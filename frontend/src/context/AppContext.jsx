import React, { createContext, useState, useEffect, useContext } from 'react';
import { API, clearAuthTokens } from '../api';

const AppContext = createContext();

export function AppProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        const isLoggedIn = localStorage.getItem("aurabuild_is_logged_in");
        return !!isLoggedIn;
    });

    const [themeSetting, setThemeSetting] = useState(() => {
        return localStorage.getItem("aurabuild_workspace_theme") || "system";
    });

    const [themeMode, setThemeMode] = useState("light");

    // Session validation on app startup
    useEffect(() => {
        const verifySession = async () => {
            const isLoggedIn = localStorage.getItem("aurabuild_is_logged_in");
            if (isLoggedIn) {
                try {
                    const res = await API.get('auth/me/');
                    if (res.data && (res.data.email || res.data.name)) {
                        setUserData(prev => ({
                            ...prev,
                            name: res.data.name || prev.name,
                            email: res.data.email || prev.email,
                            code: res.data.workspace_code || prev.code
                        }));
                        setIsAuthenticated(true);
                    }
                } catch (err) {
                    if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                        clearAuthTokens();
                        localStorage.removeItem("aurabuild_user");
                        setIsAuthenticated(false);
                    }
                }
            }
        };
        verifySession();
    }, []);

    useEffect(() => {
        localStorage.setItem("aurabuild_workspace_theme", themeSetting);
        
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        
        const updateThemeMode = () => {
            if (themeSetting === "system") {
                setThemeMode(mediaQuery.matches ? "dark" : "light");
            } else {
                setThemeMode(themeSetting);
            }
        };

        updateThemeMode();

        const listener = (e) => {
            if (themeSetting === "system") {
                setThemeMode(e.matches ? "dark" : "light");
            }
        };

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener("change", listener);
            return () => mediaQuery.removeEventListener("change", listener);
        } else {
            mediaQuery.addListener(listener);
            return () => mediaQuery.removeListener(listener);
        }
    }, [themeSetting]);

    const [userData, setUserData] = useState(() => {
        const saved = localStorage.getItem("aurabuild_user");
        if (saved) {
            try { return JSON.parse(saved); } catch (e) {}
        }
        return {
            name: "Developer",
            email: "",
            theme: "modern_glass"
        };
    });

    useEffect(() => {
        localStorage.setItem("aurabuild_user", JSON.stringify(userData));
    }, [userData]);

    const toggleTheme = () => {
        setThemeSetting(prev => prev === "light" ? "dark" : "light");
    };

    const login = (data) => {
        setUserData(prev => ({ ...prev, ...data }));
        localStorage.setItem("aurabuild_is_logged_in", "true");
        setIsAuthenticated(true);
    };

    const logout = async () => {
        try {
            await API.post('auth/logout/');
        } catch (error) {
            console.error("Failed to connect to logout endpoint", error);
        }
        
        clearAuthTokens();
        localStorage.removeItem("aurabuild_user");
        setIsAuthenticated(false);
        setUserData({
            name: "Developer",
            email: "",
            theme: "modern_glass"
        });
        
        // Force a hard reload to the landing page to guarantee all memory/state is cleared
        window.location.href = "/";
    };


    const socialLogin = (userData, accessToken, refreshToken) => {
        setUserData(prev => ({ ...prev, ...userData }));
        localStorage.setItem("aurabuild_is_logged_in", "true");
        setIsAuthenticated(true);
    };

    const value = {
        isAuthenticated,
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
