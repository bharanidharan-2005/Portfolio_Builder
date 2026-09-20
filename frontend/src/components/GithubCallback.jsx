import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { API } from '../api';
import { Loader2 } from 'lucide-react';

export default function GithubCallback() {
    const navigate = useNavigate();
    const location = useLocation();
    const { socialLogin, themeMode } = useAppContext();
    const [error, setError] = useState(null);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const code = queryParams.get('code');
        
        if (!code) {
            setError("No authorization code found.");
            setTimeout(() => navigate('/'), 3000);
            return;
        }

        const authenticateGithub = async () => {
            try {
                // Post the code to our backend
                const response = await fetch(`${API.defaults.baseURL}auth/social/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        provider: 'github',
                        code: code
                    })
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    socialLogin({
                        name: data.user.username,
                        email: data.user.email,
                        theme: "modern_glass"
                    });
                    navigate("/workspace");
                } else {
                    setError("GitHub login failed: " + (data.error || "Unknown error"));
                    setTimeout(() => navigate('/'), 3000);
                }
            } catch (err) {
                console.error(err);
                setError("Failed to connect to server. Please check your backend connection.");
                setTimeout(() => navigate('/'), 3000);
            }
        };

        authenticateGithub();
    }, [location, navigate, socialLogin]);

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center ${themeMode === 'light' ? 'bg-slate-50 text-slate-800' : 'bg-slate-950 text-slate-200'}`}>
            <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-500">
                {error ? (
                    <>
                        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </div>
                        <h2 className="text-xl font-bold">Authentication Error</h2>
                        <p className="text-sm opacity-70 text-center max-w-xs">{error}</p>
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
