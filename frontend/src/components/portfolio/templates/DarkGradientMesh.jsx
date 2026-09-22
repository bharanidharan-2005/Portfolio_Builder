import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Download } from 'lucide-react';

const DarkGradientMesh = ({ d }) => {
    return (
        <div className="min-h-screen w-full bg-black text-white relative overflow-hidden flex flex-col items-center justify-center p-6 font-sans">
            
            {/* Animated Mesh Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-600/30 rounded-full mix-blend-screen filter blur-[100px] animate-[pulse_6s_ease-in-out_infinite]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/30 rounded-full mix-blend-screen filter blur-[100px] animate-[pulse_8s_ease-in-out_infinite_reverse]"></div>
                <div className="absolute top-[30%] left-[30%] w-[40%] h-[40%] bg-violet-600/30 rounded-full mix-blend-screen filter blur-[80px] animate-[pulse_10s_ease-in-out_infinite]"></div>
            </div>
            
            <header className="absolute top-0 w-full px-8 py-8 flex justify-between items-center z-50">
                <div className="text-xl font-bold tracking-widest text-white/90">
                    {d.firstName}
                </div>
                <div className="hidden md:flex gap-8 text-sm font-medium text-white/60">
                    <span className="hover:text-white cursor-pointer transition-colors">Projects</span>
                    <span className="hover:text-white cursor-pointer transition-colors">About</span>
                    <span className="hover:text-white cursor-pointer transition-colors">Contact</span>
                </div>
            </header>

            <main className="relative z-10 w-full max-w-4xl flex flex-col items-center text-center mt-20">
                
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="flex flex-col items-center"
                >
                    {d.roleImage && (
                        <div className="w-32 h-32 mb-8 rounded-full overflow-hidden border-2 border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                            <img src={d.roleImage} alt={d.name} className="w-full h-full object-cover" />
                        </div>
                    )}
                    <h1 className="text-6xl md:text-8xl lg:text-9xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/40 mb-6">
                        {d.name}
                    </h1>
                </motion.div>
                
                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="text-2xl md:text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400 mb-8"
                >
                    {d.headline}
                </motion.p>
                
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="text-lg md:text-xl font-light text-white/60 max-w-2xl leading-relaxed mb-12"
                >
                    {d.bio}
                </motion.p>
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.6 }}
                    className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto"
                >
                    <button onClick={d.onVisualize} className="px-8 py-4 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-3">
                        View Projects <ArrowRight className="w-5 h-5" />
                    </button>
                    <button onClick={() => alert("Proceed to portfolio")} className="px-8 py-4 bg-white/10 text-white backdrop-blur-md border border-white/20 rounded-full font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-3">
                        <Download className="w-5 h-5" /> Resume
                    </button>
                </motion.div>
                
            </main>
        </div>
    );
};

export default DarkGradientMesh;
