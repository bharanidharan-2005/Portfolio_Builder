from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.test.utils import override_settings
from django.urls import reverse

from .models import UserProfile

User = get_user_model()

# DRF throttle classes cache their rate dict at import time, so override the
# class attributes directly instead of relying on override_settings.
from rest_framework.throttling import AnonRateThrottle, ScopedRateThrottle, UserRateThrottle

AnonRateThrottle.THROTTLE_RATES = {'anon': '10000/minute'}
UserRateThrottle.THROTTLE_RATES = {'user': '10000/minute'}
ScopedRateThrottle.THROTTLE_RATES = {'auth': '10000/minute', 'ai': '10000/minute', 'image-gen': '10000/minute', 'contact': '10000/minute'}


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class AuthFlowTests(TestCase):
    def setUp(self):
        # Never reach real Resend/Gmail SMTP during tests.
        patcher = patch('accounts.views.send_login_code_email', return_value=True)
        self.send_mock = patcher.start()
        self.addCleanup(patcher.stop)

    def _initialize(self, name='Ada Lovelace', email='ada@example.com', password='correct-horse-123'):
        return self.client.post(
            reverse('auth-register'),
            data={'name': name, 'email': email, 'password': password},
            content_type='application/json',
        )

    def _login(self, code):
        return self.client.post(
            reverse('auth-login'),
            data={'code': code},
            content_type='application/json',
        )

    def test_initialize_creates_account_and_returns_unique_code(self):
        res = self._initialize()
        self.assertIn(res.status_code, [200, 201])
        body = res.json()
        self.assertTrue(body['success'])
        code = body['workspace_code']
        self.assertTrue(code)
        self.assertEqual(body['user']['email'], 'ada@example.com')
        user = User.objects.get(email='ada@example.com')
        self.assertEqual(user.first_name, 'Ada Lovelace')
        self.assertTrue(user.check_password('correct-horse-123'))
        self.assertEqual(UserProfile.objects.get(user=user).workspace_code, code)

    def test_initialize_rejects_short_password(self):
        res = self._initialize(password='short')
        self.assertEqual(res.status_code, 400)
        self.assertFalse(User.objects.filter(email='ada@example.com').exists())

    def test_initialize_existing_email_resends_code(self):
        self._initialize()
        res = self._initialize()
        self.assertEqual(res.status_code, 409)
        body = res.json()
        self.assertTrue(body['account_exists'])
        self.assertEqual(self.send_mock.call_count, 2)

    def test_login_with_workspace_code(self):
        code = self._initialize().json()['workspace_code']
        res = self._login(code)
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertIn('access', body)
        self.assertIn('refresh', body)
        self.assertEqual(body['workspace_code'], code)
        self.assertEqual(body['user']['email'], 'ada@example.com')

    def test_login_rejects_bad_code(self):
        res = self._login('not-a-real-code')
        self.assertEqual(res.status_code, 401)

    def test_login_tolerates_zero_o_and_case_mixups(self):
        # Old codes could contain both 0/O and 1/l/I. Typing either variant
        # (and any casing) must still authenticate.
        self._initialize()
        profile = UserProfile.objects.get(user__email='ada@example.com')
        profile.workspace_code = 'CBN1DPhCUD0Ya.n9OMDC'
        profile.save()
        res = self._login('cbn1dphcudoYa.n90mdc')  # O<->0 swapped, case folded
        self.assertEqual(res.status_code, 200)
        self.assertIn('access', res.json())

    def test_login_requires_code(self):
        res = self.client.post(
            reverse('auth-login'),
            data={},
            content_type='application/json',
        )
        self.assertEqual(res.status_code, 400)

    def test_workspace_codes_are_unique_per_account(self):
        code_a = self._initialize(email='ada@example.com').json()['workspace_code']
        code_b = self._initialize(name='Grace Hopper', email='grace@example.com').json()['workspace_code']
        self.assertNotEqual(code_a, code_b)
        self.assertEqual(
            UserProfile.objects.filter(workspace_code__in=[code_a, code_b]).count(), 2
        )

    def test_me_returns_workspace_code_for_authenticated_user(self):
        code = self._initialize().json()['workspace_code']
        token = self._login(code).json()['access']
        res = self.client.get(reverse('auth-me'), HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()['workspace_code'], code)
        self.assertEqual(res.json()['email'], 'ada@example.com')

    def test_password_reset_requires_verified_otp_and_protects_accounts(self):
        self._initialize(email='ada@example.com', password='initial-password-1')
        # Unauthenticated reset without OTP must fail
        bad = self.client.post(
            reverse('auth-reset-password'),
            data={'email': 'ada@example.com', 'new_password': 'hacked-password-1'},
            content_type='application/json',
        )
        self.assertEqual(bad.status_code, 400)

        req = self.client.post(
            reverse('auth-request-password-reset'),
            data={'email': 'ada@example.com'},
            content_type='application/json',
        )
        self.assertEqual(req.status_code, 200)
        otp_code = self.send_mock.call_args.args[1]

        wrong = self.client.post(
            reverse('auth-reset-password'),
            data={'email': 'ada@example.com', 'reset_code': '000000', 'new_password': 'new-password-22'},
            content_type='application/json',
        )
        self.assertEqual(wrong.status_code, 400)

        ok = self.client.post(
            reverse('auth-reset-password'),
            data={'email': 'ada@example.com', 'reset_code': otp_code, 'new_password': 'new-password-22'},
            content_type='application/json',
        )
        self.assertEqual(ok.status_code, 200, ok.content.decode())
        self.assertIn('workspace_code', ok.json())
        self.assertIn('access', ok.json())

    def test_profile_refresh_and_logout_blacklist(self):
        code = self._initialize().json()['workspace_code']
        login_res = self._login(code).json()
        access = login_res['access']
        refresh = login_res['refresh']

        patch_res = self.client.patch(
            reverse('auth-profile'),
            data={'name': 'Ada Updated', 'avatar': '🚀'},
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {access}',
        )
        self.assertEqual(patch_res.status_code, 200)
        self.assertEqual(patch_res.json()['name'], 'Ada Updated')
        self.assertEqual(patch_res.json()['avatar'], '🚀')

        refresh_res = self.client.post(
            reverse('auth-token-refresh'),
            data={'refresh': refresh},
            content_type='application/json',
        )
        self.assertEqual(refresh_res.status_code, 200)
        self.assertIn('access', refresh_res.json())
        rotated_refresh = refresh_res.json()['refresh']

        logout_res = self.client.post(
            reverse('auth-logout'),
            data={'refresh': rotated_refresh},
            content_type='application/json',
        )
        self.assertEqual(logout_res.status_code, 200)

        replay_res = self.client.post(
            reverse('auth-token-refresh'),
            data={'refresh': rotated_refresh},
            content_type='application/json',
        )
        self.assertEqual(replay_res.status_code, 401)
