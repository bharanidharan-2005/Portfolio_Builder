import { useState, useEffect } from "react";
import LandingPage from "./components/LandingPage.jsx";
import WorkspaceLayout from "./components/workspace/WorkspaceLayout.jsx";

export default function App() {
    // Check current URL path and hostname
    const path = window.location.pathname;
    const hostname = window.location.hostname;
    
    // Subdomain routing detection (e.g. username.aurabuild.io)
    const rootDomains = ['aurabuild.io', 'www.aurabuild.io', 'aurabuild.com', 'localhost', '127.0.0.1'];
    let subdomainUsername = null;
    
    if (!rootDomains.includes(hostname)) {
        const parts = hostname.split('.');
        // Extract the first part as username if it is not just localhost
        if (parts.length >= 2 && !rootDomains.includes(parts.slice(-2).join('.'))) {
           subdomainUsername = parts[0];
        } else if (hostname.endsWith('.localhost')) {
           subdomainUsername = parts[0];
        }
    }
    
    const isSubdomainPreview = !!subdomainUsername;
    const isPreviewRoute = path.startsWith("/preview/") || isSubdomainPreview;

    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        const token = localStorage.getItem("aurabuild_access");
        if (token === "true") {
            // Cleanup corrupted state from previous bug
            localStorage.removeItem("aurabuild_access");
            return false;
        }
        return !!token;
    });

    const [themeMode, setThemeMode] = useState("light");

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

    const handleToggleTheme = () => {
        setThemeMode(prev => prev === "light" ? "dark" : "light");
    };

    const handleLogout = () => {
        localStorage.removeItem("aurabuild_access");
        setIsAuthenticated(false);
        setUserData({
            name: "Developer",
            email: "",
            theme: "modern_glass"
        });
        // Clear the URL path on logout
        window.history.pushState({}, '', '/');
    };

    // -----------------------------------------------------------------
    // ROUTE 1: PUBLIC PREVIEW (Bypasses Login)
    // -----------------------------------------------------------------
    if (isPreviewRoute) {
        // Extract username and token from /preview/username/token OR subdomain
        const pathParts = path.split("/");
        const publicUsername = isSubdomainPreview ? subdomainUsername : pathParts[2];
        const publicToken = isSubdomainPreview ? "public" : pathParts[3];

        return (
            <div className={`min-h-screen ${themeMode === 'light' ? 'bg-slate-50' : 'bg-[#05050A]'}`}>
                {/* 
                  We pass isPreviewMode={true} so the WorkspaceLayout knows 
                  to hide the sidebars, top nav, and editing tools.
                */}
                <WorkspaceLayout 
                    userData={{ name: publicUsername, code: publicToken }}
                    themeMode={themeMode}
                    isPreviewMode={true} 
                />
            </div>
        );
    }

    // -----------------------------------------------------------------
    // ROUTE 2: BUILDER LOGIN
    // -----------------------------------------------------------------
    if (!isAuthenticated) {
        return (
            <LandingPage onEnterWorkspace={(data) => {
                setUserData(prev => ({...prev, ...data }));
                setIsAuthenticated(true);
            }} />
        );
    }

    // -----------------------------------------------------------------
    // ROUTE 3: FULL WORKSPACE EDITOR
    // -----------------------------------------------------------------
    return (
        <div className={`min-h-screen ${themeMode === 'light' ? 'bg-slate-50' : 'bg-[#05050A]'}`}>
            <WorkspaceLayout 
                userData={userData}
                setUserData={setUserData}
                themeMode={themeMode}
                onToggleTheme={handleToggleTheme}
                onLogout={handleLogout}
                isPreviewMode={false}
            />
        </div>
    );
}