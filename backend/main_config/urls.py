from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

# Import JWT views directly to intercept the frontend typos
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/', include('api.urls')),
    path('', include('api.urls')),
    
    # FIX: Catch the missing-slash typos coming from the Vercel frontend
    path('apiauth/token/', TokenObtainPairView.as_view()),
    path('apiauth/token/refresh/', TokenRefreshView.as_view()),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)