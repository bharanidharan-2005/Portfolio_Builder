import re

from django.db.models import Q
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Portfolio, PortfolioPage
from ..serializers import PortfolioPageSerializer


class PublicPortfolioAPIView(APIView):
    """Serve strictly published portfolios by slug or owner username/name."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = []

    def get(self, request, username):
        raw_slug = (username or '').strip()
        target_clean = re.sub(r'[^a-z0-9]', '', raw_slug.lower())
        if not target_clean:
            return Response({'error': 'Portfolio not found.'}, status=status.HTTP_404_NOT_FOUND)

        published_qs = Portfolio.objects.select_related('owner').filter(is_published=True)

        # 1. Exact slug or username match (indexed)
        matched_portfolio = (
            published_qs.filter(
                Q(slug__iexact=raw_slug)
                | Q(owner__username__iexact=raw_slug)
                | Q(owner__email__iexact=raw_slug)
            )
            .order_by('-is_active', '-updated_at')
            .first()
        )

        # 2. Email prefix or normalized name/slug fallback among published portfolios only
        if not matched_portfolio:
            matched_portfolio = (
                published_qs.filter(
                    Q(owner__email__istartswith=raw_slug + '@')
                    | Q(owner__first_name__iexact=raw_slug)
                    | Q(owner_name__iexact=raw_slug)
                )
                .order_by('-is_active', '-updated_at')
                .first()
            )

        if not matched_portfolio:
            for p in published_qs.order_by('-is_active', '-updated_at')[:100]:
                candidates = {
                    re.sub(r'[^a-z0-9]', '', (p.slug or '').lower()),
                    re.sub(r'[^a-z0-9]', '', (p.owner_name or '').lower()),
                }
                if p.owner:
                    candidates.add(re.sub(r'[^a-z0-9]', '', (p.owner.username or '').lower()))
                    if p.owner.email:
                        candidates.add(re.sub(r'[^a-z0-9]', '', p.owner.email.split('@')[0].lower()))
                    if p.owner.first_name:
                        candidates.add(re.sub(r'[^a-z0-9]', '', p.owner.first_name.lower()))
                if target_clean in candidates:
                    matched_portfolio = p
                    break

        if not matched_portfolio:
            return Response(
                {'error': 'No published portfolio found for this URL.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        pages = PortfolioPage.objects.filter(portfolio=matched_portfolio).order_by('order', 'id')
        data = PortfolioPageSerializer(pages, many=True).data

        return Response({
            'id': matched_portfolio.id,
            'title': matched_portfolio.title,
            'slug': matched_portfolio.slug,
            'owner_name': matched_portfolio.owner_name,
            'career_track': matched_portfolio.career_track,
            'seo': {
                'title': matched_portfolio.seo_title or f"{matched_portfolio.owner_name} — Portfolio",
                'description': matched_portfolio.seo_description,
            },
            'settings': {
                'globalBg': matched_portfolio.global_bg_image,
                'theme': matched_portfolio.global_theme,
                'globalFont': matched_portfolio.global_font,
                'frontpageTemplate': getattr(matched_portfolio, 'frontpage_template', 'template1') or 'template1',
                'isPublished': matched_portfolio.is_published,
                'seoTitle': matched_portfolio.seo_title,
                'seoDescription': matched_portfolio.seo_description,
            },
            'pages': data,
        }, status=status.HTTP_200_OK)
