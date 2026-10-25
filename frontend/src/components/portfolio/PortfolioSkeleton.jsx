import React from 'react';

export default function PortfolioSkeleton({ isPreview = true, themeMode = 'dark' }) {
    const isLight = themeMode === 'light';

    return (
        <div className={`w-full min-h-screen flex flex-col items-center select-none animate-in fade-in duration-300 ${
            isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#080D1C] text-white'
        }`}>
            {/* Top Navigation Skeleton */}
            <div className={`sticky top-0 z-50 w-full px-4 sm:px-8 py-3.5 sm:py-4 border-b flex items-center justify-between backdrop-blur-2xl ${
                isLight ? 'bg-white/80 border-slate-200' : 'bg-black/40 border-slate-800/80'
            }`}>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600/30 animate-pulse" />
                    <div className="w-24 sm:w-32 h-4 rounded-md bg-slate-700/40 animate-pulse hidden sm:block" />
                </div>
                
                {/* Desktop Nav Links Skeleton */}
                <div className="hidden xl:flex items-center gap-4">
                    <div className="w-16 h-3 rounded-md bg-slate-700/30 animate-pulse" />
                    <div className="w-16 h-3 rounded-md bg-slate-700/30 animate-pulse" />
                    <div className="w-20 h-3 rounded-md bg-slate-700/30 animate-pulse" />
                    <div className="w-16 h-3 rounded-md bg-slate-700/30 animate-pulse" />
                    <div className="w-16 h-3 rounded-md bg-slate-700/30 animate-pulse" />
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-20 sm:w-28 h-8 rounded-lg bg-blue-600/30 animate-pulse" />
                </div>
            </div>

            {/* Main Canvas Skeleton Container */}
            <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 py-10 sm:py-16 flex flex-col gap-12 sm:gap-16">
                {/* Status Indicator */}
                <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                        Synchronizing Live Portfolio...
                    </span>
                </div>

                {/* Hero Block Skeleton */}
                <div className={`w-full rounded-2xl sm:rounded-3xl p-6 sm:p-12 border flex flex-col md:flex-row items-center justify-between gap-8 sm:gap-12 relative overflow-hidden ${
                    isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/40 border-slate-800/80 shadow-2xl backdrop-blur-xl'
                }`}>
                    <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left gap-4 w-full">
                        <div className="w-32 h-4 rounded-full bg-blue-500/20 animate-pulse" />
                        <div className="w-3/4 sm:w-2/3 h-8 sm:h-12 rounded-xl bg-slate-700/50 animate-pulse" />
                        <div className="w-full sm:w-4/5 h-4 sm:h-5 rounded-md bg-slate-700/30 animate-pulse" />
                        <div className="w-2/3 sm:w-3/5 h-4 sm:h-5 rounded-md bg-slate-700/30 animate-pulse" />
                        
                        <div className="flex items-center gap-4 mt-4 w-full sm:w-auto justify-center md:justify-start">
                            <div className="w-32 sm:w-36 h-10 rounded-xl bg-blue-600/40 animate-pulse" />
                            <div className="w-28 sm:w-32 h-10 rounded-xl bg-slate-700/40 animate-pulse" />
                        </div>
                    </div>

                    <div className="w-32 h-32 sm:w-44 sm:h-44 md:w-56 md:h-56 rounded-full sm:rounded-3xl bg-slate-700/30 border border-slate-700/50 animate-pulse shrink-0" />
                </div>

                {/* Projects Grid Skeleton */}
                <div className="flex flex-col gap-6">
                    <div className="w-48 h-6 rounded-lg bg-slate-700/40 animate-pulse mx-auto md:mx-0" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        {[1, 2].map((i) => (
                            <div 
                                key={i} 
                                className={`rounded-2xl p-6 border flex flex-col gap-4 ${
                                    isLight ? 'bg-white border-slate-200' : 'bg-slate-900/30 border-slate-800/80'
                                }`}
                            >
                                <div className="w-full h-36 sm:h-44 rounded-xl bg-slate-700/30 animate-pulse" />
                                <div className="w-1/2 h-5 rounded-md bg-slate-700/50 animate-pulse" />
                                <div className="w-full h-3.5 rounded-md bg-slate-700/30 animate-pulse" />
                                <div className="w-4/5 h-3.5 rounded-md bg-slate-700/30 animate-pulse" />
                                <div className="flex gap-2 mt-2">
                                    <div className="w-14 h-5 rounded-md bg-blue-500/20 animate-pulse" />
                                    <div className="w-14 h-5 rounded-md bg-blue-500/20 animate-pulse" />
                                    <div className="w-14 h-5 rounded-md bg-blue-500/20 animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
