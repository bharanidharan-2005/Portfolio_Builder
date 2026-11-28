from django.contrib import admin

from .models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'user_email', 'plan', 'ai_credits_used', 'last_active_at', 'workspace_code')
    list_display_links = ('user',)
    list_filter = ('plan',)
    search_fields = ('user__username', 'user__email', 'workspace_code')

    @admin.display(description='Email')
    def user_email(self, obj):
        return obj.user.email
