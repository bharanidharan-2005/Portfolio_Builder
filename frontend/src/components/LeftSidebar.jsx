import { useRef, useState } from "react";
import { 
    FileText, CheckCircle2, Loader2, Settings, Pin, PinOff, Plus, Trash2, 
    FileUp, Activity, Sparkles, Target, TrendingUp, Palette, Image, 
    Search, LayoutTemplate, FileCode 
} from "lucide-react";
import { uploadAndParseResume } from "../utils/aiUtils";

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

export default function LeftSidebar({
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
    onTogglePin
}) {
    const isLight = themeMode === 'light';

    const fileInputRef = useRef(null);
    const [uploadedFileName, setUploadedFileName] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const textMuted = isLight ? "text-slate-500" : "text-slate-400";
    const textDefault = isLight ? "text-slate-700" : "text-slate-200";
    const hoverBg = isLight ? "hover:bg-slate-100/80" : "hover:bg-slate-800/60";
    const activeBg = isLight 
        ? "bg-blue-50/90 border-blue-200/90 text-blue-700 shadow-xs" 
        : "bg-blue-600/15 border-blue-500/30 text-blue-400 shadow-xs";

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
        setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Uploading ${file.name}...` }]);
        setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] AI is extracting data. This may take 5-10 seconds...` }]);

        try {
            const data = await uploadAndParseResume(file, activePage);
            setTerminalLogs(prev => [...prev, { type: "success", text: `[SUCCESS] AI parsed ${data.wordCount || 'data'} successfully.` }]);
            if (onResumeParsed && data) onResumeParsed(data);
        } catch (error) {
            const errorMsg = error.error || error.message || "Network error. Make sure your Django backend is running.";
            setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] ${errorMsg}` }]);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return ( 
        <div className="h-full w-full flex flex-col justify-between py-3 px-2 lg:px-2.5 bg-transparent select-none overflow-y-auto custom-scrollbar overflow-x-hidden">
            <div className="space-y-4">
                
                {/* TOP HEADER & PIN TOGGLE */}
                <div className={`flex items-center pb-2.5 mb-1 border-b transition-all duration-300 ${
                    isLight ? 'border-slate-200/80' : 'border-white/10'
                } ${isPinned ? 'justify-between px-1' : 'justify-center lg:group-hover:justify-between px-1'}`}>
                    <div className={`flex items-center gap-1.5 overflow-hidden transition-all duration-300 ${headerClasses}`}>
                        <span className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                            Navigation
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onTogglePin}
                        title={isPinned ? "Unpin sidebar (collapse to rail on leave)" : "Pin sidebar (keep stably open)"}
                        className={`p-1.5 rounded-lg transition-all duration-200 flex items-center justify-center shrink-0 cursor-pointer ${
                            isPinned 
                                ? (isLight ? 'bg-blue-100/80 text-blue-700 border border-blue-300 hover:bg-blue-200 shadow-xs' : 'bg-blue-500/25 text-blue-400 border border-blue-500/40 hover:bg-blue-500/35 shadow-xs') 
                                : (isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-white/10')
                        }`}
                        aria-label={isPinned ? "Unpin sidebar" : "Pin sidebar"}
                    >
                        {isPinned ? (
                            <Pin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 fill-blue-500/30 rotate-45 transition-transform" />
                        ) : (
                            <PinOff className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                        )}
                    </button>
                </div>

                {/* PAGES NAVIGATION */}
                <div>
                    <div className={`flex items-center justify-between mb-2 px-1 overflow-hidden transition-all duration-300 ${headerClasses}`}>
                        <span className={`text-[10px] uppercase font-bold tracking-wider whitespace-nowrap ${textMuted}`}> 
                            Pages 
                        </span> 
                        <button 
                            onClick={() => onAddPage && onAddPage("New Page")} 
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors whitespace-nowrap cursor-pointer px-1 py-0.5 rounded hover:bg-blue-50 dark:hover:bg-blue-950/30" 
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
                                    }}
                                    className={`w-full flex items-center px-2 py-2 rounded-xl text-xs font-semibold transition-all text-left border cursor-pointer ${
                                        isCurrent
                                            ? activeBg
                                            : `border-transparent ${textMuted} ${hoverBg} hover:${textDefault}`
                                    }`}
                                >
                                    <span className="shrink-0 w-6 h-6 rounded-lg flex justify-center items-center">
                                        <FileText className={`w-4 h-4 ${isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
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

                {/* RESUME UPLOAD SECTION */}
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
                                ? 'opacity-70 cursor-not-allowed bg-blue-500/10 border-blue-500/50 text-blue-500'
                                : uploadedFileName 
                                    ? (isLight ? 'border-emerald-400 text-emerald-700 bg-emerald-50/80' : 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10')
                                    : (isLight ? 'border-blue-300 text-blue-600 hover:bg-blue-50/70 hover:border-blue-400' : 'border-blue-500/40 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/70')
                        }`}
                    >
                        {isUploading ? (
                            <>
                                <span className="shrink-0 w-6 h-6 flex justify-center items-center">
                                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
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
                                    <FileUp className="w-4 h-4 text-blue-500" />
                                </span>
                                <span className={`transition-all duration-300 ${labelClasses}`}>Upload Resume</span>
                            </>
                        )}
                    </button>
                </div>

                {/* AI TOOLS NAVIGATION */}
                <div>
                    <div className={`text-[10px] uppercase font-bold tracking-wider mb-2 px-1 overflow-hidden whitespace-nowrap transition-all duration-300 ${headerClasses} ${textMuted}`}>
                        AI Tools
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
                                    onClick={() => onSelectTool && onSelectTool(tool.id)}
                                    className={`w-full flex items-center px-2 py-2 rounded-xl text-xs font-semibold transition-all text-left border cursor-pointer ${
                                        isSelected
                                            ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20 border-blue-600"
                                            : `border-transparent ${textMuted} ${hoverBg} hover:${textDefault}`
                                    }`}
                                >
                                    <span className="shrink-0 w-6 h-6 rounded-lg flex justify-center items-center">
                                        <IconComponent className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                                    </span>
                                    <span className={`truncate whitespace-nowrap transition-all duration-300 ${labelClasses}`}>
                                        {tool.name}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Settings & Version attached to the bottom */}
            <div className={`mt-auto border-t pt-3 flex items-center transition-all duration-300 ${isLight ? 'border-slate-200' : 'border-slate-800'} ${isPinned ? 'justify-between px-1' : 'justify-center lg:group-hover:justify-between px-1'}`}>
                <div className={`flex items-center gap-1.5 overflow-hidden transition-all duration-300 pl-1 ${headerClasses}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span className={`text-[10px] font-medium tracking-wide whitespace-nowrap ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        AuraBuild v1.0.0
                    </span>
                </div>
                
                <button
                    onClick={onOpenSettings}
                    className={`p-2 rounded-xl transition-all shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        isLight 
                            ? 'text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-900' 
                            : 'text-slate-400 bg-slate-900/60 border border-slate-800 hover:bg-slate-800 hover:text-slate-100'
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