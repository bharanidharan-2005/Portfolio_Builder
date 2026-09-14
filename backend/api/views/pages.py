import io
import json
import logging
import os
import re
import uuid
import string
import random
import time
import pdfplumber
import requests
from django.conf import settings
from django.core.mail import send_mail
from django.db import IntegrityError, models, transaction
from django.http import FileResponse, JsonResponse
from google import genai
from google.genai import types
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework.views import APIView
from django.views.decorators.csrf import csrf_exempt
from ..models import AISessionLog, Portfolio, PortfolioPage, PortfolioSection
from ..serializers import AISessionLogSerializer, PortfolioPageSerializer, PortfolioSectionSerializer
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken

logger = logging.getLogger(__name__)

from .utils import *
# -----------------------------------------------------------------
# 3. PAGE LIST / CREATE / UPDATE
# -----------------------------------------------------------------
class PageListAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = []

    def get(self, request):
        try:
            ensure_user_workspace(request)
            portfolio = get_or_create_user_portfolio(request)
            pages = PortfolioPage.objects.filter(portfolio=portfolio).order_by('order')
            data = PortfolioPageSerializer(pages, many=True).data
            return Response(data)
        except Exception as e:
            logger.error("Workspace Load Error: %s", e)
            # Safely return an empty array to prevent the frontend from freezing
            return Response([], status=status.HTTP_200_OK)

    def post(self, request):
        try:
            portfolio = get_or_create_user_portfolio(request)
            name = request.data.get('name')
            if not name:
                return Response({'error': 'Page name is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
            base_slug = name.lower().replace(' ', '-')
            slug = base_slug
            suffix = 1
            while PortfolioPage.objects.filter(portfolio=portfolio, slug=slug).exists():
                slug = f"{base_slug}-{suffix}"
                suffix += 1
                
            max_order = PortfolioPage.objects.filter(portfolio=portfolio).aggregate(models.Max('order'))['order__max'] or 0
            page = PortfolioPage.objects.create(portfolio=portfolio, name=name, slug=slug, order=max_order + 1)
            
            return Response(PortfolioPageSerializer(page).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error("Page Create Error: %s", e)
            return Response({'error': 'Could not create page due to database state.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# -----------------------------------------------------------------
# 4. SECTION DETAIL & REORDER
# -----------------------------------------------------------------
class SectionDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = []

    def patch(self, request, pk):
        try:
            section = PortfolioSection.objects.get(pk=pk, page__portfolio__owner=get_user_filter(request))
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
            section = PortfolioSection.objects.get(pk=pk, page__portfolio__owner=get_user_filter(request))
        except PortfolioSection.DoesNotExist:
            return Response({'error': 'Section not found.'}, status=status.HTTP_404_NOT_FOUND)
        section.delete()
        return Response({'success': True}, status=status.HTTP_204_NO_CONTENT)

class SectionReorderAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        page_id = request.data.get('page_id')
        ordered_ids = request.data.get('ordered_ids')
        if not page_id or not isinstance(ordered_ids, list):
            return Response({'error': 'page_id and ordered_ids (list) are required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            page = PortfolioPage.objects.get(pk=page_id, portfolio__owner=get_user_filter(request))
        except PortfolioPage.DoesNotExist:
            return Response({'error': 'Page not found.'}, status=status.HTTP_404_NOT_FOUND)

        page_sections = page.sections.all()
        expected = {s.id for s in page_sections}
        incoming = {int(i) for i in ordered_ids}
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
    permission_classes = [permissions.AllowAny]

    def post(self, request, pk):
        try:
            section = PortfolioSection.objects.select_related('page').get(
                pk=pk, page__portfolio__owner=get_user_filter(request)
            )
        except PortfolioSection.DoesNotExist:
            return Response({'error': 'Section not found.'}, status=status.HTTP_404_NOT_FOUND)

        max_order = section.page.sections.aggregate(models.Max('order'))['order__max'] or 0
        clone = PortfolioSection.objects.create(
            page=section.page,
            section_type=section.section_type,
            order=max_order + 1,
            content_data=dict(section.content_data) if section.content_data else {},
        )
        return Response({'success': True, 'section': PortfolioSectionSerializer(clone).data})

class PageDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = []

    def delete(self, request, pk):
        try:
            page = PortfolioPage.objects.get(pk=pk, portfolio__owner=get_user_filter(request))
        except PortfolioPage.DoesNotExist:
            return Response({'error': 'Page not found.'}, status=status.HTTP_404_NOT_FOUND)
        remaining = PortfolioPage.objects.filter(portfolio=page.portfolio).exclude(pk=page.pk).count()
        if remaining == 0:
            return Response({'error': 'You must keep at least one page.'}, status=status.HTTP_400_BAD_REQUEST)
        page.delete()
        return Response({'success': True}, status=status.HTTP_204_NO_CONTENT)

# -----------------------------------------------------------------
