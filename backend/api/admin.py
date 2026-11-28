from django.contrib import admin

from .models import (
    ActivityEvent,
    AdminAuditLog,
    AISessionLog,
    AIUsageLog,
    Portfolio,
    PortfolioPage,
    PortfolioSection,
    UserSession,
)


@admin.register(Portfolio)
class PortfolioAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'owner_name', 'career_track', 'is_published', 'is_active', 'updated_at')
    list_filter = ('is_published', 'is_active', 'career_track', 'global_theme')
    search_fields = ('owner_name', 'title', 'slug', 'owner__email')


@admin.register(PortfolioPage)
class PortfolioPageAdmin(admin.ModelAdmin):
    list_display = ('id', 'portfolio', 'name', 'slug', 'order', 'theme_accent')
    list_filter = ('portfolio',)
    search_fields = ('name', 'slug', 'portfolio__title')


@admin.register(PortfolioSection)
class PortfolioSectionAdmin(admin.ModelAdmin):
    list_display = ('id', 'page', 'section_type', 'order')
    list_filter = ('section_type', 'page')
    search_fields = ('section_type', 'page__name')


@admin.register(AISessionLog)
class AISessionLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'change_type', 'status', 'timestamp')
    list_filter = ('change_type', 'status', 'timestamp')
    search_fields = ('description', 'user__email')


@admin.register(ActivityEvent)
class ActivityEventAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'event_name', 'feature_name', 'status', 'created_at')
    list_filter = ('event_name', 'feature_name', 'status')
    search_fields = ('user__email', 'event_name', 'feature_name')


@admin.register(AIUsageLog)
class AIUsageLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'action_name', 'provider', 'model_name', 'status', 'total_tokens', 'created_at')
    list_filter = ('provider', 'status', 'action_name')
    search_fields = ('user__email', 'action_name', 'model_name')


@admin.register(AdminAuditLog)
class AdminAuditLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'admin_user', 'target_user', 'action_type', 'created_at')
    list_filter = ('action_type',)
    search_fields = ('admin_user__email', 'target_user__email', 'action_type')


@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'session_key', 'duration_seconds', 'last_path', 'started_at', 'last_seen_at')
    list_filter = ('last_seen_at',)
    search_fields = ('user__email', 'session_key', 'last_path')