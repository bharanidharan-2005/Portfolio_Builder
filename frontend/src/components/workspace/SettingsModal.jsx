import { useState, useEffect, useCallback } from "react";
import { X, User, Shield, HardDrive, Download, AlertTriangle, Trash2, Loader2, CheckCircle2, ExternalLink, LogOut, Globe } from "lucide-react";
import { API } from "../../api"; 
import { useAppContext } from "../../context/AppContext";
import { Palette, Sun, Moon, Sparkles } from "lucide-react";

export default function SettingsModal({ isOpen, onClose, userData, setUserData, themeMode, onLogout, onDeploy, onExportZip }) {
    const { themeSetting, setThemeSetting } = useAppContext();
    const isLight = themeMode === 'light';
    const [activeTab, setActiveTab] = useState("account");
    
    const [localName, setLocalName] = useState(userData?.name || "Developer");
    const [localAvatar, setLocalAvatar] = useState(userData?.avatar || "🐱");
    const [isSaving, setIsSaving] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

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
                await API.patch('/user/profile/', { name: localName, avatar: localAvatar });
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
    const cleanUsername = (localName || "developer").toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Path-based preview routing format
    const protocol = window.location.protocol;
    const host = window.location.host;
    
    const liveUrl = `${protocol}//${host}/preview/${cleanUsername}/public`;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className={`rounded-2xl shadow-2xl max-w-3xl w-full flex overflow-hidden h-[500px] border animate-in zoom-in-95 ${isLight ? 'bg-white border-slate-200' : 'bg-[#0B0C10] border-slate-800'}`}>
                
                {/* Settings Sidebar */}
                <div className={`w-48 sm:w-56 p-4 border-r shrink-0 flex flex-col gap-1 ${isLight ? 'bg-slate-50/50 border-slate-200' : 'bg-[#05050A] border-slate-800'}`}>
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h2 className={`text-lg font-bold ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>Settings</h2>
                    </div>
                    
                    <button onClick={() => setActiveTab("account")} className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === "account" ? (isLight ? 'bg-blue-100 text-blue-700 shadow-sm' : 'bg-blue-900/40 text-blue-400 ring-1 ring-blue-500/20') : (isLight ? 'text-slate-600 hover:bg-slate-200' : 'text-slate-400 hover:bg-slate-800')}`}>
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4" /> Account
                        </div>
                        {isSaving && <Loader2 className="w-3 h-3 animate-spin opacity-50" />}
                    </button>
                    
                    <button onClick={() => setActiveTab("workspace")} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === "workspace" ? (isLight ? 'bg-blue-100 text-blue-700 shadow-sm' : 'bg-blue-900/40 text-blue-400 ring-1 ring-blue-500/20') : (isLight ? 'text-slate-600 hover:bg-slate-200' : 'text-slate-400 hover:bg-slate-800')}`}>
                        <Shield className="w-4 h-4" /> Workspace
                    </button>
                    
                    <button onClick={() => setActiveTab("appearance")} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === "appearance" ? (isLight ? 'bg-blue-100 text-blue-700 shadow-sm' : 'bg-blue-900/40 text-blue-400 ring-1 ring-blue-500/20') : (isLight ? 'text-slate-600 hover:bg-slate-200' : 'text-slate-400 hover:bg-slate-800')}`}>
                        <Palette className="w-4 h-4" /> Appearance
                    </button>

                    <button onClick={() => setActiveTab("data")} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === "data" ? (isLight ? 'bg-blue-100 text-blue-700 shadow-sm' : 'bg-blue-900/40 text-blue-400 ring-1 ring-blue-500/20') : (isLight ? 'text-slate-600 hover:bg-slate-200' : 'text-slate-400 hover:bg-slate-800')}`}>
                        <HardDrive className="w-4 h-4" /> Data & Privacy
                    </button>

                    <div className={`mt-auto pt-4 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                        <button 
                            onClick={async () => {
                                setIsLoggingOut(true);
                                try {
                                    // 1. Call backend to destroy HttpOnly cookies
                                    await API.post('auth/logout/');
                                } catch (e) {
                                    console.warn("Backend logout failed or was blocked, forcing local logout", e);
                                } finally {
                                    // 2. Destroy all local storage traces
                                    localStorage.removeItem("aurabuild_is_logged_in");
                                    localStorage.removeItem("aurabuild_user");
                                    
                                    // 3. Force hard redirect to landing page (wipes all React state)
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

                {/* Settings Content */}
                <div className="flex-1 flex flex-col relative overflow-hidden">
                    <button onClick={onClose} className={`absolute top-4 right-4 p-1.5 rounded-md transition-colors cursor-pointer z-10 ${isLight ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-700' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200'}`}>
                        <X className="w-5 h-5" />
                    </button>

                    <div className="p-8 overflow-y-auto custom-scrollbar h-full">
                        {activeTab === "account" && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div>
                                    <h3 className={`text-xl font-bold mb-1 ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>My Profile</h3>
                                    <p className={`text-sm flex items-center gap-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                        Manage your public builder identity.
                                        {isSaving && <span className="text-blue-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Saving...</span>}
                                        {!isSaving && (localName !== userData?.name || localAvatar !== userData?.avatar) === false && <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Saved</span>}
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="relative group">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border shadow-sm ${isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-slate-700'}`}>
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
                                            <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Workspace Avatar</p>
                                            <p className="text-xs text-slate-500">Click icon to type a new emoji.</p>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Display Name</label>
                                        <input 
                                            type="text" 
                                            value={localName} 
                                            onChange={(e) => setLocalName(e.target.value)}
                                            className={`w-full max-w-md px-4 py-3 rounded-xl border text-sm font-semibold transition-all outline-none focus:ring-2 focus:ring-blue-500/30 ${isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#111218] border-slate-700 text-slate-100'}`} 
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Access Token / Email</label>
                                        <input 
                                            type="text" 
                                            readOnly 
                                            defaultValue={userData?.code || "Auth Token"} 
                                            className={`w-full max-w-md px-4 py-3 rounded-xl border text-sm font-mono opacity-70 cursor-not-allowed ${isLight ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-slate-900/50 border-slate-800 text-slate-500'}`} 
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "workspace" && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div>
                                    <h3 className={`text-xl font-bold mb-1 ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>Workspace Preferences</h3>
                                    <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Configure your live environment routing and deployment.</p>
                                </div>
                                <div className="space-y-4">
                                    <div className={`p-4 border rounded-xl flex items-center justify-between gap-4 ${isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-[#111218]'}`}>
                                        
                                        <div className="flex-1 min-w-0 pr-2">
                                            <p className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                                                Public Portfolio URL
                                                <span className="bg-blue-500/20 text-blue-500 px-2 py-0.5 rounded text-[10px] uppercase">Live</span>
                                            </p>
                                            <p className={`text-xs mt-1 font-mono truncate ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>
                                                {liveUrl}
                                            </p>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button 
                                                onClick={async () => {
                                                    if (onDeploy) await onDeploy();
                                                    onClose();
                                                }}
                                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer bg-blue-600 hover:bg-blue-500 text-white shadow-sm hover:shadow-blue-900/20`}
                                            >
                                                Deploy to Edge <Globe className="w-3 h-3" />
                                            </button>
                                            <button 
                                                onClick={() => window.open(liveUrl, '_blank')}
                                                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors flex items-center gap-2 cursor-pointer ${isLight ? 'border-slate-300 hover:bg-slate-200 text-slate-700' : 'border-slate-700 hover:bg-slate-800 text-slate-300'}`}
                                            >
                                                Visit <ExternalLink className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "appearance" && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 h-full flex flex-col">
                                <div>
                                    <h3 className={`text-xl font-bold mb-1 uppercase tracking-widest ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>Appearance</h3>
                                    <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Customize how your AuraBuild workspace looks.</p>
                                </div>
                                
                                <div className="space-y-4 pt-2">
                                    <h4 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Theme</h4>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {/* Light Theme Card */}
                                        <button 
                                            onClick={() => setThemeSetting("light")}
                                            className={`relative p-5 rounded-2xl flex flex-col items-center justify-center gap-3 border-2 transition-all cursor-pointer text-left h-[160px] ${themeSetting === "light" ? 'border-blue-500 bg-blue-500/5 shadow-md shadow-blue-500/10' : (isLight ? 'border-slate-200 hover:border-slate-300 hover:bg-slate-50' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/50')}`}
                                        >
                                            {themeSetting === "light" && <div className="absolute top-3 right-3 bg-blue-500 text-white rounded-full p-0.5"><CheckCircle2 className="w-4 h-4" /></div>}
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-200 text-slate-700">
                                                <Sun className="w-6 h-6" />
                                            </div>
                                            <div className="text-center">
                                                <div className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Light</div>
                                                <div className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Clean workspace</div>
                                            </div>
                                        </button>

                                        {/* Dark Theme Card */}
                                        <button 
                                            onClick={() => setThemeSetting("dark")}
                                            className={`relative p-5 rounded-2xl flex flex-col items-center justify-center gap-3 border-2 transition-all cursor-pointer text-left h-[160px] ${themeSetting === "dark" ? 'border-blue-500 bg-blue-500/5 shadow-md shadow-blue-500/10' : (isLight ? 'border-slate-200 hover:border-slate-300 hover:bg-slate-50' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/50')}`}
                                        >
                                            {themeSetting === "dark" && <div className="absolute top-3 right-3 bg-blue-500 text-white rounded-full p-0.5"><CheckCircle2 className="w-4 h-4" /></div>}
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-900 shadow-sm border border-slate-700 text-slate-200">
                                                <Moon className="w-6 h-6" />
                                            </div>
                                            <div className="text-center">
                                                <div className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Dark</div>
                                                <div className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Dark workspace</div>
                                            </div>
                                        </button>

                                        {/* System Theme Card */}
                                        <button 
                                            onClick={() => setThemeSetting("system")}
                                            className={`relative p-5 rounded-2xl flex flex-col items-center justify-center gap-3 border-2 transition-all cursor-pointer text-left h-[160px] overflow-hidden group ${themeSetting === "system" ? 'border-blue-500 bg-blue-500/5 shadow-md shadow-blue-500/10' : (isLight ? 'border-slate-200 hover:border-slate-300 hover:bg-slate-50' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/50')}`}
                                        >
                                            {/* AuraBrand Background for System */}
                                            <div className={`absolute inset-0 bg-gradient-to-br from-violet-500/15 via-indigo-500/10 to-blue-500/15 transition-opacity ${themeSetting === "system" ? 'opacity-100' : 'opacity-30 group-hover:opacity-70'}`}></div>
                                            
                                            {themeSetting === "system" && <div className="absolute top-3 right-3 bg-blue-500 text-white rounded-full p-0.5 z-10"><CheckCircle2 className="w-4 h-4" /></div>}
                                            
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-violet-500 to-blue-500 shadow-md border border-white/20 text-white relative z-10">
                                                <Sparkles className="w-6 h-6" />
                                            </div>
                                            <div className="text-center relative z-10">
                                                <div className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>System</div>
                                                <div className={`text-[10px] sm:text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Follow device</div>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "data" && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div>
                                    <h3 className={`text-xl font-bold mb-1 ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>Data & Privacy</h3>
                                    <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Export your work or manage your account status.</p>
                                </div>
                                
                                <div className="space-y-3">
                                    <button 
                                        onClick={async () => {
                                            if (onExportZip) await onExportZip();
                                            onClose();
                                        }}
                                        className={`w-full flex items-center justify-between p-4 border rounded-xl transition-all cursor-pointer ${isLight ? 'border-slate-200 hover:border-blue-400 hover:bg-blue-50 hover:shadow-sm' : 'border-slate-800 hover:border-blue-500/50 hover:bg-[#111218] hover:shadow-lg'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2.5 rounded-lg ${isLight ? 'bg-blue-100 text-blue-600' : 'bg-blue-900/30 text-blue-400 ring-1 ring-blue-500/20'}`}>
                                                <Download className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <p className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Export Source Code (.ZIP)</p>
                                                <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Download a ZIP of your raw HTML/React components.</p>
                                            </div>
                                        </div>
                                    </button>

                                    <div className="pt-6 mt-6 border-t border-red-500/20">
                                        <h4 className="text-xs font-bold uppercase tracking-widest text-red-500 flex items-center gap-2 mb-4">
                                            <AlertTriangle className="w-4 h-4" /> Danger Zone
                                        </h4>
                                        <button className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl text-sm font-bold transition-colors cursor-pointer">
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