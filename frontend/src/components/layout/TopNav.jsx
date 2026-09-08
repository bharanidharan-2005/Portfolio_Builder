import { useState, useRef, useEffect } from "react";
import { 
    Zap, Shield, Moon, Sun, Palette, ChevronDown, Check, Menu, 
    Settings2, HelpCircle, Cloud, Eye 
} from "lucide-react";
import { PORTFOLIO_THEMES } from "../../canvas/themes.js";

export function TopNav({ 
    onDeploy, theme, setTheme, activeTheme, onThemeChange, 
    onToggleLeft, onToggleRight, userData, onLogout, onHelpClick,
    isPreviewMode, onTogglePreview 
}) {
    const isLight = theme === 'light';
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const currentThemeId = activeTheme || 'modern_glass';
    const currentThemeData = PORTFOLIO_THEMES && PORTFOLIO_THEMES[currentThemeId];
    const currentThemeName = (currentThemeData && currentThemeData.name) || "Modern Glass";

    return ( 
        <div className={`flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-2 sm:py-3 border-b w-full h-full transition-colors ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0B0C10] border-slate-800'}`}>
            
            {/* 1. LEFT SECTION - Logo & Mobile Menu */}
            <div className="flex items-center gap-2 sm:gap-3">
                <button onClick={onToggleLeft} className={`lg:hidden p-1.5 rounded-md transition-colors ${isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800'}`}>
                    <Menu className="w-5 h-5" />
                </button> 
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md">
                    <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                </div> 
                <h1 className={`text-base sm:text-lg font-bold tracking-tight hidden md:block ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
                    AuraBuild 
                </h1> 
            </div>

            {/* 2. CENTER SECTION - Global Canvas Settings (Theme & Save Status) */}
            <div className="flex-1 flex items-center justify-center gap-2 sm:gap-4">
                
                {/* Auto-Save Indicator */}
                <div className={`hidden lg:flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-full border ${isLight ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-emerald-900/20 border-emerald-800/50 text-emerald-400'}`}>
                    <Cloud className="w-3 h-3" />
                    <span>Saved</span>
                </div>

                {/* Theme Selector Dropdown */}
                <div className="relative max-w-[160px] sm:max-w-[200px] w-full" ref={dropdownRef}>
                    <button type="button" onClick={() => setIsDropdownOpen(!isDropdownOpen)} className={`flex items-center justify-between gap-2 border rounded-full px-3 py-1.5 w-full transition-all cursor-pointer ${isLight ? 'bg-slate-50 border-slate-200 hover:bg-slate-100' : 'bg-slate-900 border-slate-800 hover:bg-slate-800'}`}>
                        <div className="flex items-center gap-2 overflow-hidden">
                            <Palette className={`h-3.5 w-3.5 shrink-0 hidden sm:block ${isLight ? 'text-slate-500' : 'text-slate-400'}`} /> 
                            <span className={`text-[11px] sm:text-sm font-medium truncate ${isLight ? 'text-slate-700' : 'text-slate-200'}`}> 
                                {currentThemeName.replace(/^\d+\.\s*/, '')} 
                            </span> 
                        </div> 
                        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''} ${isLight ? 'text-slate-400' : 'text-slate-500'}`} /> 
                    </button>

                    {isDropdownOpen && ( 
                        <div className={`absolute top-full left-0 sm:left-1/2 sm:-translate-x-1/2 mt-2 w-[220px] rounded-xl border shadow-2xl z-50 overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'}`}>
                            <div className="max-h-64 overflow-y-auto py-1 custom-scrollbar"> 
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
                                            className={`w-full flex items-center justify-between px-3 py-2.5 text-[11px] sm:text-sm transition-colors text-left cursor-pointer ${
                                                isSelected
                                                    ? (isLight ? 'bg-blue-50 text-blue-700 font-bold' : 'bg-blue-900/40 text-blue-400 font-bold')
                                                    : (isLight ? 'text-slate-700 hover:bg-slate-50' : 'text-slate-300 hover:bg-slate-700/50')
                                            }`} 
                                        >
                                            <span className="truncate">{themeOption.name.replace(/^\d+\.\s*/, '')}</span> 
                                            {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />} 
                                        </button>
                                    );
                                })} 
                            </div> 
                        </div>
                    )} 
                </div>
            </div>

            {/* 3. RIGHT SECTION - Actions & User Profile */}
            <div className="flex items-center gap-1.5 sm:gap-2.5"> 
                
                {/* Highlighted Preview Mode Toggle */}
                <button 
                    type="button"
                    onClick={onTogglePreview}
                    className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border transition-all cursor-pointer shadow-sm ${
                        isPreviewMode 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-600/20' 
                            : (isLight ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100' : 'bg-indigo-900/30 border-indigo-700/50 text-indigo-400 hover:bg-indigo-900/50')
                    }`}
                    title="Toggle Preview Mode" 
                >
                    <Eye className="h-4 w-4" /> 
                    <span>Preview</span>
                </button>

                {/* Help Button */}
                <button 
                    type="button"
                    onClick={onHelpClick}
                    className={`p-1.5 sm:p-2 rounded-full transition-colors cursor-pointer hidden sm:block ${isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    title="How to use AuraBuild" 
                >
                    <HelpCircle className="h-4 w-4" /> 
                </button>

                {/* Theme Toggle Button */}
                <button 
                    type="button"
                    onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                    className={`p-1.5 sm:p-2 rounded-full transition-colors cursor-pointer hidden sm:block ${isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    title="Toggle UI Theme" 
                >
                    {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />} 
                </button>

                <div className={`hidden sm:block h-5 w-[1px] mx-1 ${isLight ? 'bg-slate-200' : 'bg-slate-700'}`}></div>

                {/* Deploy Button */}
                <button 
                    type="button"
                    onClick={onDeploy}
                    className="hidden sm:flex items-center px-4 py-1.5 text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md shadow-blue-600/20 transition-all cursor-pointer mr-1" 
                >
                    <Shield className="mr-1.5 h-3.5 w-3.5" /> Deploy 
                </button>

                {/* USER PROFILE AVATAR */}
                <div className={`flex items-center gap-2 pl-1.5 sm:pl-2 border-l ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                    {/* Developer Name (Hidden on small screens) */}
                    <span className={`text-sm font-bold hidden xl:block truncate max-w-[120px] ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                        {userData?.name || "Developer"}
                    </span>
                    
                    {/* Dynamic Avatar Badge */}
                    <div 
                        className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-lg sm:text-xl rounded-full shadow-sm border ${isLight ? 'bg-white border-slate-200' : 'bg-[#0B0C10] border-slate-700'}`}
                        title="Profile Settings (Open in Sidebar)"
                    >
                        {userData?.avatar || "🐱"}
                    </div>
                </div>

                {/* Mobile Right Sidebar Toggle */}
                <button onClick={onToggleRight} className={`lg:hidden ml-1 p-1.5 rounded-md transition-colors ${isLight ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' : 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/20'}`}>
                    <Settings2 className="w-5 h-5" />
                </button> 
            </div> 
        </div>
    );
}