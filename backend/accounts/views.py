import logging
import os
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.hashers import check_password, make_password
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from .models import UserProfile, normalize_workspace_code
from .serializers import (
    LoginSerializer,
    PasswordResetRequestSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    ResetPasswordSerializer,
)

User = get_user_model()
logger = logging.getLogger(__name__)

# Values in .env like "<placeholder>", "your-..." or "replace-..." are samples,
# not real secrets. Treat them as unset so the code fails loudly (and helpfully)
# instead of trying to authenticate with garbage credentials.
PLACEHOLDER_TOKENS = ('<placeholder>', 'your-', 'replace-', 'changeme', 'xxxxx', 'example@')
MAX_RESET_ATTEMPTS = 5


def is_real_secret(value):
    if not value:
        return False
    lowered = value.lower()
    return not any(token in lowered for token in PLACEHOLDER_TOKENS)


try:
    import resend
    RESEND_AVAILABLE = True
except ImportError:
    RESEND_AVAILABLE = False


def generate_workspace_code():
    """Return a unique ~20-char workspace login code, e.g. 'c7Xk2m5Ps9QaB.pJm3Dr'."""
    alphabet = "23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ"

    def chunk(n):
        return ''.join(secrets.choice(alphabet) for _ in range(n))

    while True:
        code = f"{chunk(13)}.{chunk(6)}"
        if not UserProfile.objects.filter(workspace_code=code).exists():
            return code


def normalize_code(code):
    return normalize_workspace_code(code)


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


def serialize_user_payload(user):
    profile, _ = UserProfile.objects.get_or_create(user=user)
    if not profile.workspace_code:
        profile.workspace_code = generate_workspace_code()
        profile.save()
    return {
        'id': user.id,
        'name': user.first_name or user.username,
        'email': user.email,
        'avatar': profile.avatar or '👨‍💻',
        'workspace_code': profile.workspace_code,
    }


def send_login_code_email(email, code, subject=None, message=None):
    """Deliver a workspace login code or verification OTP via Resend, Gmail SMTP, or dev console."""
    subject = subject or 'Your AuraBuild Workspace Login Code'
    text = message or f'Your AuraBuild workspace login code is: {code}'
    resend_api_key = os.getenv('RESEND_API_KEY')
    gmail_password = os.getenv('EMAIL_HOST_PASSWORD')
    gmail_user = settings.EMAIL_HOST_USER
    errors = []

    if is_real_secret(resend_api_key) and RESEND_AVAILABLE:
        try:
            resend.api_key = resend_api_key
            resend.Emails.send({
                "from": os.getenv('DEFAULT_FROM_EMAIL', 'AuraBuild <onboarding@resend.dev>'),
                "to": [email],
                "subject": subject,
                "text": text,
            })
            logger.info("Resend accepted email to %s", email)
            return True
        except Exception as e:
            msg = str(e)
            errors.append(f"Resend: {msg}")
            logger.error("Resend delivery failed for %s: %s", email, msg)

    if is_real_secret(gmail_password) and gmail_user:
        try:
            send_mail(
                subject=subject,
                message=text,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[email],
                fail_silently=False,
            )
            logger.info("Gmail SMTP accepted email to %s", email)
            return True
        except Exception as e:
            msg = str(e)
            errors.append(f"Gmail: {msg}")
            logger.error("Gmail SMTP delivery failed for %s: %s", email, msg)

    if not errors:
        errors.append(
            "no real email credentials configured (set RESEND_API_KEY or EMAIL_HOST_PASSWORD in backend/.env)"
        )
    logger.warning(
        "Email delivery unavailable%s.",
        f" ({'; '.join(errors)})" if errors else "",
    )
    if settings.DEBUG:
        logger.info("[DEV] Email fallback for %s: %s", email, subject)
    return False


