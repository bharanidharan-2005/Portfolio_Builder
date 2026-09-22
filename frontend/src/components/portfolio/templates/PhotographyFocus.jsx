import React from 'react';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { getRoleImage } from '../PortfolioFrontpage';

const PhotographyFocus = ({ d }) => {
    const roleImage = getRoleImage(d.headline);
    
    return (
        <div className="min-h-screen w-full bg-white text-black relative flex flex-col font-serif">
            
            <header className="absolute top-0 w-full px-6 py-6 md:px-12 md:py-8 flex justify-between items-center z-50 mix-blend-difference text-white">
                <div className="text-2xl font-black uppercase tracking-[0.3em]">
                    {d.firstName}
                </div>
                <div className="hidden md:flex gap-12 text-xs font-bold uppercase tracking-[0.2em]">
                    <span className="hover:text-gray-300 cursor-pointer transition-colors">Gallery</span>
                    <span className="hover:text-gray-300 cursor-pointer transition-colors">Exhibitions</span>
                    <span className="hover:text-gray-300 cursor-pointer transition-colors">Contact</span>
                </div>
            </header>

            <main className="flex-1 w-full flex flex-col md:flex-row relative">
                
                {/* Full screen image area on mobile, half on desktop */}
                <div className="w-full md:w-2/3 h-[60vh] md:h-screen relative">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.5 }}
                        className="absolute inset-0"
                    >
                        <img src={roleImage} alt="Photography Focus" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20"></div>
                    </motion.div>
                    
                    {/* Floating Title over image */}
                    <motion.h1 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="absolute bottom-12 left-6 md:left-12 text-5xl sm:text-7xl lg:text-8xl font-black text-white uppercase tracking-tighter leading-none"
                    >
                        {d.name.split(' ').map((word, i) => (
                            <span key={i} className="block">{word}</span>
                        ))}
                    </motion.h1>
                </div>
                
                {/* Text area */}
                <div className="w-full md:w-1/3 min-h-[40vh] md:h-screen bg-white p-8 md:p-12 lg:p-16 flex flex-col justify-center">
                    
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1, delay: 0.7 }}
                    >
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">
                            Introduction
                        </p>
                        
                        <p className="text-2xl lg:text-3xl font-medium text-black mb-8 leading-snug">
                            {d.headline}
                        </p>
                        
                        <div className="w-12 h-[1px] bg-black mb-8"></div>
                        
                        <p className="text-sm font-sans text-gray-600 leading-relaxed mb-12">
                            {d.bio}
                        </p>
                        
                        <div className="flex flex-col gap-4">
                            <button onClick={d.onVisualize} className="w-full py-4 bg-black text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors">
                                View Portfolio
                            </button>
                            <button onClick={() => alert("Proceed to portfolio")} className="w-full py-4 bg-white text-black border border-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                                <Download className="w-4 h-4" /> Download Resumé
                            </button>
                        </div>
                    </motion.div>
                    
                </div>
                
            </main>
        </div>
    );
};

export default PhotographyFocus;
