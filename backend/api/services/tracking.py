import logging

from django.db.models import F
from django.utils import timezone

from accounts.models import UserProfile

from ..models import ActivityEvent, AdminAuditLog, AIUsageLog

logger = logging.getLogger(__name__)

ALLOWED_ACTIVITY_EVENTS = {
    'user_login': 'authentication',
    'user_registered': 'authentication',
    'portfolio_created': 'portfolio_builder',
    'portfolio_updated': 'portfolio_builder',
    'portfolio_deleted': 'portfolio_builder',
    'template_selected': 'templates',
    'resume_uploaded': 'resume_studio',
    'resume_exported': 'resume_studio',
    'ai_request_completed': 'ai_assistant',
    'ai_request_failed': 'ai_assistant',
    'github_connected': 'github_integration',
    'portfolio_published': 'publishing',
    'portfolio_unpublished': 'publishing',
}

CLIENT_ALLOWED_EVENTS = {
    'resume_exported',
    'template_selected',
}

SAFE_METADATA_KEYS = {
    'portfolio_id',
    'template',
    'career_track',
    'provider',
    'model',
    'section_type',
    'action',
    'format',
    'theme',
    'status_code',
    'error_type',
    'page_name',
}


def sanitize_metadata(metadata):
    if not isinstance(metadata, dict):
        return {}
    clean = {}
    for key, value in metadata.items():
        if key not in SAFE_METADATA_KEYS:
            continue
        if isinstance(value, (bool, int)):
            clean[key] = value
        elif isinstance(value, str):
            clean[key] = value.strip()[:120]
    return clean


def record_activity(user, event_name, feature_name=None, status='success', metadata=None, touch_active=True):
    if event_name not in ALLOWED_ACTIVITY_EVENTS:
        logger.warning("Ignored unrecognized activity event: %s", event_name)
        return None

    resolved_feature = feature_name or ALLOWED_ACTIVITY_EVENTS[event_name]
    resolved_user = user if (user is not None and getattr(user, 'is_authenticated', False)) else None
    normalized_status = 'failed' if str(status).lower() == 'failed' else 'success'
    clean_meta = sanitize_metadata(metadata)

    try:
        event = ActivityEvent.objects.create(
            user=resolved_user,
            event_name=event_name,
            feature_name=resolved_feature[:64],
            status=normalized_status,
            metadata=clean_meta,
        )
        if resolved_user is not None and touch_active and normalized_status == 'success':
            UserProfile.objects.get_or_create(user=resolved_user)
            UserProfile.objects.filter(user=resolved_user).update(last_active_at=timezone.now())
        return event
    except Exception as exc:
        logger.warning("Failed to record ActivityEvent (%s): %s", event_name, exc)
        return None


def record_ai_usage(
    user,
    action_name,
    *,
    provider='unknown',
    model_name='',
    status='success',
    prompt_tokens=None,
    completion_tokens=None,
    total_tokens=None,
    credits_used=1,
    latency_ms=None,
    error_message='',
):
    resolved_user = user if (user is not None and getattr(user, 'is_authenticated', False)) else None
    normalized_status = 'failed' if str(status).lower() == 'failed' else 'success'
    effective_credits = max(0, int(credits_used)) if normalized_status == 'success' else 0

    try:
        usage_row = AIUsageLog.objects.create(
            user=resolved_user,
            action_name=str(action_name or 'ai_action')[:64],
            provider=str(provider or 'unknown')[:32],
            model_name=str(model_name or '')[:80],
            status=normalized_status,
            prompt_tokens=prompt_tokens if isinstance(prompt_tokens, int) and prompt_tokens >= 0 else None,
            completion_tokens=completion_tokens if isinstance(completion_tokens, int) and completion_tokens >= 0 else None,
            total_tokens=total_tokens if isinstance(total_tokens, int) and total_tokens >= 0 else None,
            credits_used=effective_credits,
            latency_ms=latency_ms if isinstance(latency_ms, int) and latency_ms >= 0 else None,
            error_message=str(error_message or '')[:240],
        )

        if resolved_user is not None and normalized_status == 'success':
            UserProfile.objects.get_or_create(user=resolved_user)
            UserProfile.objects.filter(user=resolved_user).update(
                ai_credits_used=F('ai_credits_used') + effective_credits,
                last_active_at=timezone.now(),
            )

        record_activity(
            resolved_user,
            'ai_request_completed' if normalized_status == 'success' else 'ai_request_failed',
            feature_name='ai_assistant',
            status=normalized_status,
            metadata={
                'action': str(action_name)[:60],
                'provider': str(provider or 'unknown')[:32],
                'model': str(model_name or '')[:60],
            },
            touch_active=False,
        )
        return usage_row
    except Exception as exc:
        logger.warning("Failed to record AIUsageLog (%s): %s", action_name, exc)
        return None


def record_admin_audit(admin_user, action_type, target_user=None, details=None):
    try:
        safe_details = {}
        if isinstance(details, dict):
            for k, v in details.items():
                if isinstance(v, (bool, int, str)):
                    safe_details[str(k)[:40]] = v[:180] if isinstance(v, str) else v
        return AdminAuditLog.objects.create(
            admin_user=admin_user if getattr(admin_user, 'is_authenticated', False) else None,
            target_user=target_user,
            action_type=str(action_type)[:64],
            details=safe_details,
        )
    except Exception as exc:
        logger.warning("Failed to record AdminAuditLog (%s): %s", action_type, exc)
        return None

