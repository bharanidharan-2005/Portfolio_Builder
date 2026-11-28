import csv
import os
import re
import time
from datetime import datetime, timedelta

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db import connection
from django.db.models import Avg, Count, IntegerField, OuterRef, Q, Subquery, Sum
from django.db.models.functions import Coalesce, TruncDate
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView

from accounts.models import UserProfile
from accounts.views import is_real_secret

from ..models import ActivityEvent, AdminAuditLog, AIUsageLog, Portfolio, UserSession
from ..services.tracking import (
    CLIENT_ALLOWED_EVENTS,
    record_activity,
    record_admin_audit,
)

User = get_user_model()


class AdminRateThrottle(UserRateThrottle):
    scope = 'admin'
    rate = '120/minute'


class IsAdminStaffUser(permissions.BasePermission):
    """Strictly require an authenticated, active staff administrator."""

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        return bool(
            user
            and user.is_authenticated
            and user.is_active
            and user.is_staff
        )


def _parse_range(request):
    raw = (request.query_params.get('range') or '30d').strip().lower()
    now = timezone.now()
    mapping = {'7d': 7, '30d': 30, '90d': 90}
    if raw == 'all':
        return None, None, 'all'
    days = mapping.get(raw, 30)
    return now - timedelta(days=days), days, f'{days}d'


def _csv_safe(value):
    s = '' if value is None else str(value)
    if s and s[0] in ('=', '+', '-', '@', '\t', '\r'):
        return "'" + s
    return s


def _parse_iso_date(raw_date):
    if not raw_date:
        return None
    try:
        return datetime.strptime(raw_date.strip(), '%Y-%m-%d').date()
    except ValueError:
        return None


def _apply_user_filters(queryset, request):
    search = (request.query_params.get('search') or '').strip()
    plan = (request.query_params.get('plan') or 'all').strip().lower()
    status_filter = (request.query_params.get('status') or 'all').strip().lower()
    date_from = _parse_iso_date(request.query_params.get('date_from'))
    date_to = _parse_iso_date(request.query_params.get('date_to'))

    if search:
        queryset = queryset.filter(
            Q(email__icontains=search)
            | Q(first_name__icontains=search)
            | Q(username__icontains=search)
        )
    if plan in ('free', 'pro', 'premium'):
        queryset = queryset.filter(profile__plan=plan)
    if status_filter == 'active':
        queryset = queryset.filter(is_active=True)
    elif status_filter == 'suspended':
        queryset = queryset.filter(is_active=False)
    if date_from:
        queryset = queryset.filter(date_joined__date__gte=date_from)
    if date_to:
        queryset = queryset.filter(date_joined__date__lte=date_to)
    return queryset


