import { Terminal, ChevronRight } from 'lucide-react';

export default function TerminalShell({ d }) {
    const slug = (d.name || 'developer').toLowerCase().replace(/[^a-z0-9]+/g, '-');

    return (
        <div className="min-h-screen bg-[#0b1016] text-emerald-300 font-mono flex items-center justify-center px-4 sm:px-8 py-12">
            <div className="w-full max-w-4xl rounded-xl border border-emerald-500/25 bg-[#101720] shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-[#151e29] border-b border-emerald-500/15">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                        <span className="w-3 h-3 rounded-full bg-amber-400/80" />
                        <span className="w-3 h-3 rounded-full bg-emerald-400/80" />
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{slug}@portfolio:~</span>
                    </div>
                    <span className="text-[11px] text-emerald-400/80">bash · utf-8</span>
                </div>

                <div className="p-6 sm:p-10 grid grid-cols-1 md:grid-cols-[1fr_200px] gap-8 items-center">
                    <div className="space-y-5">
                        <div className="text-xs text-slate-400">
                            <span className="text-emerald-400">$</span> whoami
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
                            {d.name}
                        </h1>
                        <div className="text-xs text-slate-400">
                            <span className="text-emerald-400">$</span> cat role.txt
                        </div>
                        <p className="text-base sm:text-lg text-emerald-300 font-semibold">
                            {d.headline}
                        </p>
                        <div className="rounded-lg bg-black/35 border border-emerald-500/15 p-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
                            {d.bio}
                        </div>
                        <div className="pt-2">
                            <button
                                onClick={d.onVisualize}
                                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-colors cursor-pointer"
                            >
                                <span>./open-portfolio.sh</span>
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-3">
                        <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-lg overflow-hidden border border-emerald-500/30 bg-slate-900">
                            <img
                                src={d.roleImage}
                                alt={d.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <span className="text-[11px] text-slate-400">
                            STATUS: <strong className="text-emerald-400">ONLINE</strong>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

