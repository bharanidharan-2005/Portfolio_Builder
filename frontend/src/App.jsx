import React, { useState, useEffect, Suspense, lazy } from "react";

const LandingPage = lazy(() => import("./components/LandingPage.jsx"));
const WorkspaceLayout = lazy(() => import("./components/workspace/WorkspaceLayout.jsx"));

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red', fontFamily: 'monospace' }}>
          <h2>Something went wrong.</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
    // Check current URL path and hostname
    const path = window.location.pathname;
    const hostname = window.location.hostname;
    
    // Subdomain routing detection (e.g. username.aurabuild.io)
    const rootDomains = ['aurabuild.io', 'www.aurabuild.io', 'aurabuild.com', 'localhost', '127.0.0.1', 'vercel.app', 'onrender.com', 'netlify.app'];
    let subdomainUsername = null;
    
    if (!rootDomains.includes(hostname)) {
        const parts = hostname.split('.');
        // Extract the first part as username if it is not just localhost
        // If the domain is something like project-name.vercel.app, parts.slice(-2) is vercel.app
        if (parts.length >= 2 && !rootDomains.includes(parts.slice(-2).join('.'))) {
           subdomainUsername = parts[0];
        } else if (hostname.endsWith('.localhost')) {
           subdomainUsername = parts[0];
        }
    }
    
    const isSubdomainPreview = !!subdomainUsername;
    const isPreviewRoute = path.startsWith("/preview/") || isSubdomainPreview;

    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        const isLoggedIn = localStorage.getItem("aurabuild_is_logged_in");
        return !!isLoggedIn;
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
        localStorage.removeItem("aurabuild_is_logged_in");
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
                <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Loading Preview...</div>}>
                    <WorkspaceLayout 
                        userData={{ name: publicUsername, code: publicToken }}
                        themeMode={themeMode}
                        isPreviewMode={true} 
                    />
                </Suspense>
            </div>
        );
    }

    // -----------------------------------------------------------------
    // ROUTE 2: BUILDER LOGIN
    // -----------------------------------------------------------------
    if (!isAuthenticated) {
        return (
            <ErrorBoundary>
                <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Loading AuraBuild...</div>}>
                    <LandingPage onEnterWorkspace={(data) => {
                        setUserData(prev => ({...prev, ...data }));
                        localStorage.setItem("aurabuild_is_logged_in", "true");
                        setIsAuthenticated(true);
                    }} />
                </Suspense>
            </ErrorBoundary>
        );
    }

    // -----------------------------------------------------------------
    // ROUTE 3: FULL WORKSPACE EDITOR
    // -----------------------------------------------------------------
    return (
        <ErrorBoundary>
            <div className={`min-h-screen ${themeMode === 'light' ? 'bg-slate-50' : 'bg-[#05050A]'}`}>
                <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Loading Workspace...</div>}>
                    <WorkspaceLayout 
                        userData={userData}
                        setUserData={setUserData}
                        themeMode={themeMode}
                        onToggleTheme={handleToggleTheme}
                        onLogout={handleLogout}
                        isPreviewMode={false}
                    />
                </Suspense>
            </div>
        </ErrorBoundary>
    );
}