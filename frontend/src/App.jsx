import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AppProvider, useAppContext } from "./context/AppContext";
import { WorkspaceProvider } from "./context/WorkspaceContext";

const LandingPage = lazy(() => import("./components/LandingPage.jsx"));
const WorkspaceLayout = lazy(() => import("./components/workspace/WorkspaceLayout.jsx"));
const GithubCallback = lazy(() => import("./components/GithubCallback.jsx"));

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
    const { isAuthenticated } = useAppContext();
    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }
    return children;
}

function PreviewRouteWrapper({ isSubdomainPreview, subdomainUsername }) {
    const { username, token } = useParams();
    const { themeMode } = useAppContext();
    
    const publicUsername = isSubdomainPreview ? subdomainUsername : username;
    const publicToken = isSubdomainPreview ? "public" : token;

    return (
        <div className={`min-h-screen ${themeMode === 'light' ? 'bg-slate-50' : 'bg-slate-950'}`}>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Loading Preview...</div>}>
                <WorkspaceProvider isPublicPreview={true} previewUserData={{ name: publicUsername, code: publicToken }}>
                    <WorkspaceLayout />
                </WorkspaceProvider>
            </Suspense>
        </div>
    );
}

function MainApp() {
    const { themeMode, isAuthenticated } = useAppContext();

    // Check hostname for subdomains
    const hostname = window.location.hostname;
    const rootDomains = ['aurabuild.io', 'www.aurabuild.io', 'aurabuild.com', 'localhost', '127.0.0.1', 'vercel.app', 'onrender.com', 'netlify.app'];
    let subdomainUsername = null;
    
    if (!rootDomains.includes(hostname)) {
        const parts = hostname.split('.');
        if (parts.length >= 2 && !rootDomains.includes(parts.slice(-2).join('.'))) {
           subdomainUsername = parts[0];
        } else if (hostname.endsWith('.localhost')) {
           subdomainUsername = parts[0];
        }
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
                            <Navigate to="/workspace" replace />
                        ) : (
                            <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Loading AuraBuild...</div>}>
                                <LandingPage />
                            </Suspense>
                        )
                    } />
                    <Route path="/workspace" element={
                        <ProtectedRoute>
                            <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Loading Workspace...</div>}>
                                <WorkspaceProvider isPublicPreview={false}>
                                    <WorkspaceLayout />
                                </WorkspaceProvider>
                            </Suspense>
                        </ProtectedRoute>
                    } />
                    <Route path="/preview/:username/:token" element={
                        <PreviewRouteWrapper isSubdomainPreview={false} />
                    } />
                    <Route path="/github/callback" element={
                        <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Authenticating...</div>}>
                            <GithubCallback />
                        </Suspense>
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

    return (
        <ErrorBoundary>
            <GoogleOAuthProvider clientId={googleClientId}>
                <AppProvider>
                    <MainApp />
                </AppProvider>
            </GoogleOAuthProvider>
        </ErrorBoundary>
    );
}
