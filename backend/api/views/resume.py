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

logger = logging.getLogger(__name__)

from .utils import *
from .ai import *
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
            prompt = (
                "You are an expert resume analyzer. Extract and structure the following resume text into a strictly valid RFC 8259 JSON object.\n"
                "Return ONLY a JSON object with NO markdown codeblock markers, explanations, or commentary.\n"
                "Keys must include:\n"
                "- name: string (Candidate's full name)\n"
                "- headline: string (Professional title)\n"
                "- about: string (Professional summary or objective)\n"
                "- email: string\n"
                "- phone: string\n"
                "- location: string\n"
                "- linkedin: string (Full URL starting with https://)\n"
                "- github: string (Full URL starting with https://)\n"
                "- website: string (Full URL starting with https://)\n"
                "- projects: array of {title, desc, tags, projectUrl, githubUrl}\n"
                "  CRITICAL RULE FOR PROJECT URLS: If a link points to GitHub or Git (e.g. github.com/user/repo), assign it to 'githubUrl'. Only assign deployed live URLs to 'projectUrl'.\n"
                "  CRITICAL RULE FOR PROJECTS: Extract ALL personal projects, academic projects, software applications, web apps, portals, platforms, RAG systems, AI assistants, and developer tools (e.g., AuraBuild, RAG Assistant, Grievance Portal, Resume Shortlister, etc.) into 'projects'. DO NOT put projects into 'experience'.\n"
                "- experience: array of {title, company, dates, description}\n"
                "  CRITICAL RULE FOR EXPERIENCE: Only extract ACTUAL employment, corporate jobs, or company internships where the candidate was employed by a recognized company or organization. If there are no formal employer jobs, return an empty array []. NEVER place software projects into 'experience'.\n"
                "- education: array of {institution, degree, years, score}\n"
                "- skills: array of {name, level} where level is an integer 0-100\n"
                "- certifications: array of {name, issuer, date}\n"
                "- publications: array of {title, publisher, date, link}\n\n"
                "CRITICAL JSON RULES:\n"
                "1. Output MUST be valid JSON.\n"
                "2. All quotes inside string values must be escaped with a backslash (\\\").\n"
                "3. NO trailing commas before } or ].\n\n"
                "Resume Content:\n" + text
            )
            
            # Using the new robust fallback handler
            res = generate_text_with_fallback(None, prompt)
            parsed = extract_clean_json_payload(res.text)
            
            if not isinstance(parsed, dict):
                raise ValueError("AI response was not a JSON object.")

            # --- INTELLIGENT PROJECT VS WORK EXPERIENCE NORMALIZATION ---
            # Guard against AI incorrectly placing candidate software projects into 'experience'
            extracted_projects = parsed.get('projects') or []
            extracted_experience = parsed.get('experience') or []

            PROJECT_INDICATORS = [
                'assistant', 'builder', 'portal', 'shortlister', 'app', 'application', 'system',
                'platform', 'rag', 'intelligence', 'analyzer', 'dashboard', 'tool', 'bot', 'website',
                'clone', 'tracker', 'detector', 'generator', 'engine', 'classifier', 'etl', 'shortlist',
                'portfolio'
            ]

            cleaned_experience = []
            migrated_projects = []

            for exp in extracted_experience:
                if not isinstance(exp, dict):
                    continue
                title = str(exp.get('title', '')).strip()
                company = str(exp.get('company', '')).strip()
                company_lower = company.lower()
                desc = str(exp.get('description', '') or exp.get('desc', '')).strip()
                title_lower = title.lower()

                # Determine if this item is actually a software project
                is_project = False
                if not company or company_lower in ['', 'company', 'n/a', 'none', 'self', 'personal', 'academic', 'project', 'freelance']:
                    is_project = True
                elif any(ind in title_lower for ind in PROJECT_INDICATORS):
                    is_project = True

                if is_project:
                    tags = exp.get('tags') or []
                    if not tags:
                        common_tech = ['Python', 'React', 'React.js', 'Node.js', 'Django', 'Flask', 'SQL', 'PostgreSQL', 'SQLite', 'Docker', 'Vercel', 'Render', 'Pandas', 'FAISS', 'LLM', 'AI', 'JavaScript', 'HTML5', 'CSS3', 'REST API', 'ETL', 'RAG', 'openpyxl']
                        tags = [tech for tech in common_tech if tech.lower() in (desc.lower() + " " + title_lower)]
                    
                    cand_url = exp.get('projectUrl') or exp.get('url') or ''
                    gh_url = exp.get('githubUrl') or ''
                    if ('github.com' in cand_url.lower() or 'gitlab.com' in cand_url.lower() or cand_url.lower().endswith('.git')) and not gh_url:
                        gh_url = cand_url
                        cand_url = ''

                    migrated_projects.append({
                        'title': title,
                        'desc': desc or title,
                        'tags': tags,
                        'projectUrl': cand_url,
                        'githubUrl': gh_url
                    })
                else:
                    cleaned_experience.append(exp)

            # Combine projects without duplicates
            combined_projects = list(extracted_projects)
            existing_titles = {str(p.get('title', '')).lower() for p in combined_projects if isinstance(p, dict)}
            for mp in migrated_projects:
                if mp['title'].lower() not in existing_titles:
                    combined_projects.append(mp)
                    existing_titles.add(mp['title'].lower())

            # Normalize projectUrl vs githubUrl across all combined projects
            for p in combined_projects:
                if isinstance(p, dict):
                    p_url = p.get('projectUrl') or p.get('url') or p.get('demo_link') or ''
                    gh_url = p.get('githubUrl') or p.get('github_url') or p.get('repo_url') or ''
                    if ('github.com' in p_url.lower() or 'gitlab.com' in p_url.lower() or p_url.lower().endswith('.git')) and not gh_url:
                        gh_url = p_url
                        p_url = ''
                    p['projectUrl'] = p_url
                    p['githubUrl'] = gh_url

            parsed['projects'] = combined_projects
            parsed['experience'] = cleaned_experience
        except AIKeyMissingError as e:
            logger.error("AI key missing during resume parse: %s", e)
            return Response({'error': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            error_message = str(e)
            logger.error("Resume AI parse failed: %s", error_message)
            
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

            # Canonical section ordering weights (Contact is always concluding section)
            SECTION_ORDER_WEIGHTS = {
                'hero': 10,
                'about': 20,
                'experience': 30,
                'education': 40,
                'skills': 50,
                'projects_grid': 60,
                'services': 70,
                'certifications': 80,
                'testimonials': 90,
                'stats': 100,
                'blog': 110,
                'contact': 120,
            }

            mapping = {
                'hero': {
                    'heading': parsed.get('name'),
                    'subheading': parsed.get('headline'),
                    'liveUrl': parsed.get('website'),
                    'linkedin': parsed.get('linkedin'),
                    'github': parsed.get('github'),
                },
                'about': {'bio': parsed.get('about')},
                'experience': {'items': parsed.get('experience') or []},
                'education': {'schools': parsed.get('education') or []},
                'skills': {'items': skill_items},
                'projects_grid': {
                    'title': parsed.get('projects_title', 'Showcase of Innovations'),
                    'projects': parsed.get('projects') or [],
                },
                'services': {'items': parsed.get('services') or []},
                'certifications': {'items': parsed.get('certifications') or []},
                'blog': {'articles': parsed.get('publications') or []},
                'contact': {
                    'text': "Let's connect — reach me via email or any of my channels below.",
                    'email': parsed.get('email'),
                    'phone': parsed.get('phone'),
                    'linkedin': parsed.get('linkedin'),
                    'github': parsed.get('github'),
                },
            }
            for stype, cdata in mapping.items():
                order_val = SECTION_ORDER_WEIGHTS.get(stype, 100)
                if stype in sections:
                    existing = sections[stype].content_data or {}
                    existing.update({k: v for k, v in cdata.items() if v is not None})
                    sections[stype].content_data = existing
                    sections[stype].order = order_val
                    sections[stype].save()
                elif cdata and (stype not in ['experience', 'services', 'certifications', 'blog'] or cdata.get('items') or cdata.get('articles')):
                    sections[stype] = PortfolioSection.objects.create(
                        page=page, section_type=stype, order=order_val, content_data=cdata
                    )

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
            'sections': PortfolioSectionSerializer(page.sections.all(), many=True).data if page else [],
            'log': log.to_frontend_dict()
        })

