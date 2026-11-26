import { FileText, ArrowRight } from 'lucide-react';

export default function MinimalistResumeSheet({ d }) {
    return (
        <div className="min-h-screen bg-slate-100 text-slate-900 flex items-center justify-center px-4 sm:px-8 py-12">
            <div className="max-w-3xl w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-12 space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-200 pb-8">
                    <div className="flex items-center gap-5">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                            <img
                                src={d.roleImage}
                                alt={d.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-950">
                                {d.name}
                            </h1>
                            <p className="text-sm sm:text-base font-medium text-indigo-600 mt-1">
                                {d.headline}
                            </p>
                        </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 self-start rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        Curriculum Vitae
                    </span>
                </div>

                <div className="space-y-3">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        Executive Summary
                    </h2>
                    <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                        {d.bio}
                    </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                    <p className="text-xs text-slate-500">
                        Includes structured skills, projects, education & work history
                    </p>
                    <button
                        onClick={d.onVisualize}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 text-sm font-semibold transition-colors cursor-pointer"
                    >
                        <span>Open Full CV & Sections</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

