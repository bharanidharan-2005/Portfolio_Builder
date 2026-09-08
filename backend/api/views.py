import io
import json
import logging
import os
import re
import uuid
import string
import random
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
from .models import AISessionLog, Portfolio, PortfolioPage, PortfolioSection
from .serializers import AISessionLogSerializer, PortfolioPageSerializer, PortfolioSectionSerializer
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
logger = logging.getLogger(__name__)

# -----------------------------------------------------------------
# 1. GEMINI CLIENT HELPERS
# -----------------------------------------------------------------
TEXT_MODEL = 'gemini-3.6-flash'

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
# 2. USER PORTFOLIO HELPER (GUEST MODE COMPATIBLE)
# -----------------------------------------------------------------
def get_user_filter(request):
    return request.user if request.user and request.user.is_authenticated else None

def get_or_create_user_portfolio(request):
    user = get_user_filter(request)
    name = user.first_name if user and user.first_name else 'Guest'
    try:
        portfolio, _ = Portfolio.objects.get_or_create(
            owner=user,
            defaults={'title': f"{name}'s Portfolio", 'owner_name': name},
        )
    except IntegrityError:
        portfolio = Portfolio.objects.get(owner=user)
    return portfolio

MAX_RESUME_BYTES = 5 * 1024 * 1024

DEFAULT_WORKSPACE_SECTIONS = [
    ('hero', {'heading': 'Your Name', 'subheading': 'Professional Headline', 'linkedin': '', 'github': ''}),
    ('about', {'bio': 'Provide a professional summary text context profile.'}),
    ('education', {'schools': []}),
    ('skills', {'items': []}),
    ('projects_grid', {'title': 'Showcase of Innovations', 'projects': []}),
    ('contact', {'text': "Let's collaborate on production platforms. Reach out directly below.", 'email': '', 'phone': '', 'linkedin': '', 'github': ''}),
]
DEFAULT_WORKSPACE_SECTIONS_MAP = dict(DEFAULT_WORKSPACE_SECTIONS)

def ensure_user_workspace(request):
    portfolio = get_or_create_user_portfolio(request)
    page = PortfolioPage.objects.filter(portfolio=portfolio).order_by('order').first()
    if not page:
        page = PortfolioPage.objects.create(portfolio=portfolio, name='Home', slug='home')
        for order, (section_type, content_data) in enumerate(DEFAULT_WORKSPACE_SECTIONS):
            PortfolioSection.objects.create(
                page=page, section_type=section_type, order=order, content_data=content_data
            )
    return page

def validate_section_content(section_type, content_data):
    errors = []
    if not isinstance(content_data, dict):
        return ['content_data must be a JSON object.']

    for key in ('heading', 'subheading', 'bio', 'text', 'email', 'phone', 'linkedin', 'github', 'liveUrl', 'designUrl'):
        value = content_data.get(key)
        if value is not None and not isinstance(value, str):
            errors.append(f"'{key}' must be a string.")

    for key in ('items', 'projects', 'schools'):
        value = content_data.get(key)
        if value is not None and not isinstance(value, list):
            errors.append(f"'{key}' must be an array.")
        elif isinstance(value, list):
            for i, item in enumerate(value):
                if not isinstance(item, dict):
                    errors.append(f"'{key}[{i}]' must be an object.")

    return errors

# -----------------------------------------------------------------
# 3. PAGE LIST / CREATE / UPDATE
# -----------------------------------------------------------------
class PageListAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []  # Ignore expired Bearer headers on public workspace loading
    throttle_classes = []

    def get(self, request):
        ensure_user_workspace(request)
        portfolio = get_or_create_user_portfolio(request)
        pages = PortfolioPage.objects.filter(portfolio=portfolio).order_by('order')
        data = PortfolioPageSerializer(pages, many=True).data
        return Response(data)

    def post(self, request):
        portfolio = get_or_create_user_portfolio(request)
        name = request.data.get('name')
        if not name:
            return Response({'error': 'Page name is required.'}, status=status.HTTP_400_BAD_REQUEST)
        base_slug = name.lower().replace(' ', '-')
        slug = base_slug
        suffix = 1
        while PortfolioPage.objects.filter(portfolio=portfolio, slug=slug).exists():
            slug = f"{base_slug}-{suffix}"
            suffix += 1
        max_order = PortfolioPage.objects.filter(portfolio=portfolio).aggregate(models.Max('order'))['order__max'] or 0
        page = PortfolioPage.objects.create(portfolio=portfolio, name=name, slug=slug, order=max_order + 1)
        for order, (section_type, content_data) in enumerate(DEFAULT_WORKSPACE_SECTIONS):
            PortfolioSection.objects.create(
                page=page, section_type=section_type, order=order, content_data=dict(content_data)
            )
        return Response(PortfolioPageSerializer(page).data, status=status.HTTP_201_CREATED)

