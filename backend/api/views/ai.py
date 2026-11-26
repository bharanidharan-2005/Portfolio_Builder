import ast
import json
import logging
import os
import re
import uuid

import requests
from django.conf import settings
from django.http import JsonResponse
from google import genai
from google.genai import types
from groq import Groq
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView

from ..models import AISessionLog, PortfolioPage, PortfolioSection
from ..serializers import AISessionLogSerializer
from .utils import (
    DEFAULT_WORKSPACE_SECTIONS_MAP,
    ensure_user_workspace,
    get_user_filter,
    validate_section_content,
)

logger = logging.getLogger(__name__)

TEXT_MODEL = 'gemini-2.5-flash'
GROQ_MODELS = [
    'llama-3.3-70b-versatile',
    'openai/gpt-oss-20b',
    'llama-3.1-8b-instant',
]
AI_TIMEOUT_SECONDS = 30


class AICreditThrottle(UserRateThrottle):
    scope = 'ai'
    rate = '30/minute'


class ImageGenerationThrottle(UserRateThrottle):
    scope = 'image-gen'
    rate = '5/minute'


class AIKeyMissingError(Exception):
    pass


def get_gemini_clients():
    keys_env = os.environ.get("GEMINI_API_KEYS", "")
    if not keys_env:
        keys_env = os.environ.get("GEMINI_API_KEY", "")

    keys = [k.strip() for k in keys_env.split(',') if k.strip()]

    valid_clients = []
    for api_key in keys:
        if not api_key or any(
            token in api_key.lower() for token in ('<placeholder>', 'your-', 'replace-', 'changeme')
        ):
            continue
        if len(api_key.strip()) < 30:
            continue
        valid_clients.append(genai.Client(api_key=api_key.strip()))

    if not valid_clients:
        raise AIKeyMissingError(
            "No valid GEMINI_API_KEY(S) configured. Add them to your .env or server environment variables."
        )
    return valid_clients


def get_gemini_client():
    return get_gemini_clients()[0]


def get_groq_client():
    api_key = os.environ.get("GROQ_API_KEY", "").strip()
    if not api_key or any(
        token in api_key.lower() for token in ('<placeholder>', 'your-', 'replace-', 'changeme')
    ):
        raise AIKeyMissingError("No GROQ_API_KEY configured. Add it to your .env or server environment variables.")
    return Groq(api_key=api_key, timeout=AI_TIMEOUT_SECONDS)


def _try_gemini_clients(clients, prompt):
    last_gemini_error = None
    for gemini_client in clients:
        try:
            response = gemini_client.models.generate_content(
                model=TEXT_MODEL,
                contents=[prompt],
            )
            text = getattr(response, 'text', None)
            if not text:
                raise ValueError("Gemini returned an empty response.")

            class TextResponse:
                def __init__(self, payload):
                    self.text = payload

            return TextResponse(text), None
        except Exception as exc:
            last_gemini_error = exc
            logger.warning("Gemini client failed (%s). Trying next key.", str(exc)[:100])
            continue
    return None, last_gemini_error


def _try_groq_models(prompt):
    try:
        client = get_groq_client()
    except AIKeyMissingError as exc:
        return None, exc

    last_error = None
    for model in GROQ_MODELS:
        try:
            logger.info("Attempting AI generation with Groq model: %s", model)
            chat_completion = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=model,
                temperature=0.5,
                timeout=AI_TIMEOUT_SECONDS,
            )
            content = chat_completion.choices[0].message.content
            if not content:
                raise ValueError("Groq returned empty content.")

            class TextResponse:
                def __init__(self, payload):
                    self.text = payload

            return TextResponse(content), None
        except Exception as exc:
            last_error = exc
            logger.warning("Groq model %s failed (%s). Falling back...", model, str(exc)[:100])
            continue
    return None, last_error


