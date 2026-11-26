import logging
import os
import posixpath
import uuid

import requests
from django.conf import settings
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.db import IntegrityError
from django.http import FileResponse, JsonResponse
from django.utils.text import slugify
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, ScopedRateThrottle
from rest_framework.views import APIView

from accounts.views import get_or_create_workspace_code

from ..models import Portfolio, PortfolioPage, PortfolioSection

logger = logging.getLogger(__name__)

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


def get_user_filter(request):
    return request.user if request.user and request.user.is_authenticated else None


def _unique_portfolio_slug(user, base_text):
    base = slugify(base_text or '')[:80] or 'portfolio'
    slug = base
    suffix = 1
    while Portfolio.objects.filter(owner=user, slug=slug).exists():
        slug = f"{base}-{suffix}"
        suffix += 1
    return slug


def get_or_create_user_portfolio(request, portfolio_id=None):
    user = get_user_filter(request)
    if user is None:
        return None

    pid = portfolio_id or request.query_params.get('portfolio_id') or request.headers.get('X-Portfolio-Id')
    if not pid and hasattr(request, 'data') and isinstance(request.data, dict):
        pid = request.data.get('portfolio_id')

    if pid:
        try:
            selected = Portfolio.objects.filter(pk=int(pid), owner=user).first()
            if selected:
                return selected
        except (TypeError, ValueError):
            pass

    portfolio = (
        Portfolio.objects.filter(owner=user, is_active=True)
        .order_by('-updated_at', '-id')
        .first()
    )
    if not portfolio:
        portfolio = Portfolio.objects.filter(owner=user).order_by('-updated_at', '-id').first()

    if not portfolio:
        display_name = (user.first_name or user.username.split('@')[0] or 'Creator').strip()
        base_slug = (user.email.split('@')[0] if user.email else user.username) or display_name
        slug = _unique_portfolio_slug(user, base_slug)
        try:
            portfolio = Portfolio.objects.create(
                owner=user,
                title=f"{display_name}'s Portfolio",
                slug=slug,
                owner_name=display_name,
                is_active=True,
                is_published=False,
            )
        except IntegrityError:
            portfolio = Portfolio.objects.filter(owner=user).order_by('-id').first()

    return portfolio


def seed_default_sections(page, owner_name=None, owner_email=None):
    if page.sections.exists():
        return
    for idx, (stype, default_data) in enumerate(DEFAULT_WORKSPACE_SECTIONS):
        content = dict(default_data)
        if stype == 'hero' and owner_name:
            content['heading'] = owner_name
        if stype == 'contact' and owner_email:
            content['email'] = owner_email
        PortfolioSection.objects.create(
            page=page,
            section_type=stype,
            order=idx,
            content_data=content,
        )


def ensure_user_workspace(request, portfolio_id=None):
    portfolio = get_or_create_user_portfolio(request, portfolio_id=portfolio_id)
    if portfolio is None:
        return None
    page = PortfolioPage.objects.filter(portfolio=portfolio).order_by('order', 'id').first()
    if not page:
        page = PortfolioPage.objects.create(portfolio=portfolio, name='Home', slug='home', order=0)
    seed_default_sections(page)
    return page


def validate_section_content(section_type, content_data):
    errors = []
    if not isinstance(content_data, dict):
        return ['content_data must be a JSON object.']

    for key in ('heading', 'subheading', 'bio', 'text', 'email', 'phone', 'linkedin', 'github', 'liveUrl', 'designUrl', 'title'):
        value = content_data.get(key)
        if value is not None and not isinstance(value, str):
            errors.append(f"'{key}' must be a string.")

    for key in ('items', 'projects', 'schools', 'articles'):
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
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'contact'

    def post(self, request):
        from django.contrib.auth import get_user_model
        User = get_user_model()

        name = (request.data.get('name') or '').strip()
        email = (request.data.get('email') or '').strip()
        message = (request.data.get('message') or '').strip()
        owner_email = (request.data.get('owner_email') or '').strip()

        if not name or not email or not message:
            return Response({'error': 'name, email and message are required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            validate_email(email)
        except DjangoValidationError:
            return Response({'error': 'Please enter a valid email address.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(message) > 5000:
            return Response({'error': 'Message is too long (max 5000 characters).'}, status=status.HTTP_400_BAD_REQUEST)

        recipient = None
        if request.user and request.user.is_authenticated:
            recipient = request.user.email
        elif owner_email:
            registered_user = User.objects.filter(email__iexact=owner_email).first()
            if registered_user and Portfolio.objects.filter(owner=registered_user, is_published=True).exists():
                recipient = registered_user.email

        if not recipient:
            return Response(
                {'error': 'Unable to route message to a published portfolio owner.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        subject = f'New portfolio contact from {name}'
        text = f"Name: {name}\nEmail: {email}\n\n{message}\n\n— sent via AuraBuild contact form"

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
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        html_content = request.data.get('html_content')
        if not html_content or not isinstance(html_content, str) or len(html_content) > 5 * 1024 * 1024:
            return Response({'error': 'html_content is required (max 5MB).'}, status=status.HTTP_400_BAD_REQUEST)

        token = os.getenv('VERCEL_TOKEN')
        if not token:
            return Response(
                {'error': 'Vercel deployment is not configured. Set VERCEL_TOKEN in your backend environment to deploy externally, or publish directly to your AuraBuild public URL.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            payload = {
                'name': f'portfolio-{uuid.uuid4().hex[:8]}',
                'files': [
                    {'file': 'index.html', 'data': html_content},
                    {
                        'file': 'manifest.json',
                        'data': '{\n  "name": "My Portfolio",\n  "short_name": "Portfolio",\n  "start_url": "/",\n  "display": "standalone",\n  "background_color": "#000000",\n  "theme_color": "#000000"\n}',
                    },
                ],
                'projectSettings': {
                    'framework': None,
                    'buildCommand': None,
                    'outputDirectory': None,
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
                err_msg = f'Vercel rejected the deployment ({resp.status_code}). '
                if resp.status_code == 403:
                    err_msg += 'Your VERCEL_TOKEN is invalid, expired, or lacks permissions.'
                else:
                    err_msg += 'Check your token/project configuration.'
                return Response({'error': err_msg}, status=status.HTTP_502_BAD_GATEWAY)

            data = resp.json()
            url = data.get('url') or data.get('id')
            deployed_url = f'https://{url}' if url and not url.startswith('http') else url

            portfolio = get_or_create_user_portfolio(request)
            if portfolio and deployed_url:
                portfolio.published_url = deployed_url
                portfolio.is_published = True
                portfolio.save(update_fields=['published_url', 'is_published', 'updated_at'])

            return Response({'success': True, 'url': deployed_url})
        except requests.RequestException as e:
            logger.warning("Vercel deployment request failed: %s", e)
            return Response({'error': 'Could not reach the Vercel API. Try again shortly.'}, status=status.HTTP_502_BAD_GATEWAY)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
@throttle_classes([AnonRateThrottle])
def serve_media(request, path):
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


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def send_workspace_key_view(request):
    """Retrieve the authenticated user's workspace code safely (legacy endpoint)."""
    code = get_or_create_workspace_code(request.user)
    return Response({
        'success': True,
        'workspace_code': code,
        'email': request.user.email,
        'name': request.user.first_name or request.user.username,
    })
