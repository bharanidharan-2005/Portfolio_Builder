from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend


class EmailBackend(ModelBackend):
    """Authenticate users by email or username safely."""

    def authenticate(self, request, username=None, password=None, **kwargs):
        User = get_user_model()
        identifier = username or kwargs.get('email')
        if not identifier or not password:
            return None

        # Look up by email (case-insensitive) or username
        candidates = list(User.objects.filter(email__iexact=identifier).order_by('-id'))
        if not candidates:
            candidates = list(User.objects.filter(username__iexact=identifier).order_by('-id'))

        for user in candidates:
            if user.check_password(password) and self.user_can_authenticate(user):
                return user
        return None
