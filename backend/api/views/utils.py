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

# 2. USER PORTFOLIO HELPER (GUEST MODE COMPATIBLE)
# -----------------------------------------------------------------
def get_user_filter(request):
    return request.user if request.user and request.user.is_authenticated else None

def get_or_create_user_portfolio(request):
    user = get_user_filter(request)
    name = user.first_name if user and user.first_name else 'Guest'
    
    # Safely fetch the first matching portfolio to avoid MultipleObjectsReturned crashes
    portfolio = Portfolio.objects.filter(owner=user).first()
    
    if not portfolio:
        try:
            portfolio = Portfolio.objects.create(
                owner=user, 
                title=f"{name}'s Portfolio", 
                owner_name=name
            )
        except Exception as e:
            logger.error("DB Create Error: %s", e)
            # Fallback if simultaneous requests try to create the guest account
            portfolio = Portfolio.objects.filter(owner=user).first()
            
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
        for s_type, content in DEFAULT_WORKSPACE_SECTIONS:
            PortfolioSection.objects.create(
                page=page,
                section_type=s_type,
                order=list(DEFAULT_WORKSPACE_SECTIONS_MAP.keys()).index(s_type),
                content_data=content
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
        if not token:
            return Response(
                {'error': 'Deployment is not configured yet. Set VERCEL_TOKEN in your backend/.env to enable one-click deploy.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        
        try:
            payload = {
                'name': 'published-user-portfolio', 
                'files': [{'file': 'index.html', 'data': html_content}],
                'projectSettings': {
                    'framework': None,
                    'buildCommand': None,
                    'outputDirectory': None
                },
                'target': 'production',
            }
                
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
def generate_20_char_workspace_key():
    """Generates a secure 20-character key with letters, digits, and special characters."""
    chars = string.ascii_letters + string.digits + "!._-"
    return ''.join(random.choices(chars, k=20))

@api_view(['POST'])
@permission_classes([AllowAny])
def send_workspace_key_view(request):
    email = (request.data.get('email') or '').strip().lower()
    code = (request.data.get('code') or '').strip()
    action = (request.data.get('action') or '').strip()
    name = (request.data.get('name') or '').strip()

    # -----------------------------------------------------------------
    # 1. VERIFY WORKSPACE CODE (User logs in using ONLY the 20-char key)
    # -----------------------------------------------------------------
    if action == 'verify' or (code and len(code) >= 10):
        # User logs in using ONLY the 20-char key, or with email during signup
        if not code:
            return Response(
                {'error': 'Workspace key is required for verification.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if email:
            user = User.objects.filter(email=email, last_name=code).first()
        else:
            user = User.objects.filter(last_name=code).first()

        if not user:
            return Response(
                {'error': 'Invalid email or workspace key.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generate JWT session tokens for the user
        refresh = RefreshToken.for_user(user)
        return Response({
            'success': True,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'email': user.email,
            'name': user.first_name,
            'message': 'Workspace authenticated successfully'
        })

    # -----------------------------------------------------------------
    # 2. GENERATE & SEND PERMANENT 20-CHARACTER KEY TO ANY EMAIL
    # -----------------------------------------------------------------
    if not email:
        return Response({'error': 'Email address is required.'}, status=status.HTTP_400_BAD_REQUEST)

    # Use email as the username to prevent collisions between users with the same email prefix
    user, created = User.objects.get_or_create(username=email, defaults={'email': email, 'first_name': name})
    
    if name and user.first_name != name:
        user.first_name = name
        user.save()

    # Retrieve or generate permanent 20-character workspace key
    if user.last_name and len(user.last_name) == 20:
        workspace_key = user.last_name
    else:
        workspace_key = generate_20_char_workspace_key()
        user.last_name = workspace_key
        user.save()

    recipient_name = user.first_name if user.first_name else email
    subject = 'Your AuraBuild Workspace Verification Key'
    text_content = (
        f"Hello {recipient_name},\n\n"
        f"Your unique 20-character permanent account key for AuraBuild Studio is:\n\n"
        f"{workspace_key}\n\n"
        f"Keep this key safe and confidential. You will need it to mount your workspace anytime.\n\n"
        f"— AuraBuild Team"
    )

    email_sent = False

    # Attempt delivery via Gmail SMTP first (Can send to ANY email address)
    if settings.EMAIL_HOST_USER and os.getenv('EMAIL_HOST_PASSWORD'):
        try:
            send_mail(
                subject=subject,
                message=text_content,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[email],
                fail_silently=False,
            )
            email_sent = True
        except Exception as e:
            logger.warning("SMTP delivery failed for %s: %s", email, e)

    # Secondary attempt via Resend API
    if not email_sent:
        resend_api_key = os.getenv('RESEND_API_KEY')
        if resend_api_key and resend_api_key.startswith('re_'):
            try:
                import resend
                resend.api_key = resend_api_key
                resend.Emails.send({
                    "from": os.getenv('DEFAULT_FROM_EMAIL', 'AuraBuild <onboarding@resend.dev>'),
                    "to": [email],
                    "subject": subject,
                    "text": text_content,
                })
                email_sent = True
            except Exception as e:
                logger.warning("Resend delivery failed for %s: %s", email, e)

    return Response({
        'success': True,
        'message': f'20-character key sent to {email}',
        'workspace_key': workspace_key if not email_sent else None,  # Emergency fallback display if email server fails
    })
