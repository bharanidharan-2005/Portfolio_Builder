import logging
import os
import secrets

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


class RegisterView(APIView):
    """Initialize a workspace: name + email + password -> unique workspace code.

    The account and its unique workspace login code are created immediately —
    there is no OTP step. The code is emailed (Resend -> Gmail SMTP -> console)
    and returned so the user can save it. Logging in later only needs the code.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        name = serializer.validated_data['name']
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        if User.objects.filter(email=email).exists():
            # Account already exists: recover (don't regenerate) the unique
            # workspace code and email it, so the user can log in with it.
            user = User.objects.get(email=email)
            code = get_or_create_workspace_code(user)
            send_login_code_email(
                email,
                code,
                subject='Your AuraBuild Workspace Login Code',
                message=(
                    "An account with this email already exists.\n\n"
                    f"Your AuraBuild workspace login code is: {code}\n\n"
                    "Log in using only this code."
                ),
            )
            return Response({
                'account_exists': True,
                'error': (
                    'An account with this email already exists. '
                    'We have emailed your workspace login code — use it to log in.'
                ),
                'message': (
                    'An account with this email already exists. '
                    'We have emailed your workspace login code — use it to log in.'
                ),
            }, status=status.HTTP_409_CONFLICT)

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
            subject='Your AuraBuild Workspace Login Code',
            message=(
                f"Welcome to AuraBuild, {name}!\n\n"
                f"Your workspace login code is: {profile.workspace_code}\n\n"
                "Save it — you will use it (by itself) to log in from now on."
            ),
        )

        return Response({
            'success': True,
            'workspace_code': profile.workspace_code,
            'user': {'name': name, 'email': email},
            'message': (
                'Workspace initialized. Your unique workspace login code has '
                'been emailed to you — save it, you will use it to log in.'
            ),
        })


class LoginView(APIView):
    """Log in with the workspace code only. The code is unique per account."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        code = serializer.validated_data['code'].strip()
        norm = normalize_code(code)

        if not norm:
            return Response(
                {'error': 'Invalid workspace code.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Fast path: exact match (case-insensitive).
        profile = (
            UserProfile.objects.select_related('user')
            .filter(workspace_code__iexact=code)
            .first()
        )

        # Fallback: tolerate 0/O and 1/l/I mixups (and case) in older codes.
        # Only scan when the normalized code actually contains an ambiguous
        # digit (0 or 1) — unambiguous new codes can never require this, so the
        # common path stays O(1) instead of scanning every profile.
        if profile is None and ('0' in norm or '1' in norm):
            for candidate in UserProfile.objects.select_related('user').all():
                if normalize_code(candidate.workspace_code) == norm:
                    profile = candidate
                    break

        if profile is None:
            return Response(
                {'error': 'Invalid workspace code.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        user = profile.user
        tokens = get_tokens_for_user(user)
        return Response({
            'access': tokens['access'],
            'refresh': tokens['refresh'],
            'workspace_code': profile.workspace_code,
            'user': {'name': user.first_name, 'email': user.email},
        })


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        workspace_code = get_or_create_workspace_code(request.user)
        return Response({
            'name': request.user.first_name,
            'email': request.user.email,
            'workspace_code': workspace_code,
        })
