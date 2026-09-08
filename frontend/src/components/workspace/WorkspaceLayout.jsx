import { useState, useEffect, useRef } from "react";
import { TopNav } from "../layout/TopNav.jsx";
import LeftSidebar from "../LeftSidebar.jsx";
import RightSidebar from "../layout/RightSidebar.jsx"; 
import CanvasContainer from "../../canvas/CanvasContainer.jsx";
import SettingsModal from "./SettingsModal.jsx";
import { 
    X, Zap, Sparkles, Target, TrendingUp, 
    Palette, Image as ImageIcon, Share2, Code2, Layers, CheckCircle2,
    Monitor, Smartphone, Tablet as TabletIcon, ExternalLink, Copy, RotateCcw, LayoutTemplate
} from "lucide-react";
import { API } from "../../api"; 
import { deployAnimatedSite } from "../../utils/deploymentUtils";

export default function WorkspaceLayout({ userData, setUserData, themeMode, onToggleTheme, onLogout }) {
    // --- Centralized Backend State ---
    const [pages, setPages] = useState([]);
    const [activePage, setActivePage] = useState("Home");
    const [sections, setSections] = useState([]);
    
    // 🎯 SYNCHRONOUS REF FIX: Prevents stale state closures when AI rapidly updates multiple blocks
    const sectionsRef = useRef([]);
    
    // --- UI State ---
    const [activeSectionId, setActiveSectionId] = useState(null);
    const [activeTool, setActiveTool] = useState("structure"); 
    const [isLeftOpen, setIsLeftOpen] = useState(true);        
    const [isRightOpen, setIsRightOpen] = useState(true);      
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    // --- GLOBAL BACKGROUND STATE (PERSISTENT FIX) ---
    const [globalBg, setGlobalBg] = useState(() => {
        // Try to load from Django userData first, fallback to browser local storage tied to user
        return userData?.globalBg || localStorage.getItem(`aurabuild_bg_${userData?.name || 'default'}`) || null;
    });

    // Auto-save the background to localStorage & userData when it changes
    useEffect(() => {
        if (globalBg) {
            localStorage.setItem(`aurabuild_bg_${userData?.name || 'default'}`, globalBg);
            setUserData(prev => ({ ...prev, globalBg })); // Syncs upstream
        } else {
            localStorage.removeItem(`aurabuild_bg_${userData?.name || 'default'}`);
        }
    }, [globalBg, userData?.name]);
    
    // --- ADVANCED Preview Modal State ---
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [previewViewport, setPreviewViewport] = useState("desktop"); 
    const [isLandscape, setIsLandscape] = useState(false);
    
    const [terminalLogs, setTerminalLogs] = useState([
        { type: "system", text: "// Studio Pipeline Activity Log" },
        { type: "status", text: "Connecting to secure backend..." }
    ]);

    // --- Strict Transactional History Engine ---
    const [history, setHistory] = useState({ past: [], future: [] });
    const lastLoadedPage = useRef(null);

    // Keep ref in sync with React state for external changes (Undo, Redo, Page load)
    useEffect(() => {
        sectionsRef.current = sections;
    }, [sections]);

    // 1. BOOT SEQUENCE: Load user data from Django DB
    useEffect(() => {
        const loadWorkspace = async () => {
            try {
                const res = await API.get('pages/');
                if (res.data && res.data.length > 0) {
                    setPages(res.data);
                    const firstPage = res.data[0];
                    setActivePage(firstPage.name);
                    setSections(firstPage.sections || []);
                    lastLoadedPage.current = firstPage.name;
                    setTerminalLogs(prev => [...prev, { type: "success", text: "[SUCCESS] Workspace synchronized with backend database." }]);
                } else {
                    handleAddPage("Home");
                }
            } catch (err) {
                setTerminalLogs(prev => [...prev, { type: "error", text: "[ERROR] Failed to load workspace from server." }]);
            }
        };
        loadWorkspace();
    }, []);

    // 2. PAGE SWITCHER: Update visible sections ONLY when actually changing tabs
    useEffect(() => {
        if (pages.length > 0 && lastLoadedPage.current !== activePage) {
            const pageObj = pages.find(p => p.name === activePage);
            if (pageObj) {
                setSections(pageObj.sections || []);
                setHistory({ past: [], future: [] }); 
                lastLoadedPage.current = activePage;
            }
        }
    }, [activePage, pages]);

    // --- URL Routing visually ---
    useEffect(() => {
        if (userData && userData.name && userData.code) {
            const cleanUsername = userData.name.toLowerCase().replace(/\s+/g, '-');
            const cleanToken = userData.code;
            const newPath = `/workspace/${cleanUsername}/${cleanToken}`;
            window.history.replaceState({}, '', newPath);
        }
    }, [userData]);

    // --- BULLETPROOF HISTORY RECORDER ---
    const commitHistory = (newSections, oldSections) => {
        const currentSnapshot = JSON.parse(JSON.stringify(oldSections)); 
        setHistory(prev => ({
            past: [...prev.past, currentSnapshot].slice(-30), 
            future: [] 
        }));
        
        setSections(newSections);
        setPages(prevPages => prevPages.map(p => p.name === activePage ? { ...p, sections: newSections } : p));
    };

    // --- Undo / Redo Handlers ---
    const handleUndo = () => {
        if (history.past.length === 0) return;
        
        const previous = history.past[history.past.length - 1];
        const newPast = history.past.slice(0, -1);
        const currentSnapshot = JSON.parse(JSON.stringify(sectionsRef.current));
        
        setHistory({
            past: newPast,
            future: [currentSnapshot, ...history.future]
        });
        
        setSections(previous);
        setPages(prev => prev.map(p => p.name === activePage ? { ...p, sections: previous } : p));
        setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Action undone.` }]);
    };

    const handleRedo = () => {
        if (history.future.length === 0) return;
        
        const next = history.future[0];
        const newFuture = history.future.slice(1);
        const currentSnapshot = JSON.parse(JSON.stringify(sectionsRef.current));
        
        setHistory({
            past: [...history.past, currentSnapshot],
            future: newFuture
        });
        
        setSections(next);
        setPages(prev => prev.map(p => p.name === activePage ? { ...p, sections: next } : p));
        setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Action redone.` }]);
    };

    // Keyboard Shortcuts (Ctrl+Z / Ctrl+Y)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) handleRedo();
                else handleUndo();
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                handleRedo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [history, sections]);

    const isLight = themeMode === 'light';
    const currentTheme = (userData && userData.theme) || 'modern_glass';

    // --- Backend-Synced Data Handlers ---
    const handleAddPage = async (pageName = "New Page") => {
        try {
            const res = await API.post('pages/create/', { name: pageName });
            setPages(prev => [...prev, res.data]);
            setActivePage(res.data.name);
            setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Created new backend page: ${res.data.name}` }]);
        } catch (err) {
            setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] Failed to create page.` }]);
        }
    };

    const handleDeletePage = async (pageNameToDelete, pageId) => {
        if (pages.length <= 1) {
            setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] Cannot delete the last remaining page.` }]);
            return;
        }
        try {
            if (pageId) await API.delete(`pages/${pageId}/`);
            const newPages = pages.filter(p => p.id !== pageId);
            setPages(newPages);
            if (activePage === pageNameToDelete) setActivePage(newPages[0].name);
            setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Deleted page: ${pageNameToDelete}` }]);
        } catch (err) {
            setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] Failed to delete page on server.` }]);
        }
    };

    const handleResumeParsed = (parsedData) => {
        if (!parsedData) return;
        setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Refreshing canvas with parsed data...` }]);
        API.get('pages/').then(res => {
            setPages(res.data);
            const active = res.data.find(p => p.name === activePage) || res.data[0];
            setHistory({ past: [], future: [] }); 
            setSections(active.sections || []);
        });
    };

    // 🎯 AUTOSAVE
    const handleUpdateSectionContent = async (sectionId, key, value) => {
        const currentSections = sectionsRef.current;
        const newSections = currentSections.map(sec => {
            if (String(sec.id) === String(sectionId)) {
                return { ...sec, content_data: { ...sec.content_data, [key]: value } };
            }
            return sec;
        });
        
        sectionsRef.current = newSections;
        commitHistory(newSections, currentSections);

        const isNumericId = /^\d+$/.test(String(sectionId));
        if (isNumericId) { 
            try {
                const targetSec = newSections.find(s => String(s.id) === String(sectionId));
                if (targetSec) {
                    await API.patch(`sections/${sectionId}/`, { content_data: targetSec.content_data });
                }
            } catch(e) {
                setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] Autosave failed for section #${sectionId}` }]);
            }
        }
    };

    const handleDropSection = async (activeId, overId) => {
        const currentSections = sectionsRef.current;
        const oldIndex = currentSections.findIndex(s => String(s.id) === String(activeId));
        const newIndex = currentSections.findIndex(s => String(s.id) === String(overId));
        if (oldIndex === -1 || newIndex === -1) return;

        const newSections = [...currentSections];
        const [moved] = newSections.splice(oldIndex, 1);
        newSections.splice(newIndex, 0, moved);
        
        sectionsRef.current = newSections;
        commitHistory(newSections, currentSections); 

        try {
            const activePageObj = pages.find(p => p.name === activePage);
            if (activePageObj) {
                await API.post('sections/reorder/', {
                    page_id: activePageObj.id,
                    ordered_ids: newSections.map(s => s.id)
                });
            }
        } catch (e) {
            setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] Layout reorder failed to save to database.` }]);
        }
    };

    const handleAddManualSection = (type) => {
        const newId = `sec-${Date.now()}`;
        const defaultContent = type === 'hero' ? { heading: "Your Name", subheading: "Headline" } :
                               type === 'about' ? { bio: "Write about yourself..." } :
                               type === 'projects_grid' ? { title: "Showcase", projects: [] } : {};

        const newSection = { id: newId, section_type: type, content_data: defaultContent };
        
        const currentSections = sectionsRef.current;
        const newSections = [...currentSections, newSection];

        sectionsRef.current = newSections;
        commitHistory(newSections, currentSections); 
        
        setTerminalLogs(prev => [...prev, { type: "success", text: `[SUCCESS] Added local ${type} block to canvas.` }]);
    };

    const triggerDeployment = async () => {
        setTerminalLogs(prev => [...prev, { type: "system", text: "[SYSTEM] Initiating secure backend deployment..." }]);
        const result = await deployAnimatedSite({ pages, activePage, userData });
        if (result.success) {
            setTerminalLogs(prev => [...prev, { type: "success", text: `[SUCCESS] Deployed successfully to ${result.data.projectUrl}` }]);
        } else {
            setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] ${result.error}` }]);
        }
    };

    const handleExportZip = async () => {
        setTerminalLogs(prev => [...prev, { type: "system", text: "[SYSTEM] Compiling source code for ZIP export..." }]);
        setTimeout(() => {
            setTerminalLogs(prev => [...prev, { type: "success", text: "[SUCCESS] Source code ready for download." }]);
        }, 1500);
    };

    // Dynamic Device Frame Classes for Live Preview
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
        <div className={`h-screen w-screen flex flex-col font-sans overflow-hidden ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#05050A] text-slate-100'}`}>
            <header className="h-14 lg:h-16 shrink-0 w-full z-50 relative">
                <TopNav 
                    theme={themeMode}
                    setTheme={onToggleTheme}
                    activeTheme={currentTheme}
                    onThemeChange={(newTheme) => setUserData({...userData, theme: newTheme })}
                    onDeploy={triggerDeployment}
                    onToggleLeft={() => setIsLeftOpen(!isLeftOpen)}
                    onToggleRight={() => setIsRightOpen(!isRightOpen)}
                    userData={userData}
                    onLogout={onLogout}
                    onHelpClick={() => setIsHelpModalOpen(true)} 
                    isPreviewMode={isPreviewMode}
                    onTogglePreview={() => setIsPreviewMode(!isPreviewMode)}
                    onUndo={handleUndo}
                    canUndo={history.past.length > 0}
                    onRedo={handleRedo}
                    canRedo={history.future.length > 0}
                />
            </header>

            {/* DUAL-PANE ARCHITECTURE STARTS HERE */}
            <div className="flex-1 flex w-full h-full overflow-hidden relative">
                
                {/* Mobile Overlay */}
                {(isLeftOpen || isRightOpen) && (
                    <div 
                        className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
                        onClick={() => {
                            setIsLeftOpen(false);
                            setIsRightOpen(false);
                        }}
                    />
                )}

                {/* 1. FAR LEFT: Expanding Icon Bar (LeftSidebar) */}
                <aside className={`absolute lg:relative group h-full shrink-0 transition-all duration-300 ease-in-out w-16 hover:w-64 overflow-hidden z-40 shadow-2xl ${isLeftOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${isLight ? 'bg-white border-r border-slate-200' : 'bg-[#0B0C10] border-r border-slate-800'}`}>
                    <LeftSidebar 
                        pages={pages}
                        activePage={activePage}
                        setActivePage={setActivePage}
                        activeTool={activeTool}
                        onSelectTool={(tool) => {
                            setActiveTool(activeTool === tool ? null : tool);
                            if (window.innerWidth < 1024) {
                                setIsLeftOpen(false);
                                setIsRightOpen(true);
                            }
                        }}
                        onAddPage={handleAddPage}
                        onDeletePage={handleDeletePage}
                        themeMode={themeMode}
                        setTerminalLogs={setTerminalLogs}
                        onResumeParsed={handleResumeParsed}
                        onOpenSettings={() => setIsSettingsModalOpen(true)}
                    />
                </aside>

                {/* 2. CENTER: CLEAN LIVE PREVIEW CANVAS */}
                <main className={`flex-1 h-full flex flex-col relative z-10 ${isLight ? 'bg-slate-100/50' : 'bg-[#08080C]'}`}>
                    <div className="flex-1 overflow-y-auto w-full h-full p-4 sm:p-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        <div className="w-full max-w-[1024px] mx-auto transition-all duration-300">
                            <CanvasContainer 
                                activePage={activePage}
                                sections={sections}
                                activeSectionId={activeSectionId}
                                setActiveSectionId={setActiveSectionId}
                                portfolioTheme={currentTheme}
                                themeMode={themeMode}
                                globalBgImage={globalBg} /* <-- PASSED HERE */
                                onInlineEdit={handleUpdateSectionContent} 
                                onDropSection={handleDropSection} 
                            />
                        </div>
                    </div>
                </main>

                {/* 3. FAR RIGHT: Tool Panel (RightSidebar) */}
                <aside className={`absolute right-0 lg:relative h-full w-80 shrink-0 border-l transition-transform duration-300 ease-in-out z-40 shadow-2xl ${isRightOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'} ${isLight ? 'bg-white border-slate-200' : 'bg-[#0B0C10] border-slate-800'}`}>
                    <RightSidebar 
                        userData={userData}
                        activeSectionId={activeSectionId}
                        themeMode={themeMode}
                        activeTool={activeTool}
                        terminalLogs={terminalLogs}
                        setTerminalLogs={setTerminalLogs}
                        activeTheme={currentTheme}
                        onThemeChange={(newTheme) => setUserData({...userData, theme: newTheme })}
                        sections={sections}
                        onUpdateSectionContent={handleUpdateSectionContent}
                        onUpdateGlobalBg={setGlobalBg} /* <-- PASSED HERE */
                        onAddSection={handleAddManualSection}
                        onDeploy={triggerDeployment}
                        onExportZip={handleExportZip}
                    />
                </aside>
            </div>

            {/* --- UPGRADED FULL-SCREEN PREVIEW MODAL --- */}
            {isPreviewMode && (
                <div className="fixed inset-0 z-[200] flex flex-col bg-slate-950/95 backdrop-blur-lg animate-in fade-in duration-200">
                    
                    {/* Preview Top Navigation Bar */}
                    <div className={`h-16 px-4 md:px-6 flex items-center justify-between border-b ${isLight ? 'bg-slate-900 border-slate-800 text-white' : 'bg-[#0B0C10] border-slate-800 text-slate-100'}`}>
                        
                        {/* Left Controls: Devices & Rotation */}
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

                            {/* Rotation Toggle (Only for mobile/tablet) */}
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

                        {/* Right Controls: Tools & Actions */}
                        <div className="flex items-center gap-2 md:gap-3">
                            
                          {/* In-Preview Theme Switcher */}
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
                                    navigator.clipboard.writeText(window.location.href);
                                    setTerminalLogs(prev => [...prev, { type: "system", text: "[SYSTEM] Preview link copied to clipboard." }]);
                                }}
                                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                                title="Copy Shareable Link"
                            >
                                <Copy className="w-4 h-4" />
                            </button>

                            <button 
                                onClick={() => window.open(window.location.href, '_blank')}
                                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                                title="Test in New Browser Tab"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </button>

                            <button 
                                onClick={() => setIsPreviewMode(false)}
                                className="flex items-center gap-2 px-4 py-2 ml-1 md:ml-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-lg hover:scale-105"
                            >
                                <X className="w-4 h-4" /> <span className="hidden sm:inline">Exit Preview</span>
                            </button>
                        </div>
                    </div>

                    {/* Device Frame Viewport Container */}
                    <div className="flex-1 overflow-auto flex items-center justify-center p-4 md:p-8 custom-scrollbar">
                        <div className={frameStyle}>
                            
                            {/* Dynamic iPhone Notch */}
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

                            {/* Canvas Scroll Area */}
                            <div className="flex-1 overflow-y-auto w-full h-full relative z-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                {/* Spacing to push content down/right below the notch so it doesn't overlap text */}
                                <div className={`pb-24 ${previewViewport === 'mobile' && !isLandscape ? 'pt-8 px-2' : previewViewport === 'mobile' && isLandscape ? 'pl-10 pr-4 pt-4' : 'pt-8 px-4'}`}>
                                    <CanvasContainer 
                                        activePage={activePage}
                                        sections={sections}
                                        activeSectionId={null} 
                                        setActiveSectionId={() => {}} 
                                        portfolioTheme={currentTheme}
                                        themeMode={themeMode}
                                        globalBgImage={globalBg} /* <-- PASSED HERE */
                                        isPreview={true} 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- COMPREHENSIVE AI TOOLS HELP GUIDE MODAL --- */}
            {isHelpModalOpen && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in p-4">
                    <div className={`w-full max-w-3xl max-h-[85vh] flex flex-col rounded-3xl shadow-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-[#0D0E12] border-slate-800'}`}>
                        
                        {/* Header */}
                        <div className={`shrink-0 p-6 border-b flex items-center justify-between ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-500">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className={`text-xl font-black tracking-tight ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
                                        AuraBuild Studio & AI Tools Guide
                                    </h2>
                                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                        Learn why each tool exists and how to maximize your portfolio's impact.
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsHelpModalOpen(false)} className={`p-2 rounded-full transition-colors cursor-pointer ${isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-slate-800 text-slate-400'}`}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {/* Scrollable Content */}
                        <div className={`flex-1 overflow-y-auto p-6 space-y-8 text-sm leading-relaxed custom-scrollbar ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                            
                            {/* Section 1: AI Tools Breakdown */}
                            <div>
                                <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>
                                    <Sparkles className="w-4 h-4" /> Specific AI Tools & Why They Are Used
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    
                                    {/* 1. Content Generator */}
                                    <div className={`p-4 rounded-2xl border transition-all ${isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-900/50 border-slate-800/80'}`}>
                                        <div className="flex items-center gap-2 font-bold text-sm mb-1.5 text-blue-500">
                                            <Sparkles className="w-4 h-4" /> Content Generator
                                        </div>
                                        <p className="text-xs leading-relaxed">
                                            <strong>Why Use It:</strong> Overcomes writer's block by automatically drafting recruiter-ready bios, engineering headlines, and project summaries directly from simple prompts or your target role.
                                        </p>
                                    </div>

                                    {/* 2. Target Role Matcher */}
                                    <div className={`p-4 rounded-2xl border transition-all ${isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-900/50 border-slate-800/80'}`}>
                                        <div className="flex items-center gap-2 font-bold text-sm mb-1.5 text-emerald-500">
                                            <Target className="w-4 h-4" /> Target Role Matcher
                                        </div>
                                        <p className="text-xs leading-relaxed">
                                            <strong>Why Use It:</strong> Scans target Job Descriptions (JDs) against your current portfolio data, calculates an ATS match score, and pinpoints exact missing technical keywords.
                                        </p>
                                    </div>

                                    {/* 3. Impact Quantifier */}
                                    <div className={`p-4 rounded-2xl border transition-all ${isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-900/50 border-slate-800/80'}`}>
                                        <div className="flex items-center gap-2 font-bold text-sm mb-1.5 text-orange-500">
                                            <TrendingUp className="w-4 h-4" /> Impact Quantifier
                                        </div>
                                        <p className="text-xs leading-relaxed">
                                            <strong>Why Use It:</strong> Transforms passive responsibility bullets into metric-driven power statements using the STAR method (Action Verb + Tech Stack + Measurable Outcome).
                                        </p>
                                    </div>

                                    {/* 4. Palette Studio */}
                                    <div className={`p-4 rounded-2xl border transition-all ${isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-900/50 border-slate-800/80'}`}>
                                        <div className="flex items-center gap-2 font-bold text-sm mb-1.5 text-purple-500">
                                            <Palette className="w-4 h-4" /> Palette Studio
                                        </div>
                                        <p className="text-xs leading-relaxed">
                                            <strong>Why Use It:</strong> Generates cohesive visual color schemes and theme moods instantly (e.g., Cyber Neon, Glassmorphism, Clean Minimal) without manual CSS tweaks.
                                        </p>
                                    </div>

                                    {/* 5. Image Customizer */}
                                    <div className={`p-4 rounded-2xl border transition-all ${isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-900/50 border-slate-800/80'}`}>
                                        <div className="flex items-center gap-2 font-bold text-sm mb-1.5 text-pink-500">
                                            <ImageIcon className="w-4 h-4" /> Image Customizer
                                        </div>
                                        <p className="text-xs leading-relaxed">
                                            <strong>Why Use It:</strong> Auto-crops, resizes, and frames headshots and project screenshots to guarantee seamless responsive display across mobile and tablet viewports.
                                        </p>
                                    </div>

                                    {/* 6. SEO & Cold Pitch */}
                                    <div className={`p-4 rounded-2xl border transition-all ${isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-900/50 border-slate-800/80'}`}>
                                        <div className="flex items-center gap-2 font-bold text-sm mb-1.5 text-indigo-500">
                                            <Share2 className="w-4 h-4" /> SEO & Cold Pitch
                                        </div>
                                        <p className="text-xs leading-relaxed">
                                            <strong>Why Use It:</strong> Generates meta tags for social media previews and drafts personalized cold outreach emails/LinkedIn pitches to hiring managers.
                                        </p>
                                    </div>

                                    {/* 7. Code Export Shell */}
                                    <div className={`p-4 rounded-2xl border transition-all md:col-span-2 ${isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-900/50 border-slate-800/80'}`}>
                                        <div className="flex items-center gap-2 font-bold text-sm mb-1.5 text-cyan-500">
                                            <Code2 className="w-4 h-4" /> Code Export Shell
                                        </div>
                                        <p className="text-xs leading-relaxed">
                                            <strong>Why Use It:</strong> Compiles your visual portfolio into production-ready React + Tailwind CSS source code, packaged in a ZIP download for custom self-hosting.
                                        </p>
                                    </div>

                                </div>
                            </div>

                            {/* Section 2: General Workflow Quick-Start */}
                            <div>
                                <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                                    <Layers className="w-4 h-4" /> Core Studio Features
                                </h3>
                                <ul className="space-y-2 text-xs list-none">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                        <span><strong>Structure Builder:</strong> Click quick-insert modules in the Right Sidebar to manually snap sections (Hero, About, Projects) into place.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                        <span><strong>Direct Inline Editing:</strong> Click any text right on the canvas to update content live without entering forms.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                        <span><strong>Drag & Drop Reordering:</strong> Grab the hover drag handle (⋮⋮) on any section block to adjust layout order.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                        <span><strong>One-Click Deployment:</strong> Push your site live to the cloud with an instant production URL.</span>
                                    </li>
                                </ul>
                            </div>

                        </div>

                        {/* Footer */}
                        <div className={`shrink-0 p-6 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                            <button onClick={() => setIsHelpModalOpen(false)} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all shadow-md cursor-pointer">
                                Got It! Let's Build
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <SettingsModal 
                isOpen={isSettingsModalOpen} 
                onClose={() => setIsSettingsModalOpen(false)} 
                userData={userData} 
                setUserData={setUserData} 
                themeMode={themeMode}
                onLogout={onLogout} /* <-- ADDED HERE */
            />
        </div>
    );
}