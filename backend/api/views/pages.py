import logging

from django.db import models, transaction
from django.utils.text import slugify
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import AISessionLog, Portfolio, PortfolioPage, PortfolioSection
from ..serializers import (
    AISessionLogSerializer,
    PortfolioPageSerializer,
    PortfolioSectionSerializer,
    PortfolioSerializer,
)
from .utils import (
    DEFAULT_WORKSPACE_SECTIONS_MAP,
    _unique_portfolio_slug,
    ensure_user_workspace,
    get_or_create_user_portfolio,
    seed_default_sections,
    validate_section_content,
)

logger = logging.getLogger(__name__)


CAREER_TRACK_SEEDS = {
    'software_developer': {
        'headline': 'Software Engineer & Systems Builder',
        'bio': 'Software engineer focused on reliable backend services, clean architecture, and responsive web applications.',
        'skills': [{'name': 'TypeScript', 'level': 88}, {'name': 'Python', 'level': 90}, {'name': 'React', 'level': 86}, {'name': 'PostgreSQL', 'level': 82}],
    },
    'fullstack_developer': {
        'headline': 'Full-Stack Developer | React & Django',
        'bio': 'Full-stack engineer bridging polished frontend interfaces with scalable REST APIs and cloud deployments.',
        'skills': [{'name': 'React', 'level': 90}, {'name': 'Django REST', 'level': 88}, {'name': 'Tailwind CSS', 'level': 85}, {'name': 'Docker', 'level': 78}],
    },
    'data_engineer': {
        'headline': 'Data Engineer | ETL, Warehousing & Streaming',
        'bio': 'Data engineer designing fault-tolerant ingestion pipelines, dimensional data models, and analytics infrastructure.',
        'skills': [{'name': 'Python', 'level': 92}, {'name': 'SQL', 'level': 92}, {'name': 'Apache Spark', 'level': 84}, {'name': 'Airflow', 'level': 80}],
    },
    'ai_ml_developer': {
        'headline': 'AI / ML Engineer | Applied LLMs & Computer Vision',
        'bio': 'Machine learning engineer building retrieval-augmented workflows, evaluation harnesses, and production inference APIs.',
        'skills': [{'name': 'Python', 'level': 92}, {'name': 'PyTorch', 'level': 86}, {'name': 'LLMs & RAG', 'level': 88}, {'name': 'FastAPI', 'level': 82}],
    },
    'designer': {
        'headline': 'Product & UI/UX Designer',
        'bio': 'Product designer crafting accessible design systems, interaction prototypes, and human-centered digital products.',
        'skills': [{'name': 'Figma', 'level': 94}, {'name': 'Design Systems', 'level': 90}, {'name': 'Prototyping', 'level': 88}, {'name': 'User Research', 'level': 82}],
    },
    'engineering_student': {
        'headline': 'B.E. / B.Tech Engineering Student & Builder',
        'bio': 'Undergraduate engineering student passionate about hands-on software projects, hackathons, and core computer science fundamentals.',
        'skills': [{'name': 'C++ / Java', 'level': 85}, {'name': 'Python', 'level': 84}, {'name': 'Data Structures', 'level': 82}, {'name': 'Git & Linux', 'level': 80}],
    },
    'arts_science_student': {
        'headline': 'Arts & Science Undergraduate | Research & Creative Portfolio',
        'bio': 'Undergraduate scholar combining analytical research, clear writing, interdisciplinary projects, and campus leadership.',
        'skills': [{'name': 'Research & Analysis', 'level': 88}, {'name': 'Technical Writing', 'level': 86}, {'name': 'Data Literacy', 'level': 80}, {'name': 'Public Speaking', 'level': 84}],
    },
}


class PortfolioListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Ensure at least one workspace portfolio exists
        get_or_create_user_portfolio(request)
        portfolios = Portfolio.objects.filter(owner=request.user).order_by('-is_active', '-updated_at', '-id')
        recent_logs = AISessionLog.objects.filter(user=request.user)[:10]
        total_ai_actions = AISessionLog.objects.filter(user=request.user).count()
        published_count = portfolios.filter(is_published=True).count()
        return Response({
            'portfolios': PortfolioSerializer(portfolios, many=True).data,
            'usage': {
                'total_portfolios': portfolios.count(),
                'published_portfolios': published_count,
                'total_ai_actions': total_ai_actions,
                'recent_ai_logs': AISessionLogSerializer(recent_logs, many=True).data,
            },
        })

    def post(self, request):
        title = (request.data.get('title') or '').strip() or 'Untitled Portfolio'
        career_track = (request.data.get('career_track') or 'software_developer').strip()
        global_theme = (request.data.get('global_theme') or 'modern_glass').strip()
        frontpage_template = (request.data.get('frontpage_template') or 'template1').strip()
        global_font = (request.data.get('global_font') or 'font-inter').strip()
        owner_name = (request.data.get('owner_name') or request.user.first_name or request.user.username.split('@')[0]).strip()

        slug = _unique_portfolio_slug(request.user, request.data.get('slug') or title)

        with transaction.atomic():
            Portfolio.objects.filter(owner=request.user, is_active=True).update(is_active=False)
            portfolio = Portfolio.objects.create(
                owner=request.user,
                title=title,
                slug=slug,
                owner_name=owner_name,
                career_track=career_track,
                global_theme=global_theme,
                global_font=global_font,
                frontpage_template=frontpage_template,
                is_active=True,
                is_published=False,
            )
            home_page = PortfolioPage.objects.create(portfolio=portfolio, name='Home', slug='home', order=0)
            seed_default_sections(home_page, owner_name=owner_name, owner_email=request.user.email)

            track_seed = CAREER_TRACK_SEEDS.get(career_track)
            if track_seed:
                hero = home_page.sections.filter(section_type='hero').first()
                if hero:
                    hero.content_data = {**hero.content_data, 'subheading': track_seed['headline']}
                    hero.save()
                about = home_page.sections.filter(section_type='about').first()
                if about:
                    about.content_data = {**about.content_data, 'bio': track_seed['bio']}
                    about.save()
                skills = home_page.sections.filter(section_type='skills').first()
                if skills:
                    skills.content_data = {**skills.content_data, 'items': track_seed['skills']}
                    skills.save()

        return Response(PortfolioSerializer(portfolio).data, status=status.HTTP_201_CREATED)


class PortfolioDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        portfolio = Portfolio.objects.filter(pk=pk, owner=request.user).first()
        if not portfolio:
            return Response({'error': 'Portfolio not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(PortfolioSerializer(portfolio).data)

    def patch(self, request, pk):
        portfolio = Portfolio.objects.filter(pk=pk, owner=request.user).first()
        if not portfolio:
            return Response({'error': 'Portfolio not found.'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data
        if 'title' in data and str(data['title']).strip():
            portfolio.title = str(data['title']).strip()[:200]
        if 'owner_name' in data and str(data['owner_name']).strip():
            portfolio.owner_name = str(data['owner_name']).strip()[:100]
        if 'career_track' in data:
            portfolio.career_track = str(data['career_track'])[:60]
        if 'global_theme' in data:
            portfolio.global_theme = str(data['global_theme'])[:50]
        if 'global_font' in data:
            portfolio.global_font = str(data['global_font'])[:50]
        if 'frontpage_template' in data:
            portfolio.frontpage_template = str(data['frontpage_template'])[:50]
        if 'seo_title' in data:
            portfolio.seo_title = str(data['seo_title'])[:120]
        if 'seo_description' in data:
            portfolio.seo_description = str(data['seo_description'])[:300]
        if 'is_published' in data:
            portfolio.is_published = bool(data['is_published'])
        if 'slug' in data and str(data['slug']).strip():
            new_slug = slugify(str(data['slug']).strip())[:120]
            if new_slug and not Portfolio.objects.filter(owner=request.user, slug=new_slug).exclude(pk=portfolio.pk).exists():
                portfolio.slug = new_slug
        if data.get('is_active'):
            Portfolio.objects.filter(owner=request.user).exclude(pk=portfolio.pk).update(is_active=False)
            portfolio.is_active = True

        portfolio.save()
        return Response(PortfolioSerializer(portfolio).data)

    def delete(self, request, pk):
        portfolio = Portfolio.objects.filter(pk=pk, owner=request.user).first()
        if not portfolio:
            return Response({'error': 'Portfolio not found.'}, status=status.HTTP_404_NOT_FOUND)
        remaining = Portfolio.objects.filter(owner=request.user).exclude(pk=pk).count()
        if remaining == 0:
            return Response({'error': 'You must keep at least one portfolio.'}, status=status.HTTP_400_BAD_REQUEST)
        was_active = portfolio.is_active
        portfolio.delete()
        if was_active:
            next_p = Portfolio.objects.filter(owner=request.user).order_by('-updated_at', '-id').first()
            if next_p:
                next_p.is_active = True
                next_p.save(update_fields=['is_active'])
        return Response({'success': True}, status=status.HTTP_204_NO_CONTENT)


class PageListAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = []

    def get(self, request):
        ensure_user_workspace(request)
        portfolio = get_or_create_user_portfolio(request)
        pages = PortfolioPage.objects.filter(portfolio=portfolio).order_by('order', 'id')
        data = PortfolioPageSerializer(pages, many=True).data
        return Response(data)

    def post(self, request):
        portfolio = get_or_create_user_portfolio(request)
        name = (request.data.get('name') or '').strip()
        if not name:
            return Response({'error': 'Page name is required.'}, status=status.HTTP_400_BAD_REQUEST)

        base_slug = slugify(name)[:90] or 'page'
        slug = base_slug
        suffix = 1
        while PortfolioPage.objects.filter(portfolio=portfolio, slug=slug).exists():
            slug = f"{base_slug}-{suffix}"
            suffix += 1

        max_order = PortfolioPage.objects.filter(portfolio=portfolio).aggregate(models.Max('order'))['order__max']
        next_order = (max_order + 1) if max_order is not None else 0
        page = PortfolioPage.objects.create(portfolio=portfolio, name=name, slug=slug, order=next_order)

        if request.data.get('seed_default', True):
            seed_default_sections(page)

        return Response(PortfolioPageSerializer(page).data, status=status.HTTP_201_CREATED)


class SectionCreateAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = []

    def post(self, request):
        page_id = request.data.get('page_id')
        section_type = (request.data.get('section_type') or '').strip()
        content_data = request.data.get('content_data')

        allowed_types = {choice[0] for choice in PortfolioSection.SECTION_CHOICES}
        if section_type not in allowed_types:
            return Response({'error': 'Invalid section_type.'}, status=status.HTTP_400_BAD_REQUEST)

        if page_id:
            page = PortfolioPage.objects.filter(pk=page_id, portfolio__owner=request.user).first()
        else:
            page = ensure_user_workspace(request)
        if not page:
            return Response({'error': 'Page not found.'}, status=status.HTTP_404_NOT_FOUND)

        if content_data is None:
            content_data = dict(DEFAULT_WORKSPACE_SECTIONS_MAP.get(section_type, {}))
        errors = validate_section_content(section_type, content_data)
        if errors:
            return Response({'error': ' '.join(errors)}, status=status.HTTP_400_BAD_REQUEST)

        order = request.data.get('order')
        if order is None:
            max_order = page.sections.aggregate(models.Max('order'))['order__max']
            order = (max_order + 1) if max_order is not None else 0

        section = PortfolioSection.objects.create(
            page=page,
            section_type=section_type,
            order=int(order),
            content_data=content_data,
        )
        return Response(PortfolioSectionSerializer(section).data, status=status.HTTP_201_CREATED)


class SectionDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = []

    def patch(self, request, pk):
        try:
            section = PortfolioSection.objects.get(pk=pk, page__portfolio__owner=request.user)
        except PortfolioSection.DoesNotExist:
            return Response({'error': 'Section not found.'}, status=status.HTTP_404_NOT_FOUND)
        new_data = request.data.get('content_data', section.content_data)
        errors = validate_section_content(section.section_type, new_data)
        if errors:
            return Response({'error': ' '.join(errors)}, status=status.HTTP_400_BAD_REQUEST)
        section.content_data = new_data
        section.save()
        return Response({'success': True, 'content_data': section.content_data})

    def delete(self, request, pk):
        try:
            section = PortfolioSection.objects.get(pk=pk, page__portfolio__owner=request.user)
        except PortfolioSection.DoesNotExist:
            return Response({'error': 'Section not found.'}, status=status.HTTP_404_NOT_FOUND)
        section.delete()
        return Response({'success': True}, status=status.HTTP_204_NO_CONTENT)


class SectionReorderAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        page_id = request.data.get('page_id')
        ordered_ids = request.data.get('ordered_ids')
        if not page_id or not isinstance(ordered_ids, list):
            return Response({'error': 'page_id and ordered_ids (list) are required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            page = PortfolioPage.objects.get(pk=page_id, portfolio__owner=request.user)
        except PortfolioPage.DoesNotExist:
            return Response({'error': 'Page not found.'}, status=status.HTTP_404_NOT_FOUND)

        page_sections = page.sections.all()
        expected = {s.id for s in page_sections}
        try:
            incoming = {int(i) for i in ordered_ids}
        except (TypeError, ValueError):
            return Response({'error': 'ordered_ids must contain integer IDs.'}, status=status.HTTP_400_BAD_REQUEST)
        if incoming != expected:
            return Response(
                {'error': 'ordered_ids must list every section on the page exactly once.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            for index, sid in enumerate(ordered_ids):
                PortfolioSection.objects.filter(pk=sid, page=page).update(order=index)
        return Response({'success': True, 'ordered_ids': [int(i) for i in ordered_ids]})


class SectionDuplicateAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            section = PortfolioSection.objects.select_related('page').get(
                pk=pk, page__portfolio__owner=request.user
            )
        except PortfolioSection.DoesNotExist:
            return Response({'error': 'Section not found.'}, status=status.HTTP_404_NOT_FOUND)

        max_order = section.page.sections.aggregate(models.Max('order'))['order__max']
        next_order = (max_order + 1) if max_order is not None else 0
        clone = PortfolioSection.objects.create(
            page=section.page,
            section_type=section.section_type,
            order=next_order,
            content_data=dict(section.content_data) if section.content_data else {},
        )
        return Response({'success': True, 'section': PortfolioSectionSerializer(clone).data})


class PageDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = []

    def patch(self, request, pk):
        try:
            page = PortfolioPage.objects.get(pk=pk, portfolio__owner=request.user)
        except PortfolioPage.DoesNotExist:
            return Response({'error': 'Page not found.'}, status=status.HTTP_404_NOT_FOUND)
        if 'name' in request.data:
            new_name = str(request.data['name']).strip()
            if not new_name:
                return Response({'error': 'Page name cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)
            page.name = new_name[:100]
        if 'order' in request.data:
            try:
                page.order = int(request.data['order'])
            except (TypeError, ValueError):
                return Response({'error': 'order must be an integer.'}, status=status.HTTP_400_BAD_REQUEST)
        if 'theme_accent' in request.data:
            page.theme_accent = str(request.data['theme_accent'])[:50]
        page.save()
        return Response(PortfolioPageSerializer(page).data)

    def delete(self, request, pk):
        try:
            page = PortfolioPage.objects.get(pk=pk, portfolio__owner=request.user)
        except PortfolioPage.DoesNotExist:
            return Response({'error': 'Page not found.'}, status=status.HTTP_404_NOT_FOUND)
        remaining = PortfolioPage.objects.filter(portfolio=page.portfolio).exclude(pk=page.pk).count()
        if remaining == 0:
            return Response({'error': 'You must keep at least one page.'}, status=status.HTTP_400_BAD_REQUEST)
        page.delete()
        return Response({'success': True}, status=status.HTTP_204_NO_CONTENT)


class PortfolioSettingsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = []

    def _serialize_settings(self, portfolio):
        return {
            'id': portfolio.id,
            'title': portfolio.title,
            'slug': portfolio.slug,
            'careerTrack': portfolio.career_track,
            'globalBg': portfolio.global_bg_image,
            'theme': portfolio.global_theme,
            'globalFont': portfolio.global_font,
            'frontpageTemplate': getattr(portfolio, 'frontpage_template', 'template1') or 'template1',
            'isPublished': portfolio.is_published,
            'seoTitle': portfolio.seo_title,
            'seoDescription': portfolio.seo_description,
            'publishedUrl': portfolio.published_url,
        }

    def get(self, request):
        portfolio = get_or_create_user_portfolio(request)
        return Response(self._serialize_settings(portfolio), status=status.HTTP_200_OK)

    def patch(self, request):
        portfolio = get_or_create_user_portfolio(request)
        data = request.data
        if 'globalBg' in data:
            portfolio.global_bg_image = data['globalBg']
        if 'theme' in data:
            portfolio.global_theme = str(data['theme'])[:50]
        if 'globalFont' in data:
            portfolio.global_font = str(data['globalFont'])[:50]
        if 'frontpageTemplate' in data:
            portfolio.frontpage_template = str(data['frontpageTemplate'])[:50]
        if 'isPublished' in data:
            portfolio.is_published = bool(data['isPublished'])
        if 'seoTitle' in data:
            portfolio.seo_title = str(data['seoTitle'])[:120]
        if 'seoDescription' in data:
            portfolio.seo_description = str(data['seoDescription'])[:300]
        if 'careerTrack' in data:
            portfolio.career_track = str(data['careerTrack'])[:60]
        if 'title' in data and str(data['title']).strip():
            portfolio.title = str(data['title']).strip()[:200]
        portfolio.save()
        return Response({'success': True, **self._serialize_settings(portfolio)}, status=status.HTTP_200_OK)
