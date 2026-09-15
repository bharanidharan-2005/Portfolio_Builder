import io
import json
import logging
import os
import re
import uuid
import string
import random
import time
import pdfplumber
import requests
from django.conf import settings
from django.core.mail import send_mail
from django.db import IntegrityError, models, transaction
from django.http import FileResponse, JsonResponse
from google import genai
from google.genai import types
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework.views import APIView
from django.views.decorators.csrf import csrf_exempt
from ..models import AISessionLog, Portfolio, PortfolioPage, PortfolioSection
from ..serializers import AISessionLogSerializer, PortfolioPageSerializer, PortfolioSectionSerializer
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from ..tasks import process_ai_refinement_task

logger = logging.getLogger(__name__)

from .utils import *
# -----------------------------------------------------------------
# 1. GEMINI CLIENT HELPERS
# -----------------------------------------------------------------
TEXT_MODEL = 'gemini-1.5-flash'

class AICreditThrottle(UserRateThrottle):
    scope = 'ai'
    rate = '30/minute'

class ImageGenerationThrottle(UserRateThrottle):
    scope = 'image-gen'
    rate = '5/minute'

class AIKeyMissingError(RuntimeError):
    pass

def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")
    
    if not api_key or any(
        token in api_key.lower() for token in ('<placeholder>', 'your-', 'replace-', 'changeme')
    ):
        raise AIKeyMissingError(
            "GEMINI_API_KEY is not configured. Add it to your .env or server environment variables."
        )
        
    if len(api_key.strip()) < 30:
        raise AIKeyMissingError(
            "GEMINI_API_KEY does not look like a valid key. Check Google AI Studio and update your .env."
        )
        
    return genai.Client(api_key=api_key.strip())
def generate_text_with_fallback(client, prompt):
    """
    Bulletproof Fast Failover: Attempts generation and falls back on ANY 
    traffic, rate-limit, or missing-model error to guarantee a successful parse.
    """
    models_to_try = [
        TEXT_MODEL,                     # Your primary model
        'gemini-1.5-pro-latest',        # Heavy-duty fallback (Google AI Studio alias)
        'gemini-2.0-flash',             # Next-gen fallback
    ]
    
    last_error = None
    for model in models_to_try:
        try:
            logger.info("Attempting AI generation with model: %s", model)
            return client.models.generate_content(model=model, contents=[prompt])
        except Exception as e:
            last_error = e
            error_str = str(e).lower()
            
            # If the API key itself is completely invalid/revoked, stop immediately
            if 'api_key' in error_str or 'unauthenticated' in error_str or '401' in error_str:
                raise e
            
            # For ANY other error (503 overloaded, 429 rate limit, 404 model not found), skip to the next model!
            logger.warning("Model %s failed (%s). Falling back immediately...", model, error_str[:50])
            continue
            
    # Only crashes if EVERY single model in the list failed
    raise last_error

def extract_clean_json_payload(raw_text):
    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', raw_text, re.IGNORECASE)
        if match:
            return json.loads(match.group(1))
        start = raw_text.find('{')
        end = raw_text.rfind('}')
        if start != -1 and end != -1:
            return json.loads(raw_text[start:end + 1])
        raise ValueError(f"Could not extract JSON from AI response. Raw output starts with: {raw_text[:100]}...")

