import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from accounts.models import UserProfile

User = get_user_model()


class Command(BaseCommand):
    help = "Idempotently ensure an admin/staff superuser exists from ADMIN_EMAIL and ADMIN_PASSWORD env vars."

    def add_arguments(self, parser):
        parser.add_argument('--email', dest='email', default=None, help='Admin email (defaults to ADMIN_EMAIL env var)')
        parser.add_argument('--password', dest='password', default=None, help='Admin password (defaults to ADMIN_PASSWORD env var)')
        parser.add_argument('--name', dest='name', default=None, help='Admin display name (defaults to ADMIN_NAME env var)')

    def handle(self, *args, **options):
        email = (options.get('email') or os.getenv('ADMIN_EMAIL') or '').strip().lower()
        password = options.get('password') or os.getenv('ADMIN_PASSWORD') or ''
        name = (options.get('name') or os.getenv('ADMIN_NAME') or 'AuraBuild Admin').strip()

        if not email or not password:
            self.stdout.write("ensure_admin: ADMIN_EMAIL or ADMIN_PASSWORD not set; skipping.")
            return

        user = User.objects.filter(email__iexact=email).first()
        created = False
        if user is None:
            user = User.objects.create_user(
                username=email,
                email=email,
                password=password,
                first_name=name,
            )
            created = True
        else:
            user.username = email
            user.email = email
            if not user.first_name:
                user.first_name = name
            user.set_password(password)

        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.save()

        UserProfile.objects.get_or_create(user=user)
        verb = "created" if created else "updated"
        self.stdout.write(self.style.SUCCESS(f"ensure_admin: {verb} staff superuser {user.email} (id={user.id})"))

