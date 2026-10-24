import axios from 'axios';

// Ensure the baseURL always ends with /api/ correctly, regardless of Vercel env var typos
let rawBaseUrl = import.meta.env.VITE_API_URL || 'https://aurabuild-backend.onrender.com/api/';
if (!rawBaseUrl.endsWith('/')) {
    rawBaseUrl += '/';
}
if (!rawBaseUrl.endsWith('api/')) {
    rawBaseUrl += 'api/';
}

// Local dev auto-detection: if baseURL points to localhost:8000 but the server was started on 8080 (or vice versa)
if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    if (rawBaseUrl.includes(':8000')) {
        rawBaseUrl = rawBaseUrl.replace(':8000', ':8080');
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
        try { sessionStorage.setItem('aurabuild_access_token', access); } catch (e) {}
    }
}

export function clearAuthTokens() {
    localStorage.removeItem(IS_LOGGED_IN_KEY);
    try { sessionStorage.removeItem('aurabuild_access_token'); } catch (e) {}
}

// Request Interceptor: Send Bearer token fallback if present (for cross-domain Vercel <-> Render)
API.interceptors.request.use(
    (config) => {
        try {
            const url = config.url || '';
            const isPublicAuth = ['auth/register/', 'auth/login/', 'auth/social/', 'token/', 'token/refresh/', 'send-key/'].some(ep => url.includes(ep));
            if (!isPublicAuth) {
                const token = sessionStorage.getItem('aurabuild_access_token');
                if (token && !config.headers['Authorization']) {
                    config.headers['Authorization'] = `Bearer ${token}`;
                }
            }
        } catch (e) {}
        return config;
    },
    (error) => Promise.reject(error)
);


let isRefreshing = false;
let pendingSubscribers = [];

function flushSubscribers(success) {
    isRefreshing = false;
    const subs = pendingSubscribers;
    pendingSubscribers = [];
    subs.forEach(({ resolve, reject }) => {
        if (success) {
            resolve();
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

        // Local development port fallback (8080 <-> 8000)
        const isNetworkError = !error.response || error.code === 'ERR_NETWORK' || (error.message && error.message.includes('Network Error'));
        if (isNetworkError && !originalRequest._portRetried && typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            const currentBase = API.defaults.baseURL || '';
            let altBase = null;
            if (currentBase.includes(':8080')) {
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
        const isAuthRoute = ['auth/register/', 'auth/login/', 'auth/social/', 'token/'].some(ep => reqUrl.includes(ep));
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
            }).then(() => {
                return API(originalRequest);
            });
        }

        isRefreshing = true;

        // The refresh token is now sent automatically via the HttpOnly cookie
        return axios
            .post(`${API.defaults.baseURL}token/refresh/`, {}, { withCredentials: true })
            .then(() => {
                flushSubscribers(true);
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