def generate_text_with_fallback(clients, prompt):
    """Attempt generation with explicit clients (if provided) or Groq -> Gemini failover."""
    errors = []

    if clients:
        res, err = _try_gemini_clients(clients, prompt)
        if res is not None:
            return res
        if err is not None:
            errors.append(f"Gemini: {err}")

    groq_res, groq_err = _try_groq_models(prompt)
    if groq_res is not None:
        return groq_res
    if groq_err is not None:
        errors.append(f"Groq: {groq_err}")

    if not clients:
        try:
            fallback_clients = get_gemini_clients()
            res, err = _try_gemini_clients(fallback_clients, prompt)
            if res is not None:
                return res
            if err is not None:
                errors.append(f"Gemini: {err}")
        except AIKeyMissingError as exc:
            errors.append(str(exc))

    if all(isinstance(e, AIKeyMissingError) for e in [groq_err] if e) and not clients:
        raise AIKeyMissingError("Neither Groq nor Gemini API keys are configured.")

    if errors and all('key' in str(e).lower() or 'configured' in str(e).lower() for e in errors):
        raise AIKeyMissingError("Neither Groq nor Gemini API keys are configured.")

    raise RuntimeError(f"AI generation failed across providers ({' | '.join(str(e)[:120] for e in errors)})")


def extract_clean_json_payload(raw_text):
    if not raw_text or not isinstance(raw_text, str):
        raise ValueError("AI response was empty or not a string.")

    match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', raw_text, re.IGNORECASE)
    cleaned = match.group(1).strip() if match else raw_text.strip()

    start_brace = cleaned.find('{')
    start_bracket = cleaned.find('[')
    if start_brace != -1 and (start_bracket == -1 or start_brace < start_bracket):
        end_brace = cleaned.rfind('}')
        if end_brace != -1:
            cleaned = cleaned[start_brace:end_brace + 1]
    elif start_bracket != -1:
        end_bracket = cleaned.rfind(']')
        if end_bracket != -1:
            cleaned = cleaned[start_bracket:end_bracket + 1]

    try:
        return json.loads(cleaned, strict=False)
    except Exception:
        pass

    cur = re.sub(r',\s*([\]}])', r'\1', cleaned)
    cur = re.sub(r'}\s*{', '}, {', cur)
    cur = re.sub(r'\]\s*\[', '], [', cur)

    try:
        return json.loads(cur, strict=False)
    except Exception:
        pass

    working = cur
    for _ in range(30):
        try:
            return json.loads(working, strict=False)
        except json.JSONDecodeError as err:
            pos = err.pos
            msg = str(err)
            if ("Expecting ',' delimiter" in msg or "Expecting ':' delimiter" in msg) and pos > 0:
                last_quote = working.rfind('"', 0, pos)
                if last_quote > 0 and working[last_quote - 1] != '\\':
                    working = working[:last_quote] + '\\"' + working[last_quote + 1:]
                    continue
            elif "Unterminated string" in msg:
                working = working[:pos] + '"' + working[pos:]
                continue
            elif "Expecting property name" in msg or "Expecting value" in msg:
                fixed = re.sub(r',\s*([\]}])', r'\1', working)
                if fixed != working:
                    working = fixed
                    continue
            break
        except Exception:
            break

    try:
        py_repr = re.sub(r'\btrue\b', 'True', working)
        py_repr = re.sub(r'\bfalse\b', 'False', py_repr)
        py_repr = re.sub(r'\bnull\b', 'None', py_repr)
        res = ast.literal_eval(py_repr)
        if isinstance(res, (dict, list)):
            return res
    except Exception:
        pass

    extracted = {}
    for key in ['name', 'headline', 'about', 'email', 'phone', 'location', 'linkedin', 'github', 'website', 'action', 'section_type']:
        m = re.search(rf'"{key}"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"', raw_text, re.IGNORECASE)
        if m:
            extracted[key] = m.group(1).replace('\\"', '"').replace('\\n', '\n').strip()

    for list_key in ['skills', 'projects', 'experience', 'education', 'certifications', 'achievements', 'publications', 'schools', 'items']:
        m = re.search(rf'"{list_key}"\s*:\s*\[([\s\S]*?)\]\s*(?:,|$|\}})', raw_text, re.IGNORECASE)
        if m:
            items_str = m.group(1)
            objs = re.findall(r'\{([\s\S]*?)\}', items_str)
            item_list = []
            for obj_str in objs:
                item_dict = {}
                pairs = re.findall(r'"([a-zA-Z0-9_]+)"\s*:\s*(?:"([^"\\]*(?:\\.[^"\\]*)*)"|([0-9]+)|(\[[^\]]*\]))', obj_str)
                for pk, pv_str, pv_num, pv_arr in pairs:
                    if pv_str:
                        item_dict[pk] = pv_str.replace('\\"', '"')
                    elif pv_num:
                        item_dict[pk] = int(pv_num)
                    elif pv_arr:
                        item_dict[pk] = [s.strip(' "') for s in pv_arr.strip('[]').split(',') if s.strip()]
                if item_dict:
                    item_list.append(item_dict)
            if item_list:
                extracted[list_key] = item_list

    if extracted:
        return extracted

    raise ValueError(f"Could not extract JSON from AI response. Raw output starts with: {raw_text[:120]}...")


def _normalize_projects_payload(new_data):
    if isinstance(new_data, dict) and 'projects' in new_data and isinstance(new_data['projects'], list):
        for p in new_data['projects']:
            if isinstance(p, dict):
                p_url = p.get('projectUrl') or ''
                gh_url = p.get('githubUrl') or ''
                if ('github.com' in p_url.lower() or 'gitlab.com' in p_url.lower() or p_url.lower().endswith('.git')) and not gh_url:
                    gh_url = p_url
                    p_url = ''
                p['projectUrl'] = p_url
                p['githubUrl'] = gh_url


# -----------------------------------------------------------------
# 5. AI SECTION REFINEMENT (Synchronous with provider fallback)
# -----------------------------------------------------------------
class AISectionRefinementView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [AICreditThrottle]

    def post(self, request):
        import api.views as api_views

        section_id = request.data.get('section_id')
        section_type = request.data.get('section_type')
        page_name = request.data.get('page')
        current = request.data.get('current_content')
        prompt = (request.data.get('prompt') or '').strip()
        apply_changes = request.data.get('apply', True)

        if len(prompt) > 2000:
            prompt = prompt[:2000]
        if not prompt:
            prompt = "Improve the professional tone, clarity, and impact of this section's content."

        user = get_user_filter(request)
        section = None
        if section_id:
            try:
                section = PortfolioSection.objects.get(pk=section_id, page__portfolio__owner=user)
            except (PortfolioSection.DoesNotExist, ValueError):
                return Response({'error': 'Section not found.'}, status=status.HTTP_404_NOT_FOUND)

        if section:
            section_type = section.section_type
            if current is None:
                current = section.content_data

        if not section_type:
            return Response({'error': 'section_type or section_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        allowed_types = {c[0] for c in PortfolioSection.SECTION_CHOICES}
        if section_type not in allowed_types:
            return Response({'error': 'Unsupported section_type.'}, status=status.HTTP_400_BAD_REQUEST)

        page = None
        if not section:
            if page_name:
                page = PortfolioPage.objects.filter(portfolio__owner=user, name=page_name).first()
            page = page or ensure_user_workspace(request)
            section = page.sections.filter(section_type=section_type).first()
            if not section and apply_changes:
                section = PortfolioSection.objects.create(
                    page=page,
                    section_type=section_type,
                    order=page.sections.count(),
                    content_data=dict(DEFAULT_WORKSPACE_SECTIONS_MAP.get(section_type, {})),
                )
            if current is None:
                current = section.content_data if section else dict(DEFAULT_WORKSPACE_SECTIONS_MAP.get(section_type, {}))

        sys_prompt = (
            "You are an expert portfolio copywriter. Return ONLY valid JSON matching the "
            "content_data schema for the given section type. Keys per section_type:\n"
            "- hero: heading, subheading, description, liveUrl, designUrl, linkedin, github (full https:// URLs)\n"
            "- about: bio\n"
            "- education: schools (array of {institution, degree, years, score})\n"
            "- skills: items (array of {name, level (integer percent 0-100)})\n"
            "- projects_grid: title, projects (array of {title, desc, tags, projectUrl, githubUrl})\n"
            "- experience: items (array of {title, company, dates, description})\n"
            "- certifications: items (array of {name, issuer, date})\n"
            "- achievements: items (array of {title, issuer, date, description})\n"
            "- contact: text, email, phone, linkedin, github (full https:// URLs)\n"
        )
        full_prompt = (
            f"{sys_prompt}\nSection type: {section_type}\n"
            f"Current content: {json.dumps(current)[:4000]}\nInstruction: {prompt}"
        )

        try:
            try:
                clients = api_views.get_gemini_clients()
            except AIKeyMissingError:
                clients = None

            res = generate_text_with_fallback(clients, full_prompt)
            new_data = extract_clean_json_payload(res.text)
            if not isinstance(new_data, dict):
                raise ValueError("AI response must be a JSON object.")

            _normalize_projects_payload(new_data)

            errors = validate_section_content(section_type, new_data)
            if errors:
                return Response({'error': ' '.join(errors)}, status=status.HTTP_502_BAD_GATEWAY)

            if apply_changes and section:
                merged = {**(section.content_data or {}), **new_data}
                section.content_data = merged
                section.save()
                saved_data = section.content_data
            else:
                saved_data = new_data

            log = AISessionLog.objects.create(
                user=user,
                change_type='Refinement',
                description=f"Refined '{section_type}' section: {prompt[:120]}",
                status='applied' if apply_changes else 'preview',
            )

            return Response({
                'success': True,
                'section_id': section.id if section else None,
                'section_type': section_type,
                'content_data': saved_data,
                'applied': bool(apply_changes),
                'log': log.to_frontend_dict(),
            }, status=status.HTTP_200_OK)

        except AIKeyMissingError as exc:
            logger.error("AI key missing during section refinement: %s", exc)
            return Response({'error': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except ValueError as exc:
            logger.warning("AI section refinement parse error: %s", exc)
            return Response({'error': 'AI returned an invalid structure. Please try again.'}, status=status.HTTP_502_BAD_GATEWAY)
        except Exception as exc:
            logger.error("AI section refinement failed: %s", exc)
            return Response({'error': 'AI refinement temporarily unavailable. Please try again.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


# -----------------------------------------------------------------
# 6. UNIFIED AI ASSISTANT ACTIONS (Summary, Skills, Projects, JD Match, Quality, Pitch)
# -----------------------------------------------------------------
class AIAssistantActionAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [AICreditThrottle]

    def post(self, request):
        action = (request.data.get('action') or '').strip().lower()
        sections = request.data.get('sections') or []
        payload = request.data.get('payload') or {}

        if not action:
            return Response({'error': 'action is required.'}, status=status.HTTP_400_BAD_REQUEST)

        canvas_compact = json.dumps(sections)[:5000]

        if action == 'generate_summary':
            target_role = str(payload.get('target_role') or '').strip()[:150]
            prompt = (
                "You are an executive technical career coach. Based on the portfolio data below, "
                "generate 3 distinct professional summary options (Concise, Impact-Driven, Leadership/Builder).\n"
                f"Target role (if any): {target_role or 'General'}\n"
                f"Portfolio data: {canvas_compact}\n"
                'Return ONLY valid JSON: {"suggestions": [{"label": "string", "bio": "string"}]}'
            )
        elif action == 'generate_project_description':
            title = str(payload.get('title') or '').strip()[:150]
            tech = str(payload.get('tech_stack') or '').strip()[:300]
            notes = str(payload.get('notes') or '').strip()[:800]
            if not title:
                return Response({'error': 'Project title is required.'}, status=status.HTTP_400_BAD_REQUEST)
            prompt = (
                "You are a senior engineering recruiter. Write a crisp, credible 2-3 sentence portfolio project "
                "description (problem solved, architecture/tech, measurable or concrete outcome without inventing fake numbers).\n"
                f"Title: {title}\nTech Stack: {tech}\nNotes: {notes}\n"
                'Return ONLY valid JSON: {"title": "string", "desc": "string", "tags": ["string"]}'
            )
        elif action == 'recommend_skills':
            target_role = str(payload.get('target_role') or '').strip()[:150]
            prompt = (
                "Analyze this candidate's existing portfolio and recommend 6 complementary, relevant skills they should highlight or learn next.\n"
                f"Target role: {target_role or 'Auto-detect from portfolio'}\n"
                f"Portfolio data: {canvas_compact}\n"
                'Return ONLY valid JSON: {"recommendations": [{"name": "string", "level": 75, "reason": "string"}]}'
            )
        elif action == 'match_jd':
            jd = str(payload.get('job_description') or '').strip()[:4000]
            if len(jd) < 20:
                return Response({'error': 'Please paste a job description (at least 20 characters).'}, status=status.HTTP_400_BAD_REQUEST)
            prompt = (
                "Compare the candidate portfolio against the target Job Description.\n"
                f"Job Description:\n{jd}\n\nCandidate Portfolio:\n{canvas_compact}\n"
                'Return ONLY valid JSON: {"match_score": 0-100 integer, "matched_keywords": ["string"], "missing_keywords": ["string"], "recommendations": ["string"]}'
            )
        elif action == 'quality_check':
            prompt = (
                "Perform a thorough portfolio quality check on the structured portfolio below. "
                "Identify missing sections, weak copy, missing links, and concrete improvements.\n"
                f"Portfolio data:\n{canvas_compact}\n"
                'Return ONLY valid JSON: {"score": 0-100 integer, "strengths": ["string"], "issues": ["string"], "action_items": ["string"]}'
            )
        elif action == 'generate_pitch':
            target = str(payload.get('target') or '').strip()[:200]
            channel = str(payload.get('channel') or 'email').strip().lower()
            if not target:
                return Response({'error': 'Target company or role is required.'}, status=status.HTTP_400_BAD_REQUEST)
            prompt = (
                f"Draft a concise, authentic {channel} outreach message to '{target}' grounded strictly in the candidate's real portfolio data below. Do not invent projects or metrics.\n"
                f"Portfolio data:\n{canvas_compact}\n"
                'Return ONLY valid JSON: {"subject": "string", "message": "string"}'
            )
        else:
            return Response({'error': f'Unknown AI action: {action}'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            res = generate_text_with_fallback(None, prompt)
            data = extract_clean_json_payload(res.text)
            if not isinstance(data, dict):
                raise ValueError("Invalid AI JSON response.")

            log = AISessionLog.objects.create(
                user=request.user,
                change_type=action.replace('_', ' ').title()[:50],
                description=f"Executed AI action '{action}'",
                status='applied',
            )
            return Response({'success': True, 'data': data, 'log': log.to_frontend_dict()})
        except AIKeyMissingError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except ValueError:
            return Response({'error': 'AI returned an unreadable response. Please try again.'}, status=status.HTTP_502_BAD_GATEWAY)
        except Exception as exc:
            logger.error("AI assistant action '%s' failed: %s", action, exc)
            return Response({'error': 'AI service temporarily unavailable. Please try again.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


# -----------------------------------------------------------------
# 7. AI LOG FEED API VIEW
# -----------------------------------------------------------------
class AISessionLogListAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        logs = AISessionLog.objects.filter(user=request.user)[:30]
        serializer = AISessionLogSerializer(logs, many=True)
        return Response({'logs': serializer.data})


# -----------------------------------------------------------------
# 8. AI TEMPLATE GENERATOR
# -----------------------------------------------------------------
class AITemplateGeneratorView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [AICreditThrottle]

    def post(self, request):
        prompt = (request.data.get('prompt') or '').strip()
        if not prompt:
            return Response({'error': 'prompt is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            page = ensure_user_workspace(request)
            category = request.data.get('category') or request.data.get('field') or ''
            category_hint = f"\nUser category/field: {category}" if category else ""
            sys_prompt = (
                "You are a portfolio template designer. Based on the user's request, "
                "return ONLY JSON describing: theme_accent (string, one of: modern_glass, "
                "developer_pro, creative_aurora, minimal_executive, cyber_neon, system_neon), layout suggestions (string), "
                "and recommended sections (array of section_type strings)."
            )
            res = generate_text_with_fallback(None, f"{sys_prompt}\nRequest: {prompt[:1000]}{category_hint}")
            template = extract_clean_json_payload(res.text)

            theme_accent = template.get('theme_accent') if isinstance(template, dict) else None
            if theme_accent and page:
                page.theme_accent = str(theme_accent)[:50]
                page.save()
            return Response({'success': True, 'template': template})
        except AIKeyMissingError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as exc:
            logger.error("Template generation failed: %s", exc)
            return Response({'error': 'Template generation failed. Please try again.'}, status=status.HTTP_502_BAD_GATEWAY)


# -----------------------------------------------------------------
# CONVERSATIONAL AI CO-PILOT
# -----------------------------------------------------------------
class AICopilotAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [AICreditThrottle]

    def post(self, request):
        prompt = (request.data.get('prompt') or '').strip()
        if len(prompt) > 2000:
            prompt = prompt[:2000] + "... [TRUNCATED]"
        canvas_state = request.data.get('canvas_state', [])

        if not prompt:
            return Response({'error': 'Prompt is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            def truncate_strings(obj):
                if isinstance(obj, dict):
                    return {k: truncate_strings(v) for k, v in obj.items()}
                if isinstance(obj, list):
                    return [truncate_strings(v) for v in obj]
                if isinstance(obj, str) and len(obj) > 80:
                    return obj[:80] + "... [TRUNCATED]"
                return obj

            stripped_state = []
            if isinstance(canvas_state, list):
                for sec in canvas_state:
                    if isinstance(sec, dict):
                        clean_sec = truncate_strings(sec)
                        clean_sec['section_type'] = sec.get('section_type', 'unknown')
                        stripped_state.append(clean_sec)

            canvas_json = json.dumps(stripped_state)[:4000]

            system_instruction = f"""You are an AI Co-Pilot for a React portfolio builder.
The user wants to modify their portfolio canvas through a chat interface.

Current canvas sections: {canvas_json}

Available themes: modern_glass, developer_pro, creative_aurora, minimal_executive, cyber_neon, system_neon
Available section types: hero, about, experience, projects_grid, education, skills, services, contact, testimonials, certifications, achievements, stats, blog

Analyze the user's prompt: "{prompt}"

Return ONLY a valid JSON object representing the action to take. DO NOT include markdown formatting like ```json.
Choose ONE of the following formats based on the user's intent:

1. To change the theme:
{{"action": "update_theme", "theme": "<theme_name>", "message": "Applying the <theme_name> theme!"}}

2. To update content in an existing section (e.g., rewriting bio, changing hero text):
{{"action": "update_section", "section_type": "<type>", "updates": {{"<key>": "<new_value>"}}, "message": "I've updated your <type> section."}}

3. To add a new section:
{{"action": "add_section", "section_type": "<type>", "message": "Adding a new <type> section to your canvas."}}

4. If you just need to reply to the user without changing anything:
{{"action": "reply", "message": "<your_message>"}}

5. To hide or remove an image in a section (like hero, about, or projects_grid):
{{"action": "update_section", "section_type": "<type>", "updates": {{"hideSideImage": true, "hideProjectImage": true}}, "message": "I've hidden the image in the <type> section."}}
"""
            response = generate_text_with_fallback(None, system_instruction)
            action_data = extract_clean_json_payload(response.text)

            log = AISessionLog.objects.create(
                user=request.user,
                change_type="copilot",
                description=f"Prompt: {prompt[:100]}\nOutput: {str(action_data)[:200]}",
                status="applied"
            )

            return Response({'success': True, 'action': action_data, 'log': log.to_frontend_dict()})

        except AIKeyMissingError as exc:
            logger.error("AI key missing during copilot: %s", exc)
            return Response({'error': 'AI service not configured. Please contact administrator.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except ValueError as exc:
            logger.error("AI copilot response parse error: %s", exc)
            return Response({'error': 'Failed to understand AI response. Please try again.'}, status=status.HTTP_502_BAD_GATEWAY)
        except Exception as exc:
            logger.error("AI Copilot failed: %s", exc, exc_info=True)
            return Response({'error': 'AI copilot service temporarily unavailable.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# -----------------------------------------------------------------
# GITHUB DATA INGESTION
# -----------------------------------------------------------------
class AIGithubIngestAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [AICreditThrottle]

    def post(self, request):
        username = (request.data.get('username') or '').strip().lstrip('@')
        if not username or not re.match(r'^[a-zA-Z0-9-]+$', username):
            return Response({'error': 'A valid GitHub username is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            try:
                gh_response = requests.get(
                    f"https://api.github.com/users/{username}/repos?sort=updated&per_page=15",
                    headers={
                        "Accept": "application/vnd.github.v3+json",
                        "User-Agent": "AuraBuild-Portfolio-App/1.0"
                    },
                    timeout=15
                )
            except requests.exceptions.Timeout:
                return Response({'error': 'Connection to GitHub timed out. Please try again later.'}, status=status.HTTP_504_GATEWAY_TIMEOUT)
            except requests.exceptions.RequestException:
                return Response({'error': 'Failed to connect to GitHub API.'}, status=status.HTTP_502_BAD_GATEWAY)

            if gh_response.status_code != 200:
                return Response({'error': f'Failed to fetch GitHub profile for {username}.'}, status=status.HTTP_400_BAD_REQUEST)

            repos = gh_response.json()
            if not repos:
                return Response({'error': 'No public repositories found for this user.'}, status=status.HTTP_404_NOT_FOUND)

            repo_summary = [
                f"- {r.get('name')}: {r.get('description')} (Lang: {r.get('language')}, Stars: {r.get('stargazers_count')}, URL: {r.get('html_url')}, Homepage: {r.get('homepage')})"
                for r in repos if not r.get('fork')
            ]
            repo_text = "\n".join(repo_summary[:10])

            prompt = f"""You are a technical recruiter building a portfolio.
I have fetched the latest GitHub repositories for the user '{username}'.
Here is the data:
{repo_text}

Task:
1. Identify the user's core technical skills based on the languages and descriptions.
2. Select the top 4 most impressive projects.
3. Rewrite the project descriptions to be professional, emphasizing the technology used and the problem solved.

Return ONLY a strictly valid JSON object exactly in this schema:
{{
  "skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5", "Skill 6"],
  "projects": [
    {{
      "id": "proj-1",
      "title": "Clean Title",
      "description": "Professional 2-sentence description of the impact and architecture.",
      "tech_stack": ["React", "Python"],
      "github_url": "https://github.com/{username}/repo_name",
      "demo_link": ""
    }}
  ]
}}
"""
            res = generate_text_with_fallback(None, prompt)
            structured_data = extract_clean_json_payload(res.text)

            if isinstance(structured_data, dict):
                for proj in structured_data.get('projects', []):
                    if isinstance(proj, dict):
                        gh = proj.get('github_url') or proj.get('githubUrl') or ''
                        demo = proj.get('demo_link') or proj.get('projectUrl') or ''
                        if ('github.com' in demo.lower() or 'gitlab.com' in demo.lower() or demo.lower().endswith('.git')) and not gh:
                            gh = demo
                            demo = ''
                        proj['github_url'] = gh
                        proj['githubUrl'] = gh
                        proj['demo_link'] = demo
                        proj['projectUrl'] = demo

            AISessionLog.objects.create(
                user=request.user,
                change_type='GitHub Sync',
                description=f"Imported projects & skills from GitHub @{username}",
                status='applied',
            )
            return Response({'success': True, 'data': structured_data})

        except AIKeyMissingError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as exc:
            logger.error("GitHub ingestion failed: %s", exc, exc_info=True)
            return Response({'error': 'GitHub ingestion failed. Please try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# -----------------------------------------------------------------
# SEO & ANALYTICS DASHBOARD
# -----------------------------------------------------------------
class AISEOAnalyticsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [AICreditThrottle]

    def post(self, request):
        sections_data = request.data.get('sections', [])
        if not sections_data:
            return Response({'error': 'Sections data is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            content_dump = []
            for sec in sections_data:
                stype = sec.get('section_type', '')
                cdata = sec.get('content_data', {})
                content_dump.append(f"--- {stype.upper()} ---")
                content_dump.append(str(cdata))

            raw_text = "\n".join(content_dump)[:3000]

            prompt = f"""You are an expert Technical SEO Specialist and UX Analyst for a portfolio builder.
Here is the portfolio content:
{raw_text}

Task:
1. Generate an optimized <title> tag (Max 60 chars).
2. Generate a compelling <meta name="description"> tag (Max 155 chars).
3. Suggest OpenGraph tags (og:title, og:description, og:type).
4. Provide 3 brief, actionable UX/content suggestions.

Return ONLY valid JSON:
{{
  "title_tag": "string",
  "meta_description": "string",
  "og_tags": {{
    "og:title": "string",
    "og:description": "string",
    "og:type": "website"
  }},
  "analytics_suggestions": ["string", "string", "string"]
}}
"""
            res = generate_text_with_fallback(None, prompt)
            structured_data = extract_clean_json_payload(res.text)

            AISessionLog.objects.create(
                user=request.user,
                change_type="seo_analytics",
                description=f"Generated SEO metadata & audit for {len(sections_data)} sections.",
                status="applied",
            )

            return Response({'success': True, 'data': structured_data})

        except AIKeyMissingError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as exc:
            logger.error("SEO generation failed: %s", exc, exc_info=True)
            return Response({'error': 'SEO generation failed. Please try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# -----------------------------------------------------------------
# 9. PORTFOLIO REVIEW ANALYTICS
# -----------------------------------------------------------------
class PortfolioReviewAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

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
        suggestions = []

        for stype in required:
            sec = section_map.get(stype)
            if not sec:
                missing_items.append(f"{stype.replace('_', ' ').title()} section is missing")
                continue

            present += 1
            data = sec.content_data or {}

            if stype == 'hero' and not (data.get('heading') and data.get('subheading')):
                missing_items.append("Hero heading / subheading is incomplete")
                suggestions.append("Add both your full name and a clear role headline to your Hero section.")
            elif stype == 'about' and not data.get('bio'):
                missing_items.append("About bio is empty")
                suggestions.append("Write a 2-3 sentence summary highlighting your strengths and focus areas.")
            elif stype == 'education' and not data.get('schools'):
                missing_items.append("No education entries added")
                suggestions.append("Add your degree, institution, and graduation years.")
            elif stype == 'skills' and not data.get('items'):
                missing_items.append("No skills added")
                suggestions.append("List 6-12 core technical or domain skills.")
            elif stype == 'projects_grid' and not data.get('projects'):
                missing_items.append("No projects added")
                suggestions.append("Add at least 2-3 projects with descriptions and live or repository links.")
            elif stype == 'contact' and not (data.get('text') or data.get('email')):
                missing_items.append("Contact email or CTA is missing")
                suggestions.append("Add a contact email and a short collaboration call-to-action.")
            else:
                completed += 1

        completion = round((present / len(required)) * 100) if required else 0
        overall_score = round((completed / len(required)) * 100) if required else 0

        if not suggestions:
            suggestions.append("All core sections are populated! Consider adding certifications or testimonials and publishing your portfolio.")

        return Response({
            'pages_count': pages.count(),
            'sections_count': sections.count(),
            'completion': completion,
            'overall_score': overall_score,
            'missing_items': missing_items,
            'suggestions': suggestions,
        })


# -----------------------------------------------------------------
# 10. CUSTOM IMAGE GENERATION
# -----------------------------------------------------------------
IMAGE_MODELS = [
    'gemini-2.5-flash-image',
    'gemini-2.0-flash-exp-image-generation',
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


def _generate_gemini_image(clients, prompt):
    if not isinstance(clients, list):
        clients = [clients]

    last_friendly = None
    for client in clients:
        for model in IMAGE_MODELS:
            for _attempt in range(2):
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
                    error_str = str(e).lower()
                    if _is_free_tier_zero_quota(e) or '429' in error_str or 'quota' in error_str or 'exhausted' in error_str:
                        last_friendly = FREE_TIER_ZERO_QUOTA_MESSAGE if _is_free_tier_zero_quota(e) else "Image service rate limit reached."
                        break
                    if _is_auth_error(e):
                        last_friendly = "Your GEMINI_API_KEY is invalid or was revoked."
                        break
                    friendly = _friendly_image_error(e)
                    if friendly:
                        last_friendly = friendly
            else:
                continue
            break
    return None, last_friendly


def _generate_imagen_image(clients, prompt):
    if not isinstance(clients, list):
        clients = [clients]

    last_friendly = None
    for client in clients:
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
                        last_friendly = "The image service returned an unreachable URL."
                        continue
            last_friendly = "The image service returned no image."
            continue
        except Exception as e:
            error_str = str(e).lower()
            if _is_free_tier_zero_quota(e) or '429' in error_str or 'quota' in error_str or 'exhausted' in error_str or _is_auth_error(e):
                last_friendly = _friendly_image_error(e)
                continue
            return None, _friendly_image_error(e)
    return None, last_friendly


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@throttle_classes([ImageGenerationThrottle])
def generate_custom_image(request):
    prompt = (request.data.get('prompt') or '').strip()
    if not prompt:
        return JsonResponse({'error': 'prompt is required.'}, status=status.HTTP_400_BAD_REQUEST)
    if len(prompt) > 600:
        prompt = prompt[:600]

    try:
        clients = get_gemini_clients()
    except AIKeyMissingError as e:
        return JsonResponse({'error': str(e)}, status=503)

    image_data, friendly = _generate_gemini_image(clients, prompt)
    if not image_data and friendly != FREE_TIER_ZERO_QUOTA_MESSAGE:
        image_data, imagen_friendly = _generate_imagen_image(clients, prompt)
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
