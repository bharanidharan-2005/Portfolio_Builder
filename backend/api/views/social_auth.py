import os
import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from django.conf import settings

class SocialLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        provider = request.data.get('provider')
        token = request.data.get('token')

        if not provider or not token:
            return Response({'error': 'Provider and token are required'}, status=status.HTTP_400_BAD_REQUEST)

        email = None
        first_name = ""
        last_name = ""

        try:
            if provider == 'google':
                # Verify Google ID Token
                # Note: In production, explicitly pass the client_id here to verify audience
                client_id = os.getenv('GOOGLE_CLIENT_ID', '')
                if not client_id:
                    # Fallback for development if client_id is not yet set in .env
                    client_id = None 

                idinfo = id_token.verify_oauth2_token(
                    token, 
                    google_requests.Request(), 
                    client_id,
                    clock_skew_in_seconds=10
                )
                
                email = idinfo.get('email')
                first_name = idinfo.get('given_name', '')
                last_name = idinfo.get('family_name', '')
                
                if not email:
                    return Response({'error': 'Google token did not contain an email'}, status=status.HTTP_400_BAD_REQUEST)

            elif provider == 'github':
                # GitHub sends a 'code' instead of a direct token from the frontend
                # We must exchange it for an access token
                client_id = os.getenv('GITHUB_CLIENT_ID', '')
                client_secret = os.getenv('GITHUB_CLIENT_SECRET', '')
                
                if not client_id or not client_secret:
                    return Response({'error': 'GitHub OAuth is not configured on the server'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                token_response = requests.post(
                    'https://github.com/login/oauth/access_token',
                    data={
                        'client_id': client_id,
                        'client_secret': client_secret,
                        'code': token,
                    },
                    headers={'Accept': 'application/json'}
                )
                
                if token_response.status_code != 200:
                    return Response({'error': 'Failed to exchange GitHub code'}, status=status.HTTP_400_BAD_REQUEST)
                    
                access_token = token_response.json().get('access_token')
                if not access_token:
                    return Response({'error': 'Invalid GitHub code'}, status=status.HTTP_400_BAD_REQUEST)

                # Fetch user emails from GitHub
                email_response = requests.get(
                    'https://api.github.com/user/emails',
                    headers={'Authorization': f'Bearer {access_token}'}
                )
                
                if email_response.status_code != 200:
                    return Response({'error': 'Failed to fetch GitHub emails'}, status=status.HTTP_400_BAD_REQUEST)

                emails = email_response.json()
                
                # Find the primary verified email
                for e in emails:
                    if e.get('primary') and e.get('verified'):
                        email = e.get('email')
                        break
                
                if not email:
                    # Fallback to any verified email
                    for e in emails:
                        if e.get('verified'):
                            email = e.get('email')
                            break
                            
                if not email:
                    return Response({'error': 'No verified email found on GitHub account'}, status=status.HTTP_400_BAD_REQUEST)

            else:
                return Response({'error': f'Unsupported provider: {provider}'}, status=status.HTTP_400_BAD_REQUEST)

        except ValueError as e:
            # Invalid token
            return Response({'error': f'Invalid token: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # 3. Create or retrieve user
        try:
            user = User.objects.get(email=email)
            # Ensure the username matches the email (since we use email as username)
            if user.username != email:
                user.username = email
                user.save()
        except User.DoesNotExist:
            # Create a new user if one doesn't exist
            # Generate a random password since they login via OAuth
            user = User.objects.create_user(
                username=email, 
                email=email, 
                password=User.objects.make_random_password()
            )
            if first_name:
                user.first_name = first_name
            if last_name:
                user.last_name = last_name
            user.save()

        # 4. Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        # 5. Set HTTPOnly cookies
        response = Response({
            'success': True,
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username
            }
        })
        
        cookie_max_age = 3600 * 24 * 7 # 7 days
        
        response.set_cookie(
            key=settings.SIMPLE_JWT['AUTH_COOKIE'],
            value=access_token,
            expires=cookie_max_age,
            secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
            httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
            samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
        )
        
        response.set_cookie(
            key='refresh_token',
            value=refresh_token,
            expires=cookie_max_age,
            secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
            httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
            samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
        )

        return response
