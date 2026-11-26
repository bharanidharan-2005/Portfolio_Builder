import { GraduationCap, ArrowRight } from 'lucide-react';

export default function ResearchAcademic({ d }) {
    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex items-center justify-center px-6 py-14">
            <div className="max-w-4xl w-full rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12">
                <div className="md:col-span-4 bg-slate-900 text-white p-8 flex flex-col justify-between gap-6">
                    <div className="space-y-4">
                        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-300">
                            <GraduationCap className="w-4 h-4" />
                            Academic & Research
                        </span>
                        <div className="w-28 h-28 rounded-xl overflow-hidden border border-white/15 bg-slate-800">
                            <img
                                src={d.roleImage}
                                alt={d.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                    <div className="text-xs text-slate-400 space-y-1">
                        <p className="font-semibold text-white">{d.name}</p>
                        <p>Scholarly Dossier & Publications</p>
                    </div>
                </div>

                <div className="md:col-span-8 p-8 sm:p-10 flex flex-col justify-between gap-6">
                    <div className="space-y-4">
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950">
                            {d.name}
                        </h1>
                        <p className="text-base sm:text-lg font-medium text-slate-700">
                            {d.headline}
                        </p>
                        <div className="h-px bg-slate-200" />
                        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                            {d.bio}
                        </p>
                    </div>

                    <div>
                        <button
                            onClick={d.onVisualize}
                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 text-sm font-semibold transition-colors cursor-pointer"
                        >
                            <span>View Research, Papers & Projects</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

