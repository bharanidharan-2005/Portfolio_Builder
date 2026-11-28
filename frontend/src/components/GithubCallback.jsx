import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { API } from '../api';
import { Loader2 } from 'lucide-react';

export default function GithubCallback() {
    const navigate = useNavigate();
    const location = useLocation();
    const { socialLogin, themeMode } = useAppContext();
    const [error, setError] = useState(null);
    const exchangedCodeRef = useRef(null);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const oauthError = queryParams.get('error');
        const oauthErrorDesc = queryParams.get('error_description');
        const code = queryParams.get('code');

        if (oauthError) {
            const tErr = setTimeout(() => {
                setError(oauthErrorDesc || `GitHub authorization was denied (${oauthError}).`);
            }, 0);
            const tNav = setTimeout(() => navigate('/'), 4000);
            return () => {
                clearTimeout(tErr);
                clearTimeout(tNav);
            };
        }

        if (!code) {
            const tErr = setTimeout(() => {
                setError("No authorization code found.");
            }, 0);
            const tNav = setTimeout(() => navigate('/'), 3000);
            return () => {
                clearTimeout(tErr);
                clearTimeout(tNav);
            };
        }

        // Prevent React StrictMode double-effect from consuming a single-use GitHub code twice
        if (exchangedCodeRef.current === code) {
            return;
        }
        exchangedCodeRef.current = code;

        let redirectTimer = null;

        const authenticateGithub = async () => {
            try {
                const { data } = await API.post('auth/social/', {
                    provider: 'github',
                    code,
                    redirect_uri: `${window.location.origin}/github/callback`,
                });

                if (data?.success) {
                    socialLogin(
                        {
                            name: data.user?.name || data.user?.username || "Developer",
                            email: data.user?.email || "",
                            avatar: data.user?.avatar || "👨‍💻",
                            code: data.workspace_code || "",
                            plan: data.user?.plan || "free",
                            isStaff: Boolean(data.user?.is_staff),
                            theme: "modern_glass"
                        },
                        data.access,
                        data.refresh
                    );
                    navigate("/dashboard");
                } else {
                    setError("GitHub login failed: " + (data?.error || "Unknown error"));
                    redirectTimer = setTimeout(() => navigate('/'), 3500);
                }
            } catch (err) {
                console.error("GitHub OAuth error:", err);
                const serverError = err.response?.data?.error;
                if (serverError) {
                    setError(`GitHub login failed: ${serverError}`);
                } else if (!err.response || err.response?.status === 502 || err.response?.status === 500) {
                    setError("Cannot reach the Django authentication server on port 8080 or 8000. Verify the backend server is running.");
                } else {
                    setError(`Failed to connect to server: ${err.message}.`);
                }
                redirectTimer = setTimeout(() => navigate('/'), 4000);
            }
        };

        authenticateGithub();
        return () => {
            if (redirectTimer) clearTimeout(redirectTimer);
        };
    }, [location.search, navigate, socialLogin]);

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center ${themeMode === 'light' ? 'bg-slate-50 text-slate-800' : 'bg-slate-950 text-slate-200'}`}>
            <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-500 px-6">
                {error ? (
                    <>
                        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </div>
                        <h2 className="text-xl font-bold">Authentication Error</h2>
                        <p className="text-sm opacity-70 text-center max-w-md">{error}</p>
                        <p className="text-xs opacity-50 mt-4">Redirecting back...</p>
                    </>
                ) : (
                    <>
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        <h2 className="text-xl font-bold">Authenticating with GitHub...</h2>
                        <p className="text-sm opacity-70">Please wait while we securely log you in.</p>
                    </>
                )}
            </div>
        </div>
    );
}
