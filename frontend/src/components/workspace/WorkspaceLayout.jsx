import { useState, useCallback, lazy, Suspense } from "react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { useAppContext } from "../../context/AppContext";
import { TopNav } from "../layout/TopNav.jsx";
import LeftSidebar from "../LeftSidebar.jsx";
import RightSidebar from "../layout/RightSidebar.jsx"; 
import CanvasContainer from "../../canvas/CanvasContainer.jsx";
import SettingsModal from "./SettingsModal.jsx";
import HelpModal from "./HelpModal.jsx";
import PreviewModal from "./PreviewModal.jsx";
import ResumeReviewModal from "./ResumeReviewModal.jsx";
import PortfolioFrontpage from "../portfolio/PortfolioFrontpage.jsx";
import { Undo2, Redo2, ChevronLeft } from "lucide-react";
import SEOUpdater from "../../utils/SEOUpdater";

const ThreeBackground = lazy(() => import('../ThreeBackground.jsx'));

export default function WorkspaceLayout() {
    // 1. Consume ALL state and logic from our new WorkspaceContext
    const workspace = useWorkspace();
    const { logout } = useAppContext();
    const {
        isPublicPreview, userData, setUserData, themeMode, currentTheme,
        pages, activePage, setActivePage, sections,
        globalBg, setGlobalBg, globalFont, setGlobalFont,
        terminalLogs, setTerminalLogs, history,
        handleUndo, handleRedo, handleAddPage, handleDeletePage,
        handleUpdateSectionContent, handleDropSection, handleAddManualSection,
        handleDeleteSection, handleDuplicateSection, handleResumeParsed,
        resumeReviewData, handleApplyResumeData, handleCancelResumeData,
        triggerDeployment, handleExportZip, handleResetWorkspace, activeHighlightSection, aiSuggestionPreview
    } = workspace;

    // 2. Local UI State (Only presentation logic remains here!)
    const [activeSectionId, setActiveSectionId] = useState(null);
    const [activeTool, setActiveTool] = useState("structure"); 
    const [isLeftOpen, setIsLeftOpen] = useState(true);        
    const [isRightOpen, setIsRightOpen] = useState(true);      
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    
    // Internal Preview Modal UI State
    const [isInternalPreviewOpen, setIsInternalPreviewOpen] = useState(false);
    const [previewViewport, setPreviewViewport] = useState("desktop"); 
    const [isLandscape, setIsLandscape] = useState(false);
    const [isFrontpageViewed, setIsFrontpageViewed] = useState(false);
    
    // Left Sidebar Pin State (persisted in localStorage)
    const [isLeftPinned, setIsLeftPinned] = useState(() => {
        try {
            return localStorage.getItem("aurabuild_left_pinned") === "true";
        } catch (e) {
            return false;
        }
    });

    const handleTogglePin = useCallback(() => {
        setIsLeftPinned(prev => {
            const next = !prev;
            try { localStorage.setItem("aurabuild_left_pinned", String(next)); } catch (e) {}
            return next;
        });
    }, []);

    const handleSelectTool = useCallback((tool) => {
        setActiveTool(prev => prev === tool ? null : tool);
        if (window.innerWidth < 1024) {
            setIsLeftOpen(false);
            setIsRightOpen(true);
        }
    }, []);

    const handleToggleLeft = useCallback(() => setIsLeftOpen(prev => !prev), []);
    const handleToggleRight = useCallback(() => setIsRightOpen(prev => !prev), []);
    const handleCloseRight = useCallback(() => setIsRightOpen(false), []);
    const handleOpenRight = useCallback(() => setIsRightOpen(true), []);
    const handleTemplateChange = useCallback((newTpl) => {
        setUserData(prev => ({ ...prev, frontpageTemplate: newTpl }));
        if (typeof window !== 'undefined') {
            localStorage.setItem(`aurabuild_frontpage_${userData?.name || 'default'}`, newTpl);
            localStorage.setItem('aurabuild_frontpage_default', newTpl);
        }
        if (!isPublicPreview) {
            API.patch('portfolio-settings/', { frontpageTemplate: newTpl }).catch(() => {});
        }
        const heroSec = sections.find(s => s.section_type === 'hero');
        if (heroSec && handleUpdateSectionContent) {
            handleUpdateSectionContent(heroSec.id, {
                ...heroSec.content_data,
                frontpageTemplate: newTpl
            });
        }
        setTerminalLogs(prev => [...prev, { type: "info", text: `[FRONTPAGE] Switched landing template to: ${newTpl}` }]);
    }, [setUserData, userData?.name, isPublicPreview, sections, handleUpdateSectionContent, setTerminalLogs]);
    const handleCloseHelp = useCallback(() => setIsHelpModalOpen(false), []);
    const handleOpenSettings = useCallback(() => setIsSettingsModalOpen(true), []);
    const handleCloseSettings = useCallback(() => setIsSettingsModalOpen(false), []);
    const handleTogglePreview = useCallback(() => setIsInternalPreviewOpen(prev => !prev), []);
    const handleClosePreview = useCallback(() => setIsInternalPreviewOpen(false), []);

    const isLight = themeMode === 'light';
    const isSystem = themeMode === 'system';

    // 3. Render Public Preview Frontpage Override
    if (isPublicPreview && !isFrontpageViewed && sections.length > 0) {
        return (
            <PortfolioFrontpage 
                userData={userData}
                sections={sections}
                themeMode={themeMode}
                onVisualize={() => setIsFrontpageViewed(true)}
            />
        );
    }

    // 4. Render Main Builder UI
    return (
        <div className={`h-screen w-full flex flex-col overflow-hidden select-none transition-colors duration-500 font-inter relative ${
            isSystem 
                ? 'bg-[#080314] text-slate-100' 
                : (isLight ? 'bg-slate-50 text-slate-800' : 'bg-slate-950 text-slate-200')
        }`}>
            {(themeMode === 'dark' || isSystem) && (
                <div className={`fixed inset-0 z-0 pointer-events-none overflow-hidden ${isSystem ? 'bg-[#080314]' : 'bg-slate-950'}`}>
                    <Suspense fallback={null}>
                        <ThreeBackground theme="dark" />
                    </Suspense>
                    {/* Deep Space Gradients */}
                    {isSystem ? (
                        <>
                            <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-[#7c00ff]/20 blur-[150px] rounded-full mix-blend-screen" />
                            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#9933ff]/20 blur-[150px] rounded-full mix-blend-screen" />
                            <div className="absolute top-[20%] left-[30%] w-[40%] h-[40%] bg-[#5500bb]/20 blur-[120px] rounded-full mix-blend-screen" />
                        </>
                    ) : (
                        <>
                            <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-900/10 blur-[150px] rounded-full mix-blend-screen" />
                            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-900/10 blur-[150px] rounded-full mix-blend-screen" />
                            <div className="absolute top-[20%] left-[30%] w-[40%] h-[40%] bg-blue-900/5 blur-[120px] rounded-full mix-blend-screen" />
                        </>
                    )}
                    
                    {/* Subtle Starlight Grid overlay */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] opacity-50"></div>
                </div>
            )}
            
            <SEOUpdater pages={pages} userData={userData} isPublicPreview={isPublicPreview} />

            {/* Top Navigation */}
            {!isPublicPreview && (
                <header className="h-14 lg:h-16 shrink-0 w-full z-50 relative">
                    <TopNav 
                        theme={themeMode}
                        setTheme={() => {}} // Controlled by AppContext toggleTheme now, but passed for compatibility
                        activeTheme={currentTheme}
                        onThemeChange={handleThemeChange}
                        onDeploy={triggerDeployment}
                        onToggleLeft={handleToggleLeft}
                        onToggleRight={handleToggleRight}
                        isRightOpen={isRightOpen}
                        userData={userData}
                        sections={sections}
                        onLogout={logout}
                        onHelpClick={handleOpenHelp} 
                        isPreviewMode={isInternalPreviewOpen}
                        onTogglePreview={handleTogglePreview}
                        onUndo={handleUndo}
                        canUndo={history.past.length > 0}
                        onRedo={handleRedo}
                        canRedo={history.future.length > 0}
                    />
                </header>
            )}

            {/* DUAL-PANE ARCHITECTURE STARTS HERE */}
            <div className="flex-1 flex w-full h-full overflow-hidden relative min-w-0">
                
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

                {/* LEFT SIDEBAR */}
                {!isPublicPreview && (
                    <aside className={`absolute lg:relative group h-full shrink-0 transition-all duration-300 ease-in-out ${
                        isLeftPinned ? 'w-60 lg:w-64' : 'w-16 hover:w-60 lg:hover:w-64'
                    } overflow-hidden z-40 shadow-2xl ${
                        isLeftOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                    } ${isSystem ? 'bg-[#0c051a]/95 backdrop-blur-2xl border-r border-[#7c00ff]/25 shadow-[4px_0_24px_rgba(124,0,255,0.12)]' : (isLight ? 'bg-white border-r border-slate-200' : 'bg-white/[0.02] backdrop-blur-2xl border-r border-white/10')}`}>
                        <LeftSidebar 
                            pages={pages}
                            activePage={activePage}
                            setActivePage={setActivePage}
                            activeTool={activeTool}
                            onSelectTool={handleSelectTool}
                            onAddPage={handleAddPage}
                            onDeletePage={handleDeletePage}
                            themeMode={themeMode}
                            setTerminalLogs={setTerminalLogs}
                            onResumeParsed={handleResumeParsed}
                            onOpenSettings={handleOpenSettings}
                            isPinned={isLeftPinned}
                            onTogglePin={handleTogglePin}
                        />
                    </aside>
                )}

                {/* CENTER: CLEAN LIVE PREVIEW CANVAS */}
                <main className={`flex-1 min-w-0 h-full flex flex-col relative z-10 overflow-hidden ${isSystem ? 'bg-[#06020c]' : (isLight ? 'bg-slate-100/50' : 'bg-transparent')}`}>
                    


                    {/* Floating Studio Button when Right Sidebar is collapsed */}
                    {!isPublicPreview && !isRightOpen && (
                        <button
                            onClick={handleOpenRight}
                            title="Open AI Studio Panel"
                            className={`absolute top-1/2 -translate-y-1/2 right-0 z-50 text-white py-2.5 px-2 rounded-l-2xl shadow-2xl flex items-center gap-1 text-xs font-bold transition-all cursor-pointer hover:pl-3 group ${
                                isSystem 
                                    ? 'bg-[#7c00ff] hover:bg-[#6b00dc] shadow-[0_0_22px_rgba(124,0,255,0.7)] border border-r-0 border-[#7c00ff]/60' 
                                    : 'bg-blue-600 hover:bg-blue-500 border border-r-0 border-blue-400/30'
                            }`}
                        >
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            <span className="hidden sm:inline">Studio</span>
                        </button>
                    )}

                    <div id="workspace-scroll-container" className={`flex-1 min-w-0 overflow-y-auto overflow-x-hidden w-full h-full ${!isPublicPreview ? 'p-3 sm:p-5 lg:p-6' : 'p-0'} [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}>
                        <div className={`w-full min-w-0 max-w-full transition-all duration-300 ${!isPublicPreview ? 'max-w-[1440px] mx-auto' : ''}`}>
                            {activeTool === "templates" ? (
                                <div className="w-full rounded-2xl overflow-hidden shadow-2xl border border-blue-500/30 flex flex-col mb-12">
                                    <div className={`p-3 sm:p-4 border-b flex items-center justify-between z-20 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 backdrop-blur-md border-slate-800'}`}>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                            <span className="text-xs font-bold uppercase tracking-wider text-blue-500">
                                                Live Frontpage Landing Preview
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                                Template: <strong className="text-blue-500 capitalize">{userData?.frontpageTemplate || "template1"}</strong>
                                            </span>
                                            <button 
                                                onClick={() => handleSelectTool(null)}
                                                className="text-xs px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors cursor-pointer"
                                            >
                                                Back to Canvas
                                            </button>
                                        </div>
                                    </div>
                                    <div className="w-full relative min-h-[600px] overflow-hidden">
                                        <PortfolioFrontpage 
                                            userData={userData}
                                            sections={sections}
                                            themeMode={themeMode}
                                            onVisualize={() => {
                                                handleSelectTool(null);
                                            }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <CanvasContainer 
                                    activePage={activePage}
                                    sections={sections}
                                    activeSectionId={!isPublicPreview ? activeSectionId : null}
                                    setActiveSectionId={setActiveSectionId}
                                    portfolioTheme={currentTheme}
                                    themeMode={themeMode}
                                    globalBgImage={globalBg}
                                    globalFont={globalFont}
                                    onInlineEdit={!isPublicPreview ? handleUpdateSectionContent : undefined} 
                                    onDropSection={!isPublicPreview ? handleDropSection : undefined} 
                                    onDeleteSection={!isPublicPreview ? handleDeleteSection : undefined}
                                    onDuplicateSection={!isPublicPreview ? handleDuplicateSection : undefined}
                                    onAddSection={!isPublicPreview ? handleAddManualSection : undefined}
                                    onUndo={!isPublicPreview ? handleUndo : undefined}
                                    onRedo={!isPublicPreview ? handleRedo : undefined}
                                    canUndo={history.past.length > 0}
                                    canRedo={history.future.length > 0}
                                    isPreview={isPublicPreview} 
                                    activeHighlightSection={activeHighlightSection}
                                    aiSuggestionPreview={aiSuggestionPreview}
                                />
                            )}
                        </div>
                    </div>
                </main>

                {/* RIGHT SIDEBAR */}
                {!isPublicPreview && (
                    <aside className={`absolute right-0 lg:relative h-full shrink-0 border-l transition-all duration-300 ease-in-out z-40 shadow-2xl overflow-hidden ${
                        isRightOpen 
                            ? 'w-[310px] md:w-[330px] xl:w-[360px] translate-x-0 opacity-100' 
                            : 'w-0 border-l-0 translate-x-full lg:translate-x-0 opacity-0 pointer-events-none'
                    } ${isSystem ? 'bg-[#0c051a]/95 backdrop-blur-2xl border-l border-[#7c00ff]/25 shadow-[-4px_0_24px_rgba(124,0,255,0.12)]' : (isLight ? 'bg-white border-slate-200' : 'bg-white/[0.02] backdrop-blur-2xl border-white/10')}`}>
                        <RightSidebar 
                            userData={userData}
                            activeSectionId={activeSectionId}
                            themeMode={themeMode}
                            activeTool={activeTool}
                            terminalLogs={terminalLogs}
                            setTerminalLogs={setTerminalLogs}
                            activeTheme={currentTheme}
                            onThemeChange={handleThemeChange}
                            onTemplateChange={handleTemplateChange}
                            sections={sections}
                            onUpdateSectionContent={handleUpdateSectionContent}
                            onUpdateGlobalBg={setGlobalBg}
                            activeFont={globalFont}
                            onUpdateFont={setGlobalFont}
                            onAddSection={handleAddManualSection}
                            onDeploy={triggerDeployment}
                            onExportZip={handleExportZip}
                            onClose={handleCloseRight}
                        />
                    </aside>
                )}
            </div>

            {/* MODALS */}
            {!isPublicPreview && (
                <PreviewModal
                    isOpen={isInternalPreviewOpen}
                    onClose={handleClosePreview}
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
                    globalFont={globalFont}
                    setTerminalLogs={setTerminalLogs}
                />
            )}

            {!isPublicPreview && (
                <HelpModal
                    isOpen={isHelpModalOpen}
                    onClose={handleCloseHelp}
                    isLight={isLight}
                />
            )}

            {!isPublicPreview && (
                <SettingsModal 
                    isOpen={isSettingsModalOpen} 
                    onClose={handleCloseSettings} 
                    userData={userData} 
                    setUserData={setUserData} 
                    themeMode={themeMode}
                    onLogout={logout}
                    onDeploy={triggerDeployment}
                    onExportZip={handleExportZip}
                    onResetWorkspace={handleResetWorkspace}
                />
            )}

            {/* Resume Extraction Review Modal */}
            <ResumeReviewModal
                isOpen={!!resumeReviewData}
                onClose={handleCancelResumeData}
                resumeData={resumeReviewData}
                onApply={handleApplyResumeData}
                isLight={isLight}
            />
        </div>
    );
}
