import logging
import os
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import UserProfile
from .serializers import LoginSerializer, RegisterSerializer

User = get_user_model()
logger = logging.getLogger(__name__)

# Values in .env like "<placeholder>", "your-..." or "replace-..." are samples,
# not real secrets. Treat them as unset so the code fails loudly (and helpfully)
# instead of trying to authenticate with garbage credentials.
PLACEHOLDER_TOKENS = ('<placeholder>', 'your-', 'replace-', 'changeme', 'xxxxx', 'example@')


def is_real_secret(value):
    if not value:
        return False
    lowered = value.lower()
    return not any(token in lowered for token in PLACEHOLDER_TOKENS)

# Resend is optional; import it once so a missing module is handled cleanly
# instead of surfacing as a runtime error on every send attempt.
try:
    import resend
    RESEND_AVAILABLE = True
except ImportError:
    RESEND_AVAILABLE = False


def generate_workspace_code():
    """Return a unique ~20-char workspace login code, e.g. 'c7Xk2m5Ps9QaB.pJm3Dr'.

    Uses an unambiguous alphabet (no 0/O or 1/l/I) so codes are easy to type.
    """
    alphabet = "23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ"

    def chunk(n):
        return ''.join(secrets.choice(alphabet) for _ in range(n))

    while True:
        # 13 + 1 (dot) + 6 = 20 characters total.
        code = f"{chunk(13)}.{chunk(6)}"
        if not UserProfile.objects.filter(workspace_code=code).exists():
            return code


def normalize_code(code):
    """Fold a workspace code so 0/O, 1/l/I, and case differences compare equal.

    Old codes were generated from a full alphanumeric alphabet, so 0 and O (and
    1/l/I) are visually ambiguous — a user may type either and should still get in.
    """
    if not code:
        return ""
    table = str.maketrans({'O': '0', 'o': '0', 'I': '1', 'i': '1', 'l': '1', 'L': '1'})
    return code.translate(table).lower()


def get_or_create_workspace_code(user):
    profile, _ = UserProfile.objects.get_or_create(user=user)
    if not profile.workspace_code:
        profile.workspace_code = generate_workspace_code()
        profile.save()
    return profile.workspace_code


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


def send_login_code_email(email, code, subject=None, message=None):
    """Deliver a workspace login code via Resend, then Gmail SMTP, then console.
    Returns True so initialization/recovery is never blocked."""
    subject = subject or 'Your AuraBuild Workspace Login Code'
    text = message or f'Your AuraBuild workspace login code is: {code}'
    resend_api_key = os.getenv('RESEND_API_KEY')
    gmail_password = os.getenv('EMAIL_HOST_PASSWORD')
    gmail_user = settings.EMAIL_HOST_USER
    errors = []

    # 1. Resend (production / Render path). Note: Resend test mode can only
    #    deliver to the account owner's address, so this frequently fails for
    #    other recipients — we then fall through to Gmail below.
    if is_real_secret(resend_api_key) and RESEND_AVAILABLE:
        try:
            resend.api_key = resend_api_key
            resend.Emails.send({
                "from": os.getenv('DEFAULT_FROM_EMAIL', 'AuraBuild <onboarding@resend.dev>'),
                "to": [email],
                "subject": subject,
                "text": text,
            })
            logger.info("Resend accepted code email to %s", email)
            if settings.DEBUG:
                print(f"\n[DEV] Code for {email}: {code} (emailed via Resend)\n")
            return True
        except Exception as e:
            msg = str(e)
            errors.append(f"Resend: {msg}")
            logger.error(f"Resend delivery failed for {email}: {msg}")

    # 2. Gmail SMTP fallback. Can deliver to ANY recipient, so it works locally
    #    even when Resend is in test mode / unverified domain.
    if is_real_secret(gmail_password) and gmail_user:
        try:
            send_mail(
                subject=subject,
                message=text,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[email],
                fail_silently=False,
            )
            logger.info("Gmail SMTP accepted code email to %s", email)
            if settings.DEBUG:
                print(f"\n[DEV] Code for {email}: {code} (emailed via Gmail SMTP)\n")
            return True
        except Exception as e:
            msg = str(e)
            errors.append(f"Gmail: {msg}")
            logger.error(f"Gmail SMTP delivery failed for {email}: {msg}")

    # 3. No provider could deliver (or none configured). Keep the dev flow
    #    alive by printing the code to the console; delivery is never blocked.
    if not errors:
        errors.append(
            "no real email credentials configured (set RESEND_API_KEY or EMAIL_HOST_PASSWORD "
            "in backend/.env)"
        )
    logger.warning(
        "No email provider could deliver the code%s; printed to console only.",
        f" ({'; '.join(errors)})" if errors else "",
    )
    if settings.DEBUG:
        print(f"\n[DEV] Code for {email} is: {code} (email delivery failed - use this from console)\n")
    return True


