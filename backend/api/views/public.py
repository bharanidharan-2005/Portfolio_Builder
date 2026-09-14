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
        # The frontend generates clean usernames by stripping non-alphanumeric chars
        target_clean = re.sub(r'[^a-z0-9]', '', username.lower())
        
        # In a real app we'd query by a unique indexed slug field.
        # For this prototype, we iterate or filter safely.
        all_portfolios = Portfolio.objects.all()
        matched_portfolio = None
        
        for p in all_portfolios:
            # We match against owner_name which is what the frontend uses for the slug
            clean_name = re.sub(r'[^a-z0-9]', '', p.owner_name.lower())
            if clean_name == target_clean:
                matched_portfolio = p
                break
                
        if not matched_portfolio:
            return Response({'error': 'Portfolio not found for this username.'}, status=status.HTTP_404_NOT_FOUND)
            
        pages = PortfolioPage.objects.filter(portfolio=matched_portfolio).order_by('order')
        data = PortfolioPageSerializer(pages, many=True).data
        return Response(data, status=status.HTTP_200_OK)
