import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Download } from 'lucide-react';
import { getRoleImage } from '../PortfolioFrontpage';

const SplitScreen = ({ d }) => {
    const roleImage = getRoleImage(d.headline);
    
    return (
        <div className="min-h-screen w-full flex flex-col lg:flex-row relative overflow-hidden bg-slate-900">
            {/* Left Text Half */}
            <div className="flex-1 lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-20 relative z-10 bg-slate-950">
                <header className="absolute top-0 left-0 w-full px-8 sm:px-16 lg:px-24 py-8 flex justify-between items-center">
                    <div className="text-xl font-black tracking-widest text-white">{d.firstName}.</div>
                </header>

                <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="w-full max-w-xl"
                >
                    <div className="w-16 h-1 bg-blue-500 mb-8"></div>
                    
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] text-white mb-6">
                        {d.name.split(' ').map((word, i) => (
                            <span key={i} className="block">{word}</span>
                        ))}
                    </h1>
                    
                    <p className="text-xl font-bold text-blue-400 mb-6">
                        {d.headline}
                    </p>
                    
                    <p className="text-lg font-medium text-slate-400 leading-relaxed mb-10 max-w-lg">
                        {d.bio}
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                        <button onClick={d.onVisualize} className="px-8 py-4 bg-blue-600 text-white rounded-none text-sm font-bold hover:bg-blue-500 transition-all flex items-center gap-3">
                            View Work <ArrowRight className="w-4 h-4" />
                        </button>
                        <button onClick={() => alert("Please proceed to your main portfolio to download the dynamically generated PDF resume.")} className="px-8 py-4 bg-transparent border border-slate-700 text-slate-300 rounded-none text-sm font-bold hover:bg-white/5 transition-all flex items-center gap-2">
                            <Download className="w-4 h-4" /> Resume
                        </button>
                    </div>
                </motion.div>
                
                {/* Minimal Footer Navbar on Left */}
                <div className="absolute bottom-0 left-0 w-full px-8 sm:px-16 lg:px-24 py-8 flex gap-8 text-xs font-bold tracking-widest text-slate-500 uppercase">
                    <span className="hover:text-white cursor-pointer transition-colors">LinkedIn</span>
                    <span className="hover:text-white cursor-pointer transition-colors">GitHub</span>
                    <span className="hover:text-white cursor-pointer transition-colors">Twitter</span>
                </div>
            </div>

            {/* Right Image Half */}
            <div className="hidden lg:block lg:w-1/2 relative h-screen">
                <motion.div 
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="absolute inset-0"
                >
                    <div className="absolute inset-0 bg-blue-900/20 mix-blend-multiply z-10"></div>
                    <img src={roleImage} alt="Hero" className="w-full h-full object-cover" />
                </motion.div>
            </div>
        </div>
    );
};

export default SplitScreen;
