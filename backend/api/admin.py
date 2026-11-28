from django.contrib import admin

from .models import AISessionLog, Portfolio, PortfolioPage, PortfolioSection


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