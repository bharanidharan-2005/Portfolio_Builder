import { useState } from "react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { TopNav } from "../layout/TopNav.jsx";
import LeftSidebar from "../LeftSidebar.jsx";
import RightSidebar from "../layout/RightSidebar.jsx"; 
import CanvasContainer from "../../canvas/CanvasContainer.jsx";
import SettingsModal from "./SettingsModal.jsx";
import HelpModal from "./HelpModal.jsx";
import PreviewModal from "./PreviewModal.jsx";
import PortfolioFrontpage from "../portfolio/PortfolioFrontpage.jsx";
import { Undo2, Redo2 } from "lucide-react";
import SEOUpdater from "../../utils/SEOUpdater";
import { lazy, Suspense } from 'react';

const ThreeBackground = lazy(() => import('../ThreeBackground.jsx'));

export default function WorkspaceLayout() {
    // 1. Consume ALL state and logic from our new WorkspaceContext
    const workspace = useWorkspace();
    const {
        isPublicPreview, userData, setUserData, themeMode, currentTheme,
        pages, activePage, setActivePage, sections,
        globalBg, setGlobalBg, globalFont, setGlobalFont,
        terminalLogs, setTerminalLogs, history,
        handleUndo, handleRedo, handleAddPage, handleDeletePage,
        handleUpdateSectionContent, handleDropSection, handleAddManualSection,
        handleDeleteSection, handleDuplicateSection, handleResumeParsed,
        triggerDeployment, handleExportZip
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

    const isLight = themeMode === 'light';

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
        <div className={`h-screen w-full flex flex-col overflow-hidden select-none transition-colors duration-500 font-inter relative ${themeMode === 'dark' ? 'bg-[#05050A] text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
            {themeMode === 'dark' && (
                <div className="fixed inset-0 z-0 pointer-events-none">
                    <Suspense fallback={null}>
                        <ThreeBackground theme="dark" />
                    </Suspense>
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 blur-[120px] rounded-full" />
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
                        onThemeChange={(newTheme) => setUserData({...userData, theme: newTheme })}
                        onDeploy={triggerDeployment}
                        onToggleLeft={() => setIsLeftOpen(!isLeftOpen)}
                        onToggleRight={() => setIsRightOpen(!isRightOpen)}
                        userData={userData}
                        onLogout={() => {}} // Logout handled internally by TopNav via AppContext
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

                {/* LEFT SIDEBAR */}
                {!isPublicPreview && (
                    <aside className={`absolute lg:relative group h-full shrink-0 transition-all duration-300 ease-in-out w-16 hover:w-64 overflow-hidden z-40 shadow-2xl ${isLeftOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${isLight ? 'bg-white border-r border-slate-200' : 'bg-white/[0.02] backdrop-blur-2xl border-r border-white/10'}`}>
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

                {/* CENTER: CLEAN LIVE PREVIEW CANVAS */}
                <main className={`flex-1 h-full flex flex-col relative z-10 ${isLight ? 'bg-slate-100/50' : 'bg-transparent'}`}>
                    
                    {/* FLOATING HISTORY TOOLBAR */}
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

                    <div id="workspace-scroll-container" className={`flex-1 overflow-y-auto w-full h-full ${!isPublicPreview ? 'p-4 sm:p-8' : 'p-0'} [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}>
                        <div className={`w-full transition-all duration-300 ${!isPublicPreview ? 'max-w-[1024px] mx-auto' : ''}`}>
                            <CanvasContainer 
                                activePage={activePage}
                                sections={sections}
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
                                isPreview={isPublicPreview || isInternalPreviewOpen} 
                            />
                        </div>
                    </div>
                </main>

                {/* RIGHT SIDEBAR */}
                {!isPublicPreview && (
                    <aside className={`absolute right-0 lg:relative h-full w-80 shrink-0 border-l transition-transform duration-300 ease-in-out z-40 shadow-2xl ${isRightOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'} ${isLight ? 'bg-white border-slate-200' : 'bg-white/[0.02] backdrop-blur-2xl border-white/10'}`}>
                        <RightSidebar 
                            userData={userData}
                            activeSectionId={activeSectionId}
                            themeMode={themeMode}
                            activeTool={activeTool}
                            terminalLogs={terminalLogs}
                            setTerminalLogs={setTerminalLogs}
                            activeTheme={currentTheme}
                            onThemeChange={(newTheme) => setUserData({...userData, theme: newTheme })}
                            onTemplateChange={(newTpl) => setUserData({...userData, frontpageTemplate: newTpl})}
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

            {/* MODALS */}
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
                    globalFont={globalFont}
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
                    onLogout={() => {}} // AppContext handles this
                    onDeploy={triggerDeployment}
                    onExportZip={handleExportZip}
                />
            )}
        </div>
    );
}