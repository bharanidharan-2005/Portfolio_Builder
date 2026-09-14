import { useState, useEffect, useRef } from "react";
import { TopNav } from "../layout/TopNav.jsx";
import LeftSidebar from "../LeftSidebar.jsx";
import RightSidebar from "../layout/RightSidebar.jsx"; 
import CanvasContainer from "../../canvas/CanvasContainer.jsx";
import SettingsModal from "./SettingsModal.jsx";
import HelpModal from "./HelpModal.jsx";
import PreviewModal from "./PreviewModal.jsx";

import { 
    X, Zap, Sparkles, Target, TrendingUp, 
    Palette, Image as ImageIcon, Share2, Code2, Layers, CheckCircle2,
    Moon, Sun, Monitor, Menu, Check, Search, Download, PanelLeftClose, PanelLeftOpen, GripVertical, Settings as SettingsIcon,
    Smartphone, Tablet as TabletIcon, ExternalLink, Copy, RotateCcw, LayoutTemplate
} from "lucide-react";
import { DEFAULT_BLOCK_DATA } from '../../utils/constants';
import { API } from "../../api"; 
import { deployAnimatedSite } from "../../utils/deploymentUtils";

// 1. Accept the isPreviewMode prop (renamed locally to isPublicPreview to avoid state collision)
export default function WorkspaceLayout({ userData, setUserData, themeMode, onToggleTheme, onLogout, isPreviewMode: isPublicPreview = false }) {
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

    // --- GLOBAL BACKGROUND STATE ---
    const [globalBg, setGlobalBg] = useState(() => {
        return userData?.globalBg || localStorage.getItem(`aurabuild_bg_${userData?.name || 'default'}`) || null;
    });

    useEffect(() => {
        if (globalBg) {
            localStorage.setItem(`aurabuild_bg_${userData?.name || 'default'}`, globalBg);
            if (setUserData) setUserData(prev => ({ ...prev, globalBg }));
        } else {
            localStorage.removeItem(`aurabuild_bg_${userData?.name || 'default'}`);
        }
    }, [globalBg, userData?.name, setUserData]);

    // --- GLOBAL FONT STATE ---
    const [globalFont, setGlobalFont] = useState(() => {
        return userData?.globalFont || localStorage.getItem(`aurabuild_font_${userData?.name || 'default'}`) || 'font-inter';
    });

    useEffect(() => {
        if (globalFont) {
            localStorage.setItem(`aurabuild_font_${userData?.name || 'default'}`, globalFont);
            if (setUserData) setUserData(prev => ({ ...prev, globalFont }));
        }
    }, [globalFont, userData?.name, setUserData]);
    
    // --- ADVANCED Preview Modal State (Renamed to avoid conflict with public preview prop) ---
    const [isInternalPreviewOpen, setIsInternalPreviewOpen] = useState(false);
    const [previewViewport, setPreviewViewport] = useState("desktop"); 
    const [isLandscape, setIsLandscape] = useState(false);
    
    const [terminalLogs, setTerminalLogs] = useState([
        { type: "system", text: "// Studio Pipeline Activity Log" },
        { type: "status", text: "Connecting to secure backend..." }
    ]);

    // --- Strict Transactional History Engine ---
    const [history, setHistory] = useState({ past: [], future: [] });
    const lastLoadedPage = useRef(null);

    useEffect(() => {
        sectionsRef.current = sections;
    }, [sections]);

    // BOOT SEQUENCE
    useEffect(() => {
        const loadWorkspace = async () => {
            try {
                let res;
                if (isPreviewMode && userData?.name) {
                    const cleanUsername = userData.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                    res = await API.get(`public-portfolio/${cleanUsername}/`);
                    // The public API returns a flat list of pages directly, just like 'pages/'
                } else {
                    res = await API.get('pages/');
                }
                
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

    // PAGE SWITCHER
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

    // --- URL Routing visually (Only apply if NOT in public preview) ---
    useEffect(() => {
        if (!isPublicPreview && userData && userData.name && userData.code) {
            const cleanUsername = userData.name.toLowerCase().replace(/\s+/g, '-');
            const cleanToken = userData.code;
            const newPath = `/workspace/${cleanUsername}/${cleanToken}`;
            window.history.replaceState({}, '', newPath);
        }
    }, [userData, isPublicPreview]);

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
        setHistory({ past: newPast, future: [currentSnapshot, ...history.future] });
        setSections(previous);
        setPages(prev => prev.map(p => p.name === activePage ? { ...p, sections: previous } : p));
        setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Action undone.` }]);
    };

    const handleRedo = () => {
        if (history.future.length === 0) return;
        const next = history.future[0];
        const newFuture = history.future.slice(1);
        const currentSnapshot = JSON.parse(JSON.stringify(sectionsRef.current));
        setHistory({ past: [...history.past, currentSnapshot], future: newFuture });
        setSections(next);
        setPages(prev => prev.map(p => p.name === activePage ? { ...p, sections: next } : p));
        setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Action redone.` }]);
    };

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
        const defaultContent = DEFAULT_BLOCK_DATA[type] || {};

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
        try {
            const { exportProjectToZip } = await import('../../utils/exportEngine.js');
            await exportProjectToZip(pages, activePage, themeMode, currentTheme, globalBgImage);
            setTerminalLogs(prev => [...prev, { type: "success", text: "[SUCCESS] Source code downloaded successfully." }]);
        } catch (e) {
            console.error(e);
            setTerminalLogs(prev => [...prev, { type: "error", text: "[ERROR] Failed to compile source code ZIP." }]);
        }
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
            
            {/* HIDE TOP NAV IN PUBLIC PREVIEW */}
            {!isPublicPreview && (
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
                        isPreviewMode={isInternalPreviewOpen}
                        onTogglePreview={() => setIsInternalPreviewOpen(!isInternalPreviewOpen)}
                        onUndo={handleUndo}
                        canUndo={history.past.length > 0}
                        onRedo={handleRedo}
                        canRedo={history.future.length > 0}
                    />
                </header>
            )}

            {/* DUAL-PANE ARCHITECTURE STARTS HERE */}
            <div className="flex-1 flex w-full h-full overflow-hidden relative">
                
                {/* Mobile Overlay */}
                {!isPublicPreview && (isLeftOpen || isRightOpen) && (
                    <div 
                        className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
                        onClick={() => {
                            setIsLeftOpen(false);
                            setIsRightOpen(false);
                        }}
                    />
                )}

                {/* HIDE LEFT SIDEBAR IN PUBLIC PREVIEW */}
                {!isPublicPreview && (
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
                )}

                {/* 2. CENTER: CLEAN LIVE PREVIEW CANVAS */}
                <main className={`flex-1 h-full flex flex-col relative z-10 ${isLight ? 'bg-slate-100/50' : 'bg-[#08080C]'}`}>
                    {/* REMOVED PADDING IF IN PUBLIC PREVIEW SO IT SPANS FULL WIDTH */}
                    <div id="workspace-scroll-container" className={`flex-1 overflow-y-auto w-full h-full ${!isPublicPreview ? 'p-4 sm:p-8' : 'p-0'} [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}>
                        {/* REMOVED MAX WIDTH CONSTRAINT IF IN PUBLIC PREVIEW */}
                        <div className={`w-full transition-all duration-300 ${!isPublicPreview ? 'max-w-[1024px] mx-auto' : ''}`}>
                            <CanvasContainer 
                                activePage={activePage}
                                sections={sections}
                                /* Only allow editing interactions if NOT in public preview */
                                activeSectionId={!isPublicPreview ? activeSectionId : null}
                                setActiveSectionId={!isPublicPreview ? setActiveSectionId : () => {}}
                                portfolioTheme={currentTheme}
                                themeMode={themeMode}
                                globalBgImage={globalBg}
                                globalFont={globalFont}
                                onInlineEdit={!isPublicPreview ? handleUpdateSectionContent : undefined} 
                                onDropSection={!isPublicPreview ? handleDropSection : undefined} 
                                /* Trigger Canvas preview logic for BOTH internal modal and public route */
                                isPreview={isPublicPreview || isInternalPreviewOpen} 
                            />
                        </div>
                    </div>
                </main>

                {/* HIDE RIGHT SIDEBAR IN PUBLIC PREVIEW */}
                {!isPublicPreview && (
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
                            onUpdateGlobalBg={setGlobalBg}
                            activeFont={globalFont}
                            onUpdateFont={setGlobalFont}
                            onAddSection={handleAddManualSection}
                            onDeploy={triggerDeployment}
                            onExportZip={handleExportZip}
                        />
                    </aside>
                )}
            </div>

            {!isPublicPreview && (
                <PreviewModal
                    isOpen={isInternalPreviewOpen}
                    onClose={() => setIsInternalPreviewOpen(false)}
                    isLight={isLight}
                    previewViewport={previewViewport}
                    setPreviewViewport={setPreviewViewport}
                    isLandscape={isLandscape}
                    setIsLandscape={setIsLandscape}
                    currentTheme={currentTheme}
                    userData={userData}
                    setUserData={setUserData}
                    activePage={activePage}
                    sections={sections}
                    themeMode={themeMode}
                    globalBg={globalBg}
                    setTerminalLogs={setTerminalLogs}
                />
            )}

            {!isPublicPreview && (
                <HelpModal
                    isOpen={isHelpModalOpen}
                    onClose={() => setIsHelpModalOpen(false)}
                    isLight={isLight}
                />
            )}

            {!isPublicPreview && (
                <SettingsModal 
                    isOpen={isSettingsModalOpen} 
                    onClose={() => setIsSettingsModalOpen(false)} 
                    userData={userData} 
                    setUserData={setUserData} 
                    themeMode={themeMode}
                    onLogout={onLogout}
                />
            )}
        </div>
    );
}