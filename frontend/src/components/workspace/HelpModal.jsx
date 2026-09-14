import { 
    X, Zap, Sparkles, Target, TrendingUp, 
    Palette, Image as ImageIcon, Share2, Code2, Layers, CheckCircle2
} from "lucide-react";

export default function HelpModal({ isOpen, onClose, isLight }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in p-4">
            <div className={`w-full max-w-3xl max-h-[85vh] flex flex-col rounded-3xl shadow-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-[#0D0E12] border-slate-800'}`}>
                
                {/* Header */}
                <div className={`shrink-0 p-6 border-b flex items-center justify-between ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-500">
                            <Zap className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className={`text-xl font-black tracking-tight ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
                                AuraBuild Studio & AI Tools Guide
                            </h2>
                            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                Learn why each tool exists and how to maximize your portfolio's impact.
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-full transition-colors cursor-pointer ${isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-slate-800 text-slate-400'}`}>
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                {/* Scrollable Content */}
                <div className={`flex-1 overflow-y-auto p-6 space-y-8 text-sm leading-relaxed custom-scrollbar ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    
                    {/* Section 1: AI Tools Breakdown */}
                    <div>
                        <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>
                            <Sparkles className="w-4 h-4" /> Specific AI Tools & Why They Are Used
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            <div className={`p-4 rounded-2xl border transition-all ${isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-900/50 border-slate-800/80'}`}>
                                <div className="flex items-center gap-2 font-bold text-sm mb-1.5 text-blue-500">
                                    <Sparkles className="w-4 h-4" /> Content Generator
                                </div>
                                <p className="text-xs leading-relaxed">
                                    <strong>Why Use It:</strong> Overcomes writer's block by automatically drafting recruiter-ready bios, engineering headlines, and project summaries directly from simple prompts or your target role.
                                </p>
                            </div>

                            <div className={`p-4 rounded-2xl border transition-all ${isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-900/50 border-slate-800/80'}`}>
                                <div className="flex items-center gap-2 font-bold text-sm mb-1.5 text-emerald-500">
                                    <Target className="w-4 h-4" /> Target Role Matcher
                                </div>
                                <p className="text-xs leading-relaxed">
                                    <strong>Why Use It:</strong> Scans target Job Descriptions (JDs) against your current portfolio data, calculates an ATS match score, and pinpoints exact missing technical keywords.
                                </p>
                            </div>

                            <div className={`p-4 rounded-2xl border transition-all ${isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-900/50 border-slate-800/80'}`}>
                                <div className="flex items-center gap-2 font-bold text-sm mb-1.5 text-orange-500">
                                    <TrendingUp className="w-4 h-4" /> Impact Quantifier
                                </div>
                                <p className="text-xs leading-relaxed">
                                    <strong>Why Use It:</strong> Transforms passive responsibility bullets into metric-driven power statements using the STAR method (Action Verb + Tech Stack + Measurable Outcome).
                                </p>
                            </div>

                            <div className={`p-4 rounded-2xl border transition-all ${isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-900/50 border-slate-800/80'}`}>
                                <div className="flex items-center gap-2 font-bold text-sm mb-1.5 text-purple-500">
                                    <Palette className="w-4 h-4" /> Palette Studio
                                </div>
                                <p className="text-xs leading-relaxed">
                                    <strong>Why Use It:</strong> Generates cohesive visual color schemes and theme moods instantly (e.g., Cyber Neon, Glassmorphism, Clean Minimal) without manual CSS tweaks.
                                </p>
                            </div>

                            <div className={`p-4 rounded-2xl border transition-all ${isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-900/50 border-slate-800/80'}`}>
                                <div className="flex items-center gap-2 font-bold text-sm mb-1.5 text-pink-500">
                                    <ImageIcon className="w-4 h-4" /> Image Customizer
                                </div>
                                <p className="text-xs leading-relaxed">
                                    <strong>Why Use It:</strong> Auto-crops, resizes, and frames headshots and project screenshots to guarantee seamless responsive display across mobile and tablet viewports.
                                </p>
                            </div>

                            <div className={`p-4 rounded-2xl border transition-all ${isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-900/50 border-slate-800/80'}`}>
                                <div className="flex items-center gap-2 font-bold text-sm mb-1.5 text-indigo-500">
                                    <Share2 className="w-4 h-4" /> SEO & Cold Pitch
                                </div>
                                <p className="text-xs leading-relaxed">
                                    <strong>Why Use It:</strong> Generates meta tags for social media previews and drafts personalized cold outreach emails/LinkedIn pitches to hiring managers.
                                </p>
                            </div>

                            <div className={`p-4 rounded-2xl border transition-all md:col-span-2 ${isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-900/50 border-slate-800/80'}`}>
                                <div className="flex items-center gap-2 font-bold text-sm mb-1.5 text-cyan-500">
                                    <Code2 className="w-4 h-4" /> Code Export Shell
                                </div>
                                <p className="text-xs leading-relaxed">
                                    <strong>Why Use It:</strong> Compiles your visual portfolio into production-ready React + Tailwind CSS source code, packaged in a ZIP download for custom self-hosting.
                                </p>
                            </div>

                        </div>
                    </div>

                    {/* Section 2: General Workflow Quick-Start */}
                    <div>
                        <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                            <Layers className="w-4 h-4" /> Core Studio Features
                        </h3>
                        <ul className="space-y-2 text-xs list-none">
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                <span><strong>Structure Builder:</strong> Click quick-insert modules in the Right Sidebar to manually snap sections (Hero, About, Projects) into place.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                <span><strong>Direct Inline Editing:</strong> Click any text right on the canvas to update content live without entering forms.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                <span><strong>Drag & Drop Reordering:</strong> Grab the hover drag handle (⋮⋮) on any section block to adjust layout order.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                <span><strong>One-Click Deployment:</strong> Push your site live to the cloud with an instant production URL.</span>
                            </li>
                        </ul>
                    </div>

                </div>

                {/* Footer */}
                <div className={`shrink-0 p-6 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                    <button onClick={onClose} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all shadow-md cursor-pointer">
                        Got It! Let's Build
                    </button>
                </div>
            </div>
        </div>
    );
}