def set_auth_cookies(response, access_token, refresh_token):
    """Attach secure HTTPOnly cookies to the response for cross-site browser sessions."""
    cookie_max_age_access = int(settings.SIMPLE_JWT.get('ACCESS_TOKEN_LIFETIME', timedelta(minutes=120)).total_seconds()) if hasattr(settings.SIMPLE_JWT.get('ACCESS_TOKEN_LIFETIME'), 'total_seconds') else 7200
    cookie_max_age_refresh = int(settings.SIMPLE_JWT.get('REFRESH_TOKEN_LIFETIME', timedelta(days=14)).total_seconds()) if hasattr(settings.SIMPLE_JWT.get('REFRESH_TOKEN_LIFETIME'), 'total_seconds') else 1209600

    cookie_secure = settings.SIMPLE_JWT.get('AUTH_COOKIE_SECURE', False)
    cookie_samesite = settings.SIMPLE_JWT.get('AUTH_COOKIE_SAMESITE', 'Lax')
    cookie_path = settings.SIMPLE_JWT.get('AUTH_COOKIE_PATH', '/')

    # Primary cookies
    response.set_cookie(
        key=settings.SIMPLE_JWT.get('AUTH_COOKIE', 'aurabuild_access'),
        value=str(access_token),
        max_age=cookie_max_age_access,
        secure=cookie_secure,
        httponly=True,
        samesite=cookie_samesite,
        path=cookie_path,
    )
    response.set_cookie(
        key=settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'aurabuild_refresh'),
        value=str(refresh_token),
        max_age=cookie_max_age_refresh,
        secure=cookie_secure,
        httponly=True,
        samesite=cookie_samesite,
        path=cookie_path,
    )
    # Legacy fallbacks
    response.set_cookie(
        key='access_token',
        value=str(access_token),
        max_age=cookie_max_age_access,
        secure=cookie_secure,
        httponly=True,
        samesite=cookie_samesite,
        path='/',
    )
    response.set_cookie(
        key='refresh_token',
        value=str(refresh_token),
        max_age=cookie_max_age_refresh,
        secure=cookie_secure,
        httponly=True,
        samesite=cookie_samesite,
        path='/',
    )
    return response