class TrackClientActivityView(APIView):
    """Validated endpoint for client-side qualifying activity events (strictly scoped to request.user)."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        event_name = (request.data.get('event_name') or '').strip()
        if event_name not in CLIENT_ALLOWED_EVENTS:
            return Response(
                {'error': 'Unsupported or restricted client activity event.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        metadata = request.data.get('metadata') or {}
        event_status = request.data.get('status', 'success')
        ev = record_activity(
            request.user,
            event_name,
            status=event_status,
            metadata=metadata,
            touch_active=True,
        )
        return Response({'success': True, 'event_id': ev.id if ev else None})


class SessionHeartbeatView(APIView):
    """Record honest visibility-aware session duration seconds for authenticated users."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        raw_key = str(request.data.get('session_key') or '').strip()
        if not re.match(r'^[a-zA-Z0-9_-]{8,64}$', raw_key):
            return Response(
                {'error': 'Valid session_key (8-64 alphanumeric/dash/underscore chars) is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            req_seconds = int(request.data.get('active_seconds') or 0)
        except (TypeError, ValueError):
            req_seconds = 0
        req_seconds = max(0, min(90, req_seconds))
        page_path = str(request.data.get('page_path') or '').strip()[:120]
        now = timezone.now()

        session = UserSession.objects.filter(user=request.user, session_key=raw_key).first()
        if session is None:
            initial_seconds = min(req_seconds, 60)
            session = UserSession.objects.create(
                user=request.user,
                session_key=raw_key,
                last_seen_at=now,
                duration_seconds=initial_seconds,
                last_path=page_path,
            )
        else:
            wall_elapsed = max(0, int((now - session.last_seen_at).total_seconds()))
            capped_delta = min(req_seconds, wall_elapsed + 5, 90)
            session.duration_seconds = (session.duration_seconds or 0) + max(0, capped_delta)
            session.last_seen_at = now
            if page_path:
                session.last_path = page_path
            session.save(update_fields=['duration_seconds', 'last_seen_at', 'last_path'])

        UserProfile.objects.get_or_create(user=request.user)
        UserProfile.objects.filter(user=request.user).update(last_active_at=now)
        return Response({'success': True, 'duration_seconds': session.duration_seconds})


class AdminOverviewAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminStaffUser]
    throttle_classes = [AdminRateThrottle]

    def get(self, request):
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = now - timedelta(days=7)
        month_start = now - timedelta(days=30)
        start_dt, days, range_key = _parse_range(request)

        total_users = User.objects.count()
        new_today = User.objects.filter(date_joined__gte=today_start).count()
        new_week = User.objects.filter(date_joined__gte=week_start).count()
        new_month = User.objects.filter(date_joined__gte=month_start).count()

        qualifying_events = ActivityEvent.objects.filter(user__isnull=False, status='success')
        dau = qualifying_events.filter(created_at__gte=now - timedelta(days=1)).values('user_id').distinct().count()
        wau = qualifying_events.filter(created_at__gte=week_start).values('user_id').distinct().count()
        mau = qualifying_events.filter(created_at__gte=month_start).values('user_id').distinct().count()

        total_portfolios = Portfolio.objects.count()
        published_portfolios = Portfolio.objects.filter(is_published=True).count()
        draft_portfolios = max(0, total_portfolios - published_portfolios)

        resume_qs = ActivityEvent.objects.filter(event_name='resume_uploaded', status='success')
        ai_qs = AIUsageLog.objects.all()
        sess_qs = UserSession.objects.all()
        if start_dt is not None:
            resume_qs = resume_qs.filter(created_at__gte=start_dt)
            ai_qs = ai_qs.filter(created_at__gte=start_dt)
            sess_qs = sess_qs.filter(started_at__gte=start_dt)

        resume_uploads = resume_qs.count()
        ai_total = ai_qs.count()
        ai_success = ai_qs.filter(status='success').count()
        ai_failed = ai_qs.filter(status='failed').count()

        sess_agg = sess_qs.aggregate(
            total_seconds=Coalesce(Sum('duration_seconds'), 0),
            total_sessions=Count('id'),
        )
        total_duration_seconds = sess_agg['total_seconds'] or 0
        total_sessions = sess_agg['total_sessions'] or 0
        avg_session_seconds = round(total_duration_seconds / total_sessions) if total_sessions else 0

        plan_rows = UserProfile.objects.values('plan').annotate(count=Count('id'))
        plan_map = {row['plan'] or 'free': row['count'] for row in plan_rows}
        users_without_profile = max(0, total_users - sum(plan_map.values()))
        free_users = plan_map.get('free', 0) + users_without_profile
        pro_users = plan_map.get('pro', 0)
        premium_users = plan_map.get('premium', 0)

        trend_days = min(days or 30, 30)
        trend_start = (now - timedelta(days=trend_days - 1)).replace(hour=0, minute=0, second=0, microsecond=0)

        reg_by_day = {
            row['day'].isoformat(): row['c']
            for row in User.objects.filter(date_joined__gte=trend_start)
            .annotate(day=TruncDate('date_joined'))
            .values('day')
            .annotate(c=Count('id'))
            if row['day']
        }
        dau_by_day = {
            row['day'].isoformat(): row['c']
            for row in qualifying_events.filter(created_at__gte=trend_start)
            .annotate(day=TruncDate('created_at'))
            .values('day')
            .annotate(c=Count('user_id', distinct=True))
            if row['day']
        }
        ai_by_day = {
            row['day'].isoformat(): row['c']
            for row in AIUsageLog.objects.filter(created_at__gte=trend_start)
            .annotate(day=TruncDate('created_at'))
            .values('day')
            .annotate(c=Count('id'))
            if row['day']
        }
        portfolios_by_day = {
            row['day'].isoformat(): row['c']
            for row in Portfolio.objects.filter(created_at__gte=trend_start)
            .annotate(day=TruncDate('created_at'))
            .values('day')
            .annotate(c=Count('id'))
            if row['day']
        }
        duration_by_day = {
            row['day'].isoformat(): row['sec']
            for row in UserSession.objects.filter(started_at__gte=trend_start)
            .annotate(day=TruncDate('started_at'))
            .values('day')
            .annotate(sec=Coalesce(Sum('duration_seconds'), 0))
            if row['day']
        }

        daily_trends = []
        for offset in range(trend_days):
            d_str = (trend_start + timedelta(days=offset)).date().isoformat()
            daily_trends.append({
                'date': d_str,
                'registrations': reg_by_day.get(d_str, 0),
                'active_users': dau_by_day.get(d_str, 0),
                'ai_requests': ai_by_day.get(d_str, 0),
                'portfolios_created': portfolios_by_day.get(d_str, 0),
                'duration_minutes': round((duration_by_day.get(d_str, 0) or 0) / 60, 1),
            })

        recent_events_qs = ActivityEvent.objects.select_related('user').order_by('-created_at')
        if start_dt is not None:
            recent_events_qs = recent_events_qs.filter(created_at__gte=start_dt)
        recent_timeline = [
            {
                'id': ev.id,
                'user_id': ev.user_id,
                'user_name': (ev.user.first_name or ev.user.username) if ev.user else 'Anonymous',
                'user_email': ev.user.email if ev.user else None,
                'event_name': ev.event_name,
                'feature_name': ev.feature_name,
                'status': ev.status,
                'metadata': ev.metadata or {},
                'timestamp': ev.created_at.isoformat() if ev.created_at else None,
            }
            for ev in recent_events_qs[:30]
        ]

        recent_sessions_rows = sess_qs.select_related('user').order_by('-last_seen_at')[:15]
        recent_sessions = [
            {
                'id': s.id,
                'user_id': s.user_id,
                'user_name': (s.user.first_name or s.user.username) if s.user else 'Unknown',
                'user_email': s.user.email if s.user else None,
                'duration_seconds': s.duration_seconds,
                'last_path': s.last_path,
                'started_at': s.started_at.isoformat() if s.started_at else None,
                'last_seen_at': s.last_seen_at.isoformat() if s.last_seen_at else None,
            }
            for s in recent_sessions_rows
        ]

        return Response({
            'range': range_key,
            'users': {
                'total': total_users,
                'new_today': new_today,
                'new_this_week': new_week,
                'new_this_month': new_month,
                'dau': dau,
                'wau': wau,
                'mau': mau,
            },
            'portfolios': {
                'total': total_portfolios,
                'published': published_portfolios,
                'draft': draft_portfolios,
            },
            'resume_uploads': resume_uploads,
            'ai': {
                'total_requests': ai_total,
                'successful_requests': ai_success,
                'failed_requests': ai_failed,
            },
            'usage_duration': {
                'total_seconds': total_duration_seconds,
                'total_sessions': total_sessions,
                'avg_session_seconds': avg_session_seconds,
            },
            'monetization': {
                'free_users': free_users,
                'pro_users': pro_users,
                'premium_users': premium_users,
                'paid_subscribers': pro_users + premium_users,
                'billing_connected': False,
                'mrr': None,
            },
            'definitions': {
                'active_user': 'Unique registered users with at least 1 qualifying successful event (login, portfolio action, resume upload/export, or AI operation) in the window.',
            },
            'daily_trends': daily_trends,
            'recent_timeline': recent_timeline,
            'recent_sessions': recent_sessions,
        })


class AdminUserListAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminStaffUser]
    throttle_classes = [AdminRateThrottle]

    def get(self, request):
        sort = (request.query_params.get('sort') or 'recent_active').strip().lower()
        try:
            page = max(1, int(request.query_params.get('page') or 1))
        except ValueError:
            page = 1
        try:
            page_size = min(100, max(5, int(request.query_params.get('page_size') or 20)))
        except ValueError:
            page_size = 20

        duration_subquery = (
            UserSession.objects.filter(user=OuterRef('pk'))
            .values('user')
            .annotate(total=Sum('duration_seconds'))
            .values('total')[:1]
        )
        sessions_subquery = (
            UserSession.objects.filter(user=OuterRef('pk'))
            .values('user')
            .annotate(cnt=Count('id'))
            .values('cnt')[:1]
        )

        qs = (
            User.objects.select_related('profile')
            .annotate(
                portfolios_count=Count('portfolio', distinct=True),
                published_count=Count('portfolio', filter=Q(portfolio__is_published=True), distinct=True),
                ai_requests_count=Count('ai_usage_logs', distinct=True),
                total_duration_seconds=Coalesce(Subquery(duration_subquery, output_field=IntegerField()), 0),
                sessions_count=Coalesce(Subquery(sessions_subquery, output_field=IntegerField()), 0),
                effective_last_active=Coalesce('profile__last_active_at', 'last_login', 'date_joined'),
            )
        )
        qs = _apply_user_filters(qs, request)

        sort_map = {
            'recent_active': ('-effective_last_active', '-id'),
            'newest': ('-date_joined', '-id'),
            'portfolios': ('-portfolios_count', '-id'),
            'ai_usage': ('-ai_requests_count', '-id'),
            'usage_duration': ('-total_duration_seconds', '-id'),
        }
        qs = qs.order_by(*sort_map.get(sort, ('-effective_last_active', '-id')))

        total_count = qs.count()
        total_pages = max(1, (total_count + page_size - 1) // page_size)
        page = min(page, total_pages)
        offset = (page - 1) * page_size
        rows = qs[offset:offset + page_size]

        results = []
        for u in rows:
            prof = getattr(u, 'profile', None)
            last_active = (prof.last_active_at if prof else None) or u.last_login
            results.append({
                'id': u.id,
                'name': u.first_name or u.username,
                'email': u.email,
                'date_joined': u.date_joined.isoformat() if u.date_joined else None,
                'last_active_at': last_active.isoformat() if last_active else None,
                'plan': (prof.plan if prof else 'free') or 'free',
                'portfolios_count': u.portfolios_count,
                'published_count': u.published_count,
                'ai_requests_count': u.ai_requests_count,
                'ai_credits_used': prof.ai_credits_used if prof else 0,
                'total_duration_seconds': u.total_duration_seconds or 0,
                'sessions_count': u.sessions_count or 0,
                'is_active': u.is_active,
                'is_staff': u.is_staff,
            })

        return Response({
            'results': results,
            'count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': total_pages,
        })


class AdminUserDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminStaffUser]
    throttle_classes = [AdminRateThrottle]

    def get(self, request, pk):
        user = User.objects.select_related('profile').filter(pk=pk).first()
        if not user:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        prof, _ = UserProfile.objects.get_or_create(user=user)
        portfolios = list(
            Portfolio.objects.filter(owner=user)
            .order_by('-updated_at', '-id')
            .values('id', 'title', 'slug', 'career_track', 'frontpage_template', 'is_published', 'updated_at')
        )
        for p in portfolios:
            if p['updated_at']:
                p['updated_at'] = p['updated_at'].isoformat()

        sessions_count = ActivityEvent.objects.filter(user=user, event_name='user_login', status='success').count()
        session_stats = UserSession.objects.filter(user=user).aggregate(
            total_duration=Coalesce(Sum('duration_seconds'), 0),
            tracked_sessions=Count('id'),
        )
        total_duration_seconds = session_stats['total_duration'] or 0
        tracked_sessions_count = session_stats['tracked_sessions'] or 0
        avg_session_seconds = round(total_duration_seconds / tracked_sessions_count) if tracked_sessions_count else 0

        recent_sessions = [
            {
                'id': s.id,
                'duration_seconds': s.duration_seconds,
                'last_path': s.last_path,
                'started_at': s.started_at.isoformat() if s.started_at else None,
                'last_seen_at': s.last_seen_at.isoformat() if s.last_seen_at else None,
            }
            for s in UserSession.objects.filter(user=user).order_by('-last_seen_at')[:15]
        ]

        resume_uploads = ActivityEvent.objects.filter(user=user, event_name='resume_uploaded', status='success').count()
        resume_exports = ActivityEvent.objects.filter(user=user, event_name='resume_exported', status='success').count()
        ai_total = AIUsageLog.objects.filter(user=user).count()
        ai_success = AIUsageLog.objects.filter(user=user, status='success').count()
        ai_failed = AIUsageLog.objects.filter(user=user, status='failed').count()

        timeline_rows = ActivityEvent.objects.filter(user=user).order_by('-created_at')[:50]
        timeline = [
            {
                'id': ev.id,
                'event_name': ev.event_name,
                'feature_name': ev.feature_name,
                'status': ev.status,
                'metadata': ev.metadata or {},
                'timestamp': ev.created_at.isoformat() if ev.created_at else None,
            }
            for ev in timeline_rows
        ]

        last_active = prof.last_active_at or user.last_login
        return Response({
            'user': {
                'id': user.id,
                'name': user.first_name or user.username,
                'email': user.email,
                'avatar': prof.avatar or '👨‍💻',
                'date_joined': user.date_joined.isoformat() if user.date_joined else None,
                'last_active_at': last_active.isoformat() if last_active else None,
                'plan': prof.plan or 'free',
                'is_active': user.is_active,
                'is_staff': user.is_staff,
            },
            'metrics': {
                'total_sessions': sessions_count,
                'tracked_sessions_count': tracked_sessions_count,
                'total_duration_seconds': total_duration_seconds,
                'avg_session_seconds': avg_session_seconds,
                'portfolios_count': len(portfolios),
                'published_portfolios_count': sum(1 for p in portfolios if p['is_published']),
                'resume_uploads_count': resume_uploads,
                'resume_exports_count': resume_exports,
                'ai_requests_total': ai_total,
                'ai_requests_success': ai_success,
                'ai_requests_failed': ai_failed,
                'ai_credits_used': prof.ai_credits_used or 0,
            },
            'portfolios': portfolios,
            'recent_sessions': recent_sessions,
            'timeline': timeline,
        })

    def patch(self, request, pk):
        target = User.objects.select_related('profile').filter(pk=pk).first()
        if not target:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        prof, _ = UserProfile.objects.get_or_create(user=target)
        data = request.data or {}

        if 'is_active' in data:
            next_active = bool(data['is_active'])
            if target.pk == request.user.pk and not next_active:
                return Response({'error': 'You cannot suspend your own administrator account.'}, status=status.HTTP_400_BAD_REQUEST)
            if target.is_active != next_active:
                target.is_active = next_active
                target.save(update_fields=['is_active'])
                record_admin_audit(
                    request.user,
                    'user_activated' if next_active else 'user_suspended',
                    target_user=target,
                    details={'email': target.email},
                )

        if 'plan' in data:
            next_plan = str(data['plan']).strip().lower()
            if next_plan not in ('free', 'pro', 'premium'):
                return Response({'error': "Plan must be 'free', 'pro', or 'premium'."}, status=status.HTTP_400_BAD_REQUEST)
            prev_plan = prof.plan or 'free'
            if prev_plan != next_plan:
                prof.plan = next_plan
                prof.save(update_fields=['plan'])
                record_admin_audit(
                    request.user,
                    'plan_changed',
                    target_user=target,
                    details={'from': prev_plan, 'to': next_plan},
                )

        if 'is_staff' in data:
            next_staff = bool(data['is_staff'])
            if target.pk == request.user.pk and not next_staff:
                return Response({'error': 'You cannot remove your own administrator role.'}, status=status.HTTP_400_BAD_REQUEST)
            if target.is_staff != next_staff:
                target.is_staff = next_staff
                target.save(update_fields=['is_staff'])
                record_admin_audit(
                    request.user,
                    'staff_role_changed',
                    target_user=target,
                    details={'is_staff': next_staff},
                )

        return Response({
            'success': True,
            'user': {
                'id': target.id,
                'name': target.first_name or target.username,
                'email': target.email,
                'plan': prof.plan or 'free',
                'is_active': target.is_active,
                'is_staff': target.is_staff,
            },
        })


