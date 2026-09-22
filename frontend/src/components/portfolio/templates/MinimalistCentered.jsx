import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Download } from 'lucide-react';

const MinimalistCentered = ({ d }) => {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white text-slate-900 px-6 sm:px-12 relative overflow-hidden">
            {/* Extremely subtle background accent */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[400px] bg-slate-50 rounded-full blur-[100px] -z-10"></div>
            
            <header className="absolute top-0 w-full max-w-5xl mx-auto px-6 py-8 flex justify-between items-center z-50">
                <div className="text-xl font-black tracking-tighter">{d.firstName}.</div>
                <div className="hidden md:flex gap-8 text-sm font-semibold text-slate-500">
                    <span className="hover:text-slate-900 cursor-pointer transition-colors">Work</span>
                    <span className="hover:text-slate-900 cursor-pointer transition-colors">About</span>
                    <span className="hover:text-slate-900 cursor-pointer transition-colors">Contact</span>
                </div>
                <button className="text-sm font-bold border-b-2 border-slate-900 pb-1 hover:text-blue-600 hover:border-blue-600 transition-colors">
                    Resume
                </button>
            </header>

            <main className="w-full max-w-4xl mx-auto flex flex-col items-center text-center z-10 mt-16">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="flex flex-col items-center"
                >
                    {d.roleImage && (
                        <div className="w-24 h-24 mb-6 rounded-full overflow-hidden border border-slate-200 shadow-sm">
                            <img src={d.roleImage} alt={d.name} className="w-full h-full object-cover" />
                        </div>
                    )}
                    <span className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-6 block">Portfolio &mdash; {new Date().getFullYear()}</span>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[1.1] text-slate-900 mb-8">
                        {d.name}
                    </h1>
                </motion.div>
                
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                    className="w-24 h-1 bg-slate-900 mb-8"
                ></motion.div>

                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.4 }}
                    className="text-xl md:text-3xl font-medium text-slate-600 max-w-2xl mb-12 leading-relaxed"
                >
                    {d.headline}
                </motion.p>
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.6 }}
                    className="flex flex-col sm:flex-row items-center gap-6"
                >
                    <button onClick={d.onVisualize} className="px-10 py-5 bg-slate-900 text-white rounded-full text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-3 hover:gap-5 hover:pr-8">
                        View Projects <ArrowRight className="w-4 h-4" />
                    </button>
                    <button onClick={() => alert("Please proceed to your main portfolio to download the dynamically generated PDF resume.")} className="px-10 py-5 bg-white text-slate-900 border border-slate-200 rounded-full text-sm font-bold hover:bg-slate-50 transition-all flex items-center gap-2">
                        <Download className="w-4 h-4" /> Download CV
                    </button>
                </motion.div>
            </main>
        </div>
    );
};

export default MinimalistCentered;
