import { 
    X, Monitor, Smartphone, Tablet as TabletIcon, ExternalLink, Copy, RotateCcw, LayoutTemplate
} from "lucide-react";
import CanvasContainer from "../../canvas/CanvasContainer.jsx";

export default function PreviewModal({
    isOpen,
    onClose,
    isLight,
    previewViewport,
    setPreviewViewport,
    isLandscape,
    setIsLandscape,
    currentTheme,
    userData,
    setUserData,
    activePage,
    sections,
    themeMode,
    globalBg,
    setTerminalLogs
}) {
    if (!isOpen) return null;

    let frameStyle = "relative flex flex-col overflow-hidden transition-all duration-500 ease-in-out bg-white dark:bg-[#05050A] shadow-2xl mx-auto ";
    if (previewViewport === 'desktop') {
        frameStyle += "w-full h-full max-w-[1440px] rounded-2xl ring-1 ring-slate-700/50";
    } else if (previewViewport === 'tablet') {
        frameStyle += isLandscape 
            ? "w-[1024px] h-[768px] rounded-[2rem] ring-[12px] ring-slate-800"
            : "w-[768px] h-[1024px] rounded-[2rem] ring-[12px] ring-slate-800";
    } else if (previewViewport === 'mobile') {
        frameStyle += isLandscape 
            ? "w-[812px] h-[375px] rounded-[2.5rem] ring-[14px] ring-slate-900"
            : "w-[375px] h-[812px] rounded-[3rem] ring-[14px] ring-slate-900";
    }

    return (
        <div className="fixed inset-0 z-[200] flex flex-col bg-slate-950/95 backdrop-blur-lg animate-in fade-in duration-200">
            <div className={`h-16 px-4 md:px-6 flex items-center justify-between border-b ${isLight ? 'bg-slate-900 border-slate-800 text-white' : 'bg-[#0B0C10] border-slate-800 text-slate-100'}`}>
                <div className="flex items-center gap-2 md:gap-4">
                    <span className="hidden lg:block text-sm font-bold uppercase tracking-wider text-blue-400">Live Preview</span>
                    
                    <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-slate-700/50">
                        <button 
                            onClick={() => setPreviewViewport('desktop')}
                            className={`p-1.5 md:px-3 md:py-1.5 flex items-center gap-2 text-xs font-semibold rounded-md transition-all ${previewViewport === 'desktop' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                            title="Desktop View"
                        >
                            <Monitor className="w-4 h-4" /> <span className="hidden sm:inline">Desktop</span>
                        </button>
                        <button 
                            onClick={() => { setPreviewViewport('tablet'); setIsLandscape(false); }}
                            className={`p-1.5 md:px-3 md:py-1.5 flex items-center gap-2 text-xs font-semibold rounded-md transition-all ${previewViewport === 'tablet' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                            title="Tablet View"
                        >
                            <TabletIcon className="w-4 h-4" /> <span className="hidden sm:inline">Tablet</span>
                        </button>
                        <button 
                            onClick={() => { setPreviewViewport('mobile'); setIsLandscape(false); }}
                            className={`p-1.5 md:px-3 md:py-1.5 flex items-center gap-2 text-xs font-semibold rounded-md transition-all ${previewViewport === 'mobile' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                            title="Mobile View"
                        >
                            <Smartphone className="w-4 h-4" /> <span className="hidden sm:inline">Mobile</span>
                        </button>
                    </div>

                    {previewViewport !== 'desktop' && (
                        <button 
                            onClick={() => setIsLandscape(!isLandscape)}
                            className="p-2 bg-black/40 border border-slate-700/50 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                            title="Rotate Device Orientation"
                        >
                            <RotateCcw className={`w-4 h-4 transition-transform duration-300 ${isLandscape ? '-rotate-90' : 'rotate-0'}`} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                    <div className="hidden md:flex items-center gap-2 bg-black/40 border border-slate-700/50 px-3 py-1.5 rounded-lg">
                        <LayoutTemplate className="w-4 h-4 text-slate-400" />
                        <select 
                            value={currentTheme}
                            onChange={(e) => setUserData({...userData, theme: e.target.value})}
                            className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer"
                        >
                            <option value="modern_glass" className="bg-slate-900 text-slate-100 font-semibold py-1">Modern Glass</option>
                            <option value="developer_pro" className="bg-slate-900 text-slate-100 font-semibold py-1">Developer Pro</option>
                            <option value="creative_aurora" className="bg-slate-900 text-slate-100 font-semibold py-1">Creative Aurora</option>
                            <option value="minimal_executive" className="bg-slate-900 text-slate-100 font-semibold py-1">Minimal Executive</option>
                            <option value="cyber_neon" className="bg-slate-900 text-slate-100 font-semibold py-1">Cyber Neon</option>
                        </select>
                    </div>
                    <div className="h-6 w-px bg-slate-700 mx-1 hidden sm:block"></div>

                    <button 
                        onClick={() => {
                            const cleanUsername = (userData?.name || "developer").toLowerCase().replace(/[^a-z0-9]/g, '');
                            const liveUrl = `${window.location.protocol}//${window.location.host}/preview/${cleanUsername}/public`;
                            navigator.clipboard.writeText(liveUrl);
                            setTerminalLogs(prev => [...prev, { type: "system", text: "[SYSTEM] Portfolio link copied to clipboard." }]);
                        }}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                        title="Copy Shareable Link"
                    >
                        <Copy className="w-4 h-4" />
                    </button>

                    <button 
                        onClick={() => {
                            const cleanUsername = (userData?.name || "developer").toLowerCase().replace(/[^a-z0-9]/g, '');
                            const liveUrl = `${window.location.protocol}//${window.location.host}/preview/${cleanUsername}/public`;
                            window.open(liveUrl, '_blank');
                        }}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                        title="Test in New Browser Tab"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </button>

                    <button 
                        onClick={onClose}
                        className="flex items-center gap-2 px-4 py-2 ml-1 md:ml-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-lg hover:scale-105"
                    >
                        <X className="w-4 h-4" /> <span className="hidden sm:inline">Exit Preview</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center p-4 md:p-8 custom-scrollbar">
                <div className={frameStyle}>
                    {previewViewport === 'mobile' && !isLandscape && (
                        <div className="absolute top-0 inset-x-0 h-7 flex justify-center z-50 pointer-events-none">
                            <div className="w-32 h-7 bg-slate-900 rounded-b-3xl"></div>
                        </div>
                    )}
                    {previewViewport === 'mobile' && isLandscape && (
                        <div className="absolute left-0 inset-y-0 w-7 flex items-center z-50 pointer-events-none">
                            <div className="h-32 w-7 bg-slate-900 rounded-r-3xl"></div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto w-full h-full relative z-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        <div className={`pb-24 ${previewViewport === 'mobile' && !isLandscape ? 'pt-8 px-2' : previewViewport === 'mobile' && isLandscape ? 'pl-10 pr-4 pt-4' : 'pt-8 px-4'}`}>
                            <CanvasContainer 
                                activePage={activePage}
                                sections={sections}
                                activeSectionId={null} 
                                setActiveSectionId={() => {}} 
                                portfolioTheme={currentTheme}
                                themeMode={themeMode}
                                globalBgImage={globalBg} 
                                isPreview={true} 
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
