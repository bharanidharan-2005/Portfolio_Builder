import os
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.test import TestCase
from django.urls import reverse

from .models import AISessionLog, Portfolio, PortfolioPage, PortfolioSection

User = get_user_model()

# DRF throttle classes cache their rate dict at import time, so override the
# class attributes directly instead of relying on override_settings.
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle

AnonRateThrottle.THROTTLE_RATES = {'anon': '10000/minute'}
UserRateThrottle.THROTTLE_RATES = {'user': '10000/minute'}

# Same treatment for the custom per-endpoint AI throttles so tests never trip
# the real per-user limits while exercising the endpoints repeatedly.
from api.views import AICreditThrottle, ImageGenerationThrottle

AICreditThrottle.rate = '10000/minute'
ImageGenerationThrottle.rate = '10000/minute'


def auth_client(client, user):
    from rest_framework_simplejwt.tokens import RefreshToken
    token = RefreshToken.for_user(user).access_token
    return {
        'HTTP_AUTHORIZATION': f'Bearer {token}',
    }


class WorkspaceAPITests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username='owner@example.com', email='owner@example.com', password='pw'
        )
        self.other = User.objects.create_user(
            username='other@example.com', email='other@example.com', password='pw'
        )

    def test_unauthenticated_pages_request_is_forbidden(self):
        res = self.client.get(reverse('page-list'))
        self.assertEqual(res.status_code, 401)

    def test_pages_list_creates_default_workspace(self):
        res = self.client.get(reverse('page-list'), **auth_client(self.client, self.owner))
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(len(data), 1)
        page = data[0]
        self.assertEqual(page['name'], 'Home')
        self.assertIn('theme_accent', page)
        # Default scaffold has all six section types.
        self.assertEqual(
            {s['section_type'] for s in page['sections']},
            {'hero', 'about', 'education', 'skills', 'projects_grid', 'contact'},
        )

    def test_create_page_uses_unique_slug_within_portfolio(self):
        headers = auth_client(self.client, self.owner)
        r1 = self.client.post(reverse('page-create'), {'name': 'About Me'}, content_type='application/json', **headers)
        self.assertEqual(r1.status_code, 201)
        r2 = self.client.post(reverse('page-create'), {'name': 'About Me'}, content_type='application/json', **headers)
        self.assertEqual(r2.status_code, 201)
        self.assertEqual(r1.json()['slug'], 'about-me')
        self.assertEqual(r2.json()['slug'], 'about-me-1')

    def test_users_do_not_see_each_others_pages(self):
        self.client.get(reverse('page-list'), **auth_client(self.client, self.owner))
        res = self.client.get(reverse('page-list'), **auth_client(self.client, self.other))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()), 1)
        # The other user's own (empty) workspace must not leak owner's pages.
        self.assertEqual(PortfolioPage.objects.filter(portfolio__owner=self.other).count(), 1)

    def test_section_patch_is_scoped_to_owner(self):
        self.client.get(reverse('page-list'), **auth_client(self.client, self.owner))
        section = PortfolioSection.objects.filter(
            page__portfolio__owner=self.owner, section_type='about'
        ).first()
        headers = auth_client(self.client, self.owner)
        ok = self.client.patch(
            reverse('section-detail', args=[section.id]),
            {'content_data': {'bio': 'Updated bio'}},
            content_type='application/json',
            **headers,
        )
        self.assertEqual(ok.status_code, 200)
        section.refresh_from_db()
        self.assertEqual(section.content_data['bio'], 'Updated bio')

        # Another user cannot touch this section (404, not a leak).
        other_headers = auth_client(self.client, self.other)
        denied = self.client.patch(
            reverse('section-detail', args=[section.id]),
            {'content_data': {'bio': 'Hacked'}},
            content_type='application/json',
            **other_headers,
        )
        self.assertEqual(denied.status_code, 404)
        section.refresh_from_db()
        self.assertEqual(section.content_data['bio'], 'Updated bio')

    def test_section_patch_missing_section_returns_404(self):
        headers = auth_client(self.client, self.owner)
        res = self.client.patch(
            reverse('section-detail', args=[999999]),
            {'content_data': {'bio': 'x'}},
            content_type='application/json',
            **headers,
        )
        self.assertEqual(res.status_code, 404)

    def test_section_patch_rejects_invalid_content_data_shape(self):
        self.client.get(reverse('page-list'), **auth_client(self.client, self.owner))
        section = PortfolioSection.objects.filter(
            page__portfolio__owner=self.owner, section_type='skills'
        ).first()
        headers = auth_client(self.client, self.owner)

        # Array key given a string instead of a list.
        bad_list = self.client.patch(
            reverse('section-detail', args=[section.id]),
            {'content_data': {'items': 'not-an-array'}},
            content_type='application/json',
            **headers,
        )
        self.assertEqual(bad_list.status_code, 400)

        # Whole payload is not an object at all.
        bad_root = self.client.patch(
            reverse('section-detail', args=[section.id]),
            {'content_data': 'garbage'},
            content_type='application/json',
            **headers,
        )
        self.assertEqual(bad_root.status_code, 400)

        # A well-formed payload still saves fine.
        good = self.client.patch(
            reverse('section-detail', args=[section.id]),
            {'content_data': {'items': [{'name': 'Python', 'level': 90}]}},
            content_type='application/json',
            **headers,
        )
        self.assertEqual(good.status_code, 200)

    def test_portfolio_is_unique_per_user(self):
        Portfolio.objects.create(owner=self.owner, title='first', owner_name='Owner')
        with self.assertRaises(IntegrityError):
            Portfolio.objects.create(owner=self.owner, title='second', owner_name='Owner')

    def test_reorder_sections_persists_new_order(self):
        headers = auth_client(self.client, self.owner)
        res = self.client.get(reverse('page-list'), **headers)
        page = res.json()[0]
        section_ids = [s['id'] for s in page['sections']]
        self.assertEqual(len(section_ids), 6)
        # Reverse the order top-to-bottom.
        reversed_ids = list(reversed(section_ids))
        reorder = self.client.post(
            reverse('section-reorder'),
            {'page_id': page['id'], 'ordered_ids': reversed_ids},
            content_type='application/json',
            **headers,
        )
        self.assertEqual(reorder.status_code, 200)
        fresh = self.client.get(reverse('page-list'), **headers).json()[0]
        self.assertEqual([s['id'] for s in fresh['sections']], reversed_ids)

    def test_reorder_rejects_incomplete_list(self):
        headers = auth_client(self.client, self.owner)
        res = self.client.get(reverse('page-list'), **headers)
        page = res.json()[0]
        partial = [page['sections'][0]['id']]
        reorder = self.client.post(
            reverse('section-reorder'),
            {'page_id': page['id'], 'ordered_ids': partial},
            content_type='application/json',
            **headers,
        )
        self.assertEqual(reorder.status_code, 400)

    def test_duplicate_section_creates_clone(self):
        headers = auth_client(self.client, self.owner)
        res = self.client.get(reverse('page-list'), **headers)
        page = res.json()[0]
        original = page['sections'][0]
        dup = self.client.post(reverse('section-duplicate', args=[original['id']]), **headers)
        self.assertEqual(dup.status_code, 200)
        fresh = self.client.get(reverse('page-list'), **headers).json()[0]
        self.assertEqual(len(fresh['sections']), len(page['sections']) + 1)
        clone = fresh['sections'][-1]
        self.assertEqual(clone['section_type'], original['section_type'])
        self.assertEqual(clone['content_data'], original['content_data'])
        self.assertEqual(clone['order'], len(page['sections']))

    def test_contact_message_requires_fields(self):
        headers = auth_client(self.client, self.owner)
        res = self.client.post(
            reverse('contact-message'),
            {'name': 'A', 'message': 'hi'},
            content_type='application/json',
            **headers,
        )
        self.assertEqual(res.status_code, 400)

    @patch.dict(os.environ, {'RESEND_API_KEY': ''}, clear=False)
    @patch('api.views.send_mail')
    def test_contact_message_delivers_to_owner_inbox(self, mock_send):
        headers = auth_client(self.client, self.owner)
        res = self.client.post(
            reverse('contact-message'),
            {'name': 'Visitor', 'email': 'v@x.com', 'message': 'Nice portfolio!'},
            content_type='application/json',
            **headers,
        )
        self.assertEqual(res.status_code, 200)
        mock_send.assert_called_once()
        _, kwargs = mock_send.call_args
        self.assertEqual(kwargs['recipient_list'], [self.owner.email])

    def test_resume_rejects_oversized_file(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        headers = auth_client(self.client, self.owner)
        big = SimpleUploadedFile('resume.pdf', b'x' * (5 * 1024 * 1024 + 1), content_type='application/pdf')
        res = self.client.post(reverse('upload-resume'), {'resume': big}, **headers)
        self.assertEqual(res.status_code, 400)
        self.assertIn('too large', res.json()['error'].lower())

    def test_create_page_boots_default_section_scaffold(self):
        headers = auth_client(self.client, self.owner)
        self.client.get(reverse('page-list'), **headers)  # seeds Home page
        res = self.client.post(
            reverse('page-create'),
            {'name': 'Projects'},
            content_type='application/json',
            **headers,
        )
        self.assertEqual(res.status_code, 201)
        body = res.json()
        self.assertEqual(body['name'], 'Projects')
        self.assertEqual(
            {s['section_type'] for s in body['sections']},
            {'hero', 'about', 'education', 'skills', 'projects_grid', 'contact'},
        )
        # New pages must be ordered after the existing Home page.
        home = PortfolioPage.objects.get(portfolio__owner=self.owner, name='Home')
        new_page = PortfolioPage.objects.get(portfolio__owner=self.owner, name='Projects')
        self.assertGreater(new_page.order, home.order)

    def test_ai_refinement_targets_section_type_on_active_page(self):
        headers = auth_client(self.client, self.owner)
        self.client.get(reverse('page-list'), **headers)  # seeds Home + hero section
        page = PortfolioPage.objects.get(portfolio__owner=self.owner, name='Home')

        fake_resp = type('FakeResp', (), {'text': '{"heading": "Ada", "subheading": "Engineer", "linkedin": "", "github": ""}'})()
        fake_models = type('FakeModels', (), {'generate_content': lambda self, model, contents: fake_resp})()
        fake_client = type('FakeClient', (), {})()
        fake_client.models = fake_models

        with patch('api.views.get_gemini_client', return_value=fake_client):
            res = self.client.post(
                reverse('ai-refinement'),
                {'prompt': 'Write a hero', 'section_type': 'hero', 'page': 'Home'},
                content_type='application/json',
                **headers,
            )
        self.assertEqual(res.status_code, 200)
        section = PortfolioSection.objects.get(page=page, section_type='hero')
        self.assertEqual(section.content_data['heading'], 'Ada')

    def test_ai_refinement_creates_missing_section_on_page(self):
        headers = auth_client(self.client, self.owner)
        self.client.get(reverse('page-list'), **headers)  # seeds Home page
        page = PortfolioPage.objects.get(portfolio__owner=self.owner, name='Home')
        page.sections.filter(section_type='about').delete()

        fake_resp = type('FakeResp', (), {'text': '{"bio": "Fresh bio"}'})()
        fake_models = type('FakeModels', (), {'generate_content': lambda self, model, contents: fake_resp})()
        fake_client = type('FakeClient', (), {})()
        fake_client.models = fake_models

        with patch('api.views.get_gemini_client', return_value=fake_client):
            res = self.client.post(
                reverse('ai-refinement'),
                {'prompt': 'Write a bio', 'section_type': 'about', 'page': 'Home'},
                content_type='application/json',
                **headers,
            )
        self.assertEqual(res.status_code, 200)
        section = PortfolioSection.objects.get(page=page, section_type='about')
        self.assertEqual(section.content_data['bio'], 'Fresh bio')

    def test_ai_refinement_logs_are_attributed_to_user(self):
        headers = auth_client(self.client, self.owner)
        self.client.get(reverse('page-list'), **headers)
        fake_resp = type('FakeResp', (), {'text': '{"bio": "Fresh bio"}'})()
        fake_models = type('FakeModels', (), {'generate_content': lambda self, model, contents: fake_resp})()
        fake_client = type('FakeClient', (), {})()
        fake_client.models = fake_models
        with patch('api.views.get_gemini_client', return_value=fake_client):
            res = self.client.post(
                reverse('ai-refinement'),
                {'prompt': 'Write a bio', 'section_type': 'about', 'page': 'Home'},
                content_type='application/json',
                **headers,
            )
        self.assertEqual(res.status_code, 200)
        log = AISessionLog.objects.latest('timestamp')
        self.assertEqual(log.user, self.owner)
        self.assertEqual(log.change_type, 'Refinement')

    def test_delete_section_is_scoped_to_owner(self):
        headers = auth_client(self.client, self.owner)
        self.client.get(reverse('page-list'), **headers)  # seeds Home page
        section = PortfolioSection.objects.filter(
            page__portfolio__owner=self.owner, section_type='about'
        ).first()
        res = self.client.delete(reverse('section-detail', args=[section.id]), **headers)
        self.assertEqual(res.status_code, 204)
        self.assertFalse(PortfolioSection.objects.filter(pk=section.id).exists())

        # A different user cannot delete it (404, no leak).
        other_headers = auth_client(self.client, self.other)
        gone = self.client.delete(reverse('section-detail', args=[section.id]), **other_headers)
        self.assertEqual(gone.status_code, 404)

    def test_delete_page_requires_remaining_page(self):
        headers = auth_client(self.client, self.owner)
        self.client.get(reverse('page-list'), **headers)  # seeds Home page
        home = PortfolioPage.objects.get(portfolio__owner=self.owner, name='Home')
        res = self.client.delete(reverse('page-detail', args=[home.id]), **headers)
        self.assertEqual(res.status_code, 400)  # must keep at least one page
        self.assertTrue(PortfolioPage.objects.filter(pk=home.id).exists())

    def test_delete_page_cascades_sections_and_is_scoped(self):
        headers = auth_client(self.client, self.owner)
        self.client.get(reverse('page-list'), **headers)  # seeds Home
        self.client.post(reverse('page-create'), {'name': 'Projects'}, content_type='application/json', **headers)
        target = PortfolioPage.objects.get(portfolio__owner=self.owner, name='Projects')
        res = self.client.delete(reverse('page-detail', args=[target.id]), **headers)
        self.assertEqual(res.status_code, 204)
        self.assertFalse(PortfolioPage.objects.filter(pk=target.id).exists())
        self.assertFalse(PortfolioSection.objects.filter(page=target).exists())

        # Other user's page cannot be deleted.
        other_headers = auth_client(self.client, self.other)
        home = PortfolioPage.objects.get(portfolio__owner=self.owner, name='Home')
        denied = self.client.delete(reverse('page-detail', args=[home.id]), **other_headers)
        self.assertEqual(denied.status_code, 404)


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

    @patch('api.views.get_gemini_client')
    def test_generate_image_success(self, mock_client):
        mock_client.return_value = self._fake_client(image_data=self.png)
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

    @patch('api.views.get_gemini_client')
    def test_generate_image_no_payload_returns_500(self, mock_client):
        mock_client.return_value = self._fake_client(image_data=None)
        res = self.client.post(
            self.url, {'prompt': 'A dark workspace'}, content_type='application/json', **self.headers
        )
        self.assertEqual(res.status_code, 500)
        self.assertIn('error', res.json())

    @patch('api.views.get_gemini_client')
    def test_generate_image_rate_limit_returns_friendly_error(self, mock_client):
        err = Exception('HTTP 429: rate limit exceeded')
        mock_client.return_value = self._fake_client(error=err)
        res = self.client.post(
            self.url, {'prompt': 'A dark workspace'}, content_type='application/json', **self.headers
        )
        self.assertEqual(res.status_code, 500)
        self.assertIn('rate limit', res.json()['error'].lower())

    @patch('api.views.get_gemini_client')
    def test_generate_image_imagen_fallback(self, mock_client):
        mock_client.return_value = self._fake_client(image_data=None, imagen_data=self.png)
        res = self.client.post(
            self.url, {'prompt': 'A dark workspace'}, content_type='application/json', **self.headers
        )
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()['success'])

    @patch('api.views.get_gemini_client')
    def test_generate_image_free_tier_zero_quota(self, mock_client):
        err = Exception('429 RESOURCE_EXHAUSTED quota free_tier_requests limit: 0')
        mock_client.return_value = self._fake_client(error=err)
        res = self.client.post(
            self.url, {'prompt': 'A dark workspace'}, content_type='application/json', **self.headers
        )
        self.assertEqual(res.status_code, 500)
        self.assertIn('free tier', res.json()['error'].lower())

    @patch('api.views.get_gemini_client')
    def test_generate_image_rejects_non_http_imagen_uri(self, mock_client):
        # A non-HTTP scheme from the image service must never be downloaded.
        mock_client.return_value = self._fake_client(image_data=None, imagen_uri='file:///etc/passwd')
        res = self.client.post(
            self.url, {'prompt': 'A dark workspace'}, content_type='application/json', **self.headers
        )
        self.assertEqual(res.status_code, 500)
        self.assertIn('invalid', res.json()['error'].lower())

    @patch('api.views.get_gemini_client')
    def test_generate_image_downloads_http_imagen_uri(self, mock_client):
        from unittest.mock import patch as _patch
        mock_client.return_value = self._fake_client(image_data=None, imagen_uri='https://cdn.example/img.png')

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