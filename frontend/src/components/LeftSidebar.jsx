import { useRef, useState } from "react";
import { FileText, CheckCircle2, Loader2, Settings } from "lucide-react"; // Added Settings icon
import { uploadAndParseResume } from "../utils/aiUtils";

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
    onOpenSettings // NEW PROP added here
}) {
    const isLight = themeMode === 'light';

    const fileInputRef = useRef(null);
    const [uploadedFileName, setUploadedFileName] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const textMuted = isLight ? "text-slate-500" : "text-slate-400";
    const textDefault = isLight ? "text-slate-700" : "text-slate-200";
    const hoverBg = isLight ? "hover:bg-slate-100" : "hover:bg-slate-800";
    const activeBg = isLight ? "bg-blue-50 border border-blue-200 text-blue-700 shadow-sm" : "bg-blue-900/20 border border-blue-500/30 text-white shadow-sm glow-neon";

    const handleFileChange = async(event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        setUploadedFileName(file.name);
        setIsUploading(true);
        setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Uploading ${file.name}...` }]);
        setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] AI is extracting data. This may take 5-10 seconds...` }]);

        try {
            const data = await uploadAndParseResume(file, activePage);
            setTerminalLogs(prev => [...prev, { type: "success", text: `[SUCCESS] AI parsed ${data.wordCount || 'data'} successfully.` }]);
            if (onResumeParsed && data.data) onResumeParsed(data.data);
        } catch (error) {
            const errorMsg = error.error || error.message || "Network error. Make sure your Django backend is running.";
            setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] ${errorMsg}` }]);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return ( 
        <div className="h-full w-full flex flex-col justify-between py-4 px-2 lg:px-3 bg-transparent select-none overflow-y-auto custom-scrollbar overflow-x-hidden">
            <div className="space-y-6">
                
                {/* PAGES NAVIGATION */}
                <div>
                    <div className="flex items-center justify-between mb-2.5 px-1 overflow-hidden transition-all duration-300 opacity-100 max-w-[200px] lg:opacity-0 lg:max-w-0 lg:group-hover:opacity-100 lg:group-hover:max-w-[200px]">
                        <span className={`text-[10px] uppercase font-black tracking-wider whitespace-nowrap ${textMuted}`}> Pages </span> 
                        <button onClick={() => onAddPage && onAddPage("New Page")} className="text-[10px] font-bold text-blue-600 hover:text-blue-500 transition-colors whitespace-nowrap" type="button">
                            +Add 
                        </button> 
                    </div> 
                    <div className="space-y-1"> 
                        {pages && pages.map((page, index) => {
                            const pageName = typeof page === "object" ? page.name : page;
                            const uniqueKey = typeof page === "object" && page.id ? "page-" + page.id : "page-idx-" + index;

                            return ( 
                                <button 
                                    key={uniqueKey}
                                    title={pageName}
                                    type="button" 
                                    aria-current={activePage === pageName && !activeTool ? "page" : undefined}
                                    onClick={() => {
                                        setActivePage(pageName);
                                        if (onSelectTool) onSelectTool(null);
                                    }}
                                    className={`w-full flex items-center px-2 py-2.5 rounded-xl text-xs font-semibold transition-all text-left border ${
                                        activePage === pageName && !activeTool
                                            ? activeBg
                                            : `border-transparent ${textMuted} ${hoverBg} hover:${textDefault}`
                                    }`}
                                >
                                    <span className="shrink-0 w-6 flex justify-center items-center text-sm">📄</span>
                                    <span className="truncate whitespace-nowrap transition-all duration-300 opacity-100 max-w-[150px] ml-2 lg:opacity-0 lg:max-w-0 lg:ml-0 lg:group-hover:opacity-100 lg:group-hover:max-w-[150px] lg:group-hover:ml-2">
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
                                            className="ml-auto shrink-0 text-slate-400 hover:text-red-500 text-[11px] px-1 rounded hover:bg-red-500/10 transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                                        >
                                            🗑️
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* RESUME UPLOAD SECTION */}
                <div className="py-2">
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
                        className={`w-full flex items-center justify-center py-3 rounded-xl border border-dashed text-xs font-bold transition-all overflow-hidden whitespace-nowrap ${
                            isUploading 
                                ? 'opacity-70 cursor-not-allowed bg-blue-500/10 border-blue-500/50 text-blue-500'
                                : uploadedFileName 
                                    ? (isLight ? 'border-emerald-400 text-emerald-600 bg-emerald-50' : 'border-emerald-500 text-emerald-400 bg-emerald-500/10')
                                    : (isLight ? 'border-blue-400 text-blue-600 hover:bg-blue-50' : 'border-blue-500/50 text-blue-400 hover:bg-blue-500/10')
                        }`}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                                <span className="transition-all duration-300 opacity-100 max-w-[150px] ml-2 lg:opacity-0 lg:max-w-0 lg:ml-0 lg:group-hover:opacity-100 lg:group-hover:max-w-[150px] lg:group-hover:ml-2">Parsing...</span>
                            </>
                        ) : uploadedFileName ? (
                            <>
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                <span className="truncate transition-all duration-300 opacity-100 max-w-[100px] ml-2 lg:opacity-0 lg:max-w-0 lg:ml-0 lg:group-hover:opacity-100 lg:group-hover:max-w-[100px] lg:group-hover:ml-2">{uploadedFileName}</span>
                            </>
                        ) : (
                            <>
                                <FileText className="w-4 h-4 shrink-0" />
                                <span className="transition-all duration-300 opacity-100 max-w-[150px] ml-2 lg:opacity-0 lg:max-w-0 lg:ml-0 lg:group-hover:opacity-100 lg:group-hover:max-w-[150px] lg:group-hover:ml-2">Upload Resume</span>
                            </>
                        )}
                    </button>
                </div>

                {/* AI TOOLS NAVIGATION */}
                <div>
                    <div className={`text-[10px] uppercase font-black tracking-wider mb-2.5 px-1 overflow-hidden whitespace-nowrap transition-all duration-300 opacity-100 max-w-[200px] lg:opacity-0 lg:max-w-0 lg:group-hover:opacity-100 lg:group-hover:max-w-[200px] ${textMuted}`}>
                        AI Tools
                    </div>
                    <div className="space-y-1">
                        {[
                            { id: "generator", icon: "✨", name: "Content Generator" },
                            { id: "matcher", icon: "🎯", name: "Target Role Matcher" },
                            { id: "impact", icon: "🚀", name: "Impact Quantifier" },
                            { id: "palette", icon: "🎨", name: "Palette Studio" },
                            { id: "image", icon: "🖼️", name: "Image Customizer" },
                            { id: "seo_pitch", icon: "✉️", name: "SEO & Cold Pitch" },
                            { id: "export", icon: "</>", name: "Code Export" },
                        ].map((tool) => (
                            <button
                                key={tool.id}
                                type="button"
                                title={tool.name}
                                aria-label={`Open ${tool.name} tool`}
                                aria-pressed={activeTool === tool.id}
                                onClick={() => onSelectTool && onSelectTool(tool.id)}
                                className={`w-full flex items-center px-2 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                                    activeTool === tool.id
                                        ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20"
                                        : `${textMuted} ${hoverBg} hover:${textDefault}`
                                }`}
                            >
                                <span className="shrink-0 w-6 flex justify-center items-center text-sm">{tool.icon}</span>
                                <span className="truncate whitespace-nowrap transition-all duration-300 opacity-100 max-w-[150px] ml-2 lg:opacity-0 lg:max-w-0 lg:ml-0 lg:group-hover:opacity-100 lg:group-hover:max-w-[150px] lg:group-hover:ml-2">
                                    {tool.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* NEW: Settings Button attached to the bottom */}
            <div className={`mt-auto border-t pt-3 flex items-center justify-center lg:justify-between transition-all duration-300 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                <span className={`text-[10px] font-medium tracking-wide whitespace-nowrap overflow-hidden transition-all duration-300 opacity-100 max-w-[150px] lg:opacity-0 lg:max-w-0 lg:group-hover:opacity-100 lg:group-hover:max-w-[150px] pl-1 ${isLight ? 'text-slate-400' : 'text-slate-600'}`}>
                    AuraBuild v1.0.0
                </span>
                
                <button
                    onClick={onOpenSettings}
                    className={`p-2 rounded-xl transition-all shadow-sm ${isLight ? 'text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-900' : 'text-slate-400 bg-slate-900/50 border border-slate-800 hover:bg-slate-800 hover:text-slate-100'}`}
                    title="Account Settings"
                >
                    <Settings className="w-[18px] h-[18px] lg:w-4 lg:h-4 shrink-0" />
                </button>
            </div>
        </div>
    );
}