import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Download } from 'lucide-react';

const ParticleNetwork = ({ d }) => {
    return (
        <div className="min-h-screen w-full bg-[#0a0a0a] text-white relative overflow-hidden flex flex-col justify-center font-sans">
            
            {/* CSS Particle Network Simulation Background */}
            <div className="absolute inset-0 z-0 overflow-hidden opacity-30">
                {/* We simulate a particle network with some animated absolute dots and lines using SVG */}
                <svg className="absolute w-full h-full">
                    <defs>
                        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.2" />
                        </linearGradient>
                    </defs>
                    <g className="animate-[pulse_4s_infinite]">
                        <line x1="10%" y1="20%" x2="30%" y2="50%" stroke="url(#lineGrad)" strokeWidth="1" />
                        <line x1="30%" y1="50%" x2="60%" y2="30%" stroke="url(#lineGrad)" strokeWidth="1" />
                        <line x1="60%" y1="30%" x2="80%" y2="70%" stroke="url(#lineGrad)" strokeWidth="1" />
                        <line x1="80%" y1="70%" x2="50%" y2="80%" stroke="url(#lineGrad)" strokeWidth="1" />
                        <line x1="50%" y1="80%" x2="20%" y2="60%" stroke="url(#lineGrad)" strokeWidth="1" />
                        <line x1="20%" y1="60%" x2="10%" y2="20%" stroke="url(#lineGrad)" strokeWidth="1" />
                        <line x1="30%" y1="50%" x2="50%" y2="80%" stroke="url(#lineGrad)" strokeWidth="1" />
                        <line x1="60%" y1="30%" x2="90%" y2="40%" stroke="url(#lineGrad)" strokeWidth="1" />
                    </g>
                    {/* Nodes */}
                    <circle cx="10%" cy="20%" r="4" fill="#3b82f6" className="animate-ping" />
                    <circle cx="30%" cy="50%" r="5" fill="#8b5cf6" />
                    <circle cx="60%" cy="30%" r="4" fill="#3b82f6" />
                    <circle cx="80%" cy="70%" r="6" fill="#8b5cf6" className="animate-ping" />
                    <circle cx="50%" cy="80%" r="4" fill="#3b82f6" />
                    <circle cx="20%" cy="60%" r="5" fill="#8b5cf6" />
                    <circle cx="90%" cy="40%" r="4" fill="#3b82f6" />
                </svg>
            </div>

            <header className="absolute top-0 w-full px-8 py-8 flex justify-between items-center z-50">
                <div className="text-xl font-bold tracking-widest text-blue-400 uppercase">
                    {d.firstName}
                </div>
                <div className="hidden md:flex gap-8 text-sm font-medium text-slate-400">
                    <span className="hover:text-white cursor-pointer transition-colors">Nodes</span>
                    <span className="hover:text-white cursor-pointer transition-colors">Data</span>
                    <span className="hover:text-white cursor-pointer transition-colors">Connect</span>
                </div>
            </header>

            <main className="relative z-10 w-full max-w-5xl mx-auto px-8 flex flex-col items-center text-center">
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                >
                    <span className="px-4 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-widest mb-8 inline-block">
                        System Online
                    </span>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tight text-white mb-6">
                        {d.name}
                    </h1>
                </motion.div>
                
                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="text-2xl md:text-4xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-8"
                >
                    {d.headline}
                </motion.p>
                
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed mb-12"
                >
                    {d.bio}
                </motion.p>
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.6 }}
                    className="flex flex-col sm:flex-row gap-6"
                >
                    <button onClick={d.onVisualize} className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-bold hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-3 relative overflow-hidden group">
                        <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></span>
                        <span className="relative flex items-center gap-2">Initialize <ArrowRight className="w-5 h-5" /></span>
                    </button>
                    <button onClick={() => alert("Proceed to portfolio")} className="px-8 py-4 bg-transparent border border-slate-700 text-white rounded-full font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                        <Download className="w-5 h-5" /> Download Log
                    </button>
                </motion.div>
                
            </main>
        </div>
    );
};

export default ParticleNetwork;
