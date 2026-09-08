import { useState } from "react";
import LandingPage from "./components/LandingPage.jsx";
import WorkspaceLayout from "./components/workspace/WorkspaceLayout.jsx";

export default function App() {
    // Check current URL path
    const path = window.location.pathname;
    const isPreviewRoute = path.startsWith("/preview/");

    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return localStorage.getItem("aurabuild_access") === "true";
    });

    const [themeMode, setThemeMode] = useState("light");

    const [userData, setUserData] = useState({
        name: "Developer",
        email: "",
        theme: "modern_glass"
    });

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
        // Extract username and token from /preview/username/token
        const pathParts = path.split("/");
        const publicUsername = pathParts[2];
        const publicToken = pathParts[3];

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
                localStorage.setItem("aurabuild_access", "true");
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