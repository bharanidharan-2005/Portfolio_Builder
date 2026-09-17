import React, { useState, useEffect } from 'react';
import { ArrowRight, ChevronRight, Play, Eye, Sparkles, Github, Linkedin, Twitter, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PortfolioFrontpage = ({ userData, sections, themeMode, onVisualize }) => {
    const templateId = userData?.frontpageTemplate || "template1";
    const isLight = themeMode === 'light';

    // Extract Data
    const heroSec = sections.find(s => s.section_type === 'hero');
    const eduSec = sections.find(s => s.section_type === 'education');
    const aboutSec = sections.find(s => s.section_type === 'about');
    const contactSec = sections.find(s => s.section_type === 'contact');

    const name = heroSec?.content_data?.heading || userData?.name || "Professional";
    const headline = heroSec?.content_data?.subheading || "Welcome to my portfolio";
    const bio = aboutSec?.content_data?.bio || "A passionate professional dedicated to building exceptional experiences.";
    const latestEdu = eduSec?.content_data?.schools?.[0] || null;
    
    // Social Links
    const socialLinks = contactSec?.content_data?.socials || [
        { platform: 'github', url: '#' },
        { platform: 'linkedin', url: '#' },
        { platform: 'twitter', url: '#' }
    ];

    const data = { name, headline, bio, latestEdu, socialLinks, isLight, onVisualize };

    // Common Animation Variants
    const staggerContainer = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.2, delayChildren: 0.3 }
        }
    };

    const fadeUp = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
    };

    const SocialIcons = ({ d, className = "" }) => (
        <motion.div variants={fadeUp} className={`flex items-center gap-4 ${className}`}>
            {d.socialLinks.map((s, i) => {
                let Icon = Mail;
                if (s.platform.toLowerCase() === 'github') Icon = Github;
                if (s.platform.toLowerCase() === 'linkedin') Icon = Linkedin;
                if (s.platform.toLowerCase() === 'twitter') Icon = Twitter;
                return (
                    <motion.a 
                        key={i} href={s.url} target="_blank" rel="noreferrer"
                        whileHover={{ scale: 1.2, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                        className={`p-2 rounded-full border transition-colors ${d.isLight ? 'border-slate-300 hover:bg-slate-100 text-slate-600' : 'border-slate-700 hover:bg-slate-800 text-slate-300'}`}
                    >
                        <Icon className="w-4 h-4" />
                    </motion.a>
                );
            })}
        </motion.div>
    );

    // --- Templates ---

    const Template1 = ({d}) => (
        <div className={`min-h-screen flex flex-col items-center justify-center text-center p-8 transition-colors duration-700 ${d.isLight ? 'bg-[#FAFAFA] text-slate-900' : 'bg-[#05050A] text-white'}`}>
            <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col items-center max-w-4xl">
                <motion.div variants={fadeUp} className="w-16 h-[1px] mb-8 bg-slate-500/50"></motion.div>
                <motion.h1 variants={fadeUp} className="text-6xl md:text-8xl font-black tracking-tighter mb-6">{d.name}</motion.h1>
                <motion.p variants={fadeUp} className={`text-xl md:text-2xl font-light mb-12 tracking-wide ${d.isLight ? 'text-slate-500' : 'text-slate-400'}`}>{d.headline}</motion.p>
                
                {d.latestEdu && (
                    <motion.div variants={fadeUp} className={`mb-12 inline-flex items-center gap-3 px-6 py-2.5 rounded-full border text-sm backdrop-blur-sm ${d.isLight ? 'border-slate-200 bg-white/50 shadow-sm' : 'border-slate-800 bg-white/5'}`}>
                        <span className="opacity-50">🎓</span> <span className="font-medium">{d.latestEdu.degree}</span> <span className="opacity-40">|</span> <span>{d.latestEdu.school}</span>
                    </motion.div>
                )}
                
                <SocialIcons d={d} className="mb-12" />

                <motion.button 
                    variants={fadeUp}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={d.onVisualize} 
                    className={`group relative inline-flex items-center justify-center px-10 py-5 font-bold text-white transition-all duration-300 rounded-full overflow-hidden shadow-2xl ${d.isLight ? 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20' : 'bg-white text-black hover:bg-slate-200 shadow-white/10'}`}
                >
                    <span className="relative z-10 flex items-center gap-3">
                        Visualize Portfolio <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                    </span>
                </motion.button>
            </motion.div>
        </div>
    );

    const Template2 = ({d}) => (
        <div className={`min-h-screen flex flex-col md:flex-row transition-colors duration-700 ${d.isLight ? 'bg-white text-slate-900' : 'bg-[#0B0C10] text-white'}`}>
            <motion.div variants={staggerContainer} initial="hidden" animate="show" className={`flex-1 flex flex-col justify-center p-12 lg:p-24 ${d.isLight ? 'bg-slate-50' : 'bg-[#15161D]'}`}>
                <motion.div variants={fadeUp} className="w-16 h-1 bg-blue-500 mb-8 rounded-full"></motion.div>
                <motion.h1 variants={fadeUp} className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">{d.name}</motion.h1>
                <motion.p variants={fadeUp} className="text-xl text-blue-500 mb-8 font-medium">{d.headline}</motion.p>
                <motion.p variants={fadeUp} className="text-slate-500 leading-relaxed mb-12 max-w-md text-lg">{d.bio.substring(0,150)}...</motion.p>
                
                <motion.div variants={fadeUp} className="flex items-center gap-6">
                    <motion.button 
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={d.onVisualize} 
                        className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30 flex items-center gap-3"
                    >
                        Enter Workspace <Play className="w-4 h-4 fill-current" />
                    </motion.button>
                    <SocialIcons d={d} />
                </motion.div>
            </motion.div>
            <div className="flex-1 relative overflow-hidden">
                <motion.div initial={{ scale: 1.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.5 }} className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 opacity-30 mix-blend-multiply"></div>
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070')] bg-cover bg-center mix-blend-overlay"></div>
                </motion.div>
            </div>
        </div>
    );

    const Template3 = ({d}) => (
        <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden">
            <motion.div 
                animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-white/10 blur-[100px]"
            />
            <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>
            
            <motion.div 
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", bounce: 0.4, duration: 1 }}
                className="relative z-10 w-full max-w-3xl p-12 md:p-20 backdrop-blur-3xl bg-white/10 rounded-[3rem] border border-white/30 shadow-[0_20px_50px_rgba(0,0,0,0.3)] text-white text-center overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent"></div>
                <h1 className="text-5xl md:text-7xl font-black mb-6 drop-shadow-lg relative z-10">{d.name}</h1>
                <h2 className="text-2xl font-light mb-10 opacity-90 relative z-10">{d.headline}</h2>
                <div className="flex justify-center mb-10 relative z-10"><SocialIcons d={d} className="[&_a]:border-white/30 [&_a]:text-white [&_a:hover]:bg-white/20" /></div>
                
                <motion.button 
                    whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={d.onVisualize} 
                    className="relative z-10 px-12 py-5 bg-white text-purple-600 rounded-full font-bold text-lg transition-all"
                >
                    View Portfolio
                </motion.button>
            </motion.div>
        </div>
    );

    const Template4 = ({d}) => (
        <div className={`min-h-screen flex items-center justify-center p-8 ${d.isLight ? 'bg-yellow-300 text-black' : 'bg-red-500 text-black'}`}>
            <motion.div 
                initial={{ opacity: 0, rotate: -2 }}
                animate={{ opacity: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="border-4 border-black bg-white p-12 md:p-20 shadow-[16px_16px_0_0_rgba(0,0,0,1)] hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-x-2 hover:translate-y-2 transition-all duration-300 max-w-4xl w-full"
            >
                <h1 className="text-6xl md:text-8xl font-black uppercase mb-6 border-b-8 border-black pb-6">{d.name}</h1>
                <p className="text-3xl font-bold mb-12">{d.headline}</p>
                <SocialIcons d={d} className="mb-12 [&_a]:border-black [&_a]:border-4 [&_a]:rounded-none [&_a]:text-black hover:[&_a]:bg-black hover:[&_a]:text-white" />
                <button onClick={d.onVisualize} className="w-full py-6 bg-black text-white text-3xl font-black uppercase border-4 border-black hover:bg-white hover:text-black transition-colors">
                    Explore
                </button>
            </motion.div>
        </div>
    );

    const Template5 = ({d}) => {
        const [text, setText] = useState("");
        const fullText = `> ${d.headline}_`;
        
        useEffect(() => {
            let i = 0;
            const timer = setInterval(() => {
                setText(fullText.slice(0, i));
                i++;
                if (i > fullText.length) clearInterval(timer);
            }, 50);
            return () => clearInterval(timer);
        }, [fullText]);

        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-cyan-400 font-mono p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10 border-2 border-cyan-500/50 bg-black/80 p-12 md:p-16 backdrop-blur-sm shadow-[0_0_40px_rgba(0,255,255,0.15)] max-w-3xl w-full"
                >
                    <div className="text-xs mb-6 text-cyan-700 flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div> SYSTEM.INITIALIZE()
                    </div>
                    
                    <motion.h1 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-5xl md:text-7xl font-bold mb-4 uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500"
                    >
                        {d.name}
                    </motion.h1>
                    
                    <h2 className="text-xl md:text-2xl text-fuchsia-500 mb-12 h-8">{text}</h2>
                    <SocialIcons d={d} className="mb-12 [&_a]:border-cyan-500/50 [&_a]:text-cyan-500 hover:[&_a]:bg-cyan-500/20" />
                    
                    <motion.button 
                        whileHover={{ scale: 1.02, backgroundColor: "rgba(34, 211, 238, 0.1)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={d.onVisualize} 
                        className="w-full py-5 border-2 border-cyan-400 text-cyan-400 transition-all flex justify-between px-8 font-bold tracking-widest hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                    >
                        <span>EXECUTE_VIEW.exe</span> <span className="animate-pulse">[ENTER]</span>
                    </motion.button>
                </motion.div>
            </div>
        );
    };

    const Template6 = ({d}) => (
        <div className={`min-h-screen p-4 md:p-8 flex items-center justify-center ${d.isLight ? 'bg-slate-100' : 'bg-[#0F111A]'}`}>
            <motion.div variants={staggerContainer} initial="hidden" animate="show" className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[250px]">
                <motion.div variants={fadeUp} className={`col-span-1 md:col-span-3 row-span-2 rounded-[2.5rem] p-12 flex flex-col justify-end relative overflow-hidden ${d.isLight ? 'bg-white shadow-xl' : 'bg-slate-900 border border-slate-800'}`}>
                    <div className="absolute top-0 right-0 p-8 opacity-10"><Sparkles className="w-48 h-48"/></div>
                    <h1 className={`text-6xl md:text-8xl font-black mb-6 ${d.isLight ? 'text-slate-900' : 'text-white'}`}>{d.name}</h1>
                    <p className="text-3xl text-blue-500 mb-8">{d.headline}</p>
                    <SocialIcons d={d} />
                </motion.div>
                
                <motion.div variants={fadeUp} className={`rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center ${d.isLight ? 'bg-blue-600 text-white shadow-xl' : 'bg-blue-600 text-white'}`}>
                    <span className="text-5xl mb-4">🎓</span>
                    <h3 className="font-bold text-xl">{d.latestEdu ? d.latestEdu.degree : "Education"}</h3>
                </motion.div>
                
                <motion.button 
                    variants={fadeUp}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={d.onVisualize} 
                    className={`rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center group cursor-pointer shadow-xl ${d.isLight ? 'bg-black text-white' : 'bg-white text-black'}`}
                >
                    <Eye className="w-16 h-16 mb-6 group-hover:text-blue-500 transition-colors" />
                    <h3 className="font-black uppercase tracking-widest text-lg">Visualize</h3>
                </motion.button>
            </motion.div>
        </div>
    );

    const Template7 = ({d}) => (
        <div className={`min-h-screen flex items-center p-12 lg:p-32 font-serif transition-colors duration-700 ${d.isLight ? 'bg-[#F9F6F0] text-[#2C3E35]' : 'bg-[#1A1A1A] text-[#E8E3D9]'}`}>
            <motion.div variants={staggerContainer} initial="hidden" animate="show" className="max-w-4xl relative z-10">
                <motion.p variants={fadeUp} className="text-xs md:text-sm tracking-[0.4em] uppercase mb-10 opacity-60 flex items-center gap-4">
                    <span className={`w-12 h-[1px] ${d.isLight ? 'bg-[#2C3E35]' : 'bg-[#E8E3D9]'}`}></span> Portfolio Of
                </motion.p>
                <motion.h1 variants={fadeUp} className="text-6xl md:text-8xl lg:text-[9rem] font-medium leading-[0.9] mb-10 tracking-tight">{d.name}</motion.h1>
                <motion.p variants={fadeUp} className="text-2xl md:text-4xl italic opacity-80 mb-16 font-light">{d.headline}</motion.p>
                
                <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-start sm:items-center gap-12">
                    <button onClick={d.onVisualize} className={`group flex items-center gap-4 text-lg tracking-widest uppercase transition-all`}>
                        <span className={`border-b-2 pb-1 ${d.isLight ? 'border-[#2C3E35]' : 'border-[#E8E3D9]'}`}>Discover</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                    </button>
                    <SocialIcons d={d} className="opacity-60 hover:opacity-100 transition-opacity" />
                </motion.div>
            </motion.div>
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 0.03, scale: 1 }} transition={{ duration: 2 }}
                className="absolute right-[-10%] top-1/2 -translate-y-1/2 text-[40rem] font-black leading-none pointer-events-none overflow-hidden"
            >
                {d.name.charAt(0)}
            </motion.div>
        </div>
    );

    const Template8 = ({d}) => (
        <div className="min-h-screen flex flex-col items-center justify-center text-white relative overflow-hidden bg-black">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 50, repeat: Infinity, ease: "linear" }} className="absolute top-[-50%] left-[-20%] w-[100vw] h-[100vw] rounded-full bg-purple-900/30 blur-[150px]"></motion.div>
            <motion.div animate={{ rotate: -360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }} className="absolute bottom-[-50%] right-[-20%] w-[100vw] h-[100vw] rounded-full bg-blue-900/30 blur-[150px]"></motion.div>
            
            <motion.div variants={staggerContainer} initial="hidden" animate="show" className="relative z-10 text-center max-w-4xl px-8">
                <motion.h1 variants={fadeUp} className="text-7xl md:text-9xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-8 pb-2 tracking-tighter">{d.name}</motion.h1>
                <motion.p variants={fadeUp} className="text-2xl md:text-4xl font-light text-slate-300 mb-16">{d.headline}</motion.p>
                <motion.div variants={fadeUp} className="flex justify-center mb-12"><SocialIcons d={d} className="[&_a]:border-white/20 hover:[&_a]:bg-white/10" /></motion.div>
                
                <motion.button variants={fadeUp} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={d.onVisualize} className="px-10 py-5 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 backdrop-blur-md transition-all flex items-center gap-3 mx-auto text-lg font-bold">
                    <Sparkles className="w-5 h-5" /> Launch Experience
                </motion.button>
            </motion.div>
        </div>
    );

    const Template9 = ({d}) => (
        <div className={`min-h-screen flex flex-col justify-between p-8 md:p-16 transition-colors duration-700 ${d.isLight ? 'bg-white text-black' : 'bg-black text-white'}`}>
            <motion.nav initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center text-sm font-bold uppercase tracking-widest">
                <span>{d.name.split(' ')[0]}</span>
                <SocialIcons d={d} className="border-none" />
                <span>{new Date().getFullYear()}</span>
            </motion.nav>
            
            <motion.div variants={staggerContainer} initial="hidden" animate="show" className="py-20">
                <motion.h1 variants={fadeUp} className="text-[14vw] leading-none font-black tracking-tighter uppercase break-words">{d.headline.split(' ')[0] || "CREATIVE"}</motion.h1>
                <motion.h1 variants={fadeUp} className="text-[14vw] leading-none font-black tracking-tighter uppercase text-blue-600">{d.headline.split(' ').slice(1).join(' ') || "DEVELOPER"}</motion.h1>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex justify-end">
                <button onClick={d.onVisualize} className="text-3xl md:text-5xl font-bold underline hover:text-blue-600 transition-colors">
                    View Portfolio ↗
                </button>
            </motion.div>
        </div>
    );

    const Template10 = ({d}) => {
        const [flipped, setFlipped] = useState(false);
        return (
            <div className={`min-h-screen flex items-center justify-center perspective-[2000px] ${d.isLight ? 'bg-slate-200' : 'bg-[#0B0C10]'}`}>
                <motion.div 
                    animate={{ rotateY: flipped ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 40, damping: 15 }}
                    className={`relative w-[350px] h-[550px] md:w-[450px] md:h-[650px] preserve-3d cursor-pointer shadow-2xl rounded-[3rem]`}
                    onClick={() => setFlipped(!flipped)}
                >
                    {/* Front */}
                    <div className="absolute inset-0 backface-hidden rounded-[3rem] p-10 flex flex-col justify-between bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
                        <div className="text-right opacity-80"><Sparkles className="w-8 h-8 ml-auto"/></div>
                        <div>
                            <p className="text-sm uppercase tracking-widest mb-4 opacity-80 font-medium">Interactive ID</p>
                            <h2 className="text-5xl font-black mb-4 leading-tight">{d.name}</h2>
                            <p className="text-lg opacity-90 flex items-center gap-2">Click to flip <ArrowRight className="w-4 h-4"/></p>
                        </div>
                    </div>
                    {/* Back */}
                    <div className={`absolute inset-0 backface-hidden rotate-y-180 rounded-[3rem] p-10 flex flex-col items-center justify-center text-center shadow-2xl ${d.isLight ? 'bg-white text-slate-900' : 'bg-slate-900 border border-slate-700 text-white'}`}>
                        <div className={`w-24 h-24 rounded-full mb-6 flex items-center justify-center text-4xl font-black ${d.isLight ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-900/50 text-indigo-400'}`}>
                            {d.name.charAt(0)}
                        </div>
                        <h3 className="text-3xl font-bold mb-4">{d.headline}</h3>
                        <p className="mb-8 opacity-70 text-base leading-relaxed max-w-sm">{d.bio.substring(0, 150)}...</p>
                        
                        <div className="flex gap-4 mb-10" onClick={(e) => e.stopPropagation()}>
                            <SocialIcons d={d} />
                        </div>
                        
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => { e.stopPropagation(); d.onVisualize(); }} 
                            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors shadow-lg text-lg"
                        >
                            Open Portfolio
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        );
    };

    const Template11 = ({d}) => (
        <div className={`min-h-screen flex items-center justify-center p-8 relative overflow-hidden transition-colors duration-700 ${d.isLight ? 'bg-emerald-50 text-emerald-950' : 'bg-[#05100a] text-emerald-50'}`}>
            <motion.div animate={{ y: [0, 20, 0] }} transition={{ duration: 8, repeat: Infinity }} className="absolute top-0 left-0 w-full h-64 bg-emerald-400/20 rounded-b-[100%] blur-3xl"></motion.div>
            <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 6, repeat: Infinity }} className="absolute bottom-0 right-0 w-96 h-96 bg-teal-500/20 rounded-t-[100%] blur-3xl"></motion.div>
            
            <motion.div variants={staggerContainer} initial="hidden" animate="show" className="relative z-10 text-center max-w-4xl">
                <motion.h1 variants={fadeUp} className="text-7xl md:text-9xl font-serif italic mb-6">{d.name}</motion.h1>
                <motion.p variants={fadeUp} className="text-2xl md:text-4xl font-light mb-12 tracking-widest uppercase opacity-80">{d.headline}</motion.p>
                <motion.div variants={fadeUp} className="flex justify-center mb-16"><SocialIcons d={d} className="[&_a]:border-emerald-500/30 hover:[&_a]:bg-emerald-500/10" /></motion.div>
                
                <motion.button 
                    variants={fadeUp} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={d.onVisualize} 
                    className={`px-12 py-5 rounded-full border-2 font-bold tracking-widest uppercase transition-all ${d.isLight ? 'border-emerald-900 text-emerald-900 hover:bg-emerald-900 hover:text-white' : 'border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-black'}`}
                >
                    Enter
                </motion.button>
            </motion.div>
        </div>
    );

    const Template12 = ({d}) => (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-8 relative overflow-hidden font-sans">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:30px_30px] opacity-40"></div>
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }}
                className="relative z-10 bg-black/60 p-12 md:p-20 backdrop-blur-xl border border-white/10 rounded-[3rem] text-center max-w-3xl w-full shadow-[0_0_80px_rgba(255,255,255,0.05)]"
            >
                <motion.div initial={{ rotate: -180 }} animate={{ rotate: 0 }} transition={{ duration: 1, type: "spring" }} className="w-20 h-20 mx-auto mb-8 bg-white rounded-full flex items-center justify-center text-black font-black text-3xl">
                    {d.name.charAt(0)}
                </motion.div>
                <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-5xl md:text-7xl font-bold mb-6">{d.name}</motion.h1>
                <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-2xl text-slate-400 mb-12">{d.headline}</motion.p>
                
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="flex justify-center mb-12">
                    <SocialIcons d={d} className="[&_a]:border-white/20 [&_a]:text-slate-400 hover:[&_a]:text-white hover:[&_a]:bg-white/10" />
                </motion.div>
                
                <motion.button initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={d.onVisualize} className="w-full py-5 bg-white text-black font-bold rounded-2xl hover:bg-slate-200 transition-colors text-lg">
                    Access Portal
                </motion.button>
            </motion.div>
        </div>
    );

    const Template13 = ({d}) => (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#2B00FF] text-yellow-400 p-8 font-mono border-[20px] border-yellow-400">
            <motion.h2 animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }} className="text-3xl mb-16">INSERT COIN TO CONTINUE</motion.h2>
            <motion.h1 initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.6 }} className="text-6xl md:text-8xl font-black mb-10 text-center drop-shadow-[6px_6px_0_#FF0055]">{d.name}</motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-3xl text-white mb-8 text-center bg-black px-6 py-3 border-4 border-white">{d.headline}</motion.p>
            
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="flex justify-center mb-16 bg-black p-4 border-4 border-white">
                <SocialIcons d={d} className="[&_a]:border-none hover:[&_a]:bg-transparent [&_a]:text-[#FF0055]" />
            </motion.div>
            
            <motion.button 
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={d.onVisualize} 
                className="text-4xl font-black uppercase text-[#FF0055] hover:text-white transition-colors bg-white hover:bg-[#FF0055] px-10 py-5 border-8 border-yellow-400 shadow-[12px_12px_0_#000]"
            >
                START GAME
            </motion.button>
        </div>
    );

    const Template14 = ({d}) => (
        <div className="min-h-screen relative flex items-end p-8 md:p-24 overflow-hidden">
            <motion.div initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ duration: 2 }} className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2064')] bg-cover bg-center"></motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
            
            <motion.div variants={staggerContainer} initial="hidden" animate="show" className="relative z-10 w-full flex flex-col md:flex-row justify-between items-end gap-12">
                <div className="text-white w-full">
                    <motion.h1 variants={fadeUp} className="text-7xl md:text-9xl font-black tracking-tighter mb-4">{d.name}</motion.h1>
                    <motion.p variants={fadeUp} className="text-3xl font-light text-slate-300 mb-8">{d.headline}</motion.p>
                    <SocialIcons d={d} className="[&_a]:border-white/20 hover:[&_a]:bg-white/20" />
                </div>
                <motion.button 
                    variants={fadeUp} whileHover={{ scale: 1.1, rotate: -15 }} whileTap={{ scale: 0.9 }}
                    onClick={d.onVisualize} 
                    className="shrink-0 w-32 h-32 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.4)]"
                >
                    <ArrowRight className="w-12 h-12" />
                </motion.button>
            </motion.div>
        </div>
    );

    const Template15 = ({d}) => {
        const floatingAnimation = {
            animate: { y: [0, -30, 0], rotate: [0, 15, -15, 0], transition: { duration: 8, repeat: Infinity, ease: "easeInOut" } }
        };

        return (
            <div className={`min-h-screen flex items-center justify-center p-8 relative overflow-hidden ${d.isLight ? 'bg-slate-50' : 'bg-[#05050A]'}`}>
                <motion.div variants={floatingAnimation} animate="animate" className="absolute top-20 left-20 w-48 h-48 md:w-80 md:h-80 bg-gradient-to-tr from-blue-500 to-cyan-300 rounded-[4rem] rotate-12 blur-[1px] opacity-20 shadow-2xl"></motion.div>
                <motion.div variants={floatingAnimation} animate="animate" style={{ animationDelay: '-4s' }} className="absolute bottom-20 right-20 w-64 h-64 md:w-96 md:h-96 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full blur-[2px] opacity-20 shadow-2xl"></motion.div>
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", damping: 20, stiffness: 50 }}
                    className="relative z-10 text-center bg-white/5 backdrop-blur-3xl p-12 md:p-24 rounded-[4rem] border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.2)] max-w-5xl w-full"
                >
                    <motion.h1 className={`text-6xl md:text-8xl lg:text-9xl font-black mb-8 tracking-tight ${d.isLight ? 'text-slate-900' : 'text-white'}`}>{d.name}</motion.h1>
                    <motion.p className="text-2xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-16 font-medium">{d.headline}</motion.p>
                    
                    <div className="flex flex-col md:flex-row items-center justify-center gap-10">
                        <motion.button 
                            whileHover={{ scale: 1.05, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={d.onVisualize} 
                            className={`px-12 py-6 rounded-3xl font-bold tracking-wide transition-all shadow-xl text-lg ${d.isLight ? 'bg-slate-900 text-white shadow-slate-900/30' : 'bg-white text-slate-900 shadow-white/30'}`}
                        >
                            Visualize Project
                        </motion.button>
                        <SocialIcons d={d} className="opacity-80" />
                    </div>
                </motion.div>
            </div>
        );
    };

    const renderTemplate = () => {
        switch (templateId) {
            case "template1": return <Template1 d={data} />;
            case "template2": return <Template2 d={data} />;
            case "template3": return <Template3 d={data} />;
            case "template4": return <Template4 d={data} />;
            case "template5": return <Template5 d={data} />;
            case "template6": return <Template6 d={data} />;
            case "template7": return <Template7 d={data} />;
            case "template8": return <Template8 d={data} />;
            case "template9": return <Template9 d={data} />;
            case "template10": return <Template10 d={data} />;
            case "template11": return <Template11 d={data} />;
            case "template12": return <Template12 d={data} />;
            case "template13": return <Template13 d={data} />;
            case "template14": return <Template14 d={data} />;
            case "template15": return <Template15 d={data} />;
            default: return <Template1 d={data} />;
        }
    };

    return (
        <AnimatePresence>
            <motion.div 
                key={templateId}
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full h-screen overflow-y-auto"
            >
                {renderTemplate()}
            </motion.div>
        </AnimatePresence>
    );
};

export default PortfolioFrontpage;
