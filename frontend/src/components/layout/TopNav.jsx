import { useState, useRef, useEffect } from "react";
import { 
    Palette, ChevronDown, Check, Menu, 
    Settings2, HelpCircle, Eye, Undo2, Redo2, Rocket, CheckCircle2, AlertCircle,
    SlidersHorizontal
} from "lucide-react";
import { PORTFOLIO_THEMES } from "../../canvas/themes.js";

export function TopNav({ 
    onDeploy, theme, setTheme, activeTheme, onThemeChange, 
    onToggleLeft, onToggleRight, isRightOpen, userData, onLogout, onHelpClick,
    isPreviewMode, onTogglePreview, onUndo, canUndo, onRedo, canRedo,
    sections = []
}) {
    const isLight = theme === 'light';
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isChecklistOpen, setIsChecklistOpen] = useState(false);
    const dropdownRef = useRef(null);
    const checklistRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
            if (checklistRef.current && !checklistRef.current.contains(event.target)) {
                setIsChecklistOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const currentThemeId = activeTheme || 'modern_glass';
    const currentThemeData = PORTFOLIO_THEMES && PORTFOLIO_THEMES[currentThemeId];
    const currentThemeName = (currentThemeData && currentThemeData.name) || "Modern Glass";

    // --- Quality Checklist Logic ---
    const getQualityChecks = () => {
        const hasHero = sections.some(s => s.section_type === 'hero');
        const hasAbout = sections.some(s => s.section_type === 'about');
        const hasProjects = sections.some(s => s.section_type === 'projects_grid');
        const hasContact = sections.some(s => s.section_type === 'contact');
        
        const checks = [
            { label: "Hero Header & Introduction", passed: hasHero },
            { label: "About Me / Biography", passed: hasAbout },
            { label: "Projects / Portfolio Grid", passed: hasProjects },
            { label: "Contact Information", passed: hasContact }
        ];
        
        const passedCount = checks.filter(c => c.passed).length;
        return { checks, passedCount, totalCount: checks.length };
    };
    
    const { checks, passedCount, totalCount } = getQualityChecks();
    const allPassed = passedCount === totalCount;

    return ( 
        <div className={`flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-5 border-b w-full h-full transition-colors ${
            isLight ? 'bg-white border-slate-200/90 shadow-xs' : 'bg-[#0B0F19]/90 backdrop-blur-2xl border-slate-800/80'
        }`}>
            
            {/* 1. LEFT SECTION - Logo & Branding */}
            <div className="flex items-center gap-2 sm:gap-3">
                <button 
                    onClick={onToggleLeft} 
                    className={`lg:hidden p-1.5 rounded-lg transition-colors cursor-pointer ${isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800'}`}
                    aria-label="Toggle navigation menu"
                >
                    <Menu className="w-5 h-5" />
                </button> 
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden flex items-center justify-center shadow-xs border border-slate-200 dark:border-slate-800">
                    <img src="/logo.svg" alt="AuraBuild Logo" className="w-full h-full object-cover" />
                </div> 
                <div className="flex items-center gap-2">
                    <h1 className={`text-base font-sora font-extrabold tracking-tight hidden md:block ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                        AuraBuild 
                    </h1> 
                    <span className={`hidden xl:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                        isLight ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                        Studio
                    </span>
                </div>
            </div>

            {/* 2. CENTER SECTION - Global Canvas Controls (Checklist & Theme Selector) */}
            <div className="flex-1 flex items-center justify-center gap-2 sm:gap-3 max-w-xl">
                
                {/* Undo / Redo Toolbar */}
                {(onUndo || onRedo) && (
                    <div className="hidden lg:flex items-center gap-0.5 p-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50">
                        <button
                            type="button"
                            onClick={onUndo}
                            disabled={!canUndo}
                            className={`p-1.5 rounded-md transition-all ${
                                !canUndo 
                                    ? 'opacity-30 cursor-not-allowed text-slate-400' 
                                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 cursor-pointer shadow-xs'
                            }`}
                            title="Undo (Ctrl+Z)"
                            aria-label="Undo"
                        >
                            <Undo2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={onRedo}
                            disabled={!canRedo}
                            className={`p-1.5 rounded-md transition-all ${
                                !canRedo 
                                    ? 'opacity-30 cursor-not-allowed text-slate-400' 
                                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 cursor-pointer shadow-xs'
                            }`}
                            title="Redo (Ctrl+Y)"
                            aria-label="Redo"
                        >
                            <Redo2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}

                {/* Quality Checklist Button */}
                <div className="relative hidden md:block" ref={checklistRef}>
                    <button 
                        type="button" 
                        onClick={() => setIsChecklistOpen(!isChecklistOpen)} 
                        className={`flex items-center gap-2 border rounded-lg px-2.5 py-1.5 transition-all cursor-pointer ${
                            isLight 
                                ? 'bg-slate-50 border-slate-200/90 hover:bg-slate-100 hover:border-slate-300 text-slate-700' 
                                : 'bg-slate-900/70 border-slate-800 hover:bg-slate-800 text-slate-200'
                        }`}
                        aria-expanded={isChecklistOpen}
                        aria-haspopup="true"
                    >
                        {allPassed ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        ) : (
                            <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        )}
                        <span className="text-xs font-medium">
                            Checklist
                        </span>
                        <span className={`text-[10px] font-mono px-1 rounded ${
                            allPassed 
                                ? (isLight ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-emerald-950 text-emerald-300')
                                : (isLight ? 'bg-amber-100 text-amber-700 font-bold' : 'bg-amber-950 text-amber-300')
                        }`}>
                            {passedCount}/{totalCount}
                        </span>
                    </button>
                    
                    {isChecklistOpen && (
                        <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[270px] rounded-xl border shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
                            isLight ? 'bg-white border-slate-200' : 'bg-[#0F172A] border-slate-700/80'
                        }`}>
                            <div className={`p-3 border-b flex items-center justify-between ${isLight ? 'border-slate-100 bg-slate-50' : 'border-slate-800 bg-slate-900/60'}`}>
                                <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
                                    Portfolio Quality
                                </h3>
                                <span className="text-[11px] font-mono font-bold text-slate-400">
                                    {Math.round((passedCount / totalCount) * 100)}%
                                </span>
                            </div>
                            <div className="p-2 space-y-1">
                                {checks.map((check, i) => (
                                    <div key={i} className={`flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium transition-colors ${
                                        check.passed 
                                            ? (isLight ? 'text-slate-700 hover:bg-slate-50' : 'text-slate-300 hover:bg-slate-800/40') 
                                            : (isLight ? 'text-slate-400' : 'text-slate-500')
                                    }`}>
                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                                            check.passed 
                                                ? 'bg-emerald-500 text-white' 
                                                : (isLight ? 'border border-slate-300 bg-slate-100 text-transparent' : 'border border-slate-700 bg-slate-800 text-transparent')
                                        }`}>
                                            {check.passed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                        </div>
                                        <span className="truncate">{check.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Theme Selector Dropdown */}
                <div className="relative max-w-[170px] sm:max-w-[210px] w-full" ref={dropdownRef}>
                    <button 
                        type="button" 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                        className={`flex items-center justify-between gap-2 border rounded-lg px-2.5 py-1.5 w-full transition-all cursor-pointer ${
                            isLight 
                                ? 'bg-slate-50 border-slate-200/90 hover:bg-slate-100 hover:border-slate-300 text-slate-800' 
                                : 'bg-slate-900/70 border-slate-800 hover:bg-slate-800 text-slate-200'
                        }`}
                        aria-expanded={isDropdownOpen}
                        aria-haspopup="true"
                    >
                        <div className="flex items-center gap-2 overflow-hidden">
                            <Palette className={`h-3.5 w-3.5 shrink-0 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} /> 
                            <span className="text-xs font-medium truncate"> 
                                {currentThemeName.replace(/^\d+\.\s*/, '')} 
                            </span> 
                        </div> 
                        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''} ${isLight ? 'text-slate-400' : 'text-slate-500'}`} /> 
                    </button>

                    {isDropdownOpen && ( 
                        <div className={`absolute top-full left-0 sm:left-1/2 sm:-translate-x-1/2 mt-2 w-[220px] rounded-xl border shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
                            isLight ? 'bg-white border-slate-200' : 'bg-[#0F172A] border-slate-700/80'
                        }`}>
                            <div className="max-h-64 overflow-y-auto p-1 custom-scrollbar"> 
                                {PORTFOLIO_THEMES && Object.entries(PORTFOLIO_THEMES).map(([themeKey, themeOption]) => {
                                    const isSelected = currentThemeId === themeKey;
                                    return ( 
                                        <button 
                                            key={themeKey}
                                            type="button"
                                            onClick={() => {
                                                if (onThemeChange) onThemeChange(themeKey);
                                                setIsDropdownOpen(false);
                                            }}
                                            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left cursor-pointer ${
                                                isSelected
                                                    ? (isLight ? 'bg-blue-50 text-blue-700 font-bold' : 'bg-blue-600/20 text-blue-400 font-bold')
                                                    : (isLight ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800/60')
                                            }`} 
                                        >
                                            <span className="truncate">{themeOption.name.replace(/^\d+\.\s*/, '')}</span> 
                                            {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-blue-500" />} 
                                        </button>
                                    );
                                })} 
                            </div> 
                        </div>
                    )} 
                </div>
            </div>

            {/* 3. RIGHT SECTION - Actions & User Profile */}
            <div className="flex items-center gap-2 sm:gap-2.5"> 

                {/* Preview Mode Toggle */}
                <button 
                    type="button"
                    onClick={onTogglePreview}
                    className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer shadow-xs ${
                        isPreviewMode 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-600/20' 
                            : (isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300' : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white')
                    }`}
                    title="Toggle Portfolio Preview" 
                    aria-pressed={isPreviewMode}
                >
                    <Eye className="h-3.5 w-3.5" /> 
                    <span>Preview</span>
                </button>

                {/* Dominant Primary Action: Deploy */}
                <button 
                    type="button"
                    onClick={onDeploy}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer" 
                    title="Publish & deploy portfolio live"
                >
                    <Rocket className="h-3.5 w-3.5" /> 
                    <span>Deploy</span> 
                </button>

                {/* Help Button */}
                <button 
                    type="button"
                    onClick={onHelpClick}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer hidden md:block ${
                        isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                    title="How to use AuraBuild" 
                    aria-label="Help and guidance"
                >
                    <HelpCircle className="h-4 w-4" /> 
                </button>

                {/* USER PROFILE AVATAR */}
                <div className={`flex items-center gap-2 pl-2 border-l ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                    <span className={`text-xs font-semibold hidden xl:block truncate max-w-[120px] ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                        {userData?.name || "Developer"}
                    </span>
                    
                    <div 
                        className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-base rounded-full shadow-xs border ${
                            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'
                        }`}
                        title="Profile Settings"
                    >
                        {userData?.avatar || "👨‍💻"}
                    </div>
                </div>

                {/* Right Sidebar Studio Toggle */}
                <button 
                    type="button"
                    onClick={onToggleRight} 
                    title={isRightOpen ? "Hide Studio Panel" : "Show Studio Panel"}
                    className={`px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isRightOpen 
                            ? (isLight ? 'text-blue-700 bg-blue-50 border-blue-200 shadow-xs' : 'text-blue-400 bg-blue-500/20 border-blue-500/30 shadow-xs') 
                            : (isLight ? 'text-slate-600 hover:text-slate-900 bg-slate-50 border-slate-200 hover:bg-slate-100' : 'text-slate-400 hover:text-white bg-slate-900 border-slate-800 hover:bg-slate-800')
                    }`}
                    aria-label={isRightOpen ? "Collapse studio panel" : "Expand studio panel"}
                >
                    <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-xs font-semibold hidden sm:inline">Studio</span>
                </button> 
            </div> 
        </div>
    );
}