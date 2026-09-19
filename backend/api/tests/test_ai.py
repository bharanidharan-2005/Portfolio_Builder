import os
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

User = get_user_model()

from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
AnonRateThrottle.THROTTLE_RATES = {'anon': '10000/minute'}
UserRateThrottle.THROTTLE_RATES = {'user': '10000/minute'}

from api.views import AICreditThrottle, ImageGenerationThrottle
AICreditThrottle.rate = '10000/minute'
ImageGenerationThrottle.rate = '10000/minute'


def auth_client(client, user):
    from rest_framework_simplejwt.tokens import RefreshToken
    token = RefreshToken.for_user(user).access_token
    return {
        'HTTP_AUTHORIZATION': f'Bearer {token}',
    }


class ImageGenerationTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username='img@example.com', email='img@example.com', password='pw'
        )
        self.headers = auth_client(self.client, self.owner)
        self.url = reverse('generate_custom_image')
        self.png = b'\x89PNG\r\n\x1a\nfake-image-bytes'

    def _fake_client(self, image_data=None, error=None, imagen_data=None, imagen_uri=None):
        from types import SimpleNamespace

        def generate_content(model, contents, config):
            if error:
                raise error
            parts = []
            if image_data:
                parts.append(SimpleNamespace(inline_data=SimpleNamespace(data=image_data)))
            return SimpleNamespace(
                candidates=[SimpleNamespace(content=SimpleNamespace(parts=parts))]
            )

        def generate_images(model, prompt, config):
            if not imagen_data and not imagen_uri:
                raise Exception('imagen not available')
            return SimpleNamespace(
                generated_images=[SimpleNamespace(
                    image=SimpleNamespace(image_bytes=imagen_data, uri=imagen_uri)
                )]
            )

        return SimpleNamespace(
            models=SimpleNamespace(
                generate_content=generate_content,
                generate_images=generate_images,
            )
        )

    @patch('api.views.ai.get_gemini_clients')
    def test_generate_image_success(self, mock_client):
        mock_client.return_value = [self._fake_client(image_data=self.png)]
        res = self.client.post(
            self.url, {'prompt': 'A dark developer workspace'}, content_type='application/json', **self.headers
        )
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertTrue(body['success'])
        self.assertIn('/api/media/generated/', body['image_url'])

    def test_generate_image_requires_prompt(self):
        res = self.client.post(
            self.url, {'prompt': '   '}, content_type='application/json', **self.headers
        )
        self.assertEqual(res.status_code, 400)

    @patch('api.views.ai.get_gemini_clients')
    def test_generate_image_no_payload_returns_500(self, mock_client):
        mock_client.return_value = [self._fake_client(image_data=None)]
        res = self.client.post(
            self.url, {'prompt': 'A dark workspace'}, content_type='application/json', **self.headers
        )
        self.assertEqual(res.status_code, 500)
        self.assertIn('error', res.json())

    @patch('api.views.ai.get_gemini_clients')
    def test_generate_image_rate_limit_returns_friendly_error(self, mock_client):
        err = Exception('HTTP 429: rate limit exceeded')
        mock_client.return_value = [self._fake_client(error=err)]
        res = self.client.post(
            self.url, {'prompt': 'A dark workspace'}, content_type='application/json', **self.headers
        )
        self.assertEqual(res.status_code, 500)
        self.assertIn('rate limit', res.json()['error'].lower())

    @patch('api.views.ai.get_gemini_clients')
    def test_generate_image_imagen_fallback(self, mock_client):
        mock_client.return_value = [self._fake_client(image_data=None, imagen_data=self.png)]
        res = self.client.post(
            self.url, {'prompt': 'A dark workspace'}, content_type='application/json', **self.headers
        )
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()['success'])

    @patch('api.views.ai.get_gemini_clients')
    def test_generate_image_free_tier_zero_quota(self, mock_client):
        err = Exception('429 RESOURCE_EXHAUSTED quota free_tier_requests limit: 0')
        mock_client.return_value = [self._fake_client(error=err)]
        res = self.client.post(
            self.url, {'prompt': 'A dark workspace'}, content_type='application/json', **self.headers
        )
        self.assertEqual(res.status_code, 500)
        self.assertIn('free tier', res.json()['error'].lower())

    @patch('api.views.ai.get_gemini_clients')
    def test_generate_image_rejects_non_http_imagen_uri(self, mock_client):
        # A non-HTTP scheme from the image service must never be downloaded.
        mock_client.return_value = [self._fake_client(image_data=None, imagen_uri='file:///etc/passwd')]
        res = self.client.post(
            self.url, {'prompt': 'A dark workspace'}, content_type='application/json', **self.headers
        )
        self.assertEqual(res.status_code, 500)
        self.assertIn('invalid', res.json()['error'].lower())

    @patch('api.views.ai.get_gemini_clients')
    def test_generate_image_downloads_http_imagen_uri(self, mock_client):
        from unittest.mock import patch as _patch
        mock_client.return_value = [self._fake_client(image_data=None, imagen_uri='https://cdn.example/img.png')]

        class FakeResp:
            def __enter__(self):
                return self
            def __exit__(self, *a):
                return False
            def raise_for_status(self):
                return None
            def iter_content(self, chunk_size):
                yield b'\x89PNG\r\n\x1a\nuri-fallback-image'

        with _patch('api.views.requests.get', return_value=FakeResp()):
            res = self.client.post(
                self.url, {'prompt': 'A dark workspace'}, content_type='application/json', **self.headers
            )
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()['success'])

    def test_generate_image_requires_auth(self):
        res = self.client.post(self.url, {'prompt': 'x'}, content_type='application/json')
        self.assertEqual(res.status_code, 401)
