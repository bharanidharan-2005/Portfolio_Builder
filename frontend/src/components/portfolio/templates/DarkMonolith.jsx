import { ArrowUpRight } from 'lucide-react';

export default function DarkMonolith({ d }) {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col justify-between px-6 sm:px-14 py-10">
            <div className="max-w-6xl w-full mx-auto flex items-center justify-between text-xs uppercase tracking-[0.25em] text-zinc-500">
                <span>{d.initials}</span>
                <span>Portfolio · Selected Index</span>
            </div>

            <div className="max-w-6xl w-full mx-auto my-auto py-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
                <div className="lg:col-span-8 space-y-6">
                    <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.9] text-white">
                        {d.firstName}
                        <span className="block text-zinc-500">{d.lastName}</span>
                    </h1>
                    <p className="text-lg sm:text-2xl text-zinc-300 font-light max-w-2xl">
                        {d.headline}
                    </p>
                    <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
                        {d.bio}
                    </p>
                    <div className="pt-2">
                        <button
                            onClick={d.onVisualize}
                            className="inline-flex items-center gap-3 rounded-full border border-zinc-700 hover:border-white hover:bg-white hover:text-black px-7 py-3.5 text-sm font-semibold transition-colors cursor-pointer"
                        >
                            <span>Enter Showcase</span>
                            <ArrowUpRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-4">
                    <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900">
                        <img
                            src={d.roleImage}
                            alt={d.name}
                            className="w-full h-full object-cover contrast-110"
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-6xl w-full mx-auto border-t border-zinc-900 pt-4 flex justify-between text-xs text-zinc-600">
                <span>{d.name}</span>
                <span>Monolith 21</span>
            </div>
        </div>
    );
}

