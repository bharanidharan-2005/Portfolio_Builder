import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Download, Database, Code2, Layers, Cpu, Globe, Cloud, LayoutTemplate, Activity } from 'lucide-react';

// Reusable Premium Hero Component
const PremiumHero = ({ d, config }) => {
    const { bgClass, textClass, accentClass, buttonClass, layoutDir, RightVisual, hideStatus } = config;
    
    return (
        <div className={`min-h-screen flex flex-col w-full relative overflow-hidden transition-colors duration-700 ${bgClass} ${textClass}`}>
            
            {/* Navbar */}
            <header className="w-full relative z-50">
                <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shadow-inner ${buttonClass} text-white`}>
                            {d.initials}
                        </div>
                        <span className="font-black tracking-widest uppercase hidden sm:block text-sm md:text-base"> 
                            {d.firstName} 
                        </span>
                    </div>
                    
                    <div className="hidden lg:flex items-center gap-8 opacity-80 font-semibold text-sm">
                        <span className="hover:opacity-100 cursor-pointer transition-opacity">About</span>
                        <span className="hover:opacity-100 cursor-pointer transition-opacity">Skills</span>
                        <span className="hover:opacity-100 cursor-pointer transition-opacity">Projects</span>
                        <span className="hover:opacity-100 cursor-pointer transition-opacity">Experience</span>
                        <span className="hover:opacity-100 cursor-pointer transition-opacity">Contact</span>
                    </div>
                    
                    <button className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-lg hover:shadow-xl text-white flex items-center gap-2 ${buttonClass}`}>
                        Resume
                    </button>
                </div>
            </header>

            {/* Main Hero Content */}
            <main className={`flex-1 flex flex-col ${layoutDir} items-center justify-center p-6 lg:p-12 xl:p-24 gap-12 lg:gap-20 max-w-7xl mx-auto w-full relative z-10`}>
                
                {/* Left Column (Text & Buttons) */}
                <div className={`flex-1 w-full space-y-8 flex flex-col ${layoutDir.includes('row-reverse') ? 'lg:items-end text-center lg:text-right' : 'lg:items-start text-center lg:text-left'} items-center`}>
                    
                    {!hideStatus && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border border-white/10 shadow-sm bg-white/5 backdrop-blur-md`}
                        >
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="opacity-90">Open to opportunities</span>
                        </motion.div>
                    )}

                    <div className="space-y-4 w-full">
                        <motion.h1
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 50 }}
                            className="font-black tracking-tight leading-tight w-full"
                            style={{ fontSize: 'clamp(40px, 5vw, 72px)' }}
                        >
                            {d.name}
                        </motion.h1>
                        
                        <motion.p 
                            initial={{ opacity: 0, y: 15 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            transition={{ type: "spring", stiffness: 50, delay: 0.1 }}
                            className={`text-xl md:text-2xl font-bold w-full ${accentClass}`}
                        >
                            {d.headline}
                        </motion.p>
                        
                        <motion.p 
                            initial={{ opacity: 0, y: 15 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            transition={{ type: "spring", stiffness: 50, delay: 0.15 }}
                            className="text-lg md:text-xl leading-relaxed w-full max-w-xl font-medium opacity-80"
                        >
                            {d.bio}
                        </motion.p>
                    </div>

                    <motion.div 
                        initial={{ opacity: 0, y: 15 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ type: "spring", stiffness: 50, delay: 0.2 }}
                        className={`flex flex-wrap items-center gap-4 pt-4 w-full ${layoutDir.includes('row-reverse') ? 'justify-center lg:justify-end' : 'justify-center lg:justify-start'}`}
                    >
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={d.onVisualize}
                            className={`px-8 py-4 rounded-xl text-sm md:text-base font-bold transition-all shadow-lg hover:shadow-xl text-white flex items-center gap-2 ${buttonClass}`}
                        >
                            View My Work <ArrowRight className="w-5 h-5" />
                        </motion.button>
                        
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-8 py-4 rounded-xl text-sm md:text-base font-bold transition-all bg-transparent hover:bg-white/10 border border-current shadow-sm hover:shadow-md flex items-center gap-2"
                        >
                            Download Resume <Download className="w-5 h-5" />
                        </motion.button>
                    </motion.div>
                </div>

                {/* Right Column (Visual) */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    transition={{ type: "spring", damping: 20, stiffness: 40, delay: 0.3 }}
                    className="flex-1 w-full flex justify-center relative"
                >
                    {RightVisual && <RightVisual d={d} />}
                </motion.div>

            </main>
        </div>
    );
};

// --- Custom Right Visuals for the 15 Templates ---

const ImageVisual = () => (
    <motion.div animate={{ y: [-15, 15, -15], rotateZ: [-2, 2, -2] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="relative w-[300px] h-[300px] md:w-[450px] md:h-[450px] lg:w-[500px] lg:h-[500px]">
        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-[100px]"></div>
        <img src="/3d_developer_workspace.jpg" alt="Developer Workspace" className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-90 rounded-3xl drop-shadow-2xl" />
    </motion.div>
);

const AbstractCodeBlocks = () => (
    <div className="relative w-full max-w-md h-[400px]">
        <motion.div animate={{ y: [-20, 20, -20] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute top-10 right-10 w-64 h-40 bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-2xl p-4 shadow-2xl">
            <div className="w-full h-2 bg-slate-700 rounded mb-4"></div>
            <div className="w-3/4 h-2 bg-blue-500 rounded mb-2"></div>
            <div className="w-1/2 h-2 bg-emerald-500 rounded mb-2"></div>
            <div className="w-5/6 h-2 bg-purple-500 rounded mb-2"></div>
            <Code2 className="absolute bottom-4 right-4 w-8 h-8 text-blue-500/50" />
        </motion.div>
        <motion.div animate={{ y: [20, -20, 20] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-10 left-0 w-56 h-48 bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-2xl p-4 shadow-2xl">
            <Database className="w-10 h-10 text-emerald-400 mb-4" />
            <div className="w-full h-2 bg-slate-700 rounded mb-2"></div>
            <div className="w-2/3 h-2 bg-slate-700 rounded mb-2"></div>
            <div className="w-full h-2 bg-emerald-500/50 rounded mb-2"></div>
        </motion.div>
    </div>
);

const GeometricSpheres = () => (
    <div className="relative w-full max-w-md h-[400px] flex items-center justify-center perspective-[1000px]">
        <motion.div animate={{ rotateX: 360, rotateY: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="w-64 h-64 border border-blue-500/30 rounded-full flex items-center justify-center preserve-3d">
            <motion.div animate={{ rotateX: -360, rotateY: -360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="w-48 h-48 border border-purple-500/40 rounded-full preserve-3d">
                <Globe className="w-full h-full text-blue-500/20" />
            </motion.div>
        </motion.div>
    </div>
);

const FloatIcons = () => (
    <div className="relative w-full max-w-md h-[400px] flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-full blur-[80px]"></div>
        {[Layers, Cpu, Cloud, LayoutTemplate, Activity, Code2].map((Icon, i) => (
            <motion.div 
                key={i}
                animate={{ y: [0, -30, 0], x: [0, (i%2==0?20:-20), 0] }}
                transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
                className="absolute"
                style={{ top: `${15 + (i * 15)}%`, left: `${10 + (i * 15)}%` }}
            >
                <div className="p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl">
                    <Icon className={`w-8 h-8 ${i%2==0 ? 'text-blue-400' : 'text-purple-400'}`} />
                </div>
            </motion.div>
        ))}
    </div>
);


const PortfolioFrontpage = ({ userData, sections, themeMode, onVisualize }) => {
    const templateId = userData?.frontpageTemplate || "template1";

    const heroSec = sections.find(s => s.section_type === 'hero');
    const aboutSec = sections.find(s => s.section_type === 'about');

    const name = heroSec?.content_data?.heading || userData?.name || "Professional Developer";
    const headline = heroSec?.content_data?.subheading || "Software Engineer | Tech Enthusiast";
    const bio = aboutSec?.content_data?.bio || "Building intelligent applications with modern web technologies and creating scalable solutions.";
    const firstName = name.split(' ')[0];
    const initials = name.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();

    const d = { name, headline, bio, firstName, initials, onVisualize };

    // Define 15 Configurations
    const configs = {
        template1: { bgClass: 'bg-[#05050A]', textClass: 'text-white', accentClass: 'text-blue-400', buttonClass: 'bg-blue-600', layoutDir: 'lg:flex-row', RightVisual: ImageVisual },
        template2: { bgClass: 'bg-slate-950', textClass: 'text-white', accentClass: 'text-emerald-400', buttonClass: 'bg-emerald-600', layoutDir: 'lg:flex-row-reverse', RightVisual: AbstractCodeBlocks },
        template3: { bgClass: 'bg-[#0f172a]', textClass: 'text-slate-100', accentClass: 'text-purple-400', buttonClass: 'bg-purple-600', layoutDir: 'lg:flex-row', RightVisual: GeometricSpheres },
        template4: { bgClass: 'bg-zinc-950', textClass: 'text-zinc-100', accentClass: 'text-rose-400', buttonClass: 'bg-rose-600', layoutDir: 'lg:flex-row', RightVisual: FloatIcons },
        template5: { bgClass: 'bg-[#1e1e2e]', textClass: 'text-[#cdd6f4]', accentClass: 'text-[#89b4fa]', buttonClass: 'bg-[#89b4fa]', layoutDir: 'lg:flex-row-reverse', RightVisual: ImageVisual },
        
        template6: { bgClass: 'bg-[#0B0C10]', textClass: 'text-[#C5C6C7]', accentClass: 'text-[#66FCF1]', buttonClass: 'bg-[#45A29E]', layoutDir: 'lg:flex-row', RightVisual: AbstractCodeBlocks },
        template7: { bgClass: 'bg-black', textClass: 'text-gray-200', accentClass: 'text-yellow-400', buttonClass: 'bg-yellow-600', layoutDir: 'lg:flex-row-reverse', RightVisual: GeometricSpheres },
        template8: { bgClass: 'bg-indigo-950', textClass: 'text-indigo-100', accentClass: 'text-indigo-400', buttonClass: 'bg-indigo-600', layoutDir: 'lg:flex-row', RightVisual: FloatIcons },
        template9: { bgClass: 'bg-[#121212]', textClass: 'text-[#E0E0E0]', accentClass: 'text-[#BB86FC]', buttonClass: 'bg-[#BB86FC]', layoutDir: 'lg:flex-row', RightVisual: ImageVisual },
        template10: { bgClass: 'bg-slate-900', textClass: 'text-slate-200', accentClass: 'text-cyan-400', buttonClass: 'bg-cyan-600', layoutDir: 'lg:flex-row-reverse', RightVisual: AbstractCodeBlocks },
        
        template11: { bgClass: 'bg-[#282c34]', textClass: 'text-[#abb2bf]', accentClass: 'text-[#61afef]', buttonClass: 'bg-[#61afef]', layoutDir: 'lg:flex-row', RightVisual: FloatIcons },
        template12: { bgClass: 'bg-gray-950', textClass: 'text-gray-100', accentClass: 'text-orange-400', buttonClass: 'bg-orange-600', layoutDir: 'lg:flex-row-reverse', RightVisual: GeometricSpheres },
        template13: { bgClass: 'bg-[#1a1a1a]', textClass: 'text-[#f2f2f2]', accentClass: 'text-[#ff6b6b]', buttonClass: 'bg-[#ff6b6b]', layoutDir: 'lg:flex-row', RightVisual: ImageVisual },
        template14: { bgClass: 'bg-[#0d1117]', textClass: 'text-[#c9d1d9]', accentClass: 'text-[#58a6ff]', buttonClass: 'bg-[#1f6feb]', layoutDir: 'lg:flex-row-reverse', RightVisual: AbstractCodeBlocks },
        template15: { bgClass: 'bg-[#11111b]', textClass: 'text-[#cdd6f4]', accentClass: 'text-[#f38ba8]', buttonClass: 'bg-[#f38ba8]', layoutDir: 'lg:flex-row', RightVisual: FloatIcons },
    };

    const currentConfig = configs[templateId] || configs.template1;

    return <PremiumHero d={d} config={currentConfig} />;
};

export default PortfolioFrontpage;