class RegisterView(APIView):
    """Register a new user account with Name, Email, and Password.
    Immediately generates tokens, sets HTTPOnly cookies, and logs the user in."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        name = serializer.validated_data['name'].strip()
        email = serializer.validated_data['email'].strip().lower()
        password = serializer.validated_data['password']

        if User.objects.filter(email__iexact=email).exists():
            return Response({
                'account_exists': True,
                'error': 'An account with this email already exists. Please log in instead.',
            }, status=status.HTTP_409_CONFLICT)

        # Create user with properly hashed password
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=name,
        )
        profile = UserProfile.objects.create(user=user, workspace_code=generate_workspace_code())

        # Send workspace key email asynchronously / non-blocking
        send_login_code_email(
            email,
            profile.workspace_code,
            subject='Welcome to AuraBuild — Your Workspace Code',
            message=(
                f"Welcome to AuraBuild, {name}!\n\n"
                f"Your account has been created. Your permanent workspace login code is: {profile.workspace_code}\n\n"
                "You can log in anytime using your Email and Password, or using this Workspace Code."
            ),
        )

        tokens = get_tokens_for_user(user)
        response = Response({
            'success': True,
            'access': tokens['access'],
            'refresh': tokens['refresh'],
            'workspace_code': profile.workspace_code,
            'user': {'name': user.first_name, 'email': user.email},
            'message': 'Account created successfully! Entering workspace...',
        }, status=status.HTTP_201_CREATED)

        return set_auth_cookies(response, tokens['access'], tokens['refresh'])


class LoginView(APIView):
    """Authenticate with either (Email + Password) OR (Workspace Access Code).
    Sets HTTPOnly cookies and returns session tokens."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data.get('email', '').strip().lower()
        password = serializer.validated_data.get('password', '')
        code = serializer.validated_data.get('code', '').strip()

        user = None

        # 1. Flow A: Authenticate with Email & Password
        if email and password:
            from django.contrib.auth import authenticate
            user = authenticate(request, username=email, password=password)
            if user is None:
                user = authenticate(request, email=email, password=password)

            if user is None:
                return Response(
                    {'error': 'Invalid email or password. Please verify your credentials and try again.'},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

        # 2. Flow B: Authenticate with Workspace Access Code
        elif code:
            norm = normalize_code(code)
            if not norm:
                return Response(
                    {'error': 'Invalid workspace access code format.'},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            profile = (
                UserProfile.objects.select_related('user')
                .filter(workspace_code__iexact=code)
                .first()
            )

            # Fallback for ambiguous 0/O and 1/l/I
            if profile is None and ('0' in norm or '1' in norm):
                for candidate in UserProfile.objects.select_related('user').all():
                    if normalize_code(candidate.workspace_code) == norm:
                        profile = candidate
                        break

            if profile is None:
                return Response(
                    {'error': 'Workspace code not found. Please check your code or log in with your email and password.'},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            user = profile.user

        else:
            return Response(
                {'error': 'Please provide either your Email and Password or a Workspace Access Code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workspace_code = get_or_create_workspace_code(user)
        tokens = get_tokens_for_user(user)

        response = Response({
            'success': True,
            'access': tokens['access'],
            'refresh': tokens['refresh'],
            'workspace_code': workspace_code,
            'user': {'name': user.first_name or user.username, 'email': user.email},
            'message': 'Authenticated successfully.',
        }, status=status.HTTP_200_OK)

        return set_auth_cookies(response, tokens['access'], tokens['refresh'])


class MeView(APIView):
    """Verify session and retrieve current user profile."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        workspace_code = get_or_create_workspace_code(request.user)
        return Response({
            'success': True,
            'id': request.user.id,
            'name': request.user.first_name or request.user.username,
            'email': request.user.email,
            'workspace_code': workspace_code,
        })


class LogoutView(APIView):
    """Log out the user by clearing all session cookies."""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        response = Response({"success": True, "message": "Successfully logged out."})
        
        cookie_names = [
            settings.SIMPLE_JWT.get('AUTH_COOKIE', 'aurabuild_access'),
            settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'aurabuild_refresh'),
            'access_token',
            'refresh_token',
            'sessionid',
        ]
        
        cookie_domain = settings.SIMPLE_JWT.get('AUTH_COOKIE_DOMAIN', None)
        cookie_samesite = settings.SIMPLE_JWT.get('AUTH_COOKIE_SAMESITE', 'Lax')

        for cookie_name in cookie_names:
            response.delete_cookie(cookie_name, samesite=cookie_samesite, domain=cookie_domain, path='/')
        
        return response

