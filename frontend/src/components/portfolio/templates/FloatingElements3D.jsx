import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Download, Box, Globe, Hexagon, Triangle } from 'lucide-react';

const FloatingElements3D = ({ d }) => {
    const roleImage = d.roleImage;
    
    return (
        <div className="min-h-screen w-full bg-slate-50 text-slate-900 relative overflow-hidden flex flex-col font-sans">
            
            {/* Floating 3D-ish Elements (using CSS transforms and shadows) */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <motion.div 
                    animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[20%] left-[10%] w-24 h-24 bg-blue-500 rounded-2xl shadow-[10px_10px_30px_rgba(59,130,246,0.3),-10px_-10px_30px_rgba(255,255,255,0.8)] border border-blue-400/20 backdrop-blur-md flex items-center justify-center opacity-70"
                >
                    <Box className="w-10 h-10 text-white" />
                </motion.div>
                
                <motion.div 
                    animate={{ y: [0, 30, 0], rotate: [0, -15, 0] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-[20%] right-[15%] w-32 h-32 bg-purple-500 rounded-full shadow-[10px_10px_30px_rgba(168,85,247,0.3),-10px_-10px_30px_rgba(255,255,255,0.8)] border border-purple-400/20 backdrop-blur-md flex items-center justify-center opacity-70"
                >
                    <Globe className="w-12 h-12 text-white" />
                </motion.div>
                
                <motion.div 
                    animate={{ y: [0, -25, 0], rotate: [0, 20, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute top-[30%] right-[25%] w-20 h-20 bg-emerald-500 rounded-[2rem] shadow-[10px_10px_30px_rgba(16,185,129,0.3),-10px_-10px_30px_rgba(255,255,255,0.8)] border border-emerald-400/20 backdrop-blur-md flex items-center justify-center opacity-70 transform rotate-45"
                >
                    <Hexagon className="w-8 h-8 text-white" />
                </motion.div>
            </div>

            <header className="relative z-50 w-full max-w-7xl mx-auto px-8 py-8 flex justify-between items-center">
                <div className="text-2xl font-black tracking-tight text-slate-800">
                    {d.firstName}<span className="text-blue-600">.</span>
                </div>
                <div className="hidden md:flex gap-8 text-sm font-bold text-slate-500">
                    <span className="hover:text-blue-600 cursor-pointer transition-colors">Features</span>
                    <span className="hover:text-blue-600 cursor-pointer transition-colors">Showcase</span>
                    <span className="hover:text-blue-600 cursor-pointer transition-colors">Contact</span>
                </div>
            </header>

            <main className="flex-1 w-full max-w-7xl mx-auto px-8 flex flex-col lg:flex-row items-center justify-center gap-12 relative z-10">
                
                {/* Left Text */}
                <div className="flex-1 max-w-2xl text-center lg:text-left">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm font-bold text-blue-600 shadow-md mb-8 border border-slate-100"
                    >
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                        Available for new projects
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-5xl sm:text-7xl font-black tracking-tighter text-slate-900 mb-6 leading-tight"
                    >
                        Designing <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">future</span> experiences.
                    </motion.h1>
                    
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-xl sm:text-2xl font-bold text-slate-600 mb-6"
                    >
                        {d.headline}
                    </motion.p>
                    
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="text-lg text-slate-500 leading-relaxed mb-10 max-w-xl mx-auto lg:mx-0"
                    >
                        {d.bio}
                    </motion.p>
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
                    >
                        <button onClick={d.onVisualize} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-600/30 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center gap-3">
                            Start Exploring <ArrowRight className="w-5 h-5" />
                        </button>
                        <button onClick={() => alert("Proceed to portfolio")} className="px-8 py-4 bg-white text-slate-700 rounded-2xl font-bold shadow-md border border-slate-100 hover:bg-slate-50 hover:-translate-y-1 transition-all flex items-center gap-2">
                            <Download className="w-5 h-5" /> Get Resume
                        </button>
                    </motion.div>
                </div>

                {/* Right Image / Central 3D Element Concept */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="flex-1 w-full max-w-md hidden lg:flex justify-center items-center relative"
                >
                    <div className="w-[400px] h-[500px] bg-white rounded-[3rem] shadow-[20px_20px_60px_rgba(0,0,0,0.05),-20px_-20px_60px_rgba(255,255,255,0.8)] border border-slate-100 p-4 relative transform perspective-1000 rotate-y-[-10deg] rotate-x-[5deg] hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-700">
                        <div className="w-full h-full rounded-[2.5rem] overflow-hidden relative">
                            <img src={roleImage} alt="Profile" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-purple-600/20 mix-blend-overlay"></div>
                        </div>
                        {/* Floating mini card */}
                        <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-4 animate-[bounce_3s_infinite]">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                                <Triangle className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-slate-900">{d.name}</div>
                                <div className="text-xs font-semibold text-slate-500">Creative Pro</div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default FloatingElements3D;