# -----------------------------------------------------------------
# 5. AI SECTION REFINEMENT
# -----------------------------------------------------------------
class AISectionRefinementView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AICreditThrottle]

    def post(self, request):
        section_id = request.data.get('section_id')
        section_type = request.data.get('section_type')
        current = request.data.get('current_content')
        prompt = request.data.get('prompt', '').strip()

        if not prompt:
            prompt = "Improve the professional tone, clarity, and impact of this section's content."

        section = None
        if section_id:
            try:
                section = PortfolioSection.objects.get(pk=section_id, page__portfolio__owner=get_user_filter(request))
            except (PortfolioSection.DoesNotExist, ValueError):
                pass 

        if section:
            section_type = section.section_type
            if current is None:
                current = section.content_data

        if not section_type:
            return Response({'error': 'section_type or section_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if not section:
            page = ensure_user_workspace(request)
            section = page.sections.filter(section_type=section_type).first()
            if not section:
                section = PortfolioSection.objects.create(
                    page=page,
                    section_type=section_type,
                    order=page.sections.count(),
                    content_data=dict(DEFAULT_WORKSPACE_SECTIONS_MAP.get(section_type, {})),
                )
            if current is None:
                current = section.content_data

        try:
            # Dispatch Celery Task for Asynchronous execution
            user_id = get_user_filter(request).id if get_user_filter(request) else None
            
            task = process_ai_refinement_task.delay(
                section_id=section.id if section else None,
                prompt=prompt,
                section_type=section_type,
                current_content=current,
                user_id=user_id
            )
            
            return Response({
                'success': True, 
                'message': 'AI refinement task queued successfully.',
                'task_id': task.id
            }, status=status.HTTP_202_ACCEPTED)
            
        except Exception as e:
            error_message = str(e)
            logger.error("AI refinement task dispatch failed: %s", error_message)
            return Response({'error': f'AI generation dispatch failed: {error_message}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# -----------------------------------------------------------------
# -----------------------------------------------------------------
# 7. AI LOG FEED API VIEW
# -----------------------------------------------------------------
class AISessionLogListAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        logs = AISessionLog.objects.filter(user=get_user_filter(request))[:20]
        serializer = AISessionLogSerializer(logs, many=True)
        return Response({'logs': serializer.data})

# -----------------------------------------------------------------
# 8. AI TEMPLATE GENERATOR
# -----------------------------------------------------------------
class AITemplateGeneratorView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AICreditThrottle]

    def post(self, request):
        prompt = request.data.get('prompt', '')
        if not prompt:
            return Response({'error': 'prompt is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            page = ensure_user_workspace(request)
            client = get_gemini_client()
            category = request.data.get('category') or request.data.get('field') or ''
            category_hint = f"\nUser category/field: {category}" if category else ""
            sys_prompt = (
                "You are a portfolio template designer. Based on the user's request, "
                "return ONLY JSON describing: theme_accent (string, one of: dark_developer, "
                "glassmorphism, gradient, minimal_clean, cyberpunk_neon), layout suggestions (string), "
                "and recommended sections (array of section_type strings)."
            )
            
            # Using the new robust fallback handler
            res = generate_text_with_fallback(client, f"{sys_prompt}\nRequest: {prompt}{category_hint}")
            template = extract_clean_json_payload(res.text)
            
            theme_accent = template.get('theme_accent') if isinstance(template, dict) else None
            if theme_accent:
                page.theme_accent = theme_accent
                page.save()
            return Response({'success': True, 'template': template})
        except AIKeyMissingError as e:
            logger.error("AI key missing during template generation: %s", e)
            return Response({'error': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            logger.error("Template generation failed: %s", e)
            return Response({'error': f'Generation failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# -----------------------------------------------------------------
# CONVERSATIONAL AI CO-PILOT
# -----------------------------------------------------------------
class AICopilotAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AICreditThrottle]

    def post(self, request):
        prompt = request.data.get('prompt', '').strip()
        canvas_state = request.data.get('canvas_state', [])

        if not prompt:
            return Response({'error': 'Prompt is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            client = get_gemini_client()
            system_instruction = f"""You are an AI Co-Pilot for a React portfolio builder. 
The user wants to modify their portfolio canvas through a chat interface.

Current canvas sections: {json.dumps(canvas_state)}

Available themes: modern_glass, cyber_neon, clean_minimal, vibrant_creative, editorial_paper
Available section types: hero, about, experience, projects_grid, education, skills, services, contact, testimonials, certifications, stats, blog

Analyze the user's prompt: "{prompt}"

Return ONLY a valid JSON object representing the action to take. DO NOT include markdown formatting like ```json.
Choose ONE of the following formats based on the user's intent:

1. To change the theme:
{{"action": "update_theme", "theme": "<theme_name>", "message": "Applying the <theme_name> theme!"}}

2. To update content in an existing section (e.g., rewriting bio, changing hero text):
{{"action": "update_section", "section_type": "<type>", "updates": {{"<key>": "<new_value>"}}, "message": "I've updated your <type> section."}}

3. To add a new section:
{{"action": "add_section", "section_type": "<type>", "message": "Adding a new <type> section to your canvas."}}

4. If you just need to reply to the user without changing anything (e.g. asking for clarification):
{{"action": "reply", "message": "<your_message>"}}
"""
            response = generate_text_with_fallback(client, system_instruction)
            action_data = extract_clean_json_payload(response.text)

            # Log the session
            user = request.user if request.user.is_authenticated else None
            AISessionLog.objects.create(
                user=user,
                action_type="copilot",
                input_tokens=prompt,
                output_tokens=str(action_data)[:500]
            )

            return Response({'success': True, 'action': action_data})

        except Exception as e:
            logger.error("AI Copilot failed: %s", str(e), exc_info=True)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# -----------------------------------------------------------------
# GITHUB DATA INGESTION
# -----------------------------------------------------------------
class AIGithubIngestAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AICreditThrottle]

    def post(self, request):
        username = request.data.get('username', '').strip()
        if not username:
            return Response({'error': 'GitHub username is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 1. Fetch GitHub Repos
            try:
                gh_response = requests.get(
                    f"https://api.github.com/users/{username}/repos?sort=updated&per_page=15",
                    headers={
                        "Accept": "application/vnd.github.v3+json",
                        "User-Agent": "Portfolio-Builder-App/1.0"
                    },
                    timeout=15
                )
            except requests.exceptions.Timeout:
                return Response({'error': 'Connection to GitHub timed out. Please check your network or try again later.'}, status=status.HTTP_504_GATEWAY_TIMEOUT)
            except requests.exceptions.RequestException as e:
                return Response({'error': f'Failed to connect to GitHub API: Network issue or API is unreachable.'}, status=status.HTTP_502_BAD_GATEWAY)
            
            if gh_response.status_code != 200:
                return Response({'error': f'Failed to fetch GitHub profile for {username}.'}, status=status.HTTP_400_BAD_REQUEST)
                
            repos = gh_response.json()
            if not repos:
                return Response({'error': 'No public repositories found for this user.'}, status=status.HTTP_404_NOT_FOUND)

            # Extract basic repo info
            repo_summary = []
            for r in repos:
                if not r.get('fork'):
                    repo_summary.append(f"- {r.get('name')}: {r.get('description')} (Lang: {r.get('language')}, Stars: {r.get('stargazers_count')})")
            
            repo_text = "\n".join(repo_summary[:10])

            # 2. Ask Gemini to format into Portfolio schema
            client = get_gemini_client()
            prompt = f"""You are a technical recruiter building a portfolio.
I have fetched the latest GitHub repositories for the user '{username}'. 
Here is the data:
{repo_text}

Task:
1. Identify the user's core technical skills based on the languages and descriptions.
2. Select the top 4 most impressive projects.
3. Rewrite the project descriptions to be professional, emphasizing the technology used and the problem solved (using the STAR method if possible).

Return ONLY a strictly valid JSON object exactly in this schema:
{{
  "skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5", "Skill 6"],
  "projects": [
    {{
      "id": "proj-1",
      "title": "Clean Title",
      "description": "Professional 2-sentence description of the impact and architecture.",
      "tech_stack": ["React", "Python"],
      "demo_link": "https://github.com/{username}/repo_name"
    }}
  ]
}}
DO NOT include any markdown blocks like ```json.
"""
            res = generate_text_with_fallback(client, prompt)
            structured_data = extract_clean_json_payload(res.text)

            return Response({'success': True, 'data': structured_data})

        except Exception as e:
            logger.error("GitHub ingestion failed: %s", str(e), exc_info=True)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# -----------------------------------------------------------------
# SEO & ANALYTICS DASHBOARD
# -----------------------------------------------------------------
class AISEOAnalyticsAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AICreditThrottle]

    def post(self, request):
        sections_data = request.data.get('sections', [])
        if not sections_data:
            return Response({'error': 'Sections data is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Flatten text content from sections
            content_dump = []
            for sec in sections_data:
                stype = sec.get('section_type', '')
                cdata = sec.get('content_data', {})
                content_dump.append(f"--- {stype.upper()} ---")
                content_dump.append(str(cdata))
            
            raw_text = "\\n".join(content_dump)[:3000] # Cap to prevent huge payloads
            
            client = get_gemini_client()
            prompt = f"""You are an expert Technical SEO Specialist and UX Analyst for a high-end portfolio builder.
I am providing you the raw content of a user's portfolio website.

Here is the content:
{raw_text}

Task:
1. Generate a highly optimized <title> tag for the portfolio (Max 60 chars).
2. Generate a compelling <meta name="description"> tag (Max 155 chars) targeting recruiters.
3. Suggest 3 OpenGraph tags (og:title, og:description, og:type).
4. Provide an 'Analytics Report': 3 brief, actionable suggestions to improve the UX or layout of this portfolio (e.g., 'Your About section is very short, add more details about your architecture experience.').

Return ONLY a strictly valid JSON object exactly in this schema:
{{
  "title_tag": "string",
  "meta_description": "string",
  "og_tags": {{
    "og:title": "string",
    "og:description": "string",
    "og:type": "website"
  }},
  "analytics_suggestions": [
    "string",
    "string",
    "string"
  ]
}}
DO NOT include any markdown blocks like ```json.
"""
            res = generate_text_with_fallback(client, prompt)
            structured_data = extract_clean_json_payload(res.text)

            user = request.user if request.user.is_authenticated else None
            if user:
                AISessionLog.objects.create(
                    user=user,
                    change_type="seo_analytics",
                    description=f"Generated SEO tags.\\nPrompt: {prompt[:100]}...\\nOutput: {str(structured_data)[:200]}"
                )

            return Response({'success': True, 'data': structured_data})

        except Exception as e:
            logger.error("SEO generation failed: %s", str(e), exc_info=True)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# -----------------------------------------------------------------
# 9. PORTFOLIO REVIEW ANALYTICS
# -----------------------------------------------------------------
class PortfolioReviewAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        page = ensure_user_workspace(request)
        portfolio = page.portfolio
        
        pages = PortfolioPage.objects.filter(portfolio=portfolio)
        sections = page.sections.all()

        section_map = {s.section_type: s for s in sections}
        required = ['hero', 'about', 'education', 'skills', 'projects_grid', 'contact']
        present = 0
        completed = 0
        missing_items = []

        for stype in required:
            sec = section_map.get(stype)
            if not sec:
                missing_items.append(f"{stype.replace('_', ' ').title()} section is missing")
                continue
            
            present += 1
            data = sec.content_data or {}
            
            if stype == 'hero' and not (data.get('heading') or data.get('subheading')):
                missing_items.append("Hero heading / subheading is empty")
            elif stype == 'about' and not data.get('bio'):
                missing_items.append("About bio is empty")
            elif stype == 'education' and not data.get('schools'):
                missing_items.append("No education entries added")
            elif stype == 'skills' and not data.get('items'):
                missing_items.append("No skills added")
            elif stype == 'projects_grid' and not data.get('projects'):
                missing_items.append("No projects added")
            elif stype == 'contact' and not data.get('text'):
                missing_items.append("Contact text is empty")
            else:
                completed += 1

        completion = round((present / len(required)) * 100) if required else 0
        overall_score = round((completed / len(required)) * 100) if required else 0

        return Response({
            'pages_count': pages.count(),
            'sections_count': sections.count(),
            'completion': completion,
            'overall_score': overall_score,
            'missing_items': missing_items,
            'suggestions': [
                "Add a professional headline and a strong call to action to your Hero section.",
                "Quantify your About bio with concrete achievements and metrics.",
                "Keep between 6 and 10 skills with realistic proficiency levels.",
                "Attach live URLs to at least 3 featured projects.",
                "Make your contact text invite a specific type of collaboration.",
            ],
        })

# -----------------------------------------------------------------
# 10. CUSTOM IMAGE GENERATION
# -----------------------------------------------------------------
IMAGE_MODELS = [
    'gemini-1.5-pro-latest',
    'gemini-2.0-flash',
    'gemini-2.5-flash',
]

IMAGEN_MODEL = 'imagen-3.0-generate-002'

FREE_TIER_ZERO_QUOTA_MESSAGE = (
    "Your Gemini API free tier has no image-generation quota (limit: 0). "
    "Enable billing on your Google AI Studio project to generate images."
)

def _is_free_tier_zero_quota(exc):
    text = str(exc).lower()
    return 'free_tier_requests' in text or ('limit: 0' in text and 'quota' in text)

def _is_auth_error(exc):
    text = str(exc).lower()
    return 'unauthenticated' in text or 'invalid authentication' in text or '401' in text

def _friendly_image_error(exc):
    code = getattr(exc, 'code', None)
    text = str(exc).lower()
    if 'free_tier_requests' in text or ('limit: 0' in text and 'quota' in text):
        return FREE_TIER_ZERO_QUOTA_MESSAGE
    if _is_auth_error(exc):
        return "Your GEMINI_API_KEY is invalid or was revoked."
    if code == 429 or '429' in text or 'rate limit' in text or 'quota' in text:
        return "Image service rate limit reached. Wait a few seconds and try again."
    if code == 403 or '403' in text or 'permission' in text or 'unauthorized' in text:
        return "Image API access failed. Check project API permissions."
    if 'safety' in text or 'blocked' in text or 'filter' in text:
        return "The image request was blocked by content safety filters."
    return None

def _extract_image_data(response):
    candidates = getattr(response, 'candidates', None) or []
    if not candidates:
        return None
    for part in getattr(candidates[0].content, 'parts', []):
        inline = getattr(part, 'inline_data', None)
        if inline is not None and getattr(inline, 'data', None):
            return inline.data
    return None

def _generate_gemini_image(client, prompt):
    last_friendly = None
    for model in IMAGE_MODELS:
        for attempt in range(2):
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=[f"Generate an image for: {prompt}"],
                    config=types.GenerateContentConfig(response_modalities=["IMAGE", "TEXT"]),
                )
                image_data = _extract_image_data(response)
                if not image_data:
                    last_friendly = "The image service returned no image payload."
                    continue
                return image_data, None
            except Exception as e:
                if _is_free_tier_zero_quota(e):
                    return None, FREE_TIER_ZERO_QUOTA_MESSAGE
                if _is_auth_error(e):
                    return None, "Your GEMINI_API_KEY is invalid or was revoked."
                friendly = _friendly_image_error(e)
                if friendly:
                    last_friendly = friendly
    return None, last_friendly

def _generate_imagen_image(client, prompt):
    try:
        response = client.models.generate_images(
            model=IMAGEN_MODEL,
            prompt=prompt,
            config=types.GenerateImagesConfig(numberOfImages=1),
        )
        generated = response.generated_images or []
        if generated:
            image = generated[0].image
            image_bytes = getattr(image, 'image_bytes', None)
            if image_bytes:
                return image_bytes, None
            uri = getattr(image, 'uri', None)
            if uri and uri.startswith(('https://', 'http://')):
                try:
                    with requests.get(uri, timeout=10, stream=True) as r:
                        r.raise_for_status()
                        chunks = []
                        size = 0
                        for chunk in r.iter_content(256 * 1024):
                            chunks.append(chunk)
                            size += len(chunk)
                            if size > 10 * 1024 * 1024:
                                return None, "The generated image was too large to save."
                        return b''.join(chunks), None
                except requests.RequestException:
                    return None, "The image service returned an unreachable URL."
        return None, "The image service returned no image."
    except Exception as e:
        return None, _friendly_image_error(e)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([ImageGenerationThrottle])
def generate_custom_image(request):
    prompt = request.data.get('prompt', '').strip()
    if not prompt:
        return JsonResponse({'error': 'prompt is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        client = get_gemini_client()
    except AIKeyMissingError as e:
        return JsonResponse({'error': str(e)}, status=503)

    image_data, friendly = _generate_gemini_image(client, prompt)
    if not image_data and friendly != FREE_TIER_ZERO_QUOTA_MESSAGE:
        image_data, imagen_friendly = _generate_imagen_image(client, prompt)
        if not image_data and imagen_friendly and (not friendly or 'no image' in friendly.lower()):
            friendly = imagen_friendly

    # Fallback to free unauthenticated image API if Google APIs fail or hit quota limit
    if not image_data:
        try:
            import urllib.parse
            encoded_prompt = urllib.parse.quote(prompt)
            fallback_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1200&height=500&nologo=true"
            fallback_resp = requests.get(fallback_url, timeout=15)
            if fallback_resp.status_code == 200:
                image_data = fallback_resp.content
        except Exception as e:
            logger.warning(f"Pollinations fallback failed: {e}")

    if not image_data:
        return JsonResponse({'error': friendly or 'Image generation failed.'}, status=500)

    filename = _save_generated_image(image_data)
    image_url = request.build_absolute_uri('/api' + settings.MEDIA_URL + filename)
    return JsonResponse({'success': True, 'image_url': image_url})

def _save_generated_image(image_data):
    ext = '.png'
    if image_data.startswith(b'\x89PNG\r\n\x1a\n'):
        ext = '.png'
    elif image_data.startswith(b'\xff\xd8\xff'):
        ext = '.jpg'
    elif image_data.startswith(b'RIFF') and image_data[8:12] == b'WEBP':
        ext = '.webp'
    filename = f"generated/{uuid.uuid4().hex}{ext}"
    full_path = os.path.join(settings.MEDIA_ROOT, filename)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'wb') as f:
        f.write(image_data)
    return filename

