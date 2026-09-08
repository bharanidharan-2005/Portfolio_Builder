from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    AISessionLogListAPIView,
    AISectionRefinementView,
    AITemplateGeneratorView,
    ContactMessageView,
    DeploymentView,
    PageDetailAPIView,
    PageListAPIView,
    PortfolioReviewAPIView,
    ResumeUploadAPIView,
    SectionDetailAPIView,
    SectionDuplicateAPIView,
    SectionReorderAPIView,
    generate_custom_image,
    serve_media,
    send_workspace_key_view,
)

urlpatterns = [
    # Authentication & JWT Tokens
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Pages & Sections CRUD
    path('pages/', PageListAPIView.as_view(), name='page-list'),
    path('pages/create/', PageListAPIView.as_view(), name='page-create'),
    path('pages/<int:pk>/', PageDetailAPIView.as_view(), name='page-detail'),
    path('sections/<int:pk>/', SectionDetailAPIView.as_view(), name='section-detail'),
    path('sections/<int:pk>/duplicate/', SectionDuplicateAPIView.as_view(), name='section-duplicate'),
    path('sections/reorder/', SectionReorderAPIView.as_view(), name='section-reorder'),
    
    # Workspace Keys
    path('send-key/', send_workspace_key_view, name='send_workspace_key'),
    
    # Resume Upload & Parsing (Fixed to match frontend aiUtils.js)
    path('upload-resume/', ResumeUploadAPIView.as_view(), name='upload-resume'),
    path('parse-resume/', ResumeUploadAPIView.as_view(), name='parse-resume'),
    
    # AI Studio Tools
    path('ai-refine/', AISectionRefinementView.as_view(), name='ai-refine'),
    path('ai-logs/', AISessionLogListAPIView.as_view(), name='ai-logs'),
    path('ai-generate-template/', AITemplateGeneratorView.as_view(), name='ai-generate-template'),
    path('portfolio-review/', PortfolioReviewAPIView.as_view(), name='portfolio-review'),
    path('generate-image/', generate_custom_image, name='generate_custom_image'),
    
    # Utilities, Contact & Media
    path('contact-message/', ContactMessageView.as_view(), name='contact-message'),
    path('deploy/', DeploymentView.as_view(), name='deploy'),
    path('media/<path:path>', serve_media, name='serve_media'),
]