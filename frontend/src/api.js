import axios from 'axios';

// Ensure the baseURL always ends with /api/ correctly, regardless of Vercel env var typos
let rawBaseUrl = import.meta.env.VITE_API_URL || 'https://aurabuild-backend.onrender.com/api/';
if (!rawBaseUrl.endsWith('/')) {
    rawBaseUrl += '/';
}
if (!rawBaseUrl.endsWith('api/')) {
    rawBaseUrl += 'api/';
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
    // We no longer store tokens in localStorage. We just store a flag.
    localStorage.setItem(IS_LOGGED_IN_KEY, 'true');
}

export function clearAuthTokens() {
    localStorage.removeItem(IS_LOGGED_IN_KEY);
}

// Request Interceptor: No longer needed for Bearer tokens
API.interceptors.request.use(
    (config) => config,
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

// Response Interceptor: Handle 401 & Concurrent Refresh Queue via Cookie
API.interceptors.response.use(
    (response) => response,
    (error) => {
        const originalRequest = error.config;
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