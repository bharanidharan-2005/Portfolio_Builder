import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Download } from 'lucide-react';

const NeoBrutalism = ({ d }) => {
    return (
        <div className="min-h-screen w-full bg-[#f4e156] text-black p-4 sm:p-8 relative overflow-hidden font-mono flex flex-col">
            
            <header className="w-full flex justify-between items-center bg-white border-4 border-black p-4 shadow-[8px_8px_0_0_rgba(0,0,0,1)] z-50 mb-8 sm:mb-16">
                <div className="text-2xl font-black uppercase tracking-tighter bg-black text-white px-2 py-1">
                    {d.initials}
                </div>
                <div className="hidden md:flex gap-6 text-lg font-bold uppercase">
                    <span className="hover:bg-black hover:text-white px-2 transition-colors cursor-pointer border-2 border-transparent hover:border-black">Work</span>
                    <span className="hover:bg-black hover:text-white px-2 transition-colors cursor-pointer border-2 border-transparent hover:border-black">About</span>
                    <span className="hover:bg-black hover:text-white px-2 transition-colors cursor-pointer border-2 border-transparent hover:border-black">Contact</span>
                </div>
                <button className="text-lg font-bold uppercase border-4 border-black px-4 py-1 bg-[#ff5e5e] shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all">
                    Resume
                </button>
            </header>

            <main className="flex-1 w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-12 z-10 relative">
                
                {/* Decorative floating elements */}
                <div className="absolute top-10 right-10 w-24 h-24 bg-[#ff5e5e] border-4 border-black rounded-full shadow-[8px_8px_0_0_rgba(0,0,0,1)] hidden lg:block animate-[bounce_4s_infinite]"></div>
                <div className="absolute bottom-20 left-10 w-32 h-16 bg-[#5698f4] border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] hidden lg:block transform -rotate-12"></div>

                <div className="flex-1 w-full flex flex-col items-start bg-white border-4 border-black p-8 sm:p-12 shadow-[12px_12px_0_0_rgba(0,0,0,1)] relative z-20">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="bg-black text-white text-sm sm:text-base font-bold uppercase px-4 py-2 mb-8 border-4 border-black transform -rotate-2"
                    >
                        Portfolio 2026
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-5xl sm:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-none mb-6"
                    >
                        {d.name}
                    </motion.h1>
                    
                    <motion.p 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="text-2xl sm:text-3xl font-bold bg-[#5698f4] px-4 py-2 border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] mb-8"
                    >
                        {d.headline}
                    </motion.p>
                    
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="text-lg sm:text-xl font-medium mb-12 max-w-xl leading-relaxed"
                    >
                        {d.bio}
                    </motion.p>
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className="flex flex-col sm:flex-row gap-6 w-full"
                    >
                        <button onClick={d.onVisualize} className="px-8 py-4 bg-[#ff5e5e] text-black border-4 border-black text-xl font-black uppercase shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-y-2 hover:translate-x-2 hover:shadow-none transition-all flex items-center justify-center gap-3 w-full sm:w-auto">
                            Projects <ArrowRight className="w-6 h-6" />
                        </button>
                        <button onClick={() => alert("Proceed to portfolio")} className="px-8 py-4 bg-white text-black border-4 border-black text-xl font-black uppercase shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-y-2 hover:translate-x-2 hover:shadow-none transition-all flex items-center justify-center gap-3 w-full sm:w-auto">
                            <Download className="w-6 h-6" /> CV
                        </button>
                    </motion.div>
                </div>
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex-1 w-full max-w-md hidden lg:block z-20"
                >
                    <div className="relative w-full aspect-[4/5] bg-white border-4 border-black shadow-[12px_12px_0_0_rgba(0,0,0,1)] p-4 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                        <div className="w-full h-full border-4 border-black overflow-hidden relative">
                            {d.roleImage ? (
                                <img src={d.roleImage} alt={d.headline} className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-500" />
                            ) : (
                                <div className="w-full h-full bg-[#4ade80] flex items-center justify-center">
                                    <span className="text-9xl font-black">?</span>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default NeoBrutalism;
