import secrets

from django.contrib.auth.models import User
from django.db import models


def generate_unique_workspace_code():
    """Return a unique ~20-char workspace login code, e.g. 'c7Xk2m5Ps9QaB.pJm3Dr'."""
    alphabet = "23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ"

    def chunk(n):
        return ''.join(secrets.choice(alphabet) for _ in range(n))

    while True:
        code = f"{chunk(13)}.{chunk(6)}"
        if not UserProfile.objects.filter(workspace_code=code).exists():
            return code


def normalize_workspace_code(code):
    """Fold a workspace code so 0/O, 1/l/I, and case differences compare equal."""
    if not code:
        return ""
    table = str.maketrans({'O': '0', 'o': '0', 'I': '1', 'i': '1', 'l': '1', 'L': '1'})
    return code.strip().translate(table).lower()


class UserProfile(models.Model):
    """Per-user profile holding the generated workspace login code and preferences."""

    PLAN_CHOICES = [
        ('free', 'Free'),
        ('pro', 'Pro'),
        ('premium', 'Premium'),
    ]

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='profile'
    )
    # ~20-char access code used to log in, e.g. "q23hyQjdnkk9.xbhb"
    workspace_code = models.CharField(max_length=24, unique=True, blank=True)
    normalized_code = models.CharField(max_length=24, db_index=True, blank=True, default='')
    avatar = models.CharField(max_length=16, default='👨‍💻', blank=True)
    plan = models.CharField(max_length=16, choices=PLAN_CHOICES, default='free', db_index=True)
    ai_credits_used = models.PositiveIntegerField(default=0)
    last_active_at = models.DateTimeField(null=True, blank=True, db_index=True)
    reset_code_hash = models.CharField(max_length=128, blank=True, default='')
    reset_code_expires_at = models.DateTimeField(null=True, blank=True)
    reset_attempts = models.PositiveSmallIntegerField(default=0)

    def save(self, *args, **kwargs):
        if not self.workspace_code:
            self.workspace_code = generate_unique_workspace_code()
        self.normalized_code = normalize_workspace_code(self.workspace_code)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Profile for {self.user.email}"
