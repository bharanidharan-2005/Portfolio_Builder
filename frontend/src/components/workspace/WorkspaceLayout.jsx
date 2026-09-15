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
    Smartphone, Tablet as TabletIcon, ExternalLink, Copy, RotateCcw, LayoutTemplate, Undo2, Redo2
} from "lucide-react";
import { DEFAULT_BLOCK_DATA, SECTION_ORDER_WEIGHTS } from '../../utils/constants';
import { API } from "../../api"; 
import { deployAnimatedSite } from "../../utils/deploymentUtils";
import SEOUpdater from "../../utils/SEOUpdater";

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
        if (!isPublicPreview) API.patch('portfolio-settings/', { globalBg: globalBg || "" }).catch(() => {});
    }, [globalBg, userData?.name, setUserData, isPublicPreview]);

    // --- GLOBAL FONT STATE ---
    const [globalFont, setGlobalFont] = useState(() => {
        return userData?.globalFont || localStorage.getItem(`aurabuild_font_${userData?.name || 'default'}`) || 'font-inter';
    });

    useEffect(() => {
        if (globalFont) {
            localStorage.setItem(`aurabuild_font_${userData?.name || 'default'}`, globalFont);
            if (setUserData) setUserData(prev => ({ ...prev, globalFont }));
        }
        if (!isPublicPreview) API.patch('portfolio-settings/', { globalFont }).catch(() => {});
    }, [globalFont, userData?.name, setUserData, isPublicPreview]);
    
    // --- Sync Theme to Backend ---
    useEffect(() => {
        if (userData?.theme && !isPublicPreview) {
            API.patch('portfolio-settings/', { theme: userData.theme }).catch(() => {});
        }
    }, [userData?.theme, isPublicPreview]);
    
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
                let pagesData = [];
                if (isPublicPreview && userData?.name) {
                    const cleanUsername = userData.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const res = await API.get(`public-portfolio/${cleanUsername}/`);
                    pagesData = res.data.pages || res.data;
                    if (res.data.settings) {
                        setGlobalBg(res.data.settings.globalBg || null);
                        setGlobalFont(res.data.settings.globalFont || 'font-inter');
                        if (res.data.settings.theme) {
                            if (setUserData) setUserData(prev => ({...prev, theme: res.data.settings.theme}));
                            setLocalTheme(res.data.settings.theme);
                        }
                    }
                } else {
                    const res = await API.get('pages/');
                    pagesData = res.data;
                    try {
                        const settingsRes = await API.get('portfolio-settings/');
                        if (settingsRes.data) {
                            setGlobalBg(settingsRes.data.globalBg || null);
                            setGlobalFont(settingsRes.data.globalFont || 'font-inter');
                            if (settingsRes.data.theme) {
                                if (setUserData) setUserData(prev => ({...prev, theme: settingsRes.data.theme}));
                                setLocalTheme(settingsRes.data.theme);
                            }
                        }
                    } catch (e) {}
                }
                
                if (pagesData && pagesData.length > 0) {
                    setPages(pagesData);
                    const firstPage = pagesData[0];
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
    
    // --- Local fallback for theme in public preview mode ---
    const [localTheme, setLocalTheme] = useState(userData?.theme || 'modern_glass');
    
    useEffect(() => {
        if (userData?.theme) setLocalTheme(userData.theme);
    }, [userData?.theme]);

    const currentTheme = (userData && userData.theme) || localTheme;

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
        
        const targetWeight = SECTION_ORDER_WEIGHTS[type] || 999;
        let insertIndex = currentSections.length;
        
        for (let i = 0; i < currentSections.length; i++) {
            const currentWeight = SECTION_ORDER_WEIGHTS[currentSections[i].section_type] || 999;
            if (targetWeight < currentWeight) {
                insertIndex = i;
                break;
            }
        }
        
        const newSections = [
            ...currentSections.slice(0, insertIndex),
            newSection,
            ...currentSections.slice(insertIndex)
        ];

        sectionsRef.current = newSections;
        commitHistory(newSections, currentSections); 
        
        setTerminalLogs(prev => [...prev, { type: "success", text: `[SUCCESS] Added local ${type} block to canvas.` }]);
    };

    const handleDeleteSection = async (sectionId) => {
        const currentSections = sectionsRef.current;
        const newSections = currentSections.filter(s => String(s.id) !== String(sectionId));
        
        sectionsRef.current = newSections;
        commitHistory(newSections, currentSections);
        
        // If it's a numeric ID, it's stored in the database
        const isNumericId = /^\d+$/.test(String(sectionId));
        if (isNumericId) {
            try {
                await API.delete(`sections/${sectionId}/`);
                setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Deleted section from database.` }]);
            } catch (e) {
                setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] Failed to delete section from database.` }]);
            }
        } else {
            setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Deleted local section.` }]);
        }
    };

    const handleDuplicateSection = async (sectionId) => {
        const currentSections = sectionsRef.current;
        const sectionIndex = currentSections.findIndex(s => String(s.id) === String(sectionId));
        if (sectionIndex === -1) return;
        
        const originalSection = currentSections[sectionIndex];
        const newId = `sec-dup-${Date.now()}`;
        
        const clonedSection = {
            id: newId,
            section_type: originalSection.section_type,
            content_data: JSON.parse(JSON.stringify(originalSection.content_data || {}))
        };
        
        const newSections = [
            ...currentSections.slice(0, sectionIndex + 1),
            clonedSection,
            ...currentSections.slice(sectionIndex + 1)
        ];
        
        sectionsRef.current = newSections;
        commitHistory(newSections, currentSections);
        setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Duplicated section block.` }]);
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
        <div className={`h-screen w-full flex flex-col overflow-hidden select-none transition-colors duration-500 font-inter ${themeMode === 'dark' ? 'bg-[#0B0C10] text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
            
            <SEOUpdater pages={pages} userData={userData} isPublicPreview={isPublicPreview} />

            {/* Top Navigation */}
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
                    
                    {/* --- FLOATING HISTORY TOOLBAR --- */}
                    {!isPublicPreview && (history.past.length > 0 || history.future.length > 0) && (
                        <div className="absolute top-6 right-8 z-50 pointer-events-auto flex items-center gap-1 p-1.5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/80 shadow-[0_8px_30px_rgb(0,0,0,0.4)] animate-in slide-in-from-top-4 duration-500">
                            <button 
                                onClick={handleUndo} 
                                disabled={history.past.length === 0} 
                                className={`p-2.5 rounded-xl transition-all duration-200 ${history.past.length === 0 ? 'opacity-30 cursor-not-allowed text-slate-500' : 'text-slate-200 hover:text-white hover:bg-slate-700 active:scale-95 cursor-pointer'} `}
                                title="Undo (Ctrl+Z)"
                            >
                                <Undo2 className="w-4 h-4" />
                            </button>
                            <div className="w-px h-5 bg-slate-700/50 mx-1"></div>
                            <button 
                                onClick={handleRedo} 
                                disabled={history.future.length === 0} 
                                className={`p-2.5 rounded-xl transition-all duration-200 ${history.future.length === 0 ? 'opacity-30 cursor-not-allowed text-slate-500' : 'text-slate-200 hover:text-white hover:bg-slate-700 active:scale-95 cursor-pointer'} `}
                                title="Redo (Ctrl+Y)"
                            >
                                <Redo2 className="w-4 h-4" />
                            </button>
                        </div>
                    )}

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
                                onDeleteSection={!isPublicPreview ? handleDeleteSection : undefined}
                                onDuplicateSection={!isPublicPreview ? handleDuplicateSection : undefined}
                                onUndo={!isPublicPreview ? handleUndo : undefined}
                                onRedo={!isPublicPreview ? handleRedo : undefined}
                                canUndo={history.past.length > 0}
                                canRedo={history.future.length > 0}
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