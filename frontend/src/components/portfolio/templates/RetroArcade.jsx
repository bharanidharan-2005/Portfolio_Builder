import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Download } from 'lucide-react';

const RetroArcade = ({ d }) => {
    return (
        <div className="min-h-screen w-full bg-[#110022] text-[#ff00ff] font-mono relative overflow-hidden flex flex-col p-4 sm:p-8">
            
            {/* Retro Sun & Grid Background */}
            <div className="absolute inset-0 z-0 overflow-hidden flex flex-col justify-end items-center">
                <div className="absolute top-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-b from-[#ffaa00] to-[#ff0055] shadow-[0_0_100px_#ff0055]"></div>
                <div className="absolute top-[25%] left-0 w-full h-[300px] bg-gradient-to-b from-[#110022] to-transparent z-10"></div>
                <div className="w-[200%] h-[50vh] bg-[linear-gradient(rgba(0,255,255,0.2)_2px,transparent_2px),linear-gradient(90deg,rgba(0,255,255,0.2)_2px,transparent_2px)] bg-[size:50px_50px] [transform:perspective(500px)_rotateX(60deg)_translateY(100px)_translateZ(100px)] animate-[move_grid_5s_linear_infinite] z-0"></div>
            </div>

            <header className="relative z-50 w-full flex justify-between items-center bg-[#220044] border-2 border-[#00ffff] p-4 shadow-[0_0_15px_#00ffff]">
                <div className="text-xl font-bold tracking-widest text-[#00ffff]">
                    {d.initials}_
                </div>
                <div className="hidden md:flex gap-8 text-sm font-bold text-[#ffff00] uppercase tracking-widest">
                    <span className="hover:text-[#ff00ff] cursor-pointer transition-colors">START</span>
                    <span className="hover:text-[#ff00ff] cursor-pointer transition-colors">OPTIONS</span>
                    <span className="hover:text-[#ff00ff] cursor-pointer transition-colors">QUIT</span>
                </div>
                <div className="text-xl font-bold text-[#00ffff]">
                    HI-SCORE: 99999
                </div>
            </header>

            <main className="flex-1 w-full max-w-4xl mx-auto flex flex-col items-center justify-center text-center relative z-10 mt-8">
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-[#220044] border-4 border-[#ff00ff] p-8 sm:p-12 shadow-[0_0_30px_#ff00ff]"
                >
                    {d.roleImage && (
                        <div className="w-32 h-32 mx-auto mb-6 border-4 border-[#00ffff] shadow-[0_0_15px_#00ffff] p-1 bg-[#110022]">
                            <img src={d.roleImage} alt={d.name} className="w-full h-full object-cover grayscale sepia hue-rotate-[-50deg] saturate-200" style={{ imageRendering: 'pixelated' }} />
                        </div>
                    )}
                    
                    <h2 className="text-2xl font-bold text-[#ffff00] mb-4 uppercase tracking-widest animate-pulse">
                        Ready Player One
                    </h2>
                    
                    <h1 className="text-5xl sm:text-7xl font-black text-[#00ffff] uppercase tracking-tighter mb-6 drop-shadow-[4px_4px_0_#ff0055]">
                        {d.name}
                    </h1>
                    
                    <p className="text-xl sm:text-3xl font-bold text-[#ffaa00] mb-8 uppercase tracking-widest">
                        &gt; {d.headline} &lt;
                    </p>
                    
                    <p className="text-sm sm:text-base text-white max-w-2xl leading-relaxed mb-12">
                        {d.bio}
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <button onClick={d.onVisualize} className="px-8 py-4 bg-[#ff0055] text-white border-2 border-white font-bold uppercase tracking-widest hover:bg-[#ff00ff] transition-colors flex items-center justify-center gap-3 w-full sm:w-auto shadow-[0_0_15px_#ff0055]">
                            PRESS START <ArrowRight className="w-5 h-5" />
                        </button>
                        <button onClick={() => alert("Proceed to portfolio")} className="px-8 py-4 bg-[#00ffff] text-[#110022] border-2 border-white font-bold uppercase tracking-widest hover:bg-white transition-colors flex items-center justify-center gap-3 w-full sm:w-auto shadow-[0_0_15px_#00ffff]">
                            <Download className="w-5 h-5" /> GET_CV
                        </button>
                    </div>
                </motion.div>
                
            </main>
            
            <footer className="relative z-50 w-full text-center mt-8 text-[#00ffff] text-sm uppercase tracking-widest">
                INSERT COIN TO CONTINUE
            </footer>
        </div>
    );
};

export default RetroArcade;
