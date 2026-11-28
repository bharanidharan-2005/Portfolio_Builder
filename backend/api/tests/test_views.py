import os
from types import SimpleNamespace
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError
from django.test import TestCase
from django.urls import reverse

from api.models import AISessionLog, Portfolio, PortfolioPage, PortfolioSection

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

    def test_portfolio_slug_is_unique_per_user(self):
        Portfolio.objects.create(owner=self.owner, title='first', slug='main', owner_name='Owner')
        second = Portfolio.objects.create(owner=self.owner, title='second', slug='secondary', owner_name='Owner')
        self.assertEqual(second.slug, 'secondary')
        with self.assertRaises(IntegrityError):
            Portfolio.objects.create(owner=self.owner, title='dup', slug='main', owner_name='Owner')

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
    @patch('api.views.utils.send_mail')
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

        with patch('api.views.get_gemini_clients', return_value=[fake_client]):
            res = self.client.post(
                reverse('ai-refine'),
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

        with patch('api.views.get_gemini_clients', return_value=[fake_client]):
            res = self.client.post(
                reverse('ai-refine'),
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
        with patch('api.views.get_gemini_clients', return_value=[fake_client]):
            res = self.client.post(
                reverse('ai-refine'),
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
        self.assertEqual(res.content, b'')
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
        self.assertEqual(res.content, b'')
        self.assertFalse(PortfolioPage.objects.filter(pk=target.id).exists())
        self.assertFalse(PortfolioSection.objects.filter(page=target).exists())

        # Other user's page cannot be deleted.
        other_headers = auth_client(self.client, self.other)
        home = PortfolioPage.objects.get(portfolio__owner=self.owner, name='Home')
        denied = self.client.delete(reverse('page-detail', args=[home.id]), **other_headers)
        self.assertEqual(denied.status_code, 404)

    def test_frontpage_template_get_and_patch(self):
        headers = auth_client(self.client, self.owner)
        res = self.client.get(reverse('portfolio-settings'), **headers)
        self.assertEqual(res.status_code, 200)
        self.assertIn('frontpageTemplate', res.json())

        # Update frontpageTemplate
        patch_res = self.client.patch(
            reverse('portfolio-settings'),
            {'frontpageTemplate': 'template4'},
            content_type='application/json',
            **headers,
        )
        self.assertEqual(patch_res.status_code, 200)
        self.assertEqual(patch_res.json()['frontpageTemplate'], 'template4')

        # Check GET returns updated value
        check_res = self.client.get(reverse('portfolio-settings'), **headers)
        self.assertEqual(check_res.status_code, 200)
        self.assertEqual(check_res.json()['frontpageTemplate'], 'template4')

        # Private draft must NOT be publicly accessible
        draft_res = self.client.get(reverse('public-portfolio', args=[self.owner.username]))
        self.assertEqual(draft_res.status_code, 404)

        # Publish portfolio and check public access returns the template in settings
        pub_toggle = self.client.patch(
            reverse('portfolio-settings'),
            data={'isPublished': True},
            content_type='application/json',
            **headers,
        )
        self.assertEqual(pub_toggle.status_code, 200)

        public_res = self.client.get(reverse('public-portfolio', args=[self.owner.username]))
        self.assertEqual(public_res.status_code, 200)
        self.assertEqual(public_res.json().get('settings', {}).get('frontpageTemplate'), 'template4')

        # Multi-portfolio creation & section add & AI assistant & resume review preview
        created_p = self.client.post(
            reverse('portfolio-list'),
            data={'title': 'AI Research Portfolio', 'career_track': 'ai_ml_engineer'},
            content_type='application/json',
            **headers,
        )
        self.assertEqual(created_p.status_code, 201)
        new_pid = created_p.json()['id']

        portfolios_res = self.client.get(reverse('portfolio-list'), **headers)
        self.assertEqual(portfolios_res.status_code, 200)
        self.assertEqual(len(portfolios_res.json()['portfolios']), 2)

        bad_file = self.client.post(
            reverse('parse-resume'),
            data={'file': SimpleUploadedFile('fake.pdf', b'not-a-pdf', content_type='application/pdf')},
            **headers,
        )
        self.assertEqual(bad_file.status_code, 400)

        detail_del = self.client.delete(reverse('portfolio-detail', args=[new_pid]), **headers)
        self.assertEqual(detail_del.status_code, 204)
        self.assertEqual(detail_del.content, b'')

    @patch(
        'api.views.ai.generate_text_with_fallback',
        return_value=SimpleNamespace(
            text='{"suggestions": [{"label": "Impact", "bio": "Built resilient REST APIs and cut p95 latency by 35%."}]}'
        ),
    )
    def test_section_create_and_ai_assistant_action(self, mock_ai):
        headers = auth_client(self.client, self.owner)
        pages_res = self.client.get(reverse('page-list'), **headers)
        home_id = pages_res.json()[0]['id']

        sec_res = self.client.post(
            reverse('section-create'),
            data={'page': home_id, 'section_type': 'achievements', 'content_data': {'title': 'Honors', 'items': []}},
            content_type='application/json',
            **headers,
        )
        self.assertEqual(sec_res.status_code, 201)
        self.assertEqual(sec_res.json()['section_type'], 'achievements')

        ai_res = self.client.post(
            reverse('ai-assistant-action'),
            data={'action': 'generate_summary', 'context': 'Backend engineer specializing in Django'},
            content_type='application/json',
            **headers,
        )
        self.assertEqual(ai_res.status_code, 200)
        self.assertTrue(ai_res.json()['success'])
        self.assertIn('p95', ai_res.json()['data']['suggestions'][0]['bio'])
        self.assertTrue(mock_ai.called)

    @patch.dict(os.environ, {'GITHUB_CLIENT_ID': 'gh-id', 'GITHUB_CLIENT_SECRET': 'gh-secret'})
    @patch('api.views.social_auth.requests.get')
    @patch('api.views.social_auth.requests.post')
    def test_github_social_login_forwards_redirect_uri_and_returns_error_details(self, mock_post, mock_get):
        # 1) GitHub error_description should be surfaced cleanly
        err_resp = SimpleNamespace(
            status_code=200,
            json=lambda: {'error': 'redirect_uri_mismatch', 'error_description': 'The redirect_uri MUST match the registered URL.'},
        )
        mock_post.return_value = err_resp
        bad_res = self.client.post(
            reverse('social_login'),
            data={'provider': 'github', 'code': 'abc', 'redirect_uri': 'http://localhost:5173/github/callback'},
            content_type='application/json',
        )
        self.assertEqual(bad_res.status_code, 400)
        self.assertIn('redirect_uri', bad_res.json()['error'])
        self.assertEqual(mock_post.call_args.kwargs['data']['redirect_uri'], 'http://localhost:5173/github/callback')

        # 2) Valid exchange creates/logs in user and returns tokens
        mock_post.return_value = SimpleNamespace(status_code=200, json=lambda: {'access_token': 'gho_123'})
        mock_get.side_effect = [
            SimpleNamespace(status_code=200, json=lambda: {'name': 'Octo Cat', 'login': 'octocat'}),
            SimpleNamespace(status_code=200, json=lambda: [{'email': 'octo@example.com', 'primary': True, 'verified': True}]),
        ]
        ok_res = self.client.post(
            reverse('social_login'),
            data={'provider': 'github', 'code': 'good-code', 'redirect_uri': 'http://localhost:5173/github/callback'},
            content_type='application/json',
        )
        self.assertEqual(ok_res.status_code, 200)
        self.assertTrue(ok_res.json()['success'])
        self.assertIn('access', ok_res.json())
        self.assertEqual(ok_res.json()['user']['email'], 'octo@example.com')

    @patch.dict(os.environ, {'VERCEL_TOKEN': ''})
    def test_deploy_requires_html_and_reports_unconfigured_token(self):
        headers = auth_client(self.client, self.owner)
        missing_html = self.client.post(
            reverse('deploy'),
            data={},
            content_type='application/json',
            **headers,
        )
        self.assertEqual(missing_html.status_code, 400)

        missing_token = self.client.post(
            reverse('deploy'),
            data={'html_content': '<html><body><h1>Portfolio</h1></body></html>'},
            content_type='application/json',
            **headers,
        )
        self.assertEqual(missing_token.status_code, 503)

    @patch.dict(os.environ, {'VERCEL_TOKEN': 'test-vercel-token'})
    @patch('api.views.utils.requests.post')
    def test_deploy_succeeds_and_marks_portfolio_published(self, mock_post):
        headers = auth_client(self.client, self.owner)
        self.client.get(reverse('portfolio-list'), **headers)
        mock_post.return_value = SimpleNamespace(
            status_code=200,
            json=lambda: {'url': 'aurabuild-demo.vercel.app'},
        )
        res = self.client.post(
            reverse('deploy'),
            data={'html_content': '<html><body><h1>Portfolio</h1></body></html>'},
            content_type='application/json',
            **headers,
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()['url'], 'https://aurabuild-demo.vercel.app')
        portfolio = Portfolio.objects.get(owner=self.owner)
        self.assertTrue(portfolio.is_published)
        self.assertEqual(portfolio.published_url, 'https://aurabuild-demo.vercel.app')

    def test_public_portfolio_query_param_scopes_to_owner_and_slug(self):
        headers_owner = auth_client(self.client, self.owner)
        headers_other = auth_client(self.client, self.other)

        p1 = self.client.post(
            reverse('portfolio-list'),
            {'title': 'Systems Showcase', 'slug': 'systems-demo', 'owner_name': 'OwnerOne'},
            content_type='application/json',
            **headers_owner,
        ).json()
        p2 = self.client.post(
            reverse('portfolio-list'),
            {'title': 'Design Showcase', 'slug': 'design-demo', 'owner_name': 'OwnerOne'},
            content_type='application/json',
            **headers_owner,
        ).json()
        # Publish both portfolios under owner
        self.client.patch(
            reverse('portfolio-detail', args=[p1['id']]),
            {'is_published': True},
            content_type='application/json',
            **headers_owner,
        )
        self.client.patch(
            reverse('portfolio-detail', args=[p2['id']]),
            {'is_published': True},
            content_type='application/json',
            **headers_owner,
        )

        # Create a same-slug published portfolio under other user
        other_p = self.client.post(
            reverse('portfolio-list'),
            {'title': 'Other User Design', 'slug': 'shared-slug', 'owner_name': 'OtherTwo'},
            content_type='application/json',
            **headers_other,
        ).json()
        self.client.patch(
            reverse('portfolio-detail', args=[other_p['id']]),
            {'is_published': True},
            content_type='application/json',
            **headers_other,
        )

        # ?portfolio=design-demo resolves specifically to owner's second portfolio
        res_p2 = self.client.get(reverse('public-portfolio', args=['OwnerOne']) + '?portfolio=design-demo')
        self.assertEqual(res_p2.status_code, 200)
        self.assertEqual(res_p2.json()['slug'], 'design-demo')

        # Requesting other user's slug under OwnerOne's URL must return 404 (no cross-account leak)
        leak = self.client.get(reverse('public-portfolio', args=['OwnerOne']) + '?portfolio=shared-slug')
        self.assertEqual(leak.status_code, 404)

    def test_section_create_persists_to_target_page_not_home(self):
        headers = auth_client(self.client, self.owner)
        self.client.get(reverse('page-list'), **headers)  # seeds Home
        second = self.client.post(
            reverse('page-create'),
            {'name': 'Research', 'seed_default': False},
            content_type='application/json',
            **headers,
        )
        self.assertEqual(second.status_code, 201)
        second_id = second.json()['id']

        sec_res = self.client.post(
            reverse('section-create'),
            {'page': second_id, 'section_type': 'certifications', 'content_data': {'title': 'Honors', 'items': []}},
            content_type='application/json',
            **headers,
        )
        self.assertEqual(sec_res.status_code, 201)
        self.assertEqual(PortfolioSection.objects.filter(page_id=second_id, section_type='certifications').count(), 1)

    def test_me_returns_plan_for_monetization_readiness(self):
        headers = auth_client(self.client, self.owner)
        res = self.client.get(reverse('auth-me'), **headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()['plan'], 'free')
        self.assertIn('is_staff', res.json())


class AdminDashboardAndTrackingTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username='regular@example.com',
            email='regular@example.com',
            password='RegularPassword123!',
            first_name='Regular User',
        )
        self.admin = User.objects.create_user(
            username='admin@example.com',
            email='admin@example.com',
            password='AdminPassword123!',
            first_name='Site Admin',
            is_staff=True,
        )

    def test_admin_endpoints_reject_unauthenticated_and_non_staff(self):
        url_names = [
            'admin-overview',
            'admin-users-list',
            'admin-users-export',
            'admin-analytics',
            'admin-ai-usage',
            'admin-system-health',
            'admin-audit-logs',
        ]
        for name in url_names:
            anon_res = self.client.get(reverse(name))
            self.assertEqual(anon_res.status_code, 401, f"{name} must require auth")

        non_admin_headers = auth_client(self.client, self.owner)
        for name in url_names:
            user_res = self.client.get(reverse(name), **non_admin_headers)
            self.assertEqual(user_res.status_code, 403, f"{name} must block non-staff user")

        patch_res = self.client.patch(
            reverse('admin-user-detail', args=[self.owner.id]),
            {'plan': 'pro'},
            content_type='application/json',
            **non_admin_headers,
        )
        self.assertEqual(patch_res.status_code, 403)

    def test_admin_overview_user_management_tracking_and_audit(self):
        from api.models import ActivityEvent, AdminAuditLog, AIUsageLog

        owner_headers = auth_client(self.client, self.owner)
        admin_headers = auth_client(self.client, self.admin)

        # Trigger real user portfolio & tracking events
        created = self.client.post(
            reverse('portfolio-list'),
            {'title': 'Cloud Portfolio', 'career_track': 'software_developer', 'frontpage_template': 'template2'},
            content_type='application/json',
            **owner_headers,
        )
        self.assertEqual(created.status_code, 201)

        # Client activity endpoint accepts allowlisted export event, rejects spoofed login event
        ok_ev = self.client.post(
            reverse('activity-track'),
            {'event_name': 'resume_exported', 'metadata': {'format': 'pdf'}},
            content_type='application/json',
            **owner_headers,
        )
        self.assertEqual(ok_ev.status_code, 200)
        bad_ev = self.client.post(
            reverse('activity-track'),
            {'event_name': 'user_login'},
            content_type='application/json',
            **owner_headers,
        )
        self.assertEqual(bad_ev.status_code, 400)

        AIUsageLog.objects.create(
            user=self.owner,
            action_name='ai_copilot',
            provider='groq',
            model_name='llama-3.3-70b-versatile',
            status='success',
            prompt_tokens=100,
            completion_tokens=40,
            total_tokens=140,
            credits_used=1,
            latency_ms=420,
        )

        # Admin overview
        ov = self.client.get(reverse('admin-overview') + '?range=30d', **admin_headers)
        self.assertEqual(ov.status_code, 200)
        self.assertGreaterEqual(ov.json()['users']['total'], 2)
        self.assertGreaterEqual(ov.json()['users']['dau'], 1)
        self.assertEqual(ov.json()['ai']['total_requests'], 1)

        # Admin user search & CSV export
        ulist = self.client.get(reverse('admin-users-list') + '?search=regular', **admin_headers)
        self.assertEqual(ulist.status_code, 200)
        self.assertEqual(ulist.json()['count'], 1)

        csv_res = self.client.get(reverse('admin-users-export'), **admin_headers)
        self.assertEqual(csv_res.status_code, 200)
        self.assertIn('text/csv', csv_res['Content-Type'])
        self.assertIn('regular@example.com', csv_res.content.decode('utf-8'))

        # Admin user detail + plan upgrade + suspension + login block
        detail = self.client.get(reverse('admin-user-detail', args=[self.owner.id]), **admin_headers)
        self.assertEqual(detail.status_code, 200)
        self.assertTrue(len(detail.json()['timeline']) >= 2)

        patch_user = self.client.patch(
            reverse('admin-user-detail', args=[self.owner.id]),
            {'plan': 'pro', 'is_active': False},
            content_type='application/json',
            **admin_headers,
        )
        self.assertEqual(patch_user.status_code, 200)
        self.assertEqual(patch_user.json()['user']['plan'], 'pro')
        self.assertFalse(patch_user.json()['user']['is_active'])

        # Self-suspend guard
        self_guard = self.client.patch(
            reverse('admin-user-detail', args=[self.admin.id]),
            {'is_active': False},
            content_type='application/json',
            **admin_headers,
        )
        self.assertEqual(self_guard.status_code, 400)

        # Suspended user cannot log in
        login_res = self.client.post(
            reverse('auth-login'),
            {'email': 'regular@example.com', 'password': 'RegularPassword123!'},
            content_type='application/json',
        )
        self.assertEqual(login_res.status_code, 401)

        # Analytics, AI usage, system health & audit logs
        an = self.client.get(reverse('admin-analytics') + '?range=30d', **admin_headers)
        self.assertEqual(an.status_code, 200)
        self.assertIn('features', an.json())
        self.assertIn('engagement', an.json())

        ai_res = self.client.get(reverse('admin-ai-usage') + '?range=30d', **admin_headers)
        self.assertEqual(ai_res.status_code, 200)
        self.assertEqual(ai_res.json()['summary']['total_tokens'], 140)

        health = self.client.get(reverse('admin-system-health'), **admin_headers)
        self.assertEqual(health.status_code, 200)
        self.assertEqual(health.json()['database']['status'], 'healthy')

        audits = self.client.get(reverse('admin-audit-logs'), **admin_headers)
        self.assertEqual(audits.status_code, 200)
        action_types = {r['action_type'] for r in audits.json()['results']}
        self.assertIn('plan_changed', action_types)
        self.assertIn('user_suspended', action_types)
        self.assertIn('csv_exported', action_types)
        self.assertTrue(ActivityEvent.objects.filter(user=self.owner, event_name='portfolio_created').exists())
        self.assertTrue(AdminAuditLog.objects.count() >= 3)

    def test_session_heartbeat_duration_and_ensure_admin_command(self):
        from datetime import timedelta
        from django.core.management import call_command
        from django.utils import timezone
        from api.models import UserSession

        # Heartbeat requires authentication and valid session_key
        self.assertEqual(self.client.post(reverse('activity-heartbeat')).status_code, 401)
        owner_headers = auth_client(self.client, self.owner)
        bad = self.client.post(
            reverse('activity-heartbeat'),
            {'session_key': 'bad'},
            content_type='application/json',
            **owner_headers,
        )
        self.assertEqual(bad.status_code, 400)

        # Initial beat caps huge spoofed values to <= 60s
        r1 = self.client.post(
            reverse('activity-heartbeat'),
            {'session_key': 'sess_12345678', 'active_seconds': 9999, 'page_path': '/dashboard'},
            content_type='application/json',
            **owner_headers,
        )
        self.assertEqual(r1.status_code, 200)
        self.assertEqual(r1.json()['duration_seconds'], 60)

        # Simulate 35s elapsed and send 30s active heartbeat
        sess = UserSession.objects.get(user=self.owner, session_key='sess_12345678')
        sess.last_seen_at = timezone.now() - timedelta(seconds=35)
        sess.save(update_fields=['last_seen_at'])

        r2 = self.client.post(
            reverse('activity-heartbeat'),
            {'session_key': 'sess_12345678', 'active_seconds': 30, 'page_path': '/workspace/1'},
            content_type='application/json',
            **owner_headers,
        )
        self.assertEqual(r2.status_code, 200)
        self.assertEqual(r2.json()['duration_seconds'], 90)

        admin_headers = auth_client(self.client, self.admin)
        ov = self.client.get(reverse('admin-overview') + '?range=30d', **admin_headers).json()
        self.assertEqual(ov['usage_duration']['total_seconds'], 90)
        self.assertEqual(ov['usage_duration']['total_sessions'], 1)
        self.assertIn('recent_timeline', ov)
        self.assertIn('recent_sessions', ov)

        ulist = self.client.get(reverse('admin-users-list') + '?search=regular', **admin_headers).json()
        self.assertEqual(ulist['results'][0]['total_duration_seconds'], 90)
        self.assertEqual(ulist['results'][0]['sessions_count'], 1)

        detail = self.client.get(reverse('admin-user-detail', args=[self.owner.id]), **admin_headers).json()
        self.assertEqual(detail['metrics']['total_duration_seconds'], 90)
        self.assertEqual(len(detail['recent_sessions']), 1)

        csv_res = self.client.get(reverse('admin-users-export'), **admin_headers)
        self.assertIn('Usage Duration (sec)', csv_res.content.decode('utf-8'))

        # ensure_admin command provisions idempotent staff superuser from env
        with patch.dict(os.environ, {
            'ADMIN_EMAIL': 'envadmin@example.com',
            'ADMIN_PASSWORD': 'EnvStrongPassword99!',
        }):
            call_command('ensure_admin')
        created_admin = User.objects.get(email='envadmin@example.com')
        self.assertTrue(created_admin.is_staff)
        self.assertTrue(created_admin.is_superuser)
        self.assertTrue(created_admin.check_password('EnvStrongPassword99!'))






