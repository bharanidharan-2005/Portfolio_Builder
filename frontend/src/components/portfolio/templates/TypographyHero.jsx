import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDownRight, Download } from 'lucide-react';

const TypographyHero = ({ d }) => {
    return (
        <div className="min-h-screen w-full bg-white text-black p-4 sm:p-8 flex flex-col font-sans">
            
            <header className="w-full flex justify-between items-start z-50 mb-12">
                <div className="text-xl font-bold">
                    {d.initials}&copy; {new Date().getFullYear()}
                </div>
                <div className="text-right text-sm font-medium text-gray-500 uppercase tracking-widest leading-relaxed">
                    Based in<br />
                    The World<br />
                    Available for<br />
                    Freelance
                </div>
            </header>

            <main className="flex-1 w-full flex flex-col justify-center max-w-7xl mx-auto">
                
                <div className="w-full border-t-2 border-black pt-8 mb-8">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-[12vw] leading-[0.8] font-black tracking-tighter uppercase break-words"
                    >
                        {d.firstName}
                    </motion.h1>
                </div>
                
                <div className="w-full border-t-2 border-black pt-8 mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        className="text-[12vw] leading-[0.8] font-black tracking-tighter uppercase break-words text-gray-400"
                    >
                        {d.lastName || 'PORTFOLIO'}
                    </motion.h1>
                    
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="max-w-sm"
                    >
                        <p className="text-xl font-bold mb-4">{d.headline}</p>
                        <p className="text-sm font-medium text-gray-600 mb-6">{d.bio}</p>
                        
                        <div className="flex gap-4">
                            <button onClick={d.onVisualize} className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors group">
                                <ArrowDownRight className="w-6 h-6 group-hover:rotate-45 transition-transform" />
                            </button>
                            <button onClick={() => alert("Proceed to portfolio")} className="h-12 px-6 border-2 border-black rounded-full font-bold uppercase text-sm hover:bg-gray-100 transition-colors flex items-center gap-2">
                                <Download className="w-4 h-4" /> CV
                            </button>
                        </div>
                    </motion.div>
                </div>
            </main>
            
            <footer className="w-full flex justify-between items-center text-xs font-bold uppercase tracking-widest border-t-2 border-black pt-4">
                <div>Scroll to explore</div>
                <div className="flex gap-4">
                    <span className="cursor-pointer hover:underline">LI</span>
                    <span className="cursor-pointer hover:underline">GH</span>
                    <span className="cursor-pointer hover:underline">TW</span>
                </div>
            </footer>
        </div>
    );
};

export default TypographyHero;
