"""
Django settings for the AuraBuild backend (main_config project).

See https://docs.djangoproject.com/en/stable/ref/settings/ for details.
"""

import os
from datetime import timedelta
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env variables from BASE_DIR if present
load_dotenv(BASE_DIR / '.env', override=True)

# -----------------------------------------------------------------
# 🔒 SECURITY CONFIGURATION
# -----------------------------------------------------------------
DEBUG = os.getenv('DEBUG', 'False').lower() in ('1', 'true', 'yes', 'on')

SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY:
    if DEBUG:
        import secrets
        SECRET_KEY = secrets.token_urlsafe(50)
        print(
            "WARNING: SECRET_KEY not set in environment; using an ephemeral dev key. "
            "Set SECRET_KEY in your .env for anything beyond local development."
        )
    else:
        raise RuntimeError("SECRET_KEY environment variable must be set when DEBUG is False.")

# Properly parsed ALLOWED_HOSTS with wildcard support for Render and Vercel domains
default_hosts = 'portfolio-builder-ufev.onrender.com,localhost,127.0.0.1,.onrender.com,.vercel.app'
ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv('ALLOWED_HOSTS', default_hosts).split(',')
    if host.strip()
]

# Tell Django it's behind a reverse proxy (Render / HTTPS)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# -----------------------------------------------------------------
# 📦 APPLICATION DEFINITION
# -----------------------------------------------------------------
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party apps
    'rest_framework',
    'corsheaders',
    # Local apps
    'api',
    'accounts',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Must remain at top
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Serves static files cleanly on Render
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'main_config.urls'

# -----------------------------------------------------------------
# 🌐 CORS & CSRF CONFIGURATION
# -----------------------------------------------------------------
default_cors = (
    "http://localhost,"
    "capacitor://localhost,"
    "http://localhost:5173,"
    "http://localhost:3000,"
    "http://127.0.0.1:5173,"
    "https://portfolio-builder-one-brown.vercel.app"
)
cors_env = os.getenv('CORS_ALLOWED_ORIGINS', default_cors)

CORS_ALLOWED_ORIGINS = [origin.strip() for origin in cors_env.split(',') if origin.strip()]
CSRF_TRUSTED_ORIGINS = [
    origin.strip() if origin.startswith(('http://', 'https://')) else f"https://{origin.strip()}"
    for origin in os.getenv('CSRF_TRUSTED_ORIGINS', default_cors).split(',')
    if origin.strip()
]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'main_config.wsgi.application'

# -----------------------------------------------------------------
# 🗄️ DATABASE CONFIGURATION (Supports Neon, Supabase & Render Postgres)
# -----------------------------------------------------------------
DATABASES = {
    'default': dj_database_url.config(
        default=os.getenv('DATABASE_URL', f"sqlite:///{BASE_DIR / 'db.sqlite3'}"),
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# Require PostgreSQL in Production
if not DEBUG and 'sqlite' in DATABASES['default']['ENGINE']:
    raise RuntimeError("SQLite is not allowed in production (Google Scale). Set DATABASE_URL to a valid PostgreSQL instance.")

# -----------------------------------------------------------------
# 🚀 CACHING CONFIGURATION (Redis or Local Memory)
# -----------------------------------------------------------------
redis_url = os.getenv("REDIS_URL")
if redis_url:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": redis_url,
        }
    }
else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "aurabuild-cache",
        }
    }

# -----------------------------------------------------------------
# ⚙️ CELERY (Task Queue)
# -----------------------------------------------------------------
# If Redis is missing, we use in-memory broker (only for dev/testing; prod requires real broker)
CELERY_BROKER_URL = os.getenv("REDIS_URL", "memory://")
CELERY_RESULT_BACKEND = os.getenv("REDIS_URL", "cache+memory://")
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'

# -----------------------------------------------------------------
# 📧 EMAIL CONFIGURATION
# -----------------------------------------------------------------
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True').lower() in ('1', 'true', 'yes', 'on')
EMAIL_TIMEOUT = 15

EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'AuraBuild <onboarding@resend.dev>')

# -----------------------------------------------------------------
# 🔑 AUTHENTICATION & JWT CONFIGURATION
# -----------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'accounts.backends.EmailBackend',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'api.authentication.CookieJWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_THROTTLE_CLASSES': (
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ),
    'DEFAULT_THROTTLE_RATES': {
        'anon': '30/minute',
        'user': '1000/minute',
    },
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=120),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=14),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACK_LIST_AFTER_ROTATION': True,
    
    # Custom Cookie Auth Settings (Used by our CookieJWTAuthentication)
    'AUTH_COOKIE': 'aurabuild_access',
    'AUTH_COOKIE_REFRESH': 'aurabuild_refresh',
    'AUTH_COOKIE_SECURE': not DEBUG,
    'AUTH_COOKIE_HTTP_ONLY': True,
    'AUTH_COOKIE_PATH': '/',
    'AUTH_COOKIE_SAMESITE': 'Lax' if DEBUG else 'None',
}

# -----------------------------------------------------------------
# 🌐 INTERNATIONALIZATION & STATIC ASSETS
# -----------------------------------------------------------------
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Django 4.2+ STORAGES syntax for WhiteNoise
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
}

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'