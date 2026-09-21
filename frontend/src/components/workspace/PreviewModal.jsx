import { 
    X, Monitor, Smartphone, Tablet as TabletIcon, ExternalLink, Copy, LayoutTemplate
} from "lucide-react";
import CanvasContainer from "../../canvas/CanvasContainer.jsx";

export default function PreviewModal({
    isOpen,
    onClose,
    isLight,
    previewViewport,
    setPreviewViewport,
    isLandscape, // Left in signature to prevent WorkspaceLayout prop errors, but unused
    setIsLandscape,
    currentTheme,
    userData,
    setUserData,
    activePage,
    sections,
    themeMode,
    globalBg,
    globalFont,
    setTerminalLogs
}) {
    if (!isOpen) return null;

    // Define the frame width and styling for responsive viewports
    let frameStyle = "relative flex flex-col overflow-hidden transition-all duration-300 ease-in-out mx-auto bg-white dark:bg-[#05050A] shadow-2xl ";
    
    if (previewViewport === 'desktop') {
        frameStyle += "w-full max-w-[1440px] h-full rounded-2xl ring-1 ring-slate-700/50";
    } else if (previewViewport === 'tablet') {
        frameStyle += "w-[768px] h-[1024px] max-h-full rounded-[2rem] ring-[8px] ring-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)]";
    } else if (previewViewport === 'mobile') {
        frameStyle += "w-[375px] h-[812px] max-h-full rounded-[3rem] ring-[12px] ring-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.5)]";
    }

    return (
        <div className={`fixed inset-0 z-[200] flex flex-col animate-in fade-in duration-200 ${isLight ? 'bg-slate-50/95' : 'bg-[#0B0C10]/95'} backdrop-blur-lg`}>
            
            {/* Ambient AuraBuild Branding Glow behind the preview */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none flex justify-center items-center">
                <div className="w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px] absolute -top-40 opacity-60"></div>
                <div className="w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-[100px] absolute -bottom-20 opacity-40"></div>
            </div>

            {/* Toolbar */}
            <div className={`relative z-50 h-16 px-4 md:px-6 flex items-center justify-between border-b transition-colors ${isLight ? 'bg-white border-slate-200 text-slate-800 shadow-sm' : 'bg-[#05050A] border-slate-800 text-slate-100'}`}>
                <div className="flex items-center gap-2 md:gap-4">
                    <span className="hidden lg:block text-sm font-bold uppercase tracking-wider text-blue-500">Live Preview</span>
                    
                    {/* Device Selector */}
                    <div className={`flex items-center gap-1 p-1 rounded-xl border transition-colors ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-black/40 border-slate-800'}`}>
                        <button 
                            onClick={() => setPreviewViewport('desktop')}
                            className={`p-1.5 md:px-3 md:py-1.5 flex items-center gap-2 text-xs font-semibold rounded-lg transition-all ${previewViewport === 'desktop' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                            title="Desktop View"
                        >
                            <Monitor className="w-4 h-4" /> <span className="hidden sm:inline">Desktop</span>
                        </button>
                        <button 
                            onClick={() => setPreviewViewport('tablet')}
                            className={`p-1.5 md:px-3 md:py-1.5 flex items-center gap-2 text-xs font-semibold rounded-lg transition-all ${previewViewport === 'tablet' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                            title="Tablet View"
                        >
                            <TabletIcon className="w-4 h-4" /> <span className="hidden sm:inline">Tablet</span>
                        </button>
                        <button 
                            onClick={() => setPreviewViewport('mobile')}
                            className={`p-1.5 md:px-3 md:py-1.5 flex items-center gap-2 text-xs font-semibold rounded-lg transition-all ${previewViewport === 'mobile' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                            title="Mobile View"
                        >
                            <Smartphone className="w-4 h-4" /> <span className="hidden sm:inline">Mobile</span>
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                    <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-colors ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-black/40 border-slate-800'}`}>
                        <LayoutTemplate className={`w-4 h-4 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                        <select 
                            value={currentTheme}
                            onChange={(e) => setUserData({...userData, theme: e.target.value})}
                            className={`bg-transparent text-xs font-semibold outline-none cursor-pointer ${isLight ? 'text-slate-700' : 'text-slate-200'}`}
                        >
                            <option value="modern_glass" className="bg-slate-900 text-slate-100 font-semibold py-1">Modern Glass</option>
                            <option value="developer_pro" className="bg-slate-900 text-slate-100 font-semibold py-1">Developer Pro</option>
                            <option value="creative_aurora" className="bg-slate-900 text-slate-100 font-semibold py-1">Creative Aurora</option>
                            <option value="minimal_executive" className="bg-slate-900 text-slate-100 font-semibold py-1">Minimal Executive</option>
                            <option value="cyber_neon" className="bg-slate-900 text-slate-100 font-semibold py-1">Cyber Neon</option>
                        </select>
                    </div>
                    
                    <div className={`h-6 w-px mx-1 hidden sm:block ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}></div>

                    <button 
                        onClick={() => {
                            const cleanUsername = (userData?.name || "developer").toLowerCase().replace(/[^a-z0-9]/g, '');
                            const liveUrl = `${window.location.protocol}//${window.location.host}/preview/${cleanUsername}/public`;
                            navigator.clipboard.writeText(liveUrl);
                            setTerminalLogs(prev => [...prev, { type: "system", text: "[SYSTEM] Portfolio link copied to clipboard." }]);
                        }}
                        className={`p-2 rounded-xl transition-all ${isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
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
                        className={`p-2 rounded-xl transition-all ${isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                        title="Test in New Browser Tab"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </button>

                    <button 
                        onClick={onClose}
                        className="flex items-center gap-2 px-4 py-2 ml-1 md:ml-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    >
                        <X className="w-4 h-4" /> <span className="hidden sm:inline">Exit Preview</span>
                    </button>
                </div>
            </div>

            {/* Preview Canvas Workspace */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-4 md:p-8 custom-scrollbar relative z-10">
                <div className={frameStyle}>
                    
                    {/* Fake Mobile Notch (Purely aesthetic for mobile view) */}
                    {previewViewport === 'mobile' && (
                        <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-50 pointer-events-none">
                            <div className="w-24 h-6 bg-slate-900 rounded-b-2xl"></div>
                        </div>
                    )}

                    {/* Scrollable container that houses the actual portfolio */}
                    <div id="preview-scroll-container" className="flex-1 overflow-x-hidden overflow-y-auto w-full h-full relative z-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        <div className={`pb-24 w-full h-full ${previewViewport === 'mobile' ? 'pt-8 px-0' : 'pt-0 px-0'}`}>
                            <CanvasContainer 
                                activePage={activePage}
                                sections={sections}
                                activeSectionId={null} 
                                setActiveSectionId={() => {}} 
                                portfolioTheme={currentTheme}
                                themeMode={themeMode}
                                globalBgImage={globalBg} 
                                globalFont={globalFont}
                                isPreview={true} 
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