class AdminUsersExportCSVView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminStaffUser]
    throttle_classes = [AdminRateThrottle]

    def get(self, request):
        duration_subquery = (
            UserSession.objects.filter(user=OuterRef('pk'))
            .values('user')
            .annotate(total=Sum('duration_seconds'))
            .values('total')[:1]
        )
        sessions_subquery = (
            UserSession.objects.filter(user=OuterRef('pk'))
            .values('user')
            .annotate(cnt=Count('id'))
            .values('cnt')[:1]
        )
        qs = (
            User.objects.select_related('profile')
            .annotate(
                portfolios_count=Count('portfolio', distinct=True),
                published_count=Count('portfolio', filter=Q(portfolio__is_published=True), distinct=True),
                ai_requests_count=Count('ai_usage_logs', distinct=True),
                total_duration_seconds=Coalesce(Subquery(duration_subquery, output_field=IntegerField()), 0),
                sessions_count=Coalesce(Subquery(sessions_subquery, output_field=IntegerField()), 0),
            )
            .order_by('-date_joined', '-id')
        )
        qs = _apply_user_filters(qs, request)

        record_admin_audit(
            request.user,
            'csv_exported',
            details={'exported_count': qs.count()},
        )

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="aurabuild-users.csv"'
        writer = csv.writer(response)
        writer.writerow([
            'User ID', 'Full Name', 'Email', 'Registered At', 'Last Active',
            'Plan', 'Portfolios', 'Published', 'AI Requests', 'AI Credits Used',
            'Tracked Sessions', 'Usage Duration (sec)', 'Account Status',
        ])
        for u in qs:
            prof = getattr(u, 'profile', None)
            last_active = (prof.last_active_at if prof else None) or u.last_login
            writer.writerow([
                u.id,
                _csv_safe(u.first_name or u.username),
                _csv_safe(u.email),
                u.date_joined.isoformat() if u.date_joined else '',
                last_active.isoformat() if last_active else '',
                _csv_safe((prof.plan if prof else 'free') or 'free'),
                u.portfolios_count,
                u.published_count,
                u.ai_requests_count,
                prof.ai_credits_used if prof else 0,
                u.sessions_count or 0,
                u.total_duration_seconds or 0,
                'Active' if u.is_active else 'Suspended',
            ])
        return response


class AdminFeatureAnalyticsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminStaffUser]
    throttle_classes = [AdminRateThrottle]

    def get(self, request):
        start_dt, _, range_key = _parse_range(request)
        total_users = User.objects.count()

        ev_qs = ActivityEvent.objects.all()
        if start_dt is not None:
            ev_qs = ev_qs.filter(created_at__gte=start_dt)

        features_catalog = [
            ('portfolio_builder', 'Portfolio Builder'),
            ('templates', 'Templates'),
            ('resume_studio', 'Resume Studio'),
            ('ai_assistant', 'AI Assistant'),
            ('github_integration', 'GitHub Integration'),
            ('publishing', 'Publishing'),
        ]
        feature_rows = []
        for f_key, f_label in features_catalog:
            f_qs = ev_qs.filter(feature_name=f_key)
            total_events = f_qs.count()
            unique_users = f_qs.filter(user__isnull=False).values('user_id').distinct().count()
            failed_events = f_qs.filter(status='failed').count()
            adoption = round((unique_users / total_users) * 100, 1) if total_users else 0.0
            feature_rows.append({
                'feature_key': f_key,
                'label': f_label,
                'total_events': total_events,
                'unique_users': unique_users,
                'failed_events': failed_events,
                'adoption_pct': adoption,
            })

        feature_rows_sorted = sorted(feature_rows, key=lambda x: x['total_events'], reverse=True)

        template_popularity = list(
            Portfolio.objects.values('frontpage_template')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )
        career_tracks = list(
            Portfolio.objects.values('career_track')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        # User engagement & onboarding funnel
        users_with_portfolio = User.objects.filter(portfolio__isnull=False).distinct().count()
        users_without_portfolio = max(0, total_users - users_with_portfolio)
        conversion_pct = round((users_with_portfolio / total_users) * 100, 1) if total_users else 0.0

        active_user_ids = set(
            ev_qs.filter(user__isnull=False, status='success').values_list('user_id', flat=True).distinct()
        )
        new_active_users = 0
        if start_dt is not None:
            new_active_users = User.objects.filter(id__in=active_user_ids, date_joined__gte=start_dt).count()
        else:
            new_active_users = len(active_user_ids)
        returning_active_users = max(0, len(active_user_ids) - new_active_users)
        inactive_users = max(0, total_users - len(active_user_ids))

        total_sessions = ev_qs.filter(event_name='user_login', status='success').count()
        avg_sessions = round(total_sessions / len(active_user_ids), 2) if active_user_ids else 0.0

        return Response({
            'range': range_key,
            'features': feature_rows_sorted,
            'template_popularity': template_popularity,
            'career_tracks': career_tracks,
            'engagement': {
                'total_users': total_users,
                'active_users': len(active_user_ids),
                'inactive_users': inactive_users,
                'new_active_users': new_active_users,
                'returning_active_users': returning_active_users,
                'users_with_portfolio': users_with_portfolio,
                'onboarding_incomplete_users': users_without_portfolio,
                'registration_to_portfolio_pct': conversion_pct,
                'avg_sessions_per_active_user': avg_sessions,
            },
        })


class AdminAIUsageAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminStaffUser]
    throttle_classes = [AdminRateThrottle]

    def get(self, request):
        start_dt, days, range_key = _parse_range(request)
        qs = AIUsageLog.objects.all()
        if start_dt is not None:
            qs = qs.filter(created_at__gte=start_dt)

        totals = qs.aggregate(
            total_requests=Count('id'),
            successful_requests=Count('id', filter=Q(status='success')),
            failed_requests=Count('id', filter=Q(status='failed')),
            prompt_tokens=Sum('prompt_tokens'),
            completion_tokens=Sum('completion_tokens'),
            total_tokens=Sum('total_tokens'),
            credits_consumed=Sum('credits_used'),
            avg_latency_ms=Avg('latency_ms'),
        )

        by_provider = list(
            qs.values('provider', 'model_name')
            .annotate(
                requests=Count('id'),
                success=Count('id', filter=Q(status='success')),
                failed=Count('id', filter=Q(status='failed')),
                prompt_tokens=Sum('prompt_tokens'),
                completion_tokens=Sum('completion_tokens'),
                total_tokens=Sum('total_tokens'),
                avg_latency_ms=Avg('latency_ms'),
            )
            .order_by('-requests')
        )

        top_users = list(
            qs.filter(user__isnull=False)
            .values('user_id', 'user__email', 'user__first_name')
            .annotate(
                requests=Count('id'),
                credits=Sum('credits_used'),
                tokens=Sum('total_tokens'),
            )
            .order_by('-requests')[:10]
        )

        trend_days = min(days or 30, 30)
        trend_start = (timezone.now() - timedelta(days=trend_days - 1)).replace(hour=0, minute=0, second=0, microsecond=0)
        daily_ai = list(
            AIUsageLog.objects.filter(created_at__gte=trend_start)
            .annotate(day=TruncDate('created_at'))
            .values('day')
            .annotate(
                total=Count('id'),
                success=Count('id', filter=Q(status='success')),
                failed=Count('id', filter=Q(status='failed')),
            )
            .order_by('day')
        )
        for row in daily_ai:
            if row['day']:
                row['date'] = row['day'].isoformat()
            row.pop('day', None)

        return Response({
            'range': range_key,
            'summary': {
                'total_requests': totals['total_requests'] or 0,
                'successful_requests': totals['successful_requests'] or 0,
                'failed_requests': totals['failed_requests'] or 0,
                'prompt_tokens': totals['prompt_tokens'],
                'completion_tokens': totals['completion_tokens'],
                'total_tokens': totals['total_tokens'],
                'credits_consumed': totals['credits_consumed'] or 0,
                'avg_latency_ms': round(totals['avg_latency_ms']) if totals['avg_latency_ms'] is not None else None,
            },
            'by_provider': by_provider,
            'top_users': top_users,
            'daily_ai': daily_ai,
            'cost_note': 'Token totals only sum requests where the AI provider returned usage metadata; external billing/estimated USD cost requires provider pricing configuration.',
        })


class AdminSystemHealthAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminStaffUser]
    throttle_classes = [AdminRateThrottle]

    def get(self, request):
        db_ok = False
        db_latency_ms = None
        started = time.monotonic()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
            db_ok = True
            db_latency_ms = round((time.monotonic() - started) * 1000, 1)
        except Exception:
            db_ok = False

        cache_ok = False
        try:
            cache.set('aurabuild_health_probe', 'ok', 10)
            cache_ok = cache.get('aurabuild_health_probe') == 'ok'
        except Exception:
            cache_ok = False

        gemini_configured = any(
            is_real_secret(k.strip())
            for k in (os.getenv('GEMINI_API_KEYS') or os.getenv('GEMINI_API_KEY') or '').split(',')
            if k.strip()
        )
        groq_configured = is_real_secret(os.getenv('GROQ_API_KEY', ''))
        email_configured = is_real_secret(os.getenv('RESEND_API_KEY', '')) or bool(
            os.getenv('EMAIL_HOST_USER') and is_real_secret(os.getenv('EMAIL_HOST_PASSWORD', ''))
        )
        redis_configured = bool(os.getenv('REDIS_URL', '').strip())

        since_24h = timezone.now() - timedelta(hours=24)
        recent_failures = list(
            AIUsageLog.objects.filter(status='failed', created_at__gte=since_24h)
            .values('id', 'action_name', 'provider', 'error_message', 'created_at')[:15]
        )
        for item in recent_failures:
            if item['created_at']:
                item['created_at'] = item['created_at'].isoformat()

        failed_events_24h = ActivityEvent.objects.filter(status='failed', created_at__gte=since_24h).count()

        return Response({
            'backend_api': {'status': 'healthy'},
            'database': {'status': 'healthy' if db_ok else 'error', 'latency_ms': db_latency_ms},
            'cache': {'status': 'healthy' if cache_ok else 'degraded'},
            'background_queue': {'configured': redis_configured, 'mode': 'redis' if redis_configured else 'synchronous_fallback'},
            'providers': {
                'gemini_configured': gemini_configured,
                'groq_configured': groq_configured,
                'email_configured': email_configured,
            },
            'failed_events_24h': failed_events_24h,
            'recent_ai_failures': recent_failures,
        })


class AdminAuditLogListAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminStaffUser]
    throttle_classes = [AdminRateThrottle]

    def get(self, request):
        try:
            page = max(1, int(request.query_params.get('page') or 1))
        except ValueError:
            page = 1
        page_size = 25
        qs = AdminAuditLog.objects.select_related('admin_user', 'target_user').order_by('-created_at', '-id')
        total = qs.count()
        offset = (page - 1) * page_size
        rows = qs[offset:offset + page_size]

        results = [
            {
                'id': r.id,
                'admin_email': r.admin_user.email if r.admin_user else 'System',
                'target_email': r.target_user.email if r.target_user else None,
                'action_type': r.action_type,
                'details': r.details or {},
                'timestamp': r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ]
        return Response({
            'results': results,
            'count': total,
            'page': page,
            'total_pages': max(1, (total + page_size - 1) // page_size),
        })

