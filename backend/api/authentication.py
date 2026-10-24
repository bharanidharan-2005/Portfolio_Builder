from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed

class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        header = self.get_header(request)
        
        # If there's an Authorization header, use it (fallback for mobile apps/non-browser clients)
        if header is not None:
            raw_token = self.get_raw_token(header)
        else:
            # Extract token from the HTTPOnly cookie for secure browser sessions
            raw_token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE']) or None
            
        if raw_token is None:
            return None

        try:
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token
        except (InvalidToken, AuthenticationFailed):
            # Expired or malformed token: treat request as unauthenticated.
            # This prevents public endpoints (registration, login, public portfolio)
            # from failing with "Given token not valid for any token type".
            # Protected endpoints (requiring IsAuthenticated) will still be cleanly rejected with 401.
            return None