def set_auth_cookies(response, access_token, refresh_token):
    """Attach HTTPOnly cookies to the response for browser sessions."""
    access_td = settings.SIMPLE_JWT.get('ACCESS_TOKEN_LIFETIME', timedelta(minutes=120))
    refresh_td = settings.SIMPLE_JWT.get('REFRESH_TOKEN_LIFETIME', timedelta(days=14))
    cookie_max_age_access = int(access_td.total_seconds()) if hasattr(access_td, 'total_seconds') else 7200
    cookie_max_age_refresh = int(refresh_td.total_seconds()) if hasattr(refresh_td, 'total_seconds') else 1209600

    cookie_secure = settings.SIMPLE_JWT.get('AUTH_COOKIE_SECURE', False)
    cookie_samesite = settings.SIMPLE_JWT.get('AUTH_COOKIE_SAMESITE', 'Lax')
    cookie_path = settings.SIMPLE_JWT.get('AUTH_COOKIE_PATH', '/')

    response.set_cookie(
        key=settings.SIMPLE_JWT.get('AUTH_COOKIE', 'aurabuild_access'),
        value=str(access_token),
        max_age=cookie_max_age_access,
        secure=cookie_secure,
        httponly=True,
        samesite=cookie_samesite,
        path=cookie_path,
    )
    if refresh_token:
        response.set_cookie(
            key=settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'aurabuild_refresh'),
            value=str(refresh_token),
            max_age=cookie_max_age_refresh,
            secure=cookie_secure,
            httponly=True,
            samesite=cookie_samesite,
            path=cookie_path,
        )
    # Legacy cookie names maintained for existing clients
    response.set_cookie(
        key='access_token',
        value=str(access_token),
        max_age=cookie_max_age_access,
        secure=cookie_secure,
        httponly=True,
        samesite=cookie_samesite,
        path='/',
    )
    if refresh_token:
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
    """Register a new user account with Name, Email, and Password."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        name = serializer.validated_data['name'].strip()
        email = serializer.validated_data['email'].strip().lower()
        password = serializer.validated_data['password']

        existing_user = User.objects.filter(email__iexact=email).first()
        if existing_user:
            existing_code = get_or_create_workspace_code(existing_user)
            send_login_code_email(
                email,
                existing_code,
                subject='Your AuraBuild Workspace Login Code',
                message=(
                    "Someone attempted to initialize an account with this email address.\n\n"
                    f"If this was you, sign in with your password or workspace code: {existing_code}\n"
                    "If not, you can safely ignore this message."
                ),
            )
            return Response(
                {
                    'error': 'An account with this email already exists. Please sign in instead.',
                    'account_exists': True,
                },
                status=status.HTTP_409_CONFLICT,
            )

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=name,
        )
        profile = UserProfile.objects.create(user=user, workspace_code=generate_workspace_code())

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
        user_payload = serialize_user_payload(user)
        response = Response({
            'success': True,
            'access': tokens['access'],
            'refresh': tokens['refresh'],
            'workspace_code': profile.workspace_code,
            'user': {
                'id': user_payload['id'],
                'name': user_payload['name'],
                'email': user_payload['email'],
                'avatar': user_payload['avatar'],
            },
            'message': 'Account created successfully! Entering workspace...',
        }, status=status.HTTP_201_CREATED)

        return set_auth_cookies(response, tokens['access'], tokens['refresh'])


class LoginView(APIView):
    """Authenticate with either (Email + Password) OR (Workspace Access Code)."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        identifier = (
            serializer.validated_data.get('email')
            or serializer.validated_data.get('username')
            or ''
        ).strip().lower()
        password = serializer.validated_data.get('password', '')
        code = serializer.validated_data.get('code', '').strip()

        user = None

        if identifier and password:
            user = authenticate(request, username=identifier, password=password)
            if user is None:
                user = authenticate(request, email=identifier, password=password)

            if user is None:
                return Response(
                    {'error': 'Invalid email or password.'},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

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
            if profile is None:
                profile = (
                    UserProfile.objects.select_related('user')
                    .filter(normalized_code=norm)
                    .first()
                )
            if profile is None:
                # Backward-compatible scan only for legacy rows missing normalized_code
                for candidate in UserProfile.objects.select_related('user').filter(normalized_code=''):
                    if normalize_code(candidate.workspace_code) == norm:
                        candidate.save()
                        profile = candidate
                        break

            if profile is None or not profile.user.is_active:
                return Response(
                    {'error': 'Invalid workspace access code.'},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            user = profile.user

        else:
            return Response(
                {'error': 'Please provide either your Email and Password or a Workspace Access Code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_payload = serialize_user_payload(user)
        tokens = get_tokens_for_user(user)

        response = Response({
            'success': True,
            'access': tokens['access'],
            'refresh': tokens['refresh'],
            'workspace_code': user_payload['workspace_code'],
            'user': {
                'id': user_payload['id'],
                'name': user_payload['name'],
                'email': user_payload['email'],
                'avatar': user_payload['avatar'],
            },
            'message': 'Authenticated successfully.',
        }, status=status.HTTP_200_OK)

        return set_auth_cookies(response, tokens['access'], tokens['refresh'])


class PasswordResetRequestView(APIView):
    """Send a time-limited 6-digit password reset code to a registered user's email."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email'].strip().lower()

        user = User.objects.filter(email__iexact=email).first()
        if user and user.is_active:
            profile, _ = UserProfile.objects.get_or_create(user=user)
            otp = f"{secrets.randbelow(900000) + 100000}"
            profile.reset_code_hash = make_password(otp)
            profile.reset_code_expires_at = timezone.now() + timedelta(minutes=15)
            profile.reset_attempts = 0
            profile.save()

            send_login_code_email(
                user.email,
                otp,
                subject='AuraBuild Password Reset Verification Code',
                message=(
                    f"Use this 6-digit verification code to reset your AuraBuild password: {otp}\n\n"
                    "This code expires in 15 minutes. If you did not request a reset, ignore this email."
                ),
            )

        return Response(
            {
                'success': True,
                'message': 'If an account exists for that email, a 6-digit reset verification code has been sent.',
            },
            status=status.HTTP_200_OK,
        )


class ResetPasswordView(APIView):
    """Secure password reset requiring either an emailed verification code or authenticated current password."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_password = serializer.validated_data['resolved_password']

        email = (serializer.validated_data.get('email') or '').strip().lower()
        reset_code = (serializer.validated_data.get('reset_code') or '').strip()

        # Path 1: Authenticated user changing their own password (without OTP)
        if request.user and request.user.is_authenticated and not reset_code:
            current_pw = serializer.validated_data.get('current_password') or ''
            if not current_pw or not request.user.check_password(current_pw):
                return Response(
                    {'error': 'Current password is required and must be correct.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            request.user.set_password(new_password)
            request.user.save()
            tokens = get_tokens_for_user(request.user)
            user_payload = serialize_user_payload(request.user)
            response = Response({
                'success': True,
                'message': 'Password updated successfully.',
                'access': tokens['access'],
                'refresh': tokens['refresh'],
                'workspace_code': user_payload['workspace_code'],
                'user': {
                    'id': user_payload['id'],
                    'name': user_payload['name'],
                    'email': user_payload['email'],
                    'avatar': user_payload['avatar'],
                },
            }, status=status.HTTP_200_OK)
            return set_auth_cookies(response, tokens['access'], tokens['refresh'])

        # Path 2: Password reset via emailed 6-digit verification code
        if not email or not reset_code:
            return Response(
                {'error': 'Email and verification reset_code are required. Request a reset code first.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return Response(
                {'error': 'Invalid or expired reset code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile = UserProfile.objects.filter(user=user).first()
        if (
            not profile
            or not profile.reset_code_hash
            or not profile.reset_code_expires_at
            or profile.reset_code_expires_at < timezone.now()
            or profile.reset_attempts >= MAX_RESET_ATTEMPTS
        ):
            return Response(
                {'error': 'Reset code is invalid, expired, or exceeded maximum attempts. Request a new code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not check_password(reset_code, profile.reset_code_hash):
            profile.reset_attempts += 1
            profile.save(update_fields=['reset_attempts'])
            return Response(
                {'error': 'Invalid or expired reset code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()
        profile.reset_code_hash = ''
        profile.reset_code_expires_at = None
        profile.reset_attempts = 0
        profile.save()

        user_payload = serialize_user_payload(user)
        tokens = get_tokens_for_user(user)
        response = Response({
            'success': True,
            'message': 'Password updated successfully! Signing you in...',
            'access': tokens['access'],
            'refresh': tokens['refresh'],
            'workspace_code': user_payload['workspace_code'],
            'user': {
                'id': user_payload['id'],
                'name': user_payload['name'],
                'email': user_payload['email'],
                'avatar': user_payload['avatar'],
            },
        }, status=status.HTTP_200_OK)
        return set_auth_cookies(response, tokens['access'], tokens['refresh'])


class MeView(APIView):
    """Verify session and retrieve current user profile."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        payload = serialize_user_payload(request.user)
        return Response({
            'success': True,
            **payload,
        })


class ProfileView(APIView):
    """Get or update the authenticated user's profile (name, avatar)."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({'success': True, **serialize_user_payload(request.user)})

    def patch(self, request):
        serializer = ProfileUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)

        if 'name' in serializer.validated_data:
            user.first_name = serializer.validated_data['name']
            user.save(update_fields=['first_name'])
        if 'avatar' in serializer.validated_data:
            profile.avatar = serializer.validated_data['avatar'] or '👨‍💻'
            profile.save(update_fields=['avatar'])

        return Response({'success': True, **serialize_user_payload(user)})


class CookieTokenRefreshView(APIView):
    """Refresh JWT access/refresh tokens from either request body or HTTPOnly cookies."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        refresh_token = (
            request.data.get('refresh')
            or request.COOKIES.get(settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'aurabuild_refresh'))
            or request.COOKIES.get('refresh_token')
        )
        if not refresh_token:
            return Response(
                {'error': 'Refresh token is missing.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        serializer = TokenRefreshSerializer(data={'refresh': refresh_token})
        try:
            serializer.is_valid(raise_exception=True)
        except (TokenError, InvalidToken):
            return Response(
                {'error': 'Session expired. Please sign in again.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        access = serializer.validated_data.get('access')
        rotated_refresh = serializer.validated_data.get('refresh') or refresh_token
        response = Response({
            'success': True,
            'access': access,
            'refresh': rotated_refresh,
        }, status=status.HTTP_200_OK)
        return set_auth_cookies(response, access, rotated_refresh)


class LogoutView(APIView):
    """Log out the user by blacklisting the refresh token and clearing all session cookies."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        refresh_token = (
            request.data.get('refresh')
            or request.COOKIES.get(settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'aurabuild_refresh'))
            or request.COOKIES.get('refresh_token')
        )
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass

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
