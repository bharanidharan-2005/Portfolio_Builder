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
            clients = get_gemini_clients()
            prompt = (
                "Parse this resume text into structured JSON with keys: "
                "name, headline, about, email, phone, location, linkedin, github, website, "
                "experience[], education[], skills[], projects[], certifications[], publications[]. "
                "experience[] items use {title, company, dates, description}. "
                "education[] items use {institution, degree, years, score}. "
                "skills[] items use {name, level} where level is an integer 0-100. "
                "projects[] items use {title, desc, tags, projectUrl}. "
                "certifications[] items use {name, issuer, date}. "
                "publications[] items use {title, publisher, date, link}. "
                "linkedin, github and website must be full URLs starting with https://. "
                "Return ONLY JSON.\n\n" + text
            )
            
            # Using the new robust fallback handler
            res = generate_text_with_fallback(clients, prompt)
            parsed = extract_clean_json_payload(res.text)
            
            if not isinstance(parsed, dict):
                raise ValueError("AI response was not a JSON object.")
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

            mapping = {
                'hero': {
                    'heading': parsed.get('name'),
                    'subheading': parsed.get('headline'),
                    'liveUrl': parsed.get('website'),
                    'linkedin': parsed.get('linkedin'),
                    'github': parsed.get('github'),
                },
                'about': {'bio': parsed.get('about')},
                'education': {'schools': parsed.get('education') or []},
                'skills': {'items': skill_items},
                'projects_grid': {
                    'title': parsed.get('projects_title', 'Showcase of Innovations'),
                    'projects': parsed.get('projects') or [],
                },
                'experience': {
                    'items': parsed.get('experience') or [],
                },
                'certifications': {
                    'items': parsed.get('certifications') or [],
                },
                'blog': {
                    'articles': parsed.get('publications') or [],
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
                if cdata:
                    if stype in sections:
                        existing = sections[stype].content_data or {}
                        existing.update({k: v for k, v in cdata.items() if v is not None})
                        sections[stype].content_data = existing
                        sections[stype].save()
                    else:
                        max_order = page.sections.aggregate(models.Max('order'))['order__max'] or -1
                        sections[stype] = PortfolioSection.objects.create(
                            page=page, section_type=stype, order=max_order + 1, content_data=cdata
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
            'log': log.to_frontend_dict()
        })