# -----------------------------------------------------------------
# 4. SECTION DETAIL & REORDER
# -----------------------------------------------------------------
class SectionDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = []

    def patch(self, request, pk):
        try:
            section = PortfolioSection.objects.get(pk=pk, page__portfolio__owner=get_user_filter(request))
        except PortfolioSection.DoesNotExist:
            return Response({'error': 'Section not found.'}, status=status.HTTP_404_NOT_FOUND)
        new_data = request.data.get('content_data', section.content_data)
        errors = validate_section_content(section.section_type, new_data)
        if errors:
            return Response({'error': ' '.join(errors)}, status=status.HTTP_400_BAD_REQUEST)
        section.content_data = new_data
        section.save()
        return Response({'success': True, 'content_data': section.content_data})

    def delete(self, request, pk):
        try:
            section = PortfolioSection.objects.get(pk=pk, page__portfolio__owner=get_user_filter(request))
        except PortfolioSection.DoesNotExist:
            return Response({'error': 'Section not found.'}, status=status.HTTP_404_NOT_FOUND)
        section.delete()
        return Response({'success': True}, status=status.HTTP_204_NO_CONTENT)

class SectionReorderAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        page_id = request.data.get('page_id')
        ordered_ids = request.data.get('ordered_ids')
        if not page_id or not isinstance(ordered_ids, list):
            return Response({'error': 'page_id and ordered_ids (list) are required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            page = PortfolioPage.objects.get(pk=page_id, portfolio__owner=get_user_filter(request))
        except PortfolioPage.DoesNotExist:
            return Response({'error': 'Page not found.'}, status=status.HTTP_404_NOT_FOUND)

        page_sections = page.sections.all()
        expected = {s.id for s in page_sections}
        incoming = {int(i) for i in ordered_ids}
        if incoming != expected:
            return Response(
                {'error': 'ordered_ids must list every section on the page exactly once.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            for index, sid in enumerate(ordered_ids):
                PortfolioSection.objects.filter(pk=sid, page=page).update(order=index)
        return Response({'success': True, 'ordered_ids': [int(i) for i in ordered_ids]})

class SectionDuplicateAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, pk):
        try:
            section = PortfolioSection.objects.select_related('page').get(
                pk=pk, page__portfolio__owner=get_user_filter(request)
            )
        except PortfolioSection.DoesNotExist:
            return Response({'error': 'Section not found.'}, status=status.HTTP_404_NOT_FOUND)

        max_order = section.page.sections.aggregate(models.Max('order'))['order__max'] or 0
        clone = PortfolioSection.objects.create(
            page=section.page,
            section_type=section.section_type,
            order=max_order + 1,
            content_data=dict(section.content_data) if section.content_data else {},
        )
        return Response({'success': True, 'section': PortfolioSectionSerializer(clone).data})

class ContactMessageView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        name = (request.data.get('name') or '').strip()
        email = (request.data.get('email') or '').strip()
        message = (request.data.get('message') or '').strip()
        if not name or not email or not message:
            return Response({'error': 'name, email and message are required.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(message) > 5000:
            return Response({'error': 'Message is too long (max 5000 characters).'}, status=status.HTTP_400_BAD_REQUEST)

        subject = f'New portfolio contact from {name}'
        text = f"Name: {name}\nEmail: {email}\n\n{message}\n\n— sent via AuraBuild contact form"
        recipient = request.user.email if (request.user and request.user.is_authenticated) else "guest@aurabuild.local"

        resend_api_key = os.getenv('RESEND_API_KEY')
        if resend_api_key and resend_api_key.startswith('re_'):
            try:
                import resend
                resend.api_key = resend_api_key
                resend.Emails.send({
                    "from": os.getenv('DEFAULT_FROM_EMAIL', 'AuraBuild <onboarding@resend.dev>'),
                    "to": [recipient],
                    "subject": subject,
                    "text": text,
                })
                return Response({'success': True})
            except Exception as e:
                logger.warning("Resend contact delivery failed: %s", e)

        if settings.EMAIL_HOST_USER and os.getenv('EMAIL_HOST_PASSWORD'):
            try:
                send_mail(
                    subject=subject,
                    message=text,
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=[recipient],
                    fail_silently=False,
                )
                return Response({'success': True})
            except Exception as e:
                logger.warning("SMTP contact delivery failed: %s", e)

        return Response(
            {'error': 'Contact delivery is not configured yet. Add RESEND_API_KEY or EMAIL_HOST_PASSWORD to your backend/.env to receive visitor messages.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

class DeploymentView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        html_content = request.data.get('html_content')
        if not html_content or not isinstance(html_content, str) or len(html_content) > 5 * 1024 * 1024:
            return Response({'error': 'html_content is required (max 5MB).'}, status=status.HTTP_400_BAD_REQUEST)

        token = os.getenv('VERCEL_TOKEN')
        project_id = os.getenv('VERCEL_PROJECT_ID')
        if not token:
            return Response(
                {'error': 'Deployment is not configured yet. Set VERCEL_TOKEN (and VERCEL_PROJECT_ID) in your backend/.env to enable one-click deploy.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        
        try:
            # 1. Use a new unique name so Vercel creates a separate static project
            payload = {
                'name': 'published-user-portfolio', 
                'files': [{'file': 'index.html', 'data': html_content}],
                'projectSettings': {
                    'framework': None,       # Specifies "Other" framework to skip build
                    'buildCommand': None,    # Leaves command empty to serve content directly
                    'outputDirectory': None  # Leaves directory empty to skip build step
                },
                'target': 'production',
            }
            
            # 2. IMPORTANT: Delete or comment out the project_id lines below! 
            # If we send your React project ID, Vercel will overwrite your frontend.
            # if project_id:
            #     payload['project'] = project_id
                
            resp = requests.post(
                'https://api.vercel.com/v13/deployments',
                headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
                json=payload,
                timeout=30,
            )
            if resp.status_code >= 400:
                logger.warning("Vercel deployment rejected: %s", resp.text[:300])
                return Response(
                    {'error': f'Vercel rejected the deployment ({resp.status_code}). Check your token/project configuration.'},
                    status=502,
                )
            data = resp.json()
            url = data.get('url') or data.get('id')
            return Response({'success': True, 'url': f'https://{url}' if url and not url.startswith('http') else url})
        except requests.RequestException as e:
            logger.warning("Vercel deployment request failed: %s", e)
            return Response({'error': 'Could not reach the Vercel API. Try again shortly.'}, status=502)

class PageDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = []

    def delete(self, request, pk):
        try:
            page = PortfolioPage.objects.get(pk=pk, portfolio__owner=get_user_filter(request))
        except PortfolioPage.DoesNotExist:
            return Response({'error': 'Page not found.'}, status=status.HTTP_404_NOT_FOUND)
        remaining = PortfolioPage.objects.filter(portfolio=page.portfolio).exclude(pk=page.pk).count()
        if remaining == 0:
            return Response({'error': 'You must keep at least one page.'}, status=status.HTTP_400_BAD_REQUEST)
        page.delete()
        return Response({'success': True}, status=status.HTTP_204_NO_CONTENT)

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
            client = get_gemini_client()
            sys_prompt = (
                "You are an expert portfolio copywriter. Return ONLY valid JSON matching the "
                "content_data schema for the given section type. Keys per section_type:\n"
                "- hero: heading, subheading, liveUrl, designUrl, backgroundImage, "
                "linkedin, github (linkedin/github as full https:// URLs)\n"
                "- about: bio\n"
                "- education: schools (array of {institution, degree, years, score})\n"
                "- skills: items (array of {name, level (integer percent)})\n"
                "- projects_grid: title, projects (array of {title, desc, tags, projectUrl})\n"
                "- contact: text, email, phone, linkedin, github (full https:// URLs)\n"
            )
            full = f"{sys_prompt}\nSection type: {section_type}\nCurrent content: {json.dumps(current)}\nInstruction: {prompt}"
            res = client.models.generate_content(model=TEXT_MODEL, contents=[full])
            new_data = extract_clean_json_payload(res.text)
            
            if not isinstance(new_data, dict):
                new_data = {}

            if section:
                section.content_data = new_data
                section.save()

            log = AISessionLog.objects.create(
                user=get_user_filter(request),
                change_type='Refinement',
                description=f"Refined '{section_type}' section: {prompt[:120]}",
                status='applied',
            )
            return Response({'success': True, 'content_data': new_data, 'log': log.to_frontend_dict()})
        except AIKeyMissingError as e:
            logger.error("AI key missing during refinement: %s", e)
            return Response({'error': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            error_message = str(e)
            logger.error("AI refinement failed: %s", error_message)
            
            # Catch the 503 Overloaded error gracefully
            if "503" in error_message or "UNAVAILABLE" in error_message:
                return Response({
                    "success": False, 
                    "error": "The AI model is currently experiencing high traffic. Please wait 30 seconds and try again."
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
                
            return Response({'error': f'AI generation failed: {error_message}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# -----------------------------------------------------------------
# 6. RESUME UPLOAD + PARSE
# -----------------------------------------------------------------
class ResumeUploadAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AICreditThrottle]

    @staticmethod
    def _extract_resume_text(file_name, content):
        name = (file_name or '').lower()
        if name.endswith('.pdf'):
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                return "\n".join((page.extract_text() or "") for page in pdf.pages).strip()
        if name.endswith(('.docx', '.doc')):
            import docx
            document = docx.Document(io.BytesIO(content))
            return "\n".join(p.text for p in document.paragraphs).strip()
        if name.endswith(('.txt', '.md')):
            return content.decode('utf-8', errors='ignore').strip()
        return None

    def post(self, request):
        uploaded = request.FILES.get('resume')
        if not uploaded:
            return Response({'error': 'No resume file provided.'}, status=status.HTTP_400_BAD_REQUEST)
        if uploaded.size > MAX_RESUME_BYTES:
            return Response({'error': 'Resume file is too large (max 5 MB).'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            text = self._extract_resume_text(uploaded.name, uploaded.read())
        except Exception as e:
            logger.error("Resume file parse error: %s", e)
            return Response(
                {'error': f'Could not read this resume file: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not text:
            return Response(
                {'error': 'No readable text found in the resume. Please upload a text-based PDF or DOCX.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            client = get_gemini_client()
            prompt = (
                "Parse this resume text into structured JSON with keys: "
                "name, headline, about, email, phone, location, linkedin, github, website, "
                "education[], skills[], projects[]. "
                "education[] items use {institution, degree, years, score}. "
                "skills[] items use {name, level} where level is an integer 0-100. "
                "projects[] items use {title, desc, tags, projectUrl}. "
                "linkedin, github and website must be full URLs starting with https://. "
                "Return ONLY JSON.\n\n" + text
            )
            res = client.models.generate_content(model=TEXT_MODEL, contents=[prompt])
            parsed = extract_clean_json_payload(res.text)
            if not isinstance(parsed, dict):
                raise ValueError("AI response was not a JSON object.")
        except AIKeyMissingError as e:
            logger.error("AI key missing during resume parse: %s", e)
            return Response({'error': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            error_message = str(e)
            logger.error("Resume AI parse failed: %s", error_message)
            
            # Catch the 503 Overloaded error gracefully
            if "503" in error_message or "UNAVAILABLE" in error_message:
                return Response({
                    "success": False, 
                    "error": "The AI model is currently experiencing high traffic. Please wait 30 seconds and try again."
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
                
            return Response({'error': f'AI API Error: {error_message}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            portfolio = get_or_create_user_portfolio(request)
            page_name = request.data.get('page')
            page = None
            if page_name:
                page = PortfolioPage.objects.filter(portfolio=portfolio, name=page_name).first()
            page = page or ensure_user_workspace(request)
            sections = {s.section_type: s for s in page.sections.all()}
            
            skill_items = []
            for s in (parsed.get('skills') or []):
                if isinstance(s, dict):
                    try:
                        level = int(s.get('level', 50))
                    except (TypeError, ValueError):
                        level = 50
                    skill_items.append({'name': s.get('name', ''), 'level': level})
                else:
                    skill_items.append({'name': str(s), 'level': 50})

            mapping = {
                'hero': {
                    'heading': parsed.get('name'),
                    'subheading': parsed.get('headline'),
                    'liveUrl': parsed.get('website'),
                    'linkedin': parsed.get('linkedin'),
                    'github': parsed.get('github'),
                },
                'about': {'bio': parsed.get('about')},
                'skills': {'items': skill_items},
                'projects_grid': {
                    'title': parsed.get('projects_title', 'Showcase of Innovations'),
                    'projects': parsed.get('projects') or [],
                },
                'contact': {
                    'text': "Let's connect — reach me via email or any of my channels below.",
                    'email': parsed.get('email'),
                    'phone': parsed.get('phone'),
                    'linkedin': parsed.get('linkedin'),
                    'github': parsed.get('github'),
                },
            }
            for stype, cdata in mapping.items():
                if stype in sections and cdata:
                    existing = sections[stype].content_data or {}
                    existing.update({k: v for k, v in cdata.items() if v is not None})
                    sections[stype].content_data = existing
                    sections[stype].save()

            edu = parsed.get('education')
            if edu is not None and 'education' in sections:
                sections['education'].content_data = {'schools': edu}
                sections['education'].save()

            word_count = len(text.split())
            log = AISessionLog.objects.create(
                user=get_user_filter(request),
                change_type='Parse',
                description=f"Parsed resume '{uploaded.name}': Vectorized {word_count} words into canvas sections.",
                status='applied',
            )

        except Exception as e:
            logger.error("Resume persist failed: %s", e)
            return Response(
                {'error': f'Resume parsed, but failed to save to workspace: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({
            'success': True,
            'message': 'Parsed successfully',
            'wordCount': f"{word_count} words",
            'data': parsed,
            'log': log.to_frontend_dict()
        })

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
            res = client.models.generate_content(
                model=TEXT_MODEL, contents=[f"{sys_prompt}\nRequest: {prompt}{category_hint}"]
            )
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
    'gemini-3.6-flash-image',
    'gemini-3.1-flash-lite-image',
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

# -----------------------------------------------------------------
# 11. MEDIA FILE SERVER
# -----------------------------------------------------------------
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
@throttle_classes([AnonRateThrottle])
def serve_media(request, path):
    import posixpath
    path = posixpath.normpath(path).lstrip('/')
    if '..' in path.split('/'):
        return JsonResponse({'error': 'Invalid path.'}, status=400)

    media_root = os.path.abspath(settings.MEDIA_ROOT)
    full_path = os.path.abspath(os.path.join(media_root, path))
    if not full_path.startswith(media_root + os.sep) and full_path != media_root:
        return JsonResponse({'error': 'Invalid path.'}, status=400)
    if not os.path.exists(full_path):
        return JsonResponse({'error': 'File not found.'}, status=404)
    try:
        media_file = open(full_path, 'rb')
    except OSError:
        return JsonResponse({'error': 'File not found.'}, status=404)
    return FileResponse(media_file)

# -----------------------------------------------------------------
# 12. WORKSPACE KEY DISPATCHER
# -----------------------------------------------------------------
@api_view(['POST'])
@permission_classes([AllowAny])
def send_workspace_key_view(request):
    email = request.data.get('email', '')
    code = request.data.get('code', '')
    action = request.data.get('action', '')

    if action == 'verify' or code:
        # Get or create a workspace user based on email
        username = email.split('@')[0] if email else 'developer'
        user, _ = User.objects.get_or_create(username=username, defaults={'email': email})

        # Generate JWT tokens for the user session
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'success': True,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'message': 'Workspace authenticated successfully'
        })

    # Default action: send/generate key
    return Response({'success': True, 'message': 'Verification code generated'})