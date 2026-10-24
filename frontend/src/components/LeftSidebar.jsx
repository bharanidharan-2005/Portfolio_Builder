import { useRef, useState, useEffect, memo } from "react";
import { 
    FileText, CheckCircle2, AlertCircle, Loader2, Settings, Pin, PinOff, Plus, Trash2, 
    FileUp, Activity, Sparkles, Target, TrendingUp, Palette, Image, 
    Search, LayoutTemplate, FileCode, X, Eye, Undo2, Redo2, ChevronDown, 
    Check, HelpCircle, LogOut, LayoutDashboard 
} from "lucide-react";
import { uploadAndParseResume } from "../utils/aiUtils";
import { PORTFOLIO_THEMES } from "../canvas/themes";

const AI_TOOLS_LIST = [
    { id: "activity_log", icon: Activity, name: "Activity Log" },
    { id: "generator", icon: Sparkles, name: "Content Generator" },
    { id: "matcher", icon: Target, name: "Target Role Matcher" },
    { id: "impact", icon: TrendingUp, name: "Impact Quantifier" },
    { id: "palette", icon: Palette, name: "Palette Studio" },
    { id: "image", icon: Image, name: "Image Customizer" },
    { id: "seo_pitch", icon: Search, name: "SEO & Cold Pitch" },
    { id: "templates", icon: LayoutTemplate, name: "Frontpage Templates" },
    { id: "export", icon: FileCode, name: "Code Export" },
];

function LeftSidebar({
    pages,
    activePage,
    setActivePage,
    onSelectTool,
    activeTool,
    onAddPage,
    onDeletePage,
    themeMode,
    setTerminalLogs,
    onResumeParsed,
    onOpenSettings,
    isPinned = false,
    onTogglePin,
    // Mobile studio controls & preview
    onClose,
    onTogglePreview,
    onUndo,
    canUndo,
    onRedo,
    canRedo,
    activeTheme,
    onThemeChange,
    sections = [],
    onHelpClick,
    onLogout,
    userData
}) {
    const isLight = themeMode === 'light';
    const isSystem = themeMode === 'system';

    const fileInputRef = useRef(null);
    const [uploadedFileName, setUploadedFileName] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);

    // Escape key listener for accessible drawer closing
    useEffect(() => {
        if (!onClose) return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const textMuted = isSystem ? "text-purple-300/70" : (isLight ? "text-slate-500" : "text-slate-400");
    const textDefault = isSystem ? "text-slate-100" : (isLight ? "text-slate-700" : "text-slate-200");
    const hoverBg = isSystem ? "hover:bg-[#7c00ff]/15 hover:text-[#c084fc]" : (isLight ? "hover:bg-slate-100/80" : "hover:bg-slate-800/60");
    const activeBg = isSystem 
        ? "bg-[#7c00ff]/20 border-[#7c00ff]/40 text-[#c084fc] shadow-[0_0_12px_rgba(124,0,255,0.35)]" 
        : (isLight 
            ? "bg-blue-50/90 border-blue-200/90 text-blue-700 shadow-xs" 
            : "bg-blue-600/15 border-blue-500/30 text-blue-400 shadow-xs");

    // Dynamic visibility classes depending on whether the sidebar is pinned or collapsible on hover
    const labelClasses = isPinned
        ? "opacity-100 max-w-[160px] ml-2.5"
        : "opacity-100 max-w-[160px] ml-2.5 lg:opacity-0 lg:max-w-0 lg:ml-0 lg:group-hover:opacity-100 lg:group-hover:max-w-[160px] lg:group-hover:ml-2.5";

    const headerClasses = isPinned
        ? "opacity-100 max-w-[200px]"
        : "opacity-100 max-w-[200px] lg:opacity-0 lg:max-w-0 lg:group-hover:opacity-100 lg:group-hover:max-w-[200px]";

    const deleteBtnClasses = isPinned
        ? "opacity-100"
        : "opacity-100 lg:opacity-0 lg:group-hover:opacity-100";

    const handleFileChange = async (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        setUploadedFileName(file.name);
        setIsUploading(true);
        if (setTerminalLogs) {
            setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Uploading ${file.name}...` }]);
            setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] AI is extracting data. This may take 5-10 seconds...` }]);
        }

        try {
            const data = await uploadAndParseResume(file, activePage);
            if (setTerminalLogs) {
                setTerminalLogs(prev => [...prev, { type: "success", text: `[SUCCESS] AI parsed ${data.wordCount || 'data'} successfully.` }]);
            }
            if (onResumeParsed && data) onResumeParsed(data);
        } catch (error) {
            const errorMsg = error.error || error.message || "Network error. Make sure your Django backend is running.";
            if (setTerminalLogs) {
                setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] ${errorMsg}` }]);
            }
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    // Quality checklist computation
    const hasHero = sections.some(s => s.section_type === 'hero');
    const hasAbout = sections.some(s => s.section_type === 'about');
    const hasProjects = sections.some(s => s.section_type === 'projects_grid');
    const hasContact = sections.some(s => s.section_type === 'contact');
    const passedCount = [hasHero, hasAbout, hasProjects, hasContact].filter(Boolean).length;
    const totalCount = 4;
    const allPassed = passedCount === totalCount;

    const currentThemeId = activeTheme || 'modern_glass';
    const currentThemeData = PORTFOLIO_THEMES && PORTFOLIO_THEMES[currentThemeId];
    const currentThemeName = (currentThemeData && currentThemeData.name) || "Modern Glass";

    return ( 
        <div className="h-full w-full flex flex-col justify-between py-3 px-2 lg:px-2.5 bg-transparent select-none overflow-y-auto custom-scrollbar overflow-x-hidden relative">
            <div className="space-y-4">
                
                {/* 1. MOBILE DRAWER TOP HEADER (Visible only on < lg) */}
                <div className="flex lg:hidden items-center justify-between pb-3 mb-2 border-b border-slate-700/40 px-1">
                    <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center border ${
                            isSystem ? 'border-[#7c00ff]/40 shadow-[0_0_10px_rgba(124,0,255,0.4)]' : 'border-slate-700'
                        }`}>
                            <img src="/logo.svg" alt="AuraBuild Logo" className="w-full h-full object-cover" />
                        </div>
                        <span className={`text-sm font-black font-sora tracking-tight ${isSystem ? 'text-white' : (isLight ? 'text-slate-900' : 'text-slate-100')}`}>
                            Studio Menu
                        </span>
                    </div>
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isSystem ? 'text-purple-300 hover:text-white hover:bg-[#7c00ff]/20' : (isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-white/10')
                            }`}
                            aria-label="Close navigation drawer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* 2. DESKTOP HEADER & PIN TOGGLE (Hidden on Mobile) */}
                <div className={`hidden lg:flex items-center pb-2.5 mb-1 border-b transition-all duration-300 ${
                    isSystem ? 'border-[#7c00ff]/25' : (isLight ? 'border-slate-200/80' : 'border-white/10')
                } ${isPinned ? 'justify-between px-1' : 'justify-center lg:group-hover:justify-between px-1'}`}>
                    <div className={`flex items-center gap-1.5 overflow-hidden transition-all duration-300 ${headerClasses}`}>
                        <span className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${isSystem ? 'text-purple-200' : (isLight ? 'text-slate-600' : 'text-slate-300')}`}>
                            Navigation
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onTogglePin}
                        title={isPinned ? "Unpin sidebar (collapse to rail on leave)" : "Pin sidebar (keep stably open)"}
                        className={`p-1.5 rounded-lg transition-all duration-200 flex items-center justify-center shrink-0 cursor-pointer ${
                            isPinned 
                                ? (isSystem 
                                    ? 'bg-[#7c00ff]/25 text-[#c084fc] border border-[#7c00ff]/50 hover:bg-[#7c00ff]/35 shadow-[0_0_12px_rgba(124,0,255,0.35)]' 
                                    : (isLight ? 'bg-blue-100/80 text-blue-700 border border-blue-300 hover:bg-blue-200 shadow-xs' : 'bg-blue-500/25 text-blue-400 border border-blue-500/40 hover:bg-blue-500/35 shadow-xs')) 
                                : (isSystem ? 'text-purple-300/60 hover:text-purple-100 hover:bg-[#7c00ff]/20' : (isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-white/10'))
                        }`}
                        aria-label={isPinned ? "Unpin sidebar" : "Pin sidebar"}
                    >
                        {isPinned ? (
                            <Pin className={`w-3.5 h-3.5 rotate-45 transition-transform ${isSystem ? 'text-[#c084fc] fill-[#7c00ff]/40' : 'text-blue-600 dark:text-blue-400 fill-blue-500/30'}`} />
                        ) : (
                            <PinOff className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                        )}
                    </button>
                </div>

                {/* 3. MOBILE STUDIO QUICK CONTROLS: Undo/Redo, Theme, Checklist (Mobile only) */}
                <div className="lg:hidden space-y-2.5 pb-2 border-b border-slate-700/40">
                    <div className="flex items-center justify-between gap-2">
                        {/* Undo & Redo */}
                        <div className={`flex items-center gap-1 p-1 rounded-xl border ${
                            isSystem ? 'border-[#7c00ff]/30 bg-[#0e0720]/80' : 'border-slate-800 bg-slate-900/60'
                        }`}>
                            <button
                                type="button"
                                onClick={onUndo}
                                disabled={!canUndo}
                                className={`p-2 rounded-lg transition-all ${
                                    !canUndo ? 'opacity-30 cursor-not-allowed text-slate-500' : 'text-slate-200 hover:text-white hover:bg-white/10 cursor-pointer'
                                }`}
                                title="Undo"
                                aria-label="Undo"
                            >
                                <Undo2 className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={onRedo}
                                disabled={!canRedo}
                                className={`p-2 rounded-lg transition-all ${
                                    !canRedo ? 'opacity-30 cursor-not-allowed text-slate-500' : 'text-slate-200 hover:text-white hover:bg-white/10 cursor-pointer'
                                }`}
                                title="Redo"
                                aria-label="Redo"
                            >
                                <Redo2 className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Checklist Status */}
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                            allPassed 
                                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' 
                                : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                        }`}>
                            {allPassed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-400" />}
                            <span>Checklist {passedCount}/{totalCount}</span>
                        </div>
                    </div>

                    {/* Theme Picker Dropdown for Mobile Drawer */}
                    {PORTFOLIO_THEMES && onThemeChange && (
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsThemePickerOpen(!isThemePickerOpen)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                                    isSystem ? 'bg-[#0e0720]/80 border-[#7c00ff]/30 text-purple-200' : 'bg-slate-900/80 border-slate-700/60 text-slate-200'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Palette className="w-4 h-4 text-blue-400" />
                                    <span>Theme: {currentThemeName.replace(/^\d+\.\s*/, '')}</span>
                                </div>
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isThemePickerOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isThemePickerOpen && (
                                <div className="mt-1.5 rounded-xl border border-slate-700 bg-slate-900/95 backdrop-blur-2xl shadow-xl max-h-48 overflow-y-auto p-1.5 custom-scrollbar">
                                    {Object.entries(PORTFOLIO_THEMES).map(([tKey, tOpt]) => (
                                        <button
                                            key={tKey}
                                            type="button"
                                            onClick={() => {
                                                onThemeChange(tKey);
                                                setIsThemePickerOpen(false);
                                            }}
                                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                                                currentThemeId === tKey 
                                                    ? 'bg-blue-600/30 text-blue-400 font-bold' 
                                                    : 'text-slate-300 hover:bg-white/10'
                                            }`}
                                        >
                                            <span>{tOpt.name.replace(/^\d+\.\s*/, '')}</span>
                                            {currentThemeId === tKey && <Check className="w-3.5 h-3.5 text-blue-400" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 4. CANVAS / HOME BUTTON */}
                <div>
                    <button
                        type="button"
                        onClick={() => {
                            if (onSelectTool) onSelectTool(null);
                            if (onClose && window.innerWidth < 1024) onClose();
                        }}
                        className={`w-full flex items-center px-2 py-2 rounded-xl text-xs font-semibold transition-all text-left border cursor-pointer ${
                            !activeTool 
                                ? activeBg 
                                : `border-transparent ${textMuted} ${hoverBg} hover:${textDefault}`
                        }`}
                        title="Main Portfolio Canvas"
                    >
                        <span className="shrink-0 w-6 h-6 rounded-lg flex justify-center items-center">
                            <LayoutDashboard className={`w-4 h-4 ${!activeTool ? (isSystem ? 'text-[#c084fc]' : 'text-blue-500') : (isSystem ? 'text-purple-300/60' : 'text-slate-400')}`} />
                        </span>
                        <span className={`truncate whitespace-nowrap transition-all duration-300 ${labelClasses}`}>
                            Canvas Editor
                        </span>
                    </button>
                </div>

                {/* 5. PAGES NAVIGATION */}
                <div>
                    <div className={`flex items-center justify-between mb-2 px-1 overflow-hidden transition-all duration-300 ${headerClasses}`}>
                        <span className={`text-[10px] uppercase font-bold tracking-wider whitespace-nowrap ${textMuted}`}> 
                            Pages 
                        </span> 
                        <button 
                            onClick={() => onAddPage && onAddPage("New Page")} 
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer px-1 py-0.5 rounded ${
                                isSystem 
                                    ? 'text-[#c084fc] hover:text-[#d8b4fe] hover:bg-[#7c00ff]/20' 
                                    : 'text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30'
                            }`} 
                            type="button"
                            title="Add new page"
                        >
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                        </button> 
                    </div> 
                    <div className="space-y-1"> 
                        {pages && pages.map((page, index) => {
                            const pageName = typeof page === "object" ? page.name : page;
                            const uniqueKey = typeof page === "object" && page.id ? "page-" + page.id : "page-idx-" + index;
                            const isCurrent = activePage === pageName && !activeTool;

                            return ( 
                                <button 
                                    key={uniqueKey}
                                    title={pageName}
                                    type="button" 
                                    aria-current={isCurrent ? "page" : undefined}
                                    onClick={() => {
                                        setActivePage(pageName);
                                        if (onSelectTool) onSelectTool(null);
                                        if (onClose && window.innerWidth < 1024) onClose();
                                    }}
                                    className={`w-full flex items-center px-2 py-2 rounded-xl text-xs font-semibold transition-all text-left border cursor-pointer ${
                                        isCurrent
                                            ? activeBg
                                            : `border-transparent ${textMuted} ${hoverBg} hover:${textDefault}`
                                    }`}
                                >
                                    <span className="shrink-0 w-6 h-6 rounded-lg flex justify-center items-center">
                                        <FileText className={`w-4 h-4 ${isCurrent ? (isSystem ? 'text-[#c084fc]' : 'text-blue-600 dark:text-blue-400') : (isSystem ? 'text-purple-300/60' : 'text-slate-400')}`} />
                                    </span>
                                    <span className={`truncate whitespace-nowrap transition-all duration-300 ${labelClasses}`}>
                                        {pageName}
                                    </span>
                                    {onDeletePage && (
                                        <span
                                            role="button"
                                            tabIndex={0}
                                            aria-label={`Delete page ${pageName}`}
                                            title="Delete page"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeletePage(pageName, page && page.id);
                                            }}
                                            className={`ml-auto shrink-0 p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-500/10 transition-colors cursor-pointer ${deleteBtnClasses}`}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 6. RESUME UPLOAD SECTION */}
                <div className="py-1">
                    <input 
                        type="file" 
                        accept=".pdf,.docx,.txt" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden" 
                    />
                    <button 
                        disabled={isUploading}
                        title="Upload Resume"
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                        className={`w-full flex items-center py-2.5 px-2 rounded-xl border border-dashed text-xs font-semibold transition-all overflow-hidden whitespace-nowrap cursor-pointer ${
                            isUploading 
                                ? (isSystem ? 'opacity-70 cursor-not-allowed bg-[#7c00ff]/10 border-[#7c00ff]/50 text-[#c084fc]' : 'opacity-70 cursor-not-allowed bg-blue-500/10 border-blue-500/50 text-blue-500')
                                : uploadedFileName 
                                    ? (isLight ? 'border-emerald-400 text-emerald-700 bg-emerald-50/80' : 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10')
                                    : (isSystem 
                                        ? 'border-[#7c00ff]/40 text-[#c084fc] hover:bg-[#7c00ff]/15 hover:border-[#7c00ff]/70 shadow-[0_0_10px_rgba(124,0,255,0.15)]' 
                                        : (isLight ? 'border-blue-300 text-blue-600 hover:bg-blue-50/70 hover:border-blue-400' : 'border-blue-500/40 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/70'))
                        }`}
                    >
                        {isUploading ? (
                            <>
                                <span className="shrink-0 w-6 h-6 flex justify-center items-center">
                                    <Loader2 className={`w-4 h-4 animate-spin ${isSystem ? 'text-[#c084fc]' : 'text-blue-500'}`} />
                                </span>
                                <span className={`transition-all duration-300 ${labelClasses}`}>Parsing...</span>
                            </>
                        ) : uploadedFileName ? (
                            <>
                                <span className="shrink-0 w-6 h-6 flex justify-center items-center">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                </span>
                                <span className={`truncate transition-all duration-300 ${isPinned ? 'opacity-100 max-w-[120px] ml-2.5' : 'opacity-100 max-w-[120px] ml-2.5 lg:opacity-0 lg:max-w-0 lg:ml-0 lg:group-hover:opacity-100 lg:group-hover:max-w-[120px] lg:group-hover:ml-2.5'}`}>{uploadedFileName}</span>
                            </>
                        ) : (
                            <>
                                <span className="shrink-0 w-6 h-6 flex justify-center items-center">
                                    <FileUp className={`w-4 h-4 ${isSystem ? 'text-[#c084fc]' : 'text-blue-500'}`} />
                                </span>
                                <span className={`transition-all duration-300 ${labelClasses}`}>Upload Resume</span>
                            </>
                        )}
                    </button>
                </div>

                {/* 7. AI TOOLS NAVIGATION (All 9 tools preserved) */}
                <div>
                    <div className={`text-[10px] uppercase font-bold tracking-wider mb-2 px-1 overflow-hidden whitespace-nowrap transition-all duration-300 ${headerClasses} ${textMuted}`}>
                        AI Studio Tools
                    </div>
                    <div className="space-y-1">
                        {AI_TOOLS_LIST.map((tool) => {
                            const IconComponent = tool.icon;
                            const isSelected = activeTool === tool.id;

                            return (
                                <button
                                    key={tool.id}
                                    type="button"
                                    title={tool.name}
                                    aria-label={`Open ${tool.name} tool`}
                                    aria-pressed={isSelected}
                                    onClick={() => {
                                        if (onSelectTool) onSelectTool(tool.id);
                                        if (onClose && window.innerWidth < 1024) onClose();
                                    }}
                                    className={`w-full flex items-center px-2 py-2 rounded-xl text-xs font-semibold transition-all text-left border cursor-pointer ${
                                        isSelected
                                            ? (isSystem 
                                                ? "bg-[#7c00ff] text-white font-bold shadow-[0_0_16px_rgba(124,0,255,0.6)] border-[#7c00ff]" 
                                                : "bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20 border-blue-600")
                                            : `border-transparent ${textMuted} ${hoverBg} hover:${textDefault}`
                                    }`}
                                >
                                    <span className="shrink-0 w-6 h-6 rounded-lg flex justify-center items-center">
                                        <IconComponent className={`w-4 h-4 ${isSelected ? 'text-white' : (isSystem ? 'text-purple-300/70' : 'text-slate-400')}`} />
                                    </span>
                                    <span className={`truncate whitespace-nowrap transition-all duration-300 ${labelClasses}`}>
                                        {tool.name}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 8. ACCOUNT & SUPPORT CONTROLS (Mobile Drawer section) */}
                <div className="lg:hidden pt-2 border-t border-slate-700/40 space-y-1">
                    <div className={`text-[10px] uppercase font-bold tracking-wider mb-1 px-1 ${textMuted}`}>
                        Account & Help
                    </div>
                    {onHelpClick && (
                        <button
                            type="button"
                            onClick={() => {
                                onHelpClick();
                                if (onClose) onClose();
                            }}
                            className={`w-full flex items-center px-2 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer`}
                        >
                            <span className="shrink-0 w-6 h-6 rounded-lg flex justify-center items-center">
                                <HelpCircle className="w-4 h-4 text-slate-400" />
                            </span>
                            <span className="ml-2.5">Help & Documentation</span>
                        </button>
                    )}
                    {onOpenSettings && (
                        <button
                            type="button"
                            onClick={() => {
                                onOpenSettings();
                                if (onClose) onClose();
                            }}
                            className={`w-full flex items-center px-2 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer`}
                        >
                            <span className="shrink-0 w-6 h-6 rounded-lg flex justify-center items-center">
                                <Settings className="w-4 h-4 text-slate-400" />
                            </span>
                            <span className="ml-2.5">Studio Settings</span>
                        </button>
                    )}
                    {onLogout && (
                        <button
                            type="button"
                            onClick={() => {
                                onLogout();
                                if (onClose) onClose();
                            }}
                            className={`w-full flex items-center px-2 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left cursor-pointer`}
                        >
                            <span className="shrink-0 w-6 h-6 rounded-lg flex justify-center items-center">
                                <LogOut className="w-4 h-4 text-red-400" />
                            </span>
                            <span className="ml-2.5">Sign Out</span>
                        </button>
                    )}
                </div>
            </div>

            {/* 9. PINNED MOBILE PREVIEW PORTFOLIO BUTTON (Prominent, separate from top navbar) */}
            <div className="lg:hidden sticky bottom-0 pt-3 pb-1 mt-3 border-t border-slate-700/60 bg-slate-950/90 backdrop-blur-xl shrink-0 z-20">
                <button
                    type="button"
                    onClick={() => {
                        if (onTogglePreview) onTogglePreview();
                        if (onClose) onClose();
                    }}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-95 border border-blue-400/30"
                    aria-label="Preview Portfolio"
                >
                    <Eye className="w-4 h-4 text-white animate-pulse" />
                    <span>Preview Portfolio</span>
                </button>
            </div>

            {/* 10. DESKTOP BOTTOM BAR: Settings & Version attached to the bottom */}
            <div className={`hidden lg:flex mt-auto border-t pt-3 items-center transition-all duration-300 ${isSystem ? 'border-[#7c00ff]/25' : (isLight ? 'border-slate-200' : 'border-slate-800')} ${isPinned ? 'justify-between px-1' : 'justify-center lg:group-hover:justify-between px-1'}`}>
                <div className={`flex items-center gap-1.5 overflow-hidden transition-all duration-300 pl-1 ${headerClasses}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span className={`text-[10px] font-medium tracking-wide whitespace-nowrap ${isSystem ? 'text-purple-200/70' : (isLight ? 'text-slate-500' : 'text-slate-400')}`}>
                        AuraBuild v1.0.0
                    </span>
                </div>
                
                <button
                    onClick={onOpenSettings}
                    className={`p-2 rounded-xl transition-all shadow-xs cursor-pointer focus-visible:ring-2 ${
                        isSystem 
                            ? 'text-[#c084fc] bg-[#7c00ff]/20 border border-[#7c00ff]/40 hover:bg-[#7c00ff]/35 hover:text-white shadow-[0_0_12px_rgba(124,0,255,0.35)] focus-visible:ring-[#7c00ff]' 
                            : (isLight 
                                ? 'text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-blue-500' 
                                : 'text-slate-400 bg-slate-900/60 border border-slate-800 hover:bg-slate-800 hover:text-slate-100 focus-visible:ring-blue-500')
                    }`}
                    title="Account Settings"
                    aria-label="Account Settings"
                >
                    <Settings className="w-4 h-4 shrink-0" />
                </button>
            </div>
        </div>
    );
}

export default memo(LeftSidebar);