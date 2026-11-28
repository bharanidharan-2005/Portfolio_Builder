import React, { Suspense, lazy, useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AppProvider, useAppContext } from "./context/AppContext";
import { WorkspaceProvider } from "./context/WorkspaceContext";
import Toasts from "./components/Toasts.jsx";

const LandingPage = lazy(() => import("./components/LandingPage.jsx"));
const DashboardPage = lazy(() => import("./components/dashboard/DashboardPage.jsx"));
const WorkspaceLayout = lazy(() => import("./components/workspace/WorkspaceLayout.jsx"));
const GithubCallback = lazy(() => import("./components/GithubCallback.jsx"));
import PortfolioSkeleton from "./components/portfolio/PortfolioSkeleton.jsx";

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

function ProtectedRoute({ children }) {
    const { isAuthenticated, isAuthLoading, themeMode } = useAppContext();
    if (isAuthLoading) {
        return <PortfolioSkeleton themeMode={themeMode} isPreview={false} />;
    }
    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }
    return children;
}

function WorkspaceRouteWrapper() {
    const { portfolioId } = useParams();
    const { themeMode } = useAppContext();
    return (
        <Suspense fallback={<PortfolioSkeleton themeMode={themeMode} isPreview={false} />}>
            <WorkspaceProvider isPublicPreview={false} portfolioId={portfolioId ? Number(portfolioId) || portfolioId : null}>
                <WorkspaceLayout />
            </WorkspaceProvider>
        </Suspense>
    );
}

function PreviewRouteWrapper({ isSubdomainPreview, subdomainUsername }) {
    const { username, token } = useParams();
    const { themeMode } = useAppContext();
    
    const publicUsername = isSubdomainPreview ? subdomainUsername : username;
    const publicToken = isSubdomainPreview ? "public" : (token || "public");

    // Reserved paths that should never be treated as usernames
    const reservedRoutes = ['dashboard', 'workspace', 'github', 'login', 'signup', 'api', 'auth', 'settings'];
    if (reservedRoutes.includes((publicUsername || '').toLowerCase())) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className={`min-h-screen ${themeMode === 'light' ? 'bg-slate-50' : 'bg-slate-950'}`}>
            <Suspense fallback={<PortfolioSkeleton themeMode={themeMode} isPreview={true} />}>
                <WorkspaceProvider isPublicPreview={true} previewUserData={{ name: publicUsername, code: publicToken }}>
                    <WorkspaceLayout />
                </WorkspaceProvider>
            </Suspense>
        </div>
    );
}

function MainApp() {
    const { themeMode, isAuthenticated } = useAppContext();

    const hostname = window.location.hostname;
    let subdomainUsername = null;
    
    // Only enable subdomain previews on official domains where wildcard routing is configured
    const officialDomains = ['aurabuild.io', 'aurabuild.com'];
    
    for (const domain of officialDomains) {
        if (hostname.endsWith('.' + domain) && hostname !== 'www.' + domain) {
            subdomainUsername = hostname.replace('.' + domain, '').replace('www.', '');
            break;
        }
    }
    
    if (hostname.endsWith('.localhost')) {
        subdomainUsername = hostname.replace('.localhost', '');
    }
    
    const isSubdomainPreview = !!subdomainUsername;

    if (isSubdomainPreview) {
        return <PreviewRouteWrapper isSubdomainPreview={true} subdomainUsername={subdomainUsername} />;
    }

    return (
        <BrowserRouter>
            <div className={`min-h-screen ${themeMode === 'light' ? 'bg-slate-50' : 'bg-slate-950'}`}>
                <Routes>
                    <Route path="/" element={
                        isAuthenticated ? (
                            <Navigate to="/dashboard" replace />
                        ) : (
                            <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Loading AuraBuild...</div>}>
                                <LandingPage />
                            </Suspense>
                        )
                    } />
                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            <Suspense fallback={<PortfolioSkeleton themeMode={themeMode} isPreview={false} />}>
                                <DashboardPage />
                            </Suspense>
                        </ProtectedRoute>
                    } />
                    <Route path="/workspace" element={
                        <ProtectedRoute>
                            <WorkspaceRouteWrapper />
                        </ProtectedRoute>
                    } />
                    <Route path="/workspace/:portfolioId" element={
                        <ProtectedRoute>
                            <WorkspaceRouteWrapper />
                        </ProtectedRoute>
                    } />
                    <Route path="/preview/:username/:token" element={
                        <PreviewRouteWrapper isSubdomainPreview={false} />
                    } />
                    <Route path="/preview/:username" element={
                        <PreviewRouteWrapper isSubdomainPreview={false} />
                    } />
                    <Route path="/github/callback" element={
                        <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Authenticating...</div>}>
                            <GithubCallback />
                        </Suspense>
                    } />
                    {/* Direct Public Portfolio URL: https://portfolio-builder-one-brown.vercel.app/:username/ */}
                    <Route path="/:username" element={
                        <PreviewRouteWrapper isSubdomainPreview={false} />
                    } />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

import { GoogleOAuthProvider } from '@react-oauth/google';

export default function App() {
    // In production, you would configure this in your .env file
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "placeholder-google-client-id.apps.googleusercontent.com";
    const [toasts, setToasts] = useState([]);

    const dismissToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    useEffect(() => {
        const handleToast = (e) => {
            const detail = e.detail || {};
            if (!detail.message) return;
            const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            setToasts((prev) => [...prev.slice(-4), { id, ...detail }]);
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, detail.duration || 4200);
        };
        window.addEventListener('aurabuild-toast', handleToast);
        return () => window.removeEventListener('aurabuild-toast', handleToast);
    }, []);

    return (
        <ErrorBoundary>
            <GoogleOAuthProvider clientId={googleClientId}>
                <AppProvider>
                    <MainApp />
                    <Toasts toasts={toasts} dismissToast={dismissToast} />
                </AppProvider>
            </GoogleOAuthProvider>
        </ErrorBoundary>
    );
}
