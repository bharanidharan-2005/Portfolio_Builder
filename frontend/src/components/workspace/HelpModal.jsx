import { 
    X, Zap, Sparkles, Target, TrendingUp, 
    Palette, Image as ImageIcon, Share2, Code2, Layers, CheckCircle2
} from "lucide-react";

export default function HelpModal({ isOpen, onClose, isLight }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in p-4">
            <div className={`w-full max-w-4xl max-h-[85vh] flex flex-col rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] border overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-[#0B0C10] border-slate-800'}`}>
                
                {/* Header */}
                <div className={`shrink-0 p-6 flex items-center justify-between border-b relative overflow-hidden ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#15161D] border-slate-800'}`}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/20">
                            <Zap className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className={`text-xl font-black tracking-tight ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
                                AuraBuild Studio & AI Tools Guide
                            </h2>
                            <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                Learn why each tool exists and how to maximize your portfolio's impact.
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-full transition-colors cursor-pointer relative z-10 ${isLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-slate-800 text-slate-400'}`}>
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                {/* Scrollable Content */}
                <div className={`flex-1 overflow-y-auto p-8 space-y-10 text-sm leading-relaxed custom-scrollbar ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    
                    {/* Section 1: AI Tools Breakdown */}
                    <div>
                        <h3 className={`text-xs font-black uppercase tracking-widest mb-5 flex items-center gap-2 ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>
                            <Sparkles className="w-4 h-4" /> The AI Engine
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            <div className={`p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isLight ? 'bg-white border-slate-200 hover:border-blue-400 shadow-sm' : 'bg-[#121319] border-slate-800/80 hover:border-blue-500/50'}`}>
                                <div className="flex items-center gap-3 font-bold text-sm mb-2 text-blue-500">
                                    <Sparkles className="w-5 h-5" /> Content Generator
                                </div>
                                <p className="text-xs leading-relaxed opacity-80">
                                    <strong>Why Use It:</strong> Overcomes writer's block by automatically drafting recruiter-ready bios, engineering headlines, and project summaries directly from simple prompts or your target role.
                                </p>
                            </div>

                            <div className={`p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isLight ? 'bg-white border-slate-200 hover:border-emerald-400 shadow-sm' : 'bg-[#121319] border-slate-800/80 hover:border-emerald-500/50'}`}>
                                <div className="flex items-center gap-3 font-bold text-sm mb-2 text-emerald-500">
                                    <Code2 className="w-5 h-5" /> GitHub Auto-Ingestion
                                </div>
                                <p className="text-xs leading-relaxed opacity-80">
                                    <strong>Why Use It:</strong> Connects to your GitHub profile to instantly fetch, analyze, and format your top repositories into a professional project grid using the STAR method.
                                </p>
                            </div>

                            <div className={`p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isLight ? 'bg-white border-slate-200 hover:border-orange-400 shadow-sm' : 'bg-[#121319] border-slate-800/80 hover:border-orange-500/50'}`}>
                                <div className="flex items-center gap-3 font-bold text-sm mb-2 text-orange-500">
                                    <TrendingUp className="w-5 h-5" /> Impact Quantifier
                                </div>
                                <p className="text-xs leading-relaxed opacity-80">
                                    <strong>Why Use It:</strong> Transforms passive responsibility bullets into metric-driven power statements using the STAR method (Action Verb + Tech Stack + Measurable Outcome).
                                </p>
                            </div>

                            <div className={`p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isLight ? 'bg-white border-slate-200 hover:border-purple-400 shadow-sm' : 'bg-[#121319] border-slate-800/80 hover:border-purple-500/50'}`}>
                                <div className="flex items-center gap-3 font-bold text-sm mb-2 text-purple-500">
                                    <Palette className="w-5 h-5" /> Palette Studio
                                </div>
                                <p className="text-xs leading-relaxed opacity-80">
                                    <strong>Why Use It:</strong> Gives you access to 20+ professional typography families (from Space Grotesk to JetBrains Mono) and instantly generates cohesive visual color schemes via AI prompts.
                                </p>
                            </div>

                            <div className={`p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isLight ? 'bg-white border-slate-200 hover:border-pink-400 shadow-sm' : 'bg-[#121319] border-slate-800/80 hover:border-pink-500/50'}`}>
                                <div className="flex items-center gap-3 font-bold text-sm mb-2 text-pink-500">
                                    <ImageIcon className="w-5 h-5" /> Image Customizer
                                </div>
                                <p className="text-xs leading-relaxed opacity-80">
                                    <strong>Why Use It:</strong> Auto-crops, resizes, and frames headshots and project screenshots to guarantee seamless responsive display across mobile and tablet viewports.
                                </p>
                            </div>

                            <div className={`p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isLight ? 'bg-white border-slate-200 hover:border-indigo-400 shadow-sm' : 'bg-[#121319] border-slate-800/80 hover:border-indigo-500/50'}`}>
                                <div className="flex items-center gap-3 font-bold text-sm mb-2 text-indigo-500">
                                    <Share2 className="w-5 h-5" /> SEO & Cold Pitch
                                </div>
                                <p className="text-xs leading-relaxed opacity-80">
                                    <strong>Why Use It:</strong> Generates meta tags for social media previews and drafts personalized cold outreach emails/LinkedIn pitches to hiring managers.
                                </p>
                            </div>

                            <div className={`p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg md:col-span-2 ${isLight ? 'bg-white border-slate-200 hover:border-cyan-400 shadow-sm' : 'bg-[#121319] border-slate-800/80 hover:border-cyan-500/50'}`}>
                                <div className="flex items-center gap-3 font-bold text-sm mb-2 text-cyan-500">
                                    <Code2 className="w-5 h-5" /> Code Export Shell
                                </div>
                                <p className="text-xs leading-relaxed opacity-80">
                                    <strong>Why Use It:</strong> Compiles your visual portfolio into production-ready React + Tailwind CSS source code, packaged in a ZIP download for custom self-hosting.
                                </p>
                            </div>

                        </div>
                    </div>

                    {/* Section 2: General Workflow Quick-Start */}
                    <div>
                        <h3 className={`text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                            <Layers className="w-4 h-4" /> Core Studio Features
                        </h3>
                        <div className={`p-6 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#121319] border-slate-800'}`}>
                            <ul className="space-y-4 text-xs list-none">
                                <li className="flex items-start gap-3">
                                    <div className="p-1 rounded-full bg-blue-500/20 text-blue-500 mt-0.5"><CheckCircle2 className="w-3 h-3" /></div>
                                    <span className="leading-relaxed"><strong>Structure Builder:</strong> Click quick-insert modules in the Right Sidebar to manually snap sections (Hero, About, Projects) into place exactly where you need them.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="p-1 rounded-full bg-blue-500/20 text-blue-500 mt-0.5"><CheckCircle2 className="w-3 h-3" /></div>
                                    <span className="leading-relaxed"><strong>Direct Inline Editing:</strong> Click any text right on the canvas to update content live without entering clunky forms.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="p-1 rounded-full bg-blue-500/20 text-blue-500 mt-0.5"><CheckCircle2 className="w-3 h-3" /></div>
                                    <span className="leading-relaxed"><strong>Drag & Drop Reordering:</strong> Grab the hover drag handle (⋮⋮) on any section block to adjust layout order dynamically.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="p-1 rounded-full bg-blue-500/20 text-blue-500 mt-0.5"><CheckCircle2 className="w-3 h-3" /></div>
                                    <span className="leading-relaxed"><strong>One-Click Deployment:</strong> Push your site live to the cloud with an instant production URL via Vercel integration.</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className={`shrink-0 p-6 border-t flex justify-end ${isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-[#15161D]'}`}>
                    <button onClick={onClose} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/30 cursor-pointer">
                        Got It! Let's Build
                    </button>
                </div>
            </div>
        </div>
    );
}
