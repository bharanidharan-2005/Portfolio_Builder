import React from 'react';
import { Settings, LayoutTemplate } from 'lucide-react';

export default function StructureBuilderTool(props) {
    const { 
        isLight, sections, activeSectionId, onAddSection
    } = props;

    const hasSections = sections && sections.length > 0;
    const isBlockSelected = hasSections && sections.some(s => s.id === activeSectionId);

    if (isBlockSelected) {
        return (
            <div className="flex flex-col items-center justify-center h-56 text-center px-6 animate-in fade-in zoom-in-95 duration-500 ease-out bg-slate-900/30 rounded-3xl border border-slate-800/50 shadow-inner">
                <div className="relative mb-5">
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse"></div>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center relative shadow-lg ${isLight ? 'bg-blue-50 border border-blue-100' : 'bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700'}`}>
                        <Settings className={`h-7 w-7 animate-[spin_4s_linear_infinite] ${isLight ? 'text-blue-500' : 'text-blue-400'}`} />
                    </div>
                </div>
                <h3 className={`text-sm font-black tracking-wide mb-2 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Block Selected</h3>
                <p className={`text-[11px] leading-relaxed max-w-[220px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Edit the text directly by clicking on it in the main canvas to the left.
                </p>
            </div>
        );
    }

    const quickInsertModules = [
        { label: "Hero Header", type: "hero", icon: "✨" },
        { label: "About Bio", type: "about", icon: "👤" },
        { label: "Experience", type: "experience", icon: "💼" },
        { label: "Education", type: "education", icon: "🎓" },
        { label: "Skills Map", type: "skills", icon: "⚡" },
        { label: "Project Grid", type: "projects_grid", icon: "🚀" },
        { label: "Services", type: "services", icon: "🛠️" },
        { label: "Testimonials", type: "testimonials", icon: "💬" },
        { label: "Certifications", type: "certifications", icon: "📜" },
        { label: "Key Stats", type: "stats", icon: "📊" },
        { label: "Blog", type: "blog", icon: "📝" },
        { label: "Contact Form", type: "contact", icon: "✉️" },
    ];

    return (
        <div className="flex-1 space-y-6 animate-in fade-in zoom-in-95 duration-500 ease-out">
            <div className="flex items-center gap-2 mb-4 border-b pb-4 border-slate-800/50">
                <LayoutTemplate className={`w-4 h-4 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} />
                <span className={`text-[11px] font-black uppercase tracking-widest ${isLight ? 'text-slate-800' : 'text-slate-200'}`}> Structure Builder </span>
            </div>

            <div className="space-y-4">
                <label className={`block text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}> Quick Insert Modules </label>
                <div className="grid grid-cols-2 gap-3">
                    {quickInsertModules.map(block => (
                        <button
                            key={block.type}
                            onClick={() => onAddSection && onAddSection(block.type)}
                            className={`p-5 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer group ${isLight ? 'bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-slate-700' : 'bg-[#15161D] border-slate-800 hover:border-blue-500 hover:bg-slate-800 text-slate-300 shadow-[0_4px_20px_rgba(0,0,0,0.1)]'}`}
                        >
                            <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{block.icon}</span>
                            <span className="text-[10px] font-bold tracking-wide">{block.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
