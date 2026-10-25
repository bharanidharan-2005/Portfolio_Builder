import logging
import json
from celery import shared_task
from .views.ai import get_gemini_client, get_gemini_clients, generate_text_with_fallback, extract_clean_json_payload
from .models import PortfolioSection, AISessionLog
from django.contrib.auth.models import User

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def process_ai_refinement_task(self, section_id, prompt, section_type, current_content, user_id):
    """
    Background task to process Google Gemini AI generation asynchronously.
    Prevents gunicorn workers from timing out under high load.
    """
    try:
        clients = get_gemini_clients()
        sys_prompt = (
            "You are an expert portfolio copywriter. Return ONLY valid JSON matching the "
            "content_data schema for the given section type. Keys per section_type:\n"
            "- hero: heading, subheading, liveUrl, designUrl, backgroundImage, "
            "linkedin, github (linkedin/github as full https:// URLs)\n"
            "- about: bio\n"
            "- education: schools (array of {institution, degree, years, score})\n"
            "- skills: items (array of {name, level (integer percent)})\n"
            "- projects_grid: title, projects (array of {title, desc, tags, projectUrl, githubUrl}) — note: put GitHub repository URLs in githubUrl and deployed live URLs in projectUrl\n"
            "- contact: text, email, phone, linkedin, github (full https:// URLs)\n"
        )
        full = f"{sys_prompt}\nSection type: {section_type}\nCurrent content: {json.dumps(current_content)}\nInstruction: {prompt}"
        
        res = generate_text_with_fallback(clients, full)
        new_data = extract_clean_json_payload(res.text)
        
        if not isinstance(new_data, dict):
            new_data = {}

        if section_type == 'projects_grid' and isinstance(new_data, dict) and 'projects' in new_data:
            for p in new_data.get('projects', []):
                if isinstance(p, dict):
                    p_url = p.get('projectUrl') or ''
                    gh_url = p.get('githubUrl') or ''
                    if ('github.com' in p_url.lower() or 'gitlab.com' in p_url.lower() or p_url.lower().endswith('.git')) and not gh_url:
                        gh_url = p_url
                        p_url = ''
                    p['projectUrl'] = p_url
                    p['githubUrl'] = gh_url

        if section_id:
            section = PortfolioSection.objects.get(id=section_id)
            section.content_data = new_data
            section.save()

        user = User.objects.filter(id=user_id).first() if user_id else None
        
        AISessionLog.objects.create(
            user=user,
            change_type='Refinement',
            description=f"Refined '{section_type}' section: {prompt[:120]}",
            status='applied',
        )
        
        return {"success": True, "section_id": section_id, "content_data": new_data}
        
    except Exception as exc:
        logger.error(f"AI Task failed: {exc}")
        raise self.retry(exc=exc, countdown=10)
