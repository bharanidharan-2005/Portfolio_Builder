from django.contrib.auth.models import User
from django.db import models


class UserProfile(models.Model):
    """Per-user profile holding the generated workspace login code."""

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='profile'
    )
    # ~20-char access code used (with email) to log in, e.g. "q23hyQjdnkk9.xbhb"
    workspace_code = models.CharField(max_length=24, unique=True, blank=True)

    def __str__(self):
        return f"Profile for {self.user.email}"

