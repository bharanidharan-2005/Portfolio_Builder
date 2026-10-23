import { useState, useEffect, useCallback } from "react";
import { X, User, Shield, HardDrive, Download, AlertTriangle, Trash2, Loader2, CheckCircle2, ExternalLink, LogOut, Globe, Copy, Check } from "lucide-react";
import { API } from "../../api"; 
import { useAppContext } from "../../context/AppContext";
import { Palette, Sun, Moon, Sparkles } from "lucide-react";

export default function SettingsModal({ isOpen, onClose, userData, setUserData, themeMode, onLogout, onDeploy, onExportZip, onResetWorkspace }) {
    const { themeSetting, setThemeSetting } = useAppContext();
    const isLight = themeMode === 'light';
    const isSystem = themeMode === 'system';
    const [activeTab, setActiveTab] = useState("account");
    
    const [localName, setLocalName] = useState(userData?.name || "Developer");
    const [localAvatar, setLocalAvatar] = useState(userData?.avatar || "🐱");
    const [isSaving, setIsSaving] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopyUrl = (urlToCopy) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(urlToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Keep it synced if user data loads slightly after the modal mounts
    useEffect(() => {
        if (userData?.name) setLocalName(userData.name);
        if (userData?.avatar) setLocalAvatar(userData.avatar);
    }, [userData?.name, userData?.avatar]);

    // Auto-save changes with debounce
    useEffect(() => {
        if (!isOpen) return;
        if (localName === userData?.name && localAvatar === userData?.avatar) return;

        const timeoutId = setTimeout(async () => {
            setIsSaving(true);
            try {
                await API.patch('user/profile/', { name: localName, avatar: localAvatar });
                if (setUserData) {
                    setUserData(prev => ({ ...prev, name: localName, avatar: localAvatar }));
                }
            } catch (error) {
                console.warn("Backend endpoint not found or failed, updating local state only.", error);
                if (setUserData) {
                    setUserData(prev => ({ ...prev, name: localName, avatar: localAvatar }));
                }
            } finally {
                setIsSaving(false);
            }
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [localName, localAvatar, userData?.name, userData?.avatar, isOpen, setUserData]);

    if (!isOpen) return null;

    // Clean username (e.g. "Bharani Dharan" -> "bharanidharan")
    const cleanUsername = (localName || userData?.name || "developer").toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Direct Public Portfolio URL: https://portfolio-builder-one-brown.vercel.app/[username]/
    const protocol = window.location.protocol;
    const host = window.location.host;
    
    const liveUrl = `${protocol}//${host}/${cleanUsername}/`;

    const getTabBtnClass = (tabId) => {
        const isActive = activeTab === tabId;
        if (isActive) {
            if (isSystem) return 'bg-[#7c00ff]/25 text-[#d8b4fe] border border-[#7c00ff]/40 shadow-[0_0_12px_rgba(124,0,255,0.3)]';
            if (isLight) return 'bg-blue-100 text-blue-700 shadow-sm';
            return 'bg-blue-900/40 text-blue-400 ring-1 ring-blue-500/20';
        }
        if (isSystem) return 'text-purple-300/70 hover:bg-[#7c00ff]/15 hover:text-white';
        if (isLight) return 'text-slate-600 hover:bg-slate-200';
        return 'text-slate-400 hover:bg-slate-800';
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-2.5 sm:p-4 animate-in fade-in duration-200">
            <div className={`rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col md:flex-row overflow-hidden max-h-[92vh] h-[92vh] md:h-[540px] border animate-in zoom-in-95 ${
                isSystem 
                    ? 'bg-[#0c051a]/95 backdrop-blur-2xl border-[#7c00ff]/40 shadow-[0_0_60px_rgba(124,0,255,0.35)] text-slate-100' 
                    : (isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0B0C10] border-slate-800 text-slate-100')
            }`}>
                
                {/* Settings Navigation Header / Sidebar */}
                <div className={`w-full md:w-56 p-3 md:p-4 border-b md:border-b-0 md:border-r shrink-0 flex flex-col justify-between ${
                    isSystem 
                        ? 'bg-[#080314]/90 border-[#7c00ff]/25' 
                        : (isLight ? 'bg-slate-50/50 border-slate-200' : 'bg-[#05050A] border-slate-800')
                }`}>
                    <div>
                        {/* Top row with Title and Mobile Close button */}
                        <div className="flex items-center justify-between mb-2 md:mb-4 px-1 md:px-2">
                            <h2 className={`text-base md:text-lg font-bold ${isSystem ? 'text-white drop-shadow-[0_0_8px_rgba(124,0,255,0.5)]' : (isLight ? 'text-slate-800' : 'text-slate-100')}`}>Settings</h2>
                            <button 
                                onClick={onClose} 
                                className={`md:hidden p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    isSystem 
                                        ? 'text-purple-300 hover:text-white hover:bg-[#7c00ff]/20' 
                                        : (isLight ? 'text-slate-500 hover:bg-slate-200' : 'text-slate-400 hover:bg-slate-800')
                                }`}
                                aria-label="Close Settings"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {/* Horizontal scroll on mobile, vertical stack on desktop */}
                        <div className="flex md:flex-col gap-1.5 overflow-x-auto pb-1 md:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            <button onClick={() => setActiveTab("account")} className={`shrink-0 flex items-center justify-between px-3 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${getTabBtnClass("account")}`}>
                                <div className="flex items-center gap-2">
                                    <User className="w-3.5 h-3.5 md:w-4 md:h-4" /> Account
                                </div>
                                {isSaving && <Loader2 className="w-3 h-3 animate-spin opacity-50 ml-1.5" />}
                            </button>
                            
                            <button onClick={() => setActiveTab("workspace")} className={`shrink-0 flex items-center gap-2 px-3 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${getTabBtnClass("workspace")}`}>
                                <Shield className="w-3.5 h-3.5 md:w-4 md:h-4" /> Workspace
                            </button>
                            
                            <button onClick={() => setActiveTab("appearance")} className={`shrink-0 flex items-center gap-2 px-3 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${getTabBtnClass("appearance")}`}>
                                <Palette className="w-3.5 h-3.5 md:w-4 md:h-4" /> Appearance
                            </button>

                            <button onClick={() => setActiveTab("data")} className={`shrink-0 flex items-center gap-2 px-3 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${getTabBtnClass("data")}`}>
                                <HardDrive className="w-3.5 h-3.5 md:w-4 md:h-4" /> Data & Privacy
                            </button>
                        </div>
                    </div>

                    {/* Desktop Logout Button */}
                    <div className={`mt-auto pt-4 border-t hidden md:block ${isSystem ? 'border-[#7c00ff]/25' : (isLight ? 'border-slate-200' : 'border-slate-800')}`}>
                        <button 
                            onClick={async () => {
                                setIsLoggingOut(true);
                                try {
                                    await API.post('auth/logout/');
                                } catch (e) {
                                    console.warn("Backend logout failed or was blocked, forcing local logout", e);
                                } finally {
                                    localStorage.removeItem("aurabuild_is_logged_in");
                                    localStorage.removeItem("aurabuild_user");
                                    window.location.href = "/";
                                }
                            }}
                            disabled={isLoggingOut}
                            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer text-red-500 ${isLight ? 'hover:bg-red-50' : 'hover:bg-red-500/10'} ${isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                            {isLoggingOut ? 'Logging out...' : 'Logout Session'}
                        </button>
                    </div>
                </div>

                {/* Settings Content Area */}
                <div className="flex-1 flex flex-col relative overflow-hidden min-w-0">
                    <button onClick={onClose} className={`hidden md:flex absolute top-4 right-4 p-1.5 rounded-md transition-colors cursor-pointer z-10 ${
                        isSystem 
                            ? 'text-purple-300 hover:text-white hover:bg-[#7c00ff]/20' 
                            : (isLight ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-700' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200')
                    }`} aria-label="Close Settings">
                        <X className="w-5 h-5" />
                    </button>                    <div className="p-3 sm:p-6 md:p-8 overflow-y-auto custom-scrollbar h-full min-w-0 w-full">
                        {activeTab === "account" && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div>
                                    <h3 className={`text-lg sm:text-xl font-bold mb-1 ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>My Profile</h3>
                                    <p className={`text-xs sm:text-sm flex items-center gap-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                        Manage your public builder identity.
                                        {isSaving && <span className="text-blue-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Saving...</span>}
                                        {!isSaving && (localName !== userData?.name || localAvatar !== userData?.avatar) === false && <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Saved</span>}
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="relative group shrink-0">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border shadow-sm ${
                                                isSystem ? 'bg-[#120826] border-[#7c00ff]/40 text-purple-200 shadow-[0_0_15px_rgba(124,0,255,0.25)]' : (isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-slate-700')
                                            }`}>
                                                {localAvatar}
                                            </div>
                                            <input 
                                                type="text" 
                                                maxLength="2" 
                                                value={localAvatar} 
                                                onChange={(e) => setLocalAvatar(e.target.value)}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                title="Type to change emoji"
                                            />
                                        </div>
                                        <div>
                                            <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${isSystem ? 'text-purple-300' : (isLight ? 'text-slate-500' : 'text-slate-400')}`}>Workspace Avatar</p>
                                            <p className={`text-xs ${isSystem ? 'text-purple-400/60' : 'text-slate-500'}`}>Click icon to type a new emoji.</p>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${isSystem ? 'text-purple-300' : (isLight ? 'text-slate-500' : 'text-slate-400')}`}>Display Name</label>
                                        <input 
                                            type="text" 
                                            value={localName} 
                                            onChange={(e) => setLocalName(e.target.value)}
                                            className={`w-full max-w-md px-4 py-3 rounded-xl border text-sm font-semibold transition-all outline-none focus:ring-2 ${
                                                isSystem 
                                                    ? 'bg-[#0e0720] border-[#7c00ff]/40 text-white focus:ring-[#7c00ff]/40 focus:border-[#7c00ff]' 
                                                    : (isLight ? 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500/30' : 'bg-[#111218] border-slate-700 text-slate-100 focus:ring-blue-500/30')
                                            }`} 
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${isSystem ? 'text-purple-300' : (isLight ? 'text-slate-500' : 'text-slate-400')}`}>Access Token / Email</label>
                                        <input 
                                            type="text" 
                                            readOnly 
                                            defaultValue={userData?.code || "Auth Token"} 
                                            className={`w-full max-w-md px-4 py-3 rounded-xl border text-sm font-mono opacity-70 cursor-not-allowed ${
                                                isSystem 
                                                    ? 'bg-[#080314]/80 border-[#7c00ff]/20 text-purple-300' 
                                                    : (isLight ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-slate-900/50 border-slate-800 text-slate-500')
                                            }`} 
                                        />
                                    </div>

                                    {/* Mobile Logout Option */}
                                    <div className={`md:hidden pt-4 mt-2 border-t ${isSystem ? 'border-[#7c00ff]/20' : 'border-slate-700/30'}`}>
                                        <button 
                                            onClick={async () => {
                                                setIsLoggingOut(true);
                                                try {
                                                    await API.post('auth/logout/');
                                                } catch (e) {
                                                    console.warn("Backend logout failed", e);
                                                } finally {
                                                    localStorage.removeItem("aurabuild_is_logged_in");
                                                    localStorage.removeItem("aurabuild_user");
                                                    window.location.href = "/";
                                                }
                                            }}
                                            disabled={isLoggingOut}
                                            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer text-red-500 bg-red-500/10 hover:bg-red-500/20 active:scale-98 ${isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                                            {isLoggingOut ? 'Logging out...' : 'Logout Session'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "workspace" && (
                            <div className="space-y-5 sm:space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div>
                                    <h3 className={`text-lg sm:text-xl font-bold mb-1 ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>Workspace Preferences</h3>
                                    <p className={`text-xs sm:text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Configure your live environment routing and deployment.</p>
                                </div>
                                <div className="space-y-4">
                                    {/* Public Portfolio URL Card */}
                                    <div className={`p-3.5 sm:p-5 border rounded-2xl flex flex-col gap-3 transition-all ${
                                        isSystem 
                                            ? 'border-[#7c00ff]/30 bg-[#0e0620]/70 shadow-[0_4px_20px_rgba(124,0,255,0.1)]' 
                                            : (isLight ? 'border-slate-200 bg-slate-50/80 shadow-xs' : 'border-slate-800 bg-[#111218]')
                                    }`}>
                                        {/* Card Top: Title, Status Badge & Desktop Quick Actions */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`text-sm font-bold ${isSystem ? 'text-purple-100' : (isLight ? 'text-slate-800' : 'text-slate-100')}`}>
                                                    Public Portfolio URL
                                                </span>
                                                <span className="inline-flex items-center gap-1.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                    Live
                                                </span>
                                            </div>

                                            {/* Action Buttons: Desktop Top-Right */}
                                            <div className="hidden sm:flex items-center gap-2">
                                                <button 
                                                    onClick={async () => {
                                                        if (onDeploy) await onDeploy();
                                                        onClose();
                                                    }}
                                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer text-white shadow-sm active:scale-95 ${
                                                        isSystem 
                                                            ? 'bg-[#7c00ff] hover:bg-[#6b00dc] shadow-[0_0_15px_rgba(124,0,255,0.4)]' 
                                                            : 'bg-blue-600 hover:bg-blue-500 hover:shadow-blue-900/20'
                                                    }`}
                                                >
                                                    <Globe className="w-3.5 h-3.5" />
                                                    <span>Deploy to Edge</span>
                                                </button>
                                                <button 
                                                    onClick={() => window.open(liveUrl, '_blank')}
                                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                                                        isSystem 
                                                            ? 'border-[#7c00ff]/40 bg-[#7c00ff]/10 hover:bg-[#7c00ff]/20 text-purple-200' 
                                                            : (isLight ? 'border-slate-300 hover:bg-slate-200 text-slate-700' : 'border-slate-700 hover:bg-slate-800 text-slate-300')
                                                    }`}
                                                >
                                                    <span>Visit</span>
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* URL Display Pill with embedded Copy Button */}
                                        <div className={`flex items-center gap-2 p-1.5 pl-3 rounded-xl border transition-all ${
                                            isSystem 
                                                ? 'bg-[#080214] border-[#7c00ff]/30 text-purple-200' 
                                                : (isLight ? 'bg-white border-slate-200 text-blue-600' : 'bg-slate-900/90 border-slate-700/60 text-blue-400')
                                        }`}>
                                            <span className="text-xs font-mono truncate flex-1 min-w-0 select-all" title={liveUrl}>
                                                {liveUrl}
                                            </span>
                                            <button 
                                                onClick={() => handleCopyUrl(liveUrl)}
                                                className={`shrink-0 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                                                    copied 
                                                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                                                        : (isSystem 
                                                            ? 'border-[#7c00ff]/40 bg-[#7c00ff]/20 hover:bg-[#7c00ff]/35 text-purple-100 shadow-[0_0_10px_rgba(124,0,255,0.2)]' 
                                                            : (isLight ? 'border-slate-200 hover:bg-slate-100 text-slate-700 bg-slate-50' : 'border-slate-700 hover:bg-slate-800 text-slate-300 bg-slate-800/60'))
                                                }`}
                                                title="Copy Live Portfolio Link"
                                            >
                                                {copied ? (
                                                    <>
                                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                        <span>Copied</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-3.5 h-3.5" />
                                                        <span>Copy</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {/* Mobile-Only Action Buttons (Clean 2-Column Responsive Grid) */}
                                        <div className="grid grid-cols-2 gap-2 sm:hidden pt-0.5">
                                            <button 
                                                onClick={async () => {
                                                    if (onDeploy) await onDeploy();
                                                    onClose();
                                                }}
                                                className={`w-full justify-center px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-white shadow-sm active:scale-95 ${
                                                    isSystem 
                                                        ? 'bg-[#7c00ff] hover:bg-[#6b00dc] shadow-[0_0_15px_rgba(124,0,255,0.4)]' 
                                                        : 'bg-blue-600 hover:bg-blue-500'
                                                }`}
                                            >
                                                <Globe className="w-3.5 h-3.5" />
                                                <span>Deploy</span>
                                            </button>
                                            <button 
                                                onClick={() => window.open(liveUrl, '_blank')}
                                                className={`w-full justify-center px-3 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                                                    isSystem 
                                                        ? 'border-[#7c00ff]/40 bg-[#7c00ff]/10 hover:bg-[#7c00ff]/20 text-purple-200' 
                                                        : (isLight ? 'border-slate-300 hover:bg-slate-200 text-slate-700' : 'border-slate-700 hover:bg-slate-800 text-slate-300')
                                                }`}
                                            >
                                                <span>Visit Live</span>
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Recruiter & Public Sharing Instructions */}
                                    <div className={`p-3.5 sm:p-5 rounded-2xl border text-xs leading-relaxed transition-all ${
                                        isSystem 
                                            ? 'bg-[#0e0620]/60 border-[#7c00ff]/30 text-purple-200/90' 
                                            : (isLight ? 'bg-blue-50/70 border-blue-200/80 text-slate-700' : 'bg-blue-950/20 border-blue-900/40 text-slate-300')
                                    }`}>
                                        <div className={`flex items-center gap-2 font-bold mb-2 ${isSystem ? 'text-[#c084fc]' : 'text-blue-500'}`}>
                                            <Sparkles className="w-4 h-4 shrink-0" />
                                            <span>Recruiter & Public Sharing Instructions</span>
                                        </div>
                                        <p className="mb-2.5 break-words">
                                            Share your public portfolio link (<span className={`font-mono font-semibold break-all select-all ${isSystem ? 'text-[#d8b4fe]' : (isLight ? 'text-blue-600' : 'text-blue-400')}`}>{liveUrl}</span>) on your resume, LinkedIn, GitHub bio, or job applications.
                                        </p>
                                        <ul className={`list-disc pl-4 space-y-1.5 text-[11px] ${isSystem ? 'text-purple-300/70' : 'text-slate-400'}`}>
                                            <li>Recruiters and visitors do not need an account or login to view your public link.</li>
                                            <li>Any edits saved or deployed in this workspace reflect instantaneously on your public page.</li>
                                            <li>Your portfolio is responsive and optimized for mobile, tablet, and widescreen recruiters.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "appearance" && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 h-full flex flex-col">
                                <div>
                                    <h3 className={`text-lg sm:text-xl font-bold mb-1 uppercase tracking-widest ${isSystem ? 'text-white drop-shadow-[0_0_8px_rgba(124,0,255,0.4)]' : (isLight ? 'text-slate-800' : 'text-slate-100')}`}>Appearance</h3>
                                    <p className={`text-xs sm:text-sm ${isSystem ? 'text-purple-200/70' : (isLight ? 'text-slate-500' : 'text-slate-400')}`}>Customize how your AuraBuild workspace looks.</p>
                                </div>
                                
                                <div className="space-y-4 pt-2">
                                    <h4 className={`text-xs font-bold uppercase tracking-wider ${isSystem ? 'text-[#c084fc]' : (isLight ? 'text-slate-400' : 'text-slate-500')}`}>Theme</h4>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                        {/* Light Theme Card */}
                                        <button 
                                            onClick={() => setThemeSetting("light")}
                                            className={`relative p-3.5 sm:p-5 rounded-2xl flex flex-row sm:flex-col items-center sm:justify-center gap-3.5 sm:gap-3 border-2 transition-all cursor-pointer text-left sm:text-center h-auto sm:h-[160px] ${
                                                themeSetting === "light" 
                                                    ? 'border-blue-500 bg-blue-500/5 shadow-md shadow-blue-500/10' 
                                                    : (isSystem 
                                                        ? 'border-[#7c00ff]/20 bg-[#080314]/50 hover:border-[#7c00ff]/40 hover:bg-[#7c00ff]/10' 
                                                        : (isLight ? 'border-slate-200 hover:border-slate-300 hover:bg-slate-50' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'))
                                            }`}
                                        >
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-200 text-slate-700">
                                                <Sun className="w-5 h-5 sm:w-6 sm:h-6" />
                                            </div>
                                            <div className="flex-1 sm:flex-initial">
                                                <div className={`font-bold text-sm sm:text-base ${isSystem ? 'text-purple-100' : (isLight ? 'text-slate-800' : 'text-slate-200')}`}>Light</div>
                                                <div className={`text-xs mt-0.5 ${isSystem ? 'text-purple-300/60' : (isLight ? 'text-slate-500' : 'text-slate-400')}`}>Clean workspace</div>
                                            </div>
                                            {themeSetting === "light" && (
                                                <div className="sm:absolute sm:top-3 sm:right-3 bg-blue-500 text-white rounded-full p-0.5 shrink-0">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </div>
                                            )}
                                        </button>

                                        {/* Dark Theme Card */}
                                        <button 
                                            onClick={() => setThemeSetting("dark")}
                                            className={`relative p-3.5 sm:p-5 rounded-2xl flex flex-row sm:flex-col items-center sm:justify-center gap-3.5 sm:gap-3 border-2 transition-all cursor-pointer text-left sm:text-center h-auto sm:h-[160px] ${
                                                themeSetting === "dark" 
                                                    ? 'border-blue-500 bg-blue-500/5 shadow-md shadow-blue-500/10' 
                                                    : (isSystem 
                                                        ? 'border-[#7c00ff]/20 bg-[#080314]/50 hover:border-[#7c00ff]/40 hover:bg-[#7c00ff]/10' 
                                                        : (isLight ? 'border-slate-200 hover:border-slate-300 hover:bg-slate-50' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'))
                                            }`}
                                        >
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl flex items-center justify-center bg-slate-900 shadow-sm border border-slate-700 text-slate-200">
                                                <Moon className="w-5 h-5 sm:w-6 sm:h-6" />
                                            </div>
                                            <div className="flex-1 sm:flex-initial">
                                                <div className={`font-bold text-sm sm:text-base ${isSystem ? 'text-purple-100' : (isLight ? 'text-slate-800' : 'text-slate-200')}`}>Dark</div>
                                                <div className={`text-xs mt-0.5 ${isSystem ? 'text-purple-300/60' : (isLight ? 'text-slate-500' : 'text-slate-400')}`}>Dark workspace</div>
                                            </div>
                                            {themeSetting === "dark" && (
                                                <div className="sm:absolute sm:top-3 sm:right-3 bg-blue-500 text-white rounded-full p-0.5 shrink-0">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </div>
                                            )}
                                        </button>

                                        {/* System Theme Card */}
                                        <button 
                                            onClick={() => setThemeSetting("system")}
                                            className={`relative p-3.5 sm:p-5 rounded-2xl flex flex-row sm:flex-col items-center sm:justify-center gap-3.5 sm:gap-3 border-2 transition-all cursor-pointer text-left sm:text-center h-auto sm:h-[160px] overflow-hidden group ${
                                                themeSetting === "system" 
                                                    ? 'border-[#7c00ff] bg-[#7c00ff]/15 shadow-xl shadow-[#7c00ff]/30 ring-2 ring-[#7c00ff]' 
                                                    : (isSystem 
                                                        ? 'border-[#7c00ff]/30 bg-[#0d061c] hover:border-[#7c00ff]/60 hover:bg-[#7c00ff]/10' 
                                                        : (isLight ? 'border-slate-200 hover:border-slate-300 hover:bg-slate-50' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'))
                                            }`}
                                        >
                                            {/* AuraBrand Background for System */}
                                            <div className={`absolute inset-0 bg-gradient-to-br from-[#7c00ff]/30 via-[#9933ff]/20 to-[#5500bb]/25 transition-opacity ${themeSetting === "system" ? 'opacity-100' : 'opacity-40 group-hover:opacity-80'}`}></div>
                                            
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#7c00ff] via-[#9400d3] to-[#5500bb] shadow-[0_4px_25px_rgba(124,0,255,0.6)] border border-white/40 text-white relative z-10">
                                                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                                            </div>
                                            <div className="flex-1 sm:flex-initial text-left sm:text-center relative z-10">
                                                <div className={`font-bold text-sm sm:text-base ${themeSetting === "system" ? 'text-white' : (isSystem ? 'text-purple-200' : (isLight ? 'text-slate-800' : 'text-slate-200'))}`}>System</div>
                                                <div className={`text-[10px] sm:text-xs mt-0.5 font-semibold ${themeSetting === "system" ? 'text-[#c084fc]' : (isSystem ? 'text-purple-300/70' : (isLight ? 'text-slate-500' : 'text-slate-400'))}`}>Blue-Violet (#7c00ff)</div>
                                            </div>
                                            {themeSetting === "system" && (
                                                <div className="sm:absolute sm:top-3 sm:right-3 bg-[#7c00ff] text-white rounded-full p-0.5 z-10 shadow-[0_0_12px_rgba(124,0,255,0.7)] shrink-0">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "data" && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div>
                                    <h3 className={`text-lg sm:text-xl font-bold mb-1 ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>Data & Privacy</h3>
                                    <p className={`text-xs sm:text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Export your work or manage your account status.</p>
                                </div>
                                
                                <div className="space-y-3">
                                    <button 
                                        onClick={async () => {
                                            if (onExportZip) await onExportZip();
                                            onClose();
                                        }}
                                        className={`w-full flex items-center justify-between p-3.5 sm:p-4 border rounded-xl transition-all cursor-pointer ${
                                            isSystem 
                                                ? 'border-[#7c00ff]/30 bg-[#0e0720]/60 hover:border-[#7c00ff]/60 hover:bg-[#7c00ff]/15' 
                                                : (isLight ? 'border-slate-200 hover:border-blue-400 hover:bg-blue-50 hover:shadow-sm' : 'border-slate-800 hover:border-blue-500/50 hover:bg-[#111218] hover:shadow-lg')
                                        }`}
                                    >
                                        <div className="flex items-center gap-3.5 sm:gap-4">
                                            <div className={`p-2.5 rounded-lg shrink-0 ${
                                                isSystem 
                                                    ? 'bg-[#7c00ff]/20 text-[#c084fc] border border-[#7c00ff]/40 shadow-[0_0_10px_rgba(124,0,255,0.3)]' 
                                                    : (isLight ? 'bg-blue-100 text-blue-600' : 'bg-blue-900/30 text-blue-400 ring-1 ring-blue-500/20')
                                            }`}>
                                                <Download className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <p className={`text-sm font-bold ${isSystem ? 'text-purple-100' : (isLight ? 'text-slate-800' : 'text-slate-200')}`}>Export Source Code (.ZIP)</p>
                                                <p className={`text-xs mt-0.5 ${isSystem ? 'text-purple-300/70' : (isLight ? 'text-slate-500' : 'text-slate-400')}`}>Download a ZIP of your raw HTML/React components.</p>
                                            </div>
                                        </div>
                                    </button>

                                    <div className={`pt-6 mt-6 border-t ${isSystem ? 'border-[#7c00ff]/20' : 'border-red-500/20'}`}>
                                        <h4 className="text-xs font-bold uppercase tracking-widest text-red-500 flex items-center gap-2 mb-4">
                                            <AlertTriangle className="w-4 h-4" /> Danger Zone
                                        </h4>
                                        <button 
                                            onClick={async () => {
                                                if (onResetWorkspace) await onResetWorkspace();
                                                onClose();
                                            }}
                                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl text-sm font-bold transition-all cursor-pointer active:scale-98"
                                        >
                                            <Trash2 className="w-4 h-4" /> Reset Workspace Canvas
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}