/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext } from 'react';
import { API, clearAuthTokens, setAuthTokens } from '../api';

const AppContext = createContext();

function resolveEffectiveTheme(setting) {
    if (setting === 'light' || setting === 'dark') return setting;
    if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    return 'dark';
}

export function AppProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAuthLoading, setIsAuthLoading] = useState(() => {
        return Boolean(localStorage.getItem("aurabuild_is_logged_in"));
    });

    const [themeSetting, setThemeSetting] = useState(() => {
        return localStorage.getItem("aurabuild_workspace_theme") || "dark";
    });
    const themeMode = resolveEffectiveTheme(themeSetting);

    const [userData, setUserData] = useState(() => {
        const saved = localStorage.getItem("aurabuild_user");
        if (saved) {
            try { return JSON.parse(saved); } catch { /* ignore */ }
        }
        return {
            name: "Developer",
            email: "",
            avatar: "👨‍💻",
            theme: "modern_glass"
        };
    });

    // Session validation on app startup — never trust localStorage alone
    useEffect(() => {
        const verifySession = async () => {
            const isLoggedIn = localStorage.getItem("aurabuild_is_logged_in");
            if (!isLoggedIn) {
                setIsAuthenticated(false);
                setIsAuthLoading(false);
                return;
            }
            try {
                const res = await API.get('auth/me/');
                if (res.data && (res.data.email || res.data.name)) {
                    setUserData(prev => ({
                        ...prev,
                        name: res.data.name || prev.name,
                        email: res.data.email || prev.email,
                        code: res.data.workspace_code || prev.code,
                        avatar: res.data.avatar || prev.avatar || '👨‍💻',
                    }));
                    setIsAuthenticated(true);
                } else {
                    clearAuthTokens();
                    setIsAuthenticated(false);
                }
            } catch (err) {
                if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                    clearAuthTokens();
                    localStorage.removeItem("aurabuild_user");
                    setIsAuthenticated(false);
                } else {
                    let hasToken = false;
                    try { hasToken = Boolean(sessionStorage.getItem('aurabuild_access_token')); } catch { /* ignore */ }
                    setIsAuthenticated(hasToken);
                }
            } finally {
                setIsAuthLoading(false);
            }
        };
        verifySession();
    }, []);

    useEffect(() => {
        localStorage.setItem("aurabuild_workspace_theme", themeSetting);
        if (themeMode === 'light') {
            document.documentElement.classList.add('theme-light');
        } else {
            document.documentElement.classList.remove('theme-light');
        }
    }, [themeSetting, themeMode]);

    useEffect(() => {
        localStorage.setItem("aurabuild_user", JSON.stringify(userData));
    }, [userData]);

    const toggleTheme = () => {
        setThemeSetting(prev => (resolveEffectiveTheme(prev) === "light" ? "dark" : "light"));
    };

    const login = (data) => {
        setUserData(prev => ({ ...prev, ...data }));
        localStorage.setItem("aurabuild_is_logged_in", "true");
        setIsAuthenticated(true);
        setIsAuthLoading(false);
    };

    const logout = async () => {
        let storedRefresh = null;
        try { storedRefresh = sessionStorage.getItem('aurabuild_refresh_token'); } catch { /* ignore */ }
        try {
            await API.post('auth/logout/', storedRefresh ? { refresh: storedRefresh } : {});
        } catch (error) {
            console.error("Failed to connect to logout endpoint", error);
        }
        
        clearAuthTokens();
        localStorage.removeItem("aurabuild_user");
        setIsAuthenticated(false);
        setIsAuthLoading(false);
        setUserData({
            name: "Developer",
            email: "",
            avatar: "👨‍💻",
            theme: "modern_glass"
        });
        
        window.location.href = "/";
    };


    const socialLogin = (nextUserData, accessToken, refreshToken) => {
        setAuthTokens(accessToken, refreshToken);
        setUserData(prev => ({ ...prev, ...nextUserData }));
        localStorage.setItem("aurabuild_is_logged_in", "true");
        setIsAuthenticated(true);
        setIsAuthLoading(false);
    };

    const value = {
        isAuthenticated,
        isAuthLoading,
        themeMode,
        themeSetting,
        setThemeSetting,
        userData,
        setUserData,
        toggleTheme,
        login,
        socialLogin,
        logout
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    return useContext(AppContext);
}
