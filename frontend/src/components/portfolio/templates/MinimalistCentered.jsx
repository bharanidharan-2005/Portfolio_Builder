import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Download } from 'lucide-react';

const MinimalistCentered = ({ d }) => {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white text-slate-900 px-4 sm:px-8 md:px-12 py-16 sm:py-20 relative overflow-hidden">
            {/* Extremely subtle background accent */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[400px] bg-slate-50 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
            
            <header className="absolute top-0 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex justify-between items-center z-50">
                <div className="text-lg sm:text-xl font-black tracking-tighter truncate max-w-[200px] sm:max-w-none">{d.firstName}.</div>
                <div className="hidden md:flex gap-8 text-sm font-semibold text-slate-500">
                    <span onClick={d.onVisualize} className="hover:text-slate-900 cursor-pointer transition-colors">Work</span>
                    <span onClick={d.onVisualize} className="hover:text-slate-900 cursor-pointer transition-colors">About</span>
                    <span onClick={d.onVisualize} className="hover:text-slate-900 cursor-pointer transition-colors">Contact</span>
                </div>
                <button onClick={d.onVisualize} className="text-xs sm:text-sm font-bold border-b-2 border-slate-900 pb-1 hover:text-blue-600 hover:border-blue-600 transition-colors cursor-pointer shrink-0">
                    Resume
                </button>
            </header>

            <main className="w-full max-w-4xl mx-auto flex flex-col items-center text-center z-10 mt-12 sm:mt-16 px-2">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="flex flex-col items-center w-full max-w-full"
                >
                    {d.roleImage && (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 mb-4 sm:mb-6 rounded-full overflow-hidden border border-slate-200 shadow-sm shrink-0">
                            <img src={d.roleImage} alt={d.name} className="w-full h-full object-cover" />
                        </div>
                    )}
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] sm:tracking-[0.3em] text-slate-400 mb-4 sm:mb-6 block">
                        Portfolio &mdash; {new Date().getFullYear()}
                    </span>
                    <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.1] text-slate-900 mb-6 sm:mb-8 break-words max-w-full px-2 text-center hyphens-auto">
                        {d.name}
                    </h1>
                </motion.div>
                
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                    className="w-16 sm:w-24 h-1 bg-slate-900 mb-6 sm:mb-8"
                ></motion.div>

                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.4 }}
                    className="text-base sm:text-xl md:text-2xl font-medium text-slate-600 max-w-2xl mb-8 sm:mb-12 leading-relaxed px-2"
                >
                    {d.headline}
                </motion.p>
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.6 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full sm:w-auto px-4"
                >
                    <button onClick={d.onVisualize} className="w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-5 bg-slate-900 text-white rounded-full text-xs sm:text-sm font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-3 hover:gap-5 cursor-pointer shadow-lg active:scale-95">
                        View Projects <ArrowRight className="w-4 h-4" />
                    </button>
                    <button onClick={d.onVisualize} className="w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-5 bg-white text-slate-900 border border-slate-200 rounded-full text-xs sm:text-sm font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95">
                        <Download className="w-4 h-4" /> Download CV / Resume
                    </button>
                </motion.div>
            </main>
        </div>
    );
};

export default MinimalistCentered;
