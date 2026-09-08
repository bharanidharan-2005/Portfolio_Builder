import { useState, useEffect } from "react";
import { X, User, Shield, HardDrive, Download, AlertTriangle, Trash2, Loader2, CheckCircle2, ExternalLink, LogOut } from "lucide-react";
import { API } from "../../api"; 

export default function SettingsModal({ isOpen, onClose, userData, setUserData, themeMode, onLogout }) {
    const isLight = themeMode === 'light';
    const [activeTab, setActiveTab] = useState("account");
    
    // Track inputs locally inside the modal
    const [localName, setLocalName] = useState(userData?.name || "Developer");
    const [localAvatar, setLocalAvatar] = useState(userData?.avatar || "🐱");
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null); // 'success' or 'error'

    // Keep it synced if user data loads slightly after the modal mounts
    useEffect(() => {
        if (userData?.name) setLocalName(userData.name);
        if (userData?.avatar) setLocalAvatar(userData.avatar);
    }, [userData?.name, userData?.avatar]);

    if (!isOpen) return null;

    // Push changes to the Django backend, then update global state
    const handleSaveChanges = async () => {
        setIsSaving(true);
        setSaveStatus(null);
        
        try {
            await API.patch('/user/profile/', { name: localName, avatar: localAvatar });
            
            if (setUserData) {
                setUserData({ ...userData, name: localName, avatar: localAvatar });
            }
            
            setSaveStatus('success');
            setTimeout(() => {
                setSaveStatus(null);
                onClose();
            }, 1200);

        } catch (error) {
            console.warn("Backend endpoint not found or failed, updating local state only.", error);
            
            if (setUserData) {
                setUserData({ ...userData, name: localName, avatar: localAvatar });
            }
            setSaveStatus('error');
            setTimeout(() => {
                setSaveStatus(null);
                onClose();
            }, 1500);
        } finally {
            setIsSaving(false);
        }
    };

    const cleanUsername = (localName || "developer").toLowerCase().replace(/\s+/g, '-');
    const cleanToken = userData?.code || "demo";
    const liveUrl = `${window.location.origin}/workspace/${cleanUsername}/${cleanToken}`;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className={`rounded-2xl shadow-2xl max-w-3xl w-full flex overflow-hidden h-[500px] border animate-in zoom-in-95 ${isLight ? 'bg-white border-slate-200' : 'bg-[#0B0C10] border-slate-800'}`}>
                
                {/* Settings Sidebar */}
                <div className={`w-48 sm:w-56 p-4 border-r shrink-0 flex flex-col gap-1 ${isLight ? 'bg-slate-50/50 border-slate-200' : 'bg-[#05050A] border-slate-800'}`}>
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h2 className={`text-lg font-bold ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>Settings</h2>
                    </div>
                    
                    <button onClick={() => setActiveTab("account")} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === "account" ? (isLight ? 'bg-blue-100 text-blue-700 shadow-sm' : 'bg-blue-900/40 text-blue-400 ring-1 ring-blue-500/20') : (isLight ? 'text-slate-600 hover:bg-slate-200' : 'text-slate-400 hover:bg-slate-800')}`}>
                        <User className="w-4 h-4" /> Account
                    </button>
                    
                    <button onClick={() => setActiveTab("workspace")} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === "workspace" ? (isLight ? 'bg-blue-100 text-blue-700 shadow-sm' : 'bg-blue-900/40 text-blue-400 ring-1 ring-blue-500/20') : (isLight ? 'text-slate-600 hover:bg-slate-200' : 'text-slate-400 hover:bg-slate-800')}`}>
                        <Shield className="w-4 h-4" /> Workspace
                    </button>
                    
                    <button onClick={() => setActiveTab("data")} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === "data" ? (isLight ? 'bg-blue-100 text-blue-700 shadow-sm' : 'bg-blue-900/40 text-blue-400 ring-1 ring-blue-500/20') : (isLight ? 'text-slate-600 hover:bg-slate-200' : 'text-slate-400 hover:bg-slate-800')}`}>
                        <HardDrive className="w-4 h-4" /> Data & Privacy
                    </button>

                    {/* MOVED LOGOUT BUTTON HERE */}
                    <div className={`mt-auto pt-4 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                        <button 
                            onClick={onLogout} 
                            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer text-red-500 ${isLight ? 'hover:bg-red-50' : 'hover:bg-red-500/10'}`}
                        >
                            <LogOut className="w-4 h-4" /> Logout Session
                        </button>
                    </div>
                </div>

                {/* Settings Content */}
                <div className="flex-1 flex flex-col relative">
                    <button onClick={onClose} className={`absolute top-4 right-4 p-1.5 rounded-md transition-colors cursor-pointer z-10 ${isLight ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-700' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200'}`}>
                        <X className="w-5 h-5" />
                    </button>

                    <div className="p-8 overflow-y-auto custom-scrollbar h-full">
                        {activeTab === "account" && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div>
                                    <h3 className={`text-xl font-bold mb-1 ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>My Profile</h3>
                                    <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Manage your public builder identity.</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 mb-2">
                                        {/* Avatar Updater */}
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
                                    
                                    <div className="pt-2">
                                        <button 
                                            onClick={handleSaveChanges}
                                            disabled={isSaving || (localName === userData?.name && localAvatar === userData?.avatar)}
                                            className={`px-5 py-2.5 text-white text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer ${
                                                isSaving || (localName === userData?.name && localAvatar === userData?.avatar) ? 'opacity-50 cursor-not-allowed bg-slate-500' :
                                                saveStatus === 'success' ? 'bg-emerald-600' : 
                                                saveStatus === 'error' ? 'bg-orange-500' : 
                                                'bg-blue-600 hover:bg-blue-500 hover:shadow-blue-900/20'
                                            }`}
                                        >
                                            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                            {saveStatus === 'success' && <CheckCircle2 className="w-4 h-4" />}
                                            {saveStatus === 'error' && <AlertTriangle className="w-4 h-4" />}
                                            
                                            {isSaving ? "Saving to Cloud..." : 
                                             saveStatus === 'success' ? "Saved Successfully!" :
                                             saveStatus === 'error' ? "Saved Locally (No DB)" :
                                             "Save Changes"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "workspace" && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div>
                                    <h3 className={`text-xl font-bold mb-1 ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>Workspace Preferences</h3>
                                    <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Configure your live environment routing.</p>
                                </div>
                                <div className="space-y-4">
                                    <div className={`p-4 border rounded-xl flex items-center justify-between ${isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-[#111218]'}`}>
                                        <div className="overflow-hidden pr-4">
                                            <p className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Public Portfolio URL</p>
                                            <p className={`text-xs mt-1 font-mono truncate ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>
                                                {liveUrl}
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => window.open(liveUrl, '_blank')}
                                            className={`shrink-0 px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors flex items-center gap-2 cursor-pointer ${isLight ? 'border-slate-300 hover:bg-slate-200 text-slate-700' : 'border-slate-700 hover:bg-slate-800 text-slate-300'}`}
                                        >
                                            Visit <ExternalLink className="w-3 h-3" />
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
                                    <button className={`w-full flex items-center justify-between p-4 border rounded-xl transition-all cursor-pointer ${isLight ? 'border-slate-200 hover:border-blue-400 hover:bg-blue-50 hover:shadow-sm' : 'border-slate-800 hover:border-blue-500/50 hover:bg-[#111218] hover:shadow-lg'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2.5 rounded-lg ${isLight ? 'bg-blue-100 text-blue-600' : 'bg-blue-900/30 text-blue-400 ring-1 ring-blue-500/20'}`}>
                                                <Download className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <p className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Export Source Code</p>
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