import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Download, Github, Linkedin, Mail } from 'lucide-react';
import { getRoleImage } from '../PortfolioFrontpage';

const CardFlip3D = ({ d }) => {
    const roleImage = getRoleImage(d.headline);
    
    return (
        <div className="min-h-screen w-full bg-slate-100 flex items-center justify-center p-4 sm:p-8 perspective-1000">
            
            <div className="w-full max-w-6xl h-[800px] md:h-[600px] relative group [transform-style:preserve-3d] transition-transform duration-1000 hover:[transform:rotateY(180deg)]">
                
                {/* Front of Card */}
                <div className="absolute inset-0 w-full h-full bg-white rounded-[2rem] shadow-2xl p-8 md:p-12 flex flex-col md:flex-row gap-8 backface-hidden [backface-visibility:hidden]">
                    <div className="flex-1 flex flex-col justify-between">
                        <header>
                            <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg shadow-blue-600/30 mb-8">
                                {d.initials}
                            </div>
                            <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight mb-4">{d.name}</h1>
                            <p className="text-2xl font-bold text-blue-600 mb-6">{d.headline}</p>
                            <p className="text-lg text-slate-600 font-medium max-w-md line-clamp-4">{d.bio}</p>
                        </header>
                        
                        <div className="mt-8">
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Hover card to flip &rarr;</p>
                            <div className="flex gap-4">
                                <button onClick={d.onVisualize} className="px-8 py-4 bg-slate-900 text-white rounded-xl font-bold shadow-xl shadow-slate-900/20 hover:scale-105 transition-transform">
                                    View Projects
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex-1 rounded-2xl overflow-hidden shadow-inner relative">
                        <img src={roleImage} alt="Profile" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        <div className="absolute bottom-6 left-6 text-white font-bold tracking-widest uppercase text-sm">
                            {d.firstName} &copy; {new Date().getFullYear()}
                        </div>
                    </div>
                </div>

                {/* Back of Card */}
                <div className="absolute inset-0 w-full h-full bg-slate-900 text-white rounded-[2rem] shadow-2xl p-8 md:p-12 flex flex-col items-center justify-center text-center backface-hidden [backface-visibility:hidden] [transform:rotateY(180deg)] border border-slate-700">
                    <h2 className="text-4xl font-black mb-8 text-blue-400">Let's Connect</h2>
                    
                    <p className="text-xl font-medium text-slate-300 max-w-2xl mb-12">
                        I'm always open to discussing product design work or partnership opportunities.
                    </p>
                    
                    <div className="flex gap-6 mb-12">
                        <a href="#" className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                            <Github className="w-8 h-8" />
                        </a>
                        <a href="#" className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                            <Linkedin className="w-8 h-8" />
                        </a>
                        <a href="#" className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                            <Mail className="w-8 h-8" />
                        </a>
                    </div>
                    
                    <button onClick={() => alert("Proceed to portfolio")} className="px-10 py-5 bg-white text-slate-900 rounded-xl font-black uppercase tracking-widest hover:bg-blue-50 transition-colors flex items-center gap-3">
                        <Download className="w-5 h-5" /> Download Resume
                    </button>
                </div>

            </div>
        </div>
    );
};

export default CardFlip3D;
