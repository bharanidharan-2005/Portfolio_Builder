import { Sparkles, ArrowRight } from 'lucide-react';

export default function GradientAuroraGlass({ d }) {
    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white flex items-center justify-center px-6 py-14">
            <div className="pointer-events-none absolute -top-32 -left-24 w-96 h-96 rounded-full bg-indigo-600/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -right-24 w-96 h-96 rounded-full bg-cyan-500/25 blur-3xl" />

            <div className="relative z-10 max-w-5xl w-full rounded-3xl border border-white/15 bg-white/[0.06] backdrop-blur-xl p-8 sm:p-12 shadow-2xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-7 space-y-5">
                    <span className="inline-flex items-center gap-2 rounded-full border border-indigo-300/30 bg-indigo-500/15 px-3.5 py-1 text-xs font-semibold text-indigo-200">
                        <Sparkles className="w-3.5 h-3.5" />
                        Interactive Portfolio
                    </span>
                    <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight">
                        {d.name}
                    </h1>
                    <p className="text-lg sm:text-xl font-medium text-cyan-200">
                        {d.headline}
                    </p>
                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                        {d.bio}
                    </p>
                    <div className="pt-2">
                        <button
                            onClick={d.onVisualize}
                            className="inline-flex items-center gap-2.5 rounded-xl bg-white text-slate-950 hover:bg-indigo-100 px-6 py-3.5 text-sm font-semibold transition-colors cursor-pointer"
                        >
                            <span>View Projects & Experience</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="md:col-span-5 flex justify-center">
                    <div className="w-56 h-72 sm:w-64 sm:h-80 rounded-2xl overflow-hidden border border-white/20 shadow-xl bg-slate-900">
                        <img
                            src={d.roleImage}
                            alt={d.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

