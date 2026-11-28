from rest_framework import serializers

from .models import AISessionLog, Portfolio, PortfolioPage, PortfolioSection


class PortfolioSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioSection
        fields = ['id', 'section_type', 'order', 'content_data']


class PortfolioPageSerializer(serializers.ModelSerializer):
    sections = PortfolioSectionSerializer(many=True, read_only=True)

    class Meta:
        model = PortfolioPage
        fields = ['id', 'name', 'slug', 'order', 'theme_accent', 'sections']


class PortfolioSerializer(serializers.ModelSerializer):
    pages_count = serializers.SerializerMethodField()
    sections_count = serializers.SerializerMethodField()
    completeness = serializers.SerializerMethodField()

    class Meta:
        model = Portfolio
        fields = [
            'id',
            'title',
            'slug',
            'owner_name',
            'career_track',
            'global_theme',
            'global_bg_image',
            'global_font',
            'frontpage_template',
            'is_published',
            'is_active',
            'seo_title',
            'seo_description',
            'published_url',
            'created_at',
            'updated_at',
            'pages_count',
            'sections_count',
            'completeness',
        ]

    def get_pages_count(self, obj):
        if hasattr(obj, '_prefetched_objects_cache') and 'portfoliopage_set' in obj._prefetched_objects_cache:
            return len(obj._prefetched_objects_cache['portfoliopage_set'])
        return PortfolioPage.objects.filter(portfolio=obj).count()

    def get_sections_count(self, obj):
        if hasattr(obj, '_prefetched_objects_cache') and 'portfoliopage_set' in obj._prefetched_objects_cache:
            return sum(len(p.sections.all()) for p in obj._prefetched_objects_cache['portfoliopage_set'])
        return PortfolioSection.objects.filter(page__portfolio=obj).count()

    def get_completeness(self, obj):
        required = {'hero', 'about', 'education', 'skills', 'projects_grid', 'contact'}
        if hasattr(obj, '_prefetched_objects_cache') and 'portfoliopage_set' in obj._prefetched_objects_cache:
            present = {
                s.section_type
                for p in obj._prefetched_objects_cache['portfoliopage_set']
                for s in p.sections.all()
            }
        else:
            present = set(
                PortfolioSection.objects.filter(page__portfolio=obj)
                .values_list('section_type', flat=True)
            )
        return round((len(required & present) / len(required)) * 100)


class AISessionLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AISessionLog
        fields = ['id', 'change_type', 'description', 'status', 'timestamp']
