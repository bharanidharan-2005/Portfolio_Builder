from django.urls import path

from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='auth-register'),
    path('login/', views.LoginView.as_view(), name='auth-login'),
    path('request-password-reset/', views.PasswordResetRequestView.as_view(), name='auth-request-password-reset'),
    path('reset-password/', views.ResetPasswordView.as_view(), name='auth-reset-password'),
    path('logout/', views.LogoutView.as_view(), name='auth-logout'),
    path('me/', views.MeView.as_view(), name='auth-me'),
    path('profile/', views.ProfileView.as_view(), name='auth-profile'),
    path('token/refresh/', views.CookieTokenRefreshView.as_view(), name='auth-token-refresh'),
]
