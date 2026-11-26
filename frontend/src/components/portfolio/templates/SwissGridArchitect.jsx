import { ArrowRight, Grid3X3 } from 'lucide-react';

export default function SwissGridArchitect({ d }) {
    return (
        <div className="min-h-screen bg-white text-neutral-950 flex flex-col">
            <div className="border-b border-neutral-900 px-6 sm:px-10 py-4 flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                <span className="inline-flex items-center gap-2">
                    <Grid3X3 className="w-4 h-4 text-red-600" />
                    {d.initials} / INDEX
                </span>
                <span className="text-red-600">SWISS GRID SYSTEM</span>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12">
                <div className="lg:col-span-7 border-b lg:border-b-0 lg:border-r border-neutral-900 p-8 sm:p-14 flex flex-col justify-between gap-10">
                    <div className="space-y-4">
                        <div className="inline-block bg-red-600 text-white text-[11px] font-bold uppercase tracking-[0.2em] px-3 py-1">
                            01 · Overview
                        </div>
                        <h1 className="text-5xl sm:text-7xl font-black tracking-tighter leading-[0.92] uppercase">
                            {d.firstName}
                            <br />
                            {d.lastName}
                        </h1>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-neutral-200">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                                Discipline
                            </p>
                            <p className="text-base font-semibold text-neutral-900">
                                {d.headline}
                            </p>
                        </div>
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                                Statement
                            </p>
                            <p className="text-sm text-neutral-600 leading-relaxed">
                                {d.bio}
                            </p>
                        </div>
                    </div>

                    <div>
                        <button
                            onClick={d.onVisualize}
                            className="inline-flex items-center gap-3 bg-neutral-950 hover:bg-red-600 text-white px-7 py-4 text-xs font-bold uppercase tracking-[0.2em] transition-colors cursor-pointer"
                        >
                            <span>Explore Portfolio</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-5 p-8 sm:p-12 bg-neutral-50 flex flex-col justify-between gap-6">
                    <div className="aspect-square w-full border border-neutral-900 overflow-hidden bg-neutral-200">
                        <img
                            src={d.roleImage}
                            alt={d.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-neutral-500">
                        <span>{d.name}</span>
                        <span>Layout 18</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

