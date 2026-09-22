import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Download } from 'lucide-react';

const WaveOrganic = ({ d }) => {
    const roleImage = d.roleImage;
    
    return (
        <div className="min-h-screen w-full bg-[#fcf9f2] text-[#4a5d23] relative overflow-hidden flex flex-col font-sans">
            
            {/* Organic SVG Backgrounds */}
            <div className="absolute top-0 left-0 w-full h-full z-0 opacity-20 pointer-events-none">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute top-0 right-0 w-1/2 h-full text-[#8eb042] fill-current">
                    <path d="M0,0 Q50,50 100,0 L100,100 L0,100 Z" opacity="0.3"></path>
                    <path d="M20,0 Q60,40 100,20 L100,100 L20,100 Z" opacity="0.5"></path>
                </svg>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#d9e5a3] rounded-full mix-blend-multiply blur-3xl"></div>
                <div className="absolute top-[-10%] right-[10%] w-[400px] h-[400px] bg-[#b5d56a] rounded-full mix-blend-multiply blur-3xl"></div>
            </div>

            <header className="relative z-50 w-full px-8 py-8 flex justify-between items-center">
                <div className="text-2xl font-bold tracking-tight text-[#3a491c] flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#8eb042] rounded-full flex items-center justify-center text-white text-sm">
                        {d.initials}
                    </div>
                    {d.firstName}
                </div>
                <div className="hidden md:flex gap-8 text-sm font-semibold text-[#6a8039]">
                    <span className="hover:text-[#3a491c] cursor-pointer transition-colors">Work</span>
                    <span className="hover:text-[#3a491c] cursor-pointer transition-colors">About</span>
                    <span className="hover:text-[#3a491c] cursor-pointer transition-colors">Contact</span>
                </div>
            </header>

            <main className="flex-1 w-full max-w-7xl mx-auto px-8 flex flex-col lg:flex-row items-center justify-center gap-12 relative z-10">
                
                {/* Left Text */}
                <div className="flex-1 max-w-2xl">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="inline-block px-4 py-2 bg-[#e8f0d1] text-[#5c732c] rounded-full text-sm font-bold mb-6"
                    >
                        Portfolio 2026
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        className="text-5xl sm:text-7xl font-black tracking-tight text-[#2c3614] mb-6 leading-tight"
                    >
                        {d.name}
                    </motion.h1>
                    
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-2xl font-medium text-[#6a8039] mb-8"
                    >
                        {d.headline}
                    </motion.p>
                    
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-lg text-[#5c732c] leading-relaxed mb-10 max-w-xl"
                    >
                        {d.bio}
                    </motion.p>
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="flex flex-col sm:flex-row gap-4"
                    >
                        <button onClick={d.onVisualize} className="px-8 py-4 bg-[#8eb042] text-white rounded-[2rem] font-bold shadow-lg shadow-[#8eb042]/30 hover:bg-[#799638] transition-all flex items-center justify-center gap-3">
                            Explore Work <ArrowRight className="w-5 h-5" />
                        </button>
                        <button onClick={() => alert("Proceed to portfolio")} className="px-8 py-4 bg-white text-[#6a8039] border-2 border-[#d9e5a3] rounded-[2rem] font-bold hover:bg-[#f4f7eb] transition-all flex items-center justify-center gap-2">
                            <Download className="w-5 h-5" /> Resume
                        </button>
                    </motion.div>
                </div>

                {/* Right Image */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="flex-1 w-full max-w-lg hidden lg:block relative"
                >
                    {/* Organic Image Mask */}
                    <div className="w-full aspect-square bg-[#d9e5a3] rounded-[40%_60%_70%_30%_/_40%_50%_60%_50%] overflow-hidden relative shadow-2xl animate-[morph_8s_ease-in-out_infinite]">
                        <img src={roleImage} alt="Profile" className="w-full h-full object-cover scale-110" />
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default WaveOrganic;
