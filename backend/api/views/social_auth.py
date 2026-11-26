import logging
import os
import secrets

import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from accounts.views import (
    get_or_create_workspace_code,
    get_tokens_for_user,
    serialize_user_payload,
    set_auth_cookies,
)

User = get_user_model()
logger = logging.getLogger(__name__)


class SocialLoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request):
        provider = (request.data.get('provider') or '').strip().lower()
        token = request.data.get('token') or request.data.get('code')

        if not provider or not token:
            return Response({'error': 'Provider and token/code are required.'}, status=status.HTTP_400_BAD_REQUEST)

        email = None
        first_name = ""
        last_name = ""

        try:
            if provider == 'google':
                client_id = os.getenv('GOOGLE_CLIENT_ID', '').strip()
                if not client_id and not settings.DEBUG:
                    return Response(
                        {'error': 'Google OAuth is not configured on the server.'},
                        status=status.HTTP_503_SERVICE_UNAVAILABLE,
                    )

                idinfo = id_token.verify_oauth2_token(
                    token,
                    google_requests.Request(),
                    client_id or None,
                    clock_skew_in_seconds=10,
                )

                if not idinfo.get('email_verified', False):
                    return Response({'error': 'Google email address is not verified.'}, status=status.HTTP_400_BAD_REQUEST)

                email = (idinfo.get('email') or '').strip().lower()
                first_name = idinfo.get('given_name', '')
                last_name = idinfo.get('family_name', '')

                if not email:
                    return Response({'error': 'Google token did not contain an email.'}, status=status.HTTP_400_BAD_REQUEST)

            elif provider == 'github':
                client_id = os.getenv('GITHUB_CLIENT_ID', '').strip()
                client_secret = os.getenv('GITHUB_CLIENT_SECRET', '').strip()
                redirect_uri = (request.data.get('redirect_uri') or '').strip()

                if not client_id or not client_secret:
                    return Response({'error': 'GitHub OAuth is not configured on the server.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

                token_payload = {
                    'client_id': client_id,
                    'client_secret': client_secret,
                    'code': token,
                }
                if redirect_uri:
                    token_payload['redirect_uri'] = redirect_uri

                token_response = requests.post(
                    'https://github.com/login/oauth/access_token',
                    data=token_payload,
                    headers={'Accept': 'application/json'},
                    timeout=15,
                )

                if token_response.status_code != 200:
                    return Response({'error': 'Failed to exchange GitHub code.'}, status=status.HTTP_400_BAD_REQUEST)

                token_data = token_response.json()
                access_token = token_data.get('access_token')
                if not access_token:
                    gh_error = token_data.get('error_description') or token_data.get('error') or 'Invalid GitHub authorization code.'
                    return Response({'error': gh_error}, status=status.HTTP_400_BAD_REQUEST)

                profile_response = requests.get(
                    'https://api.github.com/user',
                    headers={'Authorization': f'Bearer {access_token}', 'Accept': 'application/json'},
                    timeout=15,
                )
                if profile_response.status_code == 200:
                    gh_profile = profile_response.json()
                    gh_name = (gh_profile.get('name') or gh_profile.get('login') or '').strip()
                    if gh_name:
                        parts = gh_name.split(' ', 1)
                        first_name = parts[0]
                        last_name = parts[1] if len(parts) > 1 else ''

                email_response = requests.get(
                    'https://api.github.com/user/emails',
                    headers={'Authorization': f'Bearer {access_token}', 'Accept': 'application/json'},
                    timeout=15,
                )

                if email_response.status_code != 200:
                    return Response({'error': 'Failed to fetch GitHub emails.'}, status=status.HTTP_400_BAD_REQUEST)

                emails = email_response.json()
                for e in emails:
                    if e.get('primary') and e.get('verified'):
                        email = (e.get('email') or '').strip().lower()
                        break
                if not email:
                    for e in emails:
                        if e.get('verified'):
                            email = (e.get('email') or '').strip().lower()
                            break

                if not email:
                    return Response({'error': 'No verified email found on GitHub account.'}, status=status.HTTP_400_BAD_REQUEST)

            else:
                return Response({'error': f'Unsupported provider: {provider}'}, status=status.HTTP_400_BAD_REQUEST)

        except ValueError:
            return Response({'error': 'Invalid or expired social authentication token.'}, status=status.HTTP_400_BAD_REQUEST)
        except requests.RequestException as exc:
            logger.warning("Social OAuth upstream error (%s): %s", provider, exc)
            return Response({'error': 'Could not reach OAuth provider. Please try again.'}, status=status.HTTP_502_BAD_GATEWAY)
        except Exception as exc:
            logger.error("Social auth error (%s): %s", provider, exc, exc_info=True)
            return Response({'error': 'Social authentication failed.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            user = User.objects.create_user(
                username=email,
                email=email,
                password=secrets.token_urlsafe(32),
                first_name=first_name or email.split('@')[0],
                last_name=last_name,
            )
        elif not user.first_name and first_name:
            user.first_name = first_name
            user.save(update_fields=['first_name'])

        workspace_code = get_or_create_workspace_code(user)
        user_payload = serialize_user_payload(user)
        tokens = get_tokens_for_user(user)

        response = Response({
            'success': True,
            'access': tokens['access'],
            'refresh': tokens['refresh'],
            'workspace_code': workspace_code,
            'user': {
                'id': user_payload['id'],
                'name': user_payload['name'],
                'email': user_payload['email'],
                'avatar': user_payload['avatar'],
                'username': user.username,
            },
        }, status=status.HTTP_200_OK)

        return set_auth_cookies(response, tokens['access'], tokens['refresh'])
