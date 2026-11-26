import { ArrowUpRight, BookOpen } from 'lucide-react';

export default function EditorialMagazine({ d }) {
    return (
        <div className="min-h-screen bg-[#faf7f2] text-stone-900 flex flex-col justify-between px-6 sm:px-12 py-10">
            <header className="max-w-6xl w-full mx-auto flex items-center justify-between border-b border-stone-900/15 pb-4 text-xs uppercase tracking-[0.22em] text-stone-500">
                <span className="inline-flex items-center gap-2 font-semibold text-stone-900">
                    <BookOpen className="w-3.5 h-3.5" />
                    Issue 01 · Portfolio
                </span>
                <span>{d.initials} Edition</span>
            </header>

            <main className="max-w-6xl w-full mx-auto my-auto py-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                <div className="lg:col-span-7 space-y-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-800">
                        Featured Profile
                    </p>
                    <h1 className="font-serif text-5xl sm:text-7xl font-normal tracking-tight leading-[0.98] text-stone-950">
                        {d.firstName}{' '}
                        <span className="italic text-stone-600">{d.lastName}</span>
                    </h1>
                    <p className="text-xl sm:text-2xl font-serif text-stone-700 leading-snug max-w-2xl">
                        {d.headline}
                    </p>
                    <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-xl border-l-2 border-stone-900/20 pl-4">
                        {d.bio}
                    </p>
                    <div className="pt-2">
                        <button
                            onClick={d.onVisualize}
                            className="inline-flex items-center gap-2.5 bg-stone-950 hover:bg-stone-800 text-[#faf7f2] px-6 py-3.5 text-sm font-medium tracking-wide transition-colors cursor-pointer"
                        >
                            <span>Read Full Dossier</span>
                            <ArrowUpRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-5">
                    <div className="relative bg-stone-200 border border-stone-900/15 p-3 shadow-sm">
                        <div className="aspect-[4/5] overflow-hidden bg-stone-300">
                            <img
                                src={d.roleImage}
                                alt={d.name}
                                className="w-full h-full object-cover grayscale contrast-105 hover:grayscale-0 transition-all duration-500"
                            />
                        </div>
                        <div className="pt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-stone-600">
                            <span>{d.name}</span>
                            <span>Selected Works</span>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="max-w-6xl w-full mx-auto border-t border-stone-900/15 pt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
                <span>Curated with AuraBuild</span>
                <span>Scroll / Enter workspace to inspect sections</span>
            </footer>
        </div>
    );
}

