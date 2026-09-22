import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Download } from 'lucide-react';

const Glassmorphism = ({ d }) => {
    return (
        <div className="min-h-screen w-full relative overflow-hidden flex items-center justify-center p-6 bg-slate-900">
            {/* Animated Mesh Gradient Background */}
            <div className="absolute inset-0 z-0 opacity-80">
                <div className="absolute top-0 -left-1/4 w-[800px] h-[800px] bg-purple-600 rounded-full mix-blend-screen filter blur-[120px] animate-[pulse_8s_ease-in-out_infinite]"></div>
                <div className="absolute bottom-0 -right-1/4 w-[600px] h-[600px] bg-cyan-500 rounded-full mix-blend-screen filter blur-[100px] animate-[pulse_10s_ease-in-out_infinite_reverse]"></div>
                <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-blue-600 rounded-full mix-blend-screen filter blur-[90px] animate-[pulse_12s_ease-in-out_infinite]"></div>
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
            </div>
            
            <header className="absolute top-0 w-full px-8 py-8 flex justify-between items-center z-50 text-white">
                <div className="text-2xl font-black tracking-widest uppercase flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                        {d.initials}
                    </div>
                </div>
                <div className="hidden md:flex gap-8 text-sm font-semibold text-white/80">
                    <span className="hover:text-white cursor-pointer transition-colors">Work</span>
                    <span className="hover:text-white cursor-pointer transition-colors">About</span>
                    <span className="hover:text-white cursor-pointer transition-colors">Contact</span>
                </div>
            </header>

            {/* Glass Card */}
            <motion.div 
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 w-full max-w-5xl bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] p-8 md:p-16 lg:p-20 shadow-2xl shadow-purple-900/50 flex flex-col items-center text-center overflow-hidden"
            >
                {/* Internal Card Shine Effect */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent opacity-50 pointer-events-none"></div>
                
                <span className="px-6 py-2 rounded-full bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-widest text-white mb-8">
                    Welcome to my space
                </span>
                
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-white mb-6 drop-shadow-md">
                    {d.name}
                </h1>
                
                <p className="text-xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300 mb-8 max-w-3xl">
                    {d.headline}
                </p>
                
                <p className="text-lg md:text-xl font-medium text-white/80 leading-relaxed mb-12 max-w-2xl">
                    {d.bio}
                </p>
                
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <button onClick={d.onVisualize} className="px-8 py-4 bg-white text-slate-900 rounded-2xl text-sm font-black hover:scale-105 transition-all flex items-center gap-3 shadow-lg hover:shadow-white/20">
                        Explore Portfolio <ArrowRight className="w-4 h-4" />
                    </button>
                    <button onClick={() => alert("Please proceed to your main portfolio to download the dynamically generated PDF resume.")} className="px-8 py-4 bg-white/10 text-white border border-white/30 rounded-2xl text-sm font-bold hover:bg-white/20 hover:scale-105 transition-all flex items-center gap-2 backdrop-blur-md">
                        <Download className="w-4 h-4" /> Download CV
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default Glassmorphism;
