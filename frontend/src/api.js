import axios from 'axios';

// Ensure the baseURL always ends with /api/ correctly, regardless of Vercel env var typos
let rawBaseUrl = import.meta.env.VITE_API_URL || 'https://portfolio-builder-1-rm9r.onrender.com/api/';
if (!rawBaseUrl.endsWith('/')) {
    rawBaseUrl += '/';
}
if (!rawBaseUrl.endsWith('api/')) {
    rawBaseUrl += 'api/';
}

// Seamlessly migrate any stale aurabuild-backend references to the live backend
if (rawBaseUrl.includes('aurabuild-backend.onrender.com')) {
    rawBaseUrl = rawBaseUrl.replace('aurabuild-backend.onrender.com', 'portfolio-builder-1-rm9r.onrender.com');
}

// Local dev auto-detection: prefer Vite same-origin /api proxy when in dev, falling back to 8080/8000
if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    if (import.meta.env.DEV && (rawBaseUrl.includes('127.0.0.1') || rawBaseUrl.includes('localhost') || rawBaseUrl.includes('onrender.com'))) {
        rawBaseUrl = '/api/';
    } else if (rawBaseUrl.includes(':8000')) {
        rawBaseUrl = rawBaseUrl.replace(':8000', ':8080');
    } else if (rawBaseUrl.includes('onrender.com')) {
        rawBaseUrl = 'http://127.0.0.1:8080/api/';
    }
}

export const API = axios.create({
    baseURL: rawBaseUrl,
    timeout: 60000,
    withCredentials: true, // Send HTTPOnly cookies automatically
    headers: {
        'Content-Type': 'application/json',
    },
});

const IS_LOGGED_IN_KEY = 'aurabuild_is_logged_in';

export function setAuthTokens(access, refresh) {
    localStorage.setItem(IS_LOGGED_IN_KEY, 'true');
    if (access) {
        try { sessionStorage.setItem('aurabuild_access_token', access); } catch { /* ignore */ }
    }
    if (refresh) {
        try { sessionStorage.setItem('aurabuild_refresh_token', refresh); } catch { /* ignore */ }
    }
}

export function clearAuthTokens() {
    localStorage.removeItem(IS_LOGGED_IN_KEY);
    try {
        sessionStorage.removeItem('aurabuild_access_token');
        sessionStorage.removeItem('aurabuild_refresh_token');
    } catch { /* ignore */ }
}

// Request Interceptor: Send Bearer token fallback if present (for cross-domain Vercel <-> Render)
API.interceptors.request.use(
    (config) => {
        try {
            const url = config.url || '';
            const isPublicAuth = ['auth/register/', 'auth/login/', 'auth/request-password-reset/', 'auth/reset-password/', 'auth/social/', 'token/', 'token/refresh/', 'send-key/'].some(ep => url.includes(ep));
            if (!isPublicAuth) {
                const token = sessionStorage.getItem('aurabuild_access_token');
                if (token && !config.headers['Authorization']) {
                    config.headers['Authorization'] = `Bearer ${token}`;
                }
            }
        } catch { /* ignore */ }
        return config;
    },
    (error) => Promise.reject(error)
);


let isRefreshing = false;
let pendingSubscribers = [];

function flushSubscribers(success, accessToken = null) {
    isRefreshing = false;
    const subs = pendingSubscribers;
    pendingSubscribers = [];
    subs.forEach(({ resolve, reject }) => {
        if (success) {
            resolve(accessToken);
        } else {
            reject(new Error('Token refresh failed'));
        }
    });
}

// Response Interceptor: Handle local dev port fallback, 401 & Concurrent Refresh Queue via Cookie
API.interceptors.response.use(
    (response) => response,
    (error) => {
        const originalRequest = error.config;
        if (!originalRequest) return Promise.reject(error);

        // Local development port / proxy fallback (/api/ -> :8000, :8080 <-> :8000)
        const currentBase = API.defaults.baseURL || '';
        const isProxyFailure = currentBase === '/api/' && (
            !error.response ||
            error.response.status === 502 ||
            error.response.status === 504 ||
            (error.response.status === 500 && !error.response.data)
        );
        const isNetworkError = !error.response || error.code === 'ERR_NETWORK' || (error.message && error.message.includes('Network Error'));
        if ((isNetworkError || isProxyFailure) && !originalRequest._portRetried && typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            let altBase = null;
            if (currentBase === '/api/') {
                altBase = 'http://127.0.0.1:8000/api/';
            } else if (currentBase.includes(':8080')) {
                altBase = currentBase.replace(':8080', ':8000');
            } else if (currentBase.includes(':8000')) {
                altBase = currentBase.replace(':8000', ':8080');
            }

            if (altBase) {
                originalRequest._portRetried = true;
                originalRequest.baseURL = altBase;
                API.defaults.baseURL = altBase;
                return API(originalRequest);
            }
        }

        // Never attempt token refresh on login or register endpoints
        const reqUrl = originalRequest.url || '';
        const isAuthRoute = ['auth/register/', 'auth/login/', 'auth/request-password-reset/', 'auth/reset-password/', 'auth/social/', 'token/'].some(ep => reqUrl.includes(ep));
        if (isAuthRoute) {
            return Promise.reject(error);
        }

        if (!error.response || error.response.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }
        originalRequest._retry = true;

        const isLoggedIn = localStorage.getItem(IS_LOGGED_IN_KEY);
        if (!isLoggedIn) {
            clearAuthTokens();
            return Promise.reject(error);
        }


        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                pendingSubscribers.push({ resolve, reject });
            }).then((newAccess) => {
                if (newAccess) {
                    originalRequest.headers = originalRequest.headers || {};
                    originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
                }
                return API(originalRequest);
            });
        }

        isRefreshing = true;

        let refreshPayload = {};
        try {
            const storedRefresh = sessionStorage.getItem('aurabuild_refresh_token');
            if (storedRefresh) {
                refreshPayload = { refresh: storedRefresh };
            }
        } catch { /* ignore */ }

        // Refresh via HttpOnly cookie and/or fallback refresh token
        return axios
            .post(`${API.defaults.baseURL}token/refresh/`, refreshPayload, { withCredentials: true })
            .then((refreshRes) => {
                const newAccess = refreshRes.data?.access || null;
                const newRefresh = refreshRes.data?.refresh || null;
                setAuthTokens(newAccess, newRefresh);
                if (newAccess) {
                    originalRequest.headers = originalRequest.headers || {};
                    originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
                }
                flushSubscribers(true, newAccess);
                return API(originalRequest);
            })
            .catch((refreshError) => {
                clearAuthTokens();
                flushSubscribers(false);
                return Promise.reject(refreshError);
            });
    }
);

export default API;