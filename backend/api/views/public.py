import re
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from ..models import Portfolio, PortfolioPage
from ..serializers import PortfolioPageSerializer

class PublicPortfolioAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []  # Bypass JWT checks completely
    throttle_classes = []
    
    def get(self, request, username):
        # Normalize requested username
        target_clean = re.sub(r'[^a-z0-9]', '', (username or '').lower())
        
        all_portfolios = Portfolio.objects.select_related('owner').all()
        matched_portfolio = None
        
        for p in all_portfolios:
            candidates = set()
            if p.owner_name:
                candidates.add(re.sub(r'[^a-z0-9]', '', p.owner_name.lower()))
            if p.owner:
                if p.owner.username:
                    candidates.add(re.sub(r'[^a-z0-9]', '', p.owner.username.lower()))
                if p.owner.email:
                    clean_email = re.sub(r'[^a-z0-9]', '', p.owner.email.lower())
                    email_prefix = p.owner.email.split('@')[0]
                    candidates.add(clean_email)
                    candidates.add(re.sub(r'[^a-z0-9]', '', email_prefix.lower()))
                if p.owner.first_name:
                    candidates.add(re.sub(r'[^a-z0-9]', '', p.owner.first_name.lower()))
                    full_name = f"{p.owner.first_name}{p.owner.last_name or ''}"
                    candidates.add(re.sub(r'[^a-z0-9]', '', full_name.lower()))
            
            if target_clean in candidates:
                matched_portfolio = p
                break
                
        # Graceful fallback: single portfolio or generic keywords (developer, user, public, preview)
        if not matched_portfolio and all_portfolios.exists():
            if all_portfolios.count() == 1 or target_clean in ('developer', 'user', 'public', 'portfolio', 'preview'):
                matched_portfolio = all_portfolios.first()
            else:
                for p in all_portfolios:
                    c_name = re.sub(r'[^a-z0-9]', '', (p.owner_name or '').lower())
                    if c_name and (c_name in target_clean or target_clean in c_name):
                        matched_portfolio = p
                        break
                        
        if not matched_portfolio:
            return Response({'error': 'Portfolio not found for this username.'}, status=status.HTTP_404_NOT_FOUND)
            
        pages = PortfolioPage.objects.filter(portfolio=matched_portfolio).order_by('order')
        data = PortfolioPageSerializer(pages, many=True).data
        
        return Response({
            'owner_name': matched_portfolio.owner_name,
            'settings': {
                'globalBg': matched_portfolio.global_bg_image,
                'theme': matched_portfolio.global_theme,
                'globalFont': matched_portfolio.global_font,
                'frontpageTemplate': getattr(matched_portfolio, 'frontpage_template', 'template1') or 'template1',
            },
            'pages': data
        }, status=status.HTTP_200_OK)
