import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Download } from 'lucide-react';

const Cyberpunk = ({ d }) => {
    return (
        <div className="min-h-screen w-full bg-[#0B0C10] text-[#C5C6C7] font-mono relative overflow-hidden flex flex-col items-center justify-center p-6">
            
            {/* Grid Background */}
            <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(34,211,238,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [transform:perspective(500px)_rotateX(60deg)_translateY(-100px)_translateZ(-200px)] opacity-40"></div>
            
            {/* Top scanning line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400 shadow-[0_0_20px_#22d3ee] z-50"></div>
            
            <header className="absolute top-0 w-full px-8 py-6 flex justify-between items-center z-50">
                <div className="text-2xl font-black text-cyan-400 tracking-widest uppercase drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
                    SYS.{d.firstName}
                </div>
                <div className="hidden md:flex gap-8 text-sm font-bold text-pink-500 uppercase tracking-widest">
                    <span className="hover:text-cyan-400 cursor-pointer transition-colors drop-shadow-[0_0_5px_rgba(236,72,153,0.8)]">_Work</span>
                    <span className="hover:text-cyan-400 cursor-pointer transition-colors drop-shadow-[0_0_5px_rgba(236,72,153,0.8)]">_Data</span>
                    <span className="hover:text-cyan-400 cursor-pointer transition-colors drop-shadow-[0_0_5px_rgba(236,72,153,0.8)]">_Comm</span>
                </div>
            </header>

            <main className="relative z-10 w-full max-w-5xl bg-black/60 backdrop-blur-sm border border-cyan-500/50 p-8 sm:p-16 border-l-4 border-l-pink-500 shadow-[0_0_30px_rgba(34,211,238,0.15)] flex flex-col items-start skew-x-[-2deg]">
                
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-4 h-4 bg-pink-500 animate-pulse shadow-[0_0_10px_#ec4899]"></div>
                    <span className="text-cyan-400 font-bold tracking-widest text-sm drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">CONNECTION ESTABLISHED</span>
                </div>

                {d.roleImage && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="w-32 h-32 mb-6 border-2 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)] relative p-1"
                    >
                        <div className="absolute inset-0 bg-cyan-400/20 mix-blend-overlay z-10 pointer-events-none"></div>
                        <img src={d.roleImage} alt={d.name} className="w-full h-full object-cover grayscale contrast-125" />
                    </motion.div>
                )}
                
                <motion.h1 
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-5xl sm:text-7xl lg:text-8xl font-black text-white uppercase tracking-tighter mb-4 drop-shadow-[2px_2px_0px_#ec4899,-2px_-2px_0px_#22d3ee]"
                >
                    {d.name}
                </motion.h1>
                
                <motion.p 
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="text-xl sm:text-2xl lg:text-3xl font-bold text-cyan-300 mb-8 uppercase tracking-wide bg-cyan-900/40 px-4 py-2 border-l-2 border-cyan-400"
                >
                    {d.headline}
                </motion.p>
                
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    className="text-lg text-slate-400 max-w-2xl leading-relaxed mb-12"
                >
                    &gt; {d.bio}
                </motion.p>
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                    className="flex flex-col sm:flex-row gap-6 w-full"
                >
                    <button onClick={d.onVisualize} className="group relative px-8 py-4 bg-cyan-500 text-black font-black uppercase tracking-widest hover:bg-cyan-400 transition-colors flex items-center justify-center gap-3 w-full sm:w-auto shadow-[0_0_20px_rgba(34,211,238,0.6)]">
                        <span className="absolute inset-0 w-full h-full border-2 border-cyan-400 scale-105 group-hover:scale-110 transition-transform"></span>
                        Access Grid <ArrowRight className="w-5 h-5" />
                    </button>
                    <button onClick={() => alert("Proceed to portfolio")} className="group relative px-8 py-4 bg-transparent border-2 border-pink-500 text-pink-500 font-black uppercase tracking-widest hover:bg-pink-500/10 transition-colors flex items-center justify-center gap-3 w-full sm:w-auto shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                        <Download className="w-5 h-5" /> DL_Resume
                    </button>
                </motion.div>
                
                {/* Decorative Cyberpunk Elements */}
                <div className="absolute top-4 right-4 text-[10px] text-cyan-500/50 text-right">
                    <div>SYS.MEM: 1024TB</div>
                    <div>NET.LAT: 2ms</div>
                    <div>UPLINK: ACTIVE</div>
                </div>
            </main>
        </div>
    );
};

export default Cyberpunk;
