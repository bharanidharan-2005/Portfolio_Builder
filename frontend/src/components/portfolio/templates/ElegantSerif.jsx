import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Download } from 'lucide-react';

const ElegantSerif = ({ d }) => {
    const roleImage = d.roleImage;
    
    return (
        <div className="min-h-screen w-full bg-[#f8f5f2] text-[#2c2c2c] relative overflow-hidden flex flex-col font-serif">
            
            {/* Elegant Top Border */}
            <div className="absolute top-0 left-0 w-full h-2 bg-[#2c2c2c] z-50"></div>
            
            <header className="w-full max-w-7xl mx-auto px-8 sm:px-12 py-10 flex justify-between items-center z-40">
                <div className="text-3xl font-bold tracking-tight italic">
                    {d.firstName}
                </div>
                <div className="hidden md:flex gap-10 text-sm tracking-widest uppercase font-sans font-medium text-[#5a5a5a]">
                    <span className="hover:text-black cursor-pointer transition-colors border-b border-transparent hover:border-black pb-1">Portfolio</span>
                    <span className="hover:text-black cursor-pointer transition-colors border-b border-transparent hover:border-black pb-1">Journal</span>
                    <span className="hover:text-black cursor-pointer transition-colors border-b border-transparent hover:border-black pb-1">Contact</span>
                </div>
                <button className="text-sm font-sans font-bold tracking-widest uppercase bg-black text-white px-6 py-2 rounded-full hover:bg-[#333] transition-colors">
                    CV
                </button>
            </header>

            <main className="flex-1 w-full max-w-7xl mx-auto px-8 sm:px-12 flex flex-col justify-center relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
                    
                    {/* Left Content */}
                    <div className="flex-1 w-full flex flex-col items-start pt-10">
                        <motion.span 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="text-sm font-sans font-semibold uppercase tracking-[0.2em] text-[#888] mb-6 block"
                        >
                            Selected Works &mdash; {new Date().getFullYear()}
                        </motion.span>
                        
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 0.1 }}
                            className="text-6xl sm:text-7xl lg:text-8xl font-normal leading-tight mb-8"
                        >
                            {d.name.split(' ')[0]} <br />
                            <span className="italic text-[#666]">{d.name.split(' ')[1] || ''}</span>
                        </motion.h1>
                        
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className="text-2xl sm:text-3xl font-medium text-[#444] mb-10 max-w-2xl leading-snug"
                        >
                            {d.headline}
                        </motion.p>
                        
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 0.3 }}
                            className="flex items-center gap-6"
                        >
                            <button onClick={d.onVisualize} className="px-8 py-4 bg-[#2c2c2c] text-white font-sans text-xs uppercase tracking-[0.2em] font-semibold hover:bg-black transition-colors flex items-center gap-4">
                                Discover Work <ArrowRight className="w-4 h-4" />
                            </button>
                        </motion.div>
                    </div>

                    {/* Right Image */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.2, delay: 0.4 }}
                        className="flex-1 w-full relative h-[500px] lg:h-[600px] hidden md:block"
                    >
                        {/* Decorative frame */}
                        <div className="absolute inset-0 border border-[#2c2c2c] translate-x-4 translate-y-4"></div>
                        <img src={roleImage} alt="Portrait" className="w-full h-full object-cover grayscale relative z-10" />
                    </motion.div>
                </div>
            </main>
            
            {/* Elegant footer lines */}
            <div className="w-full max-w-7xl mx-auto px-8 sm:px-12 py-10 flex justify-between items-center text-xs font-sans tracking-widest uppercase text-[#888] border-t border-[#e0dcd7] mt-10">
                <div>Based in The World</div>
                <div>Available for Freelance</div>
            </div>
        </div>
    );
};

export default ElegantSerif;
