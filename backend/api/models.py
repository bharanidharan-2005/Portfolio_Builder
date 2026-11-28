from django.db import models
from django.utils import timezone


# -----------------------------------------------------------------
# 1. MAIN SYSTEM PORTFOLIO SCHEMA
# -----------------------------------------------------------------
class Portfolio(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=120, blank=True, db_index=True)
    owner = models.ForeignKey('auth.User', on_delete=models.CASCADE, null=True, blank=True)
    owner_name = models.CharField(max_length=100)
    career_track = models.CharField(max_length=60, default="software_developer", blank=True)
    global_theme = models.CharField(max_length=50, default="modern_glass", blank=True)
    global_bg_image = models.TextField(blank=True, null=True)
    global_font = models.CharField(max_length=50, default="font-inter", blank=True)
    frontpage_template = models.CharField(max_length=50, default="template1", blank=True)
    is_published = models.BooleanField(default=False, db_index=True)
    is_active = models.BooleanField(default=True)
    seo_title = models.CharField(max_length=120, blank=True, default="")
    seo_description = models.CharField(max_length=300, blank=True, default="")
    published_url = models.URLField(max_length=500, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['owner', 'slug'], name='unique_portfolio_slug_per_owner'),
        ]

    def __str__(self):
        return f"{self.owner_name} — {self.title}"


# -----------------------------------------------------------------
# 2. SITE ROUTING PAGES SCHEMA
# -----------------------------------------------------------------
class PortfolioPage(models.Model):
    portfolio = models.ForeignKey('Portfolio', on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100)
    order = models.IntegerField(default=0)
    theme_accent = models.CharField(max_length=50, default="dark")

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['portfolio', 'slug'], name='unique_page_slug_per_portfolio'),
        ]

    def __str__(self):
        return self.name


# -----------------------------------------------------------------
# 3. INTERACTIVE CANVAS COMPONENT LAYOUT BLOCKS SCHEMA
# -----------------------------------------------------------------
class PortfolioSection(models.Model):
    SECTION_CHOICES = [
        ('hero', 'Hero (Name & Headline)'),
        ('about', 'About Me Summary'),
        ('education', 'Educational Background'),
        ('skills', 'Skills with Levels'),
        ('projects_grid', 'Featured Projects Grid'),
        ('contact', 'Contact Action Channel'),
        ('experience', 'Work Experience'),
        ('services', 'Services & Offerings'),
        ('testimonials', 'Client Testimonials'),
        ('certifications', 'Certifications & Awards'),
        ('achievements', 'Achievements & Honors'),
        ('stats', 'Key Statistics'),
        ('blog', 'Blog & Publications'),
    ]

    page = models.ForeignKey(PortfolioPage, on_delete=models.CASCADE, related_name="sections")
    section_type = models.CharField(max_length=50, choices=SECTION_CHOICES)
    order = models.IntegerField(default=0)
    content_data = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Block Node: [{self.section_type.upper()}] on Page: ({self.page.name})"


# -----------------------------------------------------------------
# 4. WORKSPACE AI OPERATION EXECUTION STREAM FEED LOGS
# -----------------------------------------------------------------
class AISessionLog(models.Model):
    user = models.ForeignKey(
        'auth.User', on_delete=models.CASCADE, null=True, blank=True, related_name='ai_logs'
    )
    change_type = models.CharField(max_length=50)
    description = models.TextField()
    status = models.CharField(max_length=50, default="applied")
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"AI Execution Event Log #{self.id} -> Status: [{self.status.upper()}]"

    def to_frontend_dict(self):
        return {
            "id": self.id,
            "type": self.change_type,
            "desc": self.description,
            "status": self.status,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        }


# -----------------------------------------------------------------
# 5. CONTROLLED PRODUCT ACTIVITY & ANALYTICS EVENTS
# -----------------------------------------------------------------
class ActivityEvent(models.Model):
    STATUS_CHOICES = [
        ('success', 'Success'),
        ('failed', 'Failed'),
    ]

    user = models.ForeignKey(
        'auth.User',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='activity_events',
    )
    event_name = models.CharField(max_length=64, db_index=True)
    feature_name = models.CharField(max_length=64, db_index=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='success', db_index=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at'], name='api_act_user_created_idx'),
            models.Index(fields=['event_name', 'created_at'], name='api_act_event_created_idx'),
            models.Index(fields=['feature_name', 'created_at'], name='api_act_feat_created_idx'),
        ]

    def __str__(self):
        return f"[{self.event_name}] user={self.user_id} ({self.status})"


# -----------------------------------------------------------------
# 6. AI PROVIDER USAGE & TOKEN TELEMETRY
# -----------------------------------------------------------------
class AIUsageLog(models.Model):
    STATUS_CHOICES = [
        ('success', 'Success'),
        ('failed', 'Failed'),
    ]

    user = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ai_usage_logs',
    )
    action_name = models.CharField(max_length=64, db_index=True)
    provider = models.CharField(max_length=32, default='unknown', db_index=True)
    model_name = models.CharField(max_length=80, blank=True, default='')
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='success', db_index=True)
    prompt_tokens = models.PositiveIntegerField(null=True, blank=True)
    completion_tokens = models.PositiveIntegerField(null=True, blank=True)
    total_tokens = models.PositiveIntegerField(null=True, blank=True)
    credits_used = models.PositiveIntegerField(default=1)
    latency_ms = models.PositiveIntegerField(null=True, blank=True)
    error_message = models.CharField(max_length=240, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['provider', 'created_at'], name='api_ai_prov_created_idx'),
            models.Index(fields=['user', 'created_at'], name='api_ai_user_created_idx'),
        ]

    def __str__(self):
        return f"AI [{self.provider}:{self.action_name}] {self.status}"


# -----------------------------------------------------------------
# 7. IMMUTABLE ADMIN AUDIT LOG
# -----------------------------------------------------------------
class AdminAuditLog(models.Model):
    admin_user = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='admin_audit_actions',
    )
    target_user = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='targeted_audit_logs',
    )
    action_type = models.CharField(max_length=64, db_index=True)
    details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"AdminAudit [{self.action_type}] by={self.admin_user_id} target={self.target_user_id}"


# -----------------------------------------------------------------
# 8. USER SESSION DURATION TELEMETRY
# -----------------------------------------------------------------
class UserSession(models.Model):
    user = models.ForeignKey(
        'auth.User',
        on_delete=models.CASCADE,
        related_name='usage_sessions',
    )
    session_key = models.CharField(max_length=64, db_index=True)
    started_at = models.DateTimeField(auto_now_add=True, db_index=True)
    last_seen_at = models.DateTimeField(default=timezone.now, db_index=True)
    duration_seconds = models.PositiveIntegerField(default=0)
    last_path = models.CharField(max_length=120, blank=True, default='')

    class Meta:
        ordering = ['-last_seen_at']
        constraints = [
            models.UniqueConstraint(fields=['user', 'session_key'], name='unique_user_session_key'),
        ]
        indexes = [
            models.Index(fields=['user', 'last_seen_at'], name='api_sess_user_seen_idx'),
            models.Index(fields=['started_at'], name='api_sess_started_idx'),
        ]

    def __str__(self):
        return f"Session [{self.session_key[:8]}] user={self.user_id} ({self.duration_seconds}s)"
