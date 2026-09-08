import axios from 'axios';

export const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://aurabuild-backend.onrender.com/api/',
    timeout: 60000, // Accommodates Render free tier cold starts
    headers: {
        'Content-Type': 'application/json',
    },
});

const ACCESS_TOKEN_KEY = 'aurabuild_access';
const REFRESH_TOKEN_KEY = 'aurabuild_refresh';

export function setAuthTokens(access, refresh) {
    if (access) localStorage.setItem(ACCESS_TOKEN_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function clearAuthTokens() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
}

// Request Interceptor: Attach Bearer Token
API.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

let isRefreshing = false;
let pendingSubscribers = [];

function flushSubscribers(newAccessToken) {
    isRefreshing = false;
    const subs = pendingSubscribers;
    pendingSubscribers = [];
    subs.forEach(({ resolve, reject }) => {
        if (newAccessToken) {
            resolve(newAccessToken);
        } else {
            reject(new Error('Token refresh failed'));
        }
    });
}

// Response Interceptor: Handle 401 & Concurrent Refresh Queue
API.interceptors.response.use(
    (response) => response,
    (error) => {
        const originalRequest = error.config;
        if (!error.response || error.response.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }
        originalRequest._retry = true;

        const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (!refresh) {
            clearAuthTokens();
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                pendingSubscribers.push({ resolve, reject });
            }).then((newAccessToken) => {
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return API(originalRequest);
            });
        }

        isRefreshing = true;

        return axios
            .post(`${API.defaults.baseURL}auth/token/refresh/`, { refresh })
            .then((resp) => {
                const newAccessToken = resp.data.access;
                const newRefreshToken = resp.data.refresh || null;

                setAuthTokens(newAccessToken, newRefreshToken);
                flushSubscribers(newAccessToken);

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return API(originalRequest);
            })
            .catch((refreshError) => {
                clearAuthTokens();
                flushSubscribers(null);
                return Promise.reject(refreshError);
            });
    }
);

export default API;