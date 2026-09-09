from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.http import HttpResponse  # Added to send simple health check responses

# Import JWT views directly to intercept the frontend typos
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# Simple view to handle Render's root health check pings
def api_root(request):
    return HttpResponse("AuraBuild Backend API is running successfully. 🚀")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/', include('api.urls')),
    
    # FIX: Handle root URL explicitly for Render automated health checks
    path('', api_root),
    
    # FIX: Catch the missing-slash typos coming from the Vercel frontend
    path('apiauth/token/', TokenObtainPairView.as_view()),
    path('apiauth/token/refresh/', TokenRefreshView.as_view()),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)