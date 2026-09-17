import React, { useState, useEffect } from 'react';
import { ArrowRight, ChevronRight, Play, Eye, Sparkles } from 'lucide-react';

const PortfolioFrontpage = ({ userData, sections, themeMode, onVisualize }) => {
    const templateId = userData?.frontpageTemplate || "template1";
    const isLight = themeMode === 'light';

    // Extract Data
    const heroSec = sections.find(s => s.section_type === 'hero');
    const eduSec = sections.find(s => s.section_type === 'education');
    const aboutSec = sections.find(s => s.section_type === 'about');

    const name = heroSec?.content_data?.heading || userData?.name || "Professional";
    const headline = heroSec?.content_data?.subheading || "Welcome to my portfolio";
    const bio = aboutSec?.content_data?.bio || "A passionate professional dedicated to building exceptional experiences.";
    const latestEdu = eduSec?.content_data?.schools?.[0] || null;

    const data = { name, headline, bio, latestEdu, isLight, onVisualize };

    // --- Templates ---
    const Template1 = ({d}) => (
        <div className={`min-h-screen flex flex-col items-center justify-center text-center p-8 transition-colors duration-700 ${d.isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#05050A] text-white'}`}>
            <div className="animate-in slide-in-from-bottom-8 duration-1000 zoom-in-95">
                <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-4">{d.name}</h1>
                <p className="text-xl md:text-2xl font-light text-slate-500 mb-8">{d.headline}</p>
                {d.latestEdu && (
                    <div className="mb-12 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-500/20 text-sm">
                        <span className="opacity-50">🎓</span> {d.latestEdu.degree} @ {d.latestEdu.school}
                    </div>
                )}
                <br/>
                <button onClick={d.onVisualize} className={`group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-300 rounded-full overflow-hidden ${d.isLight ? 'bg-black hover:bg-slate-800' : 'bg-white text-black hover:bg-slate-200'}`}>
                    <span className="relative z-10 flex items-center gap-2">Visualize Portfolio <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
                </button>
            </div>
        </div>
    );

    const Template2 = ({d}) => (
        <div className={`min-h-screen flex flex-col md:flex-row transition-colors duration-700 ${d.isLight ? 'bg-white text-slate-900' : 'bg-[#0B0C10] text-white'}`}>
            <div className={`flex-1 flex flex-col justify-center p-12 lg:p-24 ${d.isLight ? 'bg-slate-50' : 'bg-[#15161D]'}`}>
                <div className="animate-in slide-in-from-left-8 duration-1000">
                    <div className="w-16 h-1 bg-blue-500 mb-8"></div>
                    <h1 className="text-5xl lg:text-7xl font-bold mb-6">{d.name}</h1>
                    <p className="text-xl text-blue-500 mb-4">{d.headline}</p>
                    <p className="text-slate-500 leading-relaxed mb-12 max-w-md">{d.bio.substring(0,150)}...</p>
                    <button onClick={d.onVisualize} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all shadow-lg shadow-blue-500/30 flex items-center gap-3">
                        Enter Workspace <Play className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <div className="flex-1 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 opacity-20"></div>
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070')] bg-cover bg-center mix-blend-overlay"></div>
            </div>
        </div>
    );

    const Template3 = ({d}) => (
        <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative z-10 w-full max-w-3xl p-12 backdrop-blur-2xl bg-white/10 rounded-3xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-white text-center animate-in zoom-in-95 duration-1000">
                <h1 className="text-5xl md:text-7xl font-black mb-6 drop-shadow-lg">{d.name}</h1>
                <h2 className="text-2xl font-light mb-8 opacity-90">{d.headline}</h2>
                {d.latestEdu && <p className="mb-10 text-lg opacity-75">{d.latestEdu.degree}</p>}
                <button onClick={d.onVisualize} className="px-10 py-4 bg-white text-purple-600 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-xl">
                    View Portfolio
                </button>
            </div>
        </div>
    );

    const Template4 = ({d}) => (
        <div className={`min-h-screen flex items-center justify-center p-8 ${d.isLight ? 'bg-yellow-300 text-black' : 'bg-red-500 text-black'}`}>
            <div className="border-4 border-black bg-white p-12 md:p-20 shadow-[16px_16px_0_0_rgba(0,0,0,1)] hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-x-2 hover:translate-y-2 transition-all duration-300">
                <h1 className="text-6xl font-black uppercase mb-4 border-b-4 border-black pb-4">{d.name}</h1>
                <p className="text-3xl font-bold mb-12">{d.headline}</p>
                <button onClick={d.onVisualize} className="w-full py-6 bg-black text-white text-2xl font-black uppercase border-4 border-black hover:bg-white hover:text-black transition-colors">
                    Explore
                </button>
            </div>
        </div>
    );

    const Template5 = ({d}) => (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-cyan-400 font-mono p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.05)_1px,transparent_1px)] bg-[size:30px_30px]"></div>
            <div className="relative z-10 border border-cyan-500/50 bg-black/80 p-12 backdrop-blur-sm shadow-[0_0_30px_rgba(0,255,255,0.2)]">
                <div className="text-xs mb-4 text-cyan-700 animate-pulse">SYSTEM.INITIALIZE()</div>
                <h1 className="text-5xl font-bold mb-2 uppercase tracking-widest">{d.name}</h1>
                <h2 className="text-xl text-fuchsia-500 mb-8">{`> ${d.headline}`}</h2>
                <button onClick={d.onVisualize} className="w-full py-4 border border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-all flex justify-between px-6">
                    <span>EXECUTE_VIEW</span> <span>[ENTER]</span>
                </button>
            </div>
        </div>
    );

    const Template6 = ({d}) => (
        <div className={`min-h-screen p-4 md:p-8 flex items-center justify-center ${d.isLight ? 'bg-slate-100' : 'bg-[#0F111A]'}`}>
            <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[200px]">
                <div className={`col-span-1 md:col-span-2 row-span-2 rounded-3xl p-10 flex flex-col justify-end relative overflow-hidden ${d.isLight ? 'bg-white shadow-xl' : 'bg-slate-900 border border-slate-800'}`}>
                    <div className="absolute top-0 right-0 p-8 opacity-10"><Sparkles className="w-32 h-32"/></div>
                    <h1 className={`text-5xl font-black mb-4 ${d.isLight ? 'text-slate-900' : 'text-white'}`}>{d.name}</h1>
                    <p className="text-2xl text-blue-500">{d.headline}</p>
                </div>
                <div className={`rounded-3xl p-8 flex flex-col items-center justify-center text-center ${d.isLight ? 'bg-blue-600 text-white shadow-xl' : 'bg-blue-600 text-white'}`}>
                    <span className="text-4xl mb-2">🎓</span>
                    <h3 className="font-bold">{d.latestEdu ? d.latestEdu.degree : "Education"}</h3>
                </div>
                <button onClick={d.onVisualize} className={`rounded-3xl p-8 flex flex-col items-center justify-center text-center group cursor-pointer transition-all hover:scale-[1.02] ${d.isLight ? 'bg-black text-white shadow-xl' : 'bg-white text-black'}`}>
                    <Eye className="w-12 h-12 mb-4 group-hover:text-blue-500 transition-colors" />
                    <h3 className="font-black uppercase tracking-widest">Visualize</h3>
                </button>
            </div>
        </div>
    );

    const Template7 = ({d}) => (
        <div className={`min-h-screen flex items-center p-12 lg:p-32 font-serif transition-colors duration-700 ${d.isLight ? 'bg-[#F9F6F0] text-[#2C3E35]' : 'bg-[#1A1A1A] text-[#E8E3D9]'}`}>
            <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-10 duration-1000">
                <p className="text-sm tracking-[0.3em] uppercase mb-8 opacity-60">Portfolio of</p>
                <h1 className="text-6xl md:text-8xl font-medium leading-tight mb-8">{d.name}</h1>
                <p className="text-2xl italic opacity-80 mb-16">{d.headline}</p>
                <button onClick={d.onVisualize} className={`border-b-2 pb-1 text-lg tracking-widest uppercase transition-all ${d.isLight ? 'border-[#2C3E35] hover:opacity-50' : 'border-[#E8E3D9] hover:opacity-50'}`}>
                    Discover Work
                </button>
            </div>
        </div>
    );

    const Template8 = ({d}) => (
        <div className="min-h-screen flex flex-col items-center justify-center text-white relative overflow-hidden bg-black">
            <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-purple-900/40 blur-[120px]"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-900/40 blur-[120px]"></div>
            <div className="relative z-10 text-center animate-in zoom-in-95 duration-1000">
                <h1 className="text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-6 pb-2">{d.name}</h1>
                <p className="text-2xl font-light text-slate-300 mb-12">{d.headline}</p>
                <button onClick={d.onVisualize} className="px-10 py-4 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 backdrop-blur-md transition-all flex items-center gap-3 mx-auto">
                    <Sparkles className="w-5 h-5" /> Launch Experience
                </button>
            </div>
        </div>
    );

    const Template9 = ({d}) => (
        <div className={`min-h-screen flex flex-col justify-between p-8 md:p-16 transition-colors duration-700 ${d.isLight ? 'bg-white text-black' : 'bg-black text-white'}`}>
            <nav className="flex justify-between items-center text-sm font-bold uppercase tracking-widest">
                <span>{d.name.split(' ')[0]}</span>
                <span>{new Date().getFullYear()}</span>
            </nav>
            <div className="py-20 animate-in slide-in-from-bottom-10 duration-1000">
                <h1 className="text-[12vw] leading-none font-black tracking-tighter uppercase break-words">{d.headline.split(' ')[0] || "CREATIVE"}</h1>
                <h1 className="text-[12vw] leading-none font-black tracking-tighter uppercase text-blue-600">{d.headline.split(' ')[1] || "DEVELOPER"}</h1>
            </div>
            <div className="flex justify-end">
                <button onClick={d.onVisualize} className="text-2xl md:text-4xl font-bold underline hover:text-blue-600 transition-colors">
                    View Portfolio ↗
                </button>
            </div>
        </div>
    );

    const Template10 = ({d}) => {
        const [flipped, setFlipped] = useState(false);
        return (
            <div className={`min-h-screen flex items-center justify-center perspective-[2000px] ${d.isLight ? 'bg-slate-200' : 'bg-[#0B0C10]'}`}>
                <div className={`relative w-[350px] h-[500px] md:w-[400px] transition-transform duration-700 preserve-3d cursor-pointer ${flipped ? 'rotate-y-180' : ''}`} onClick={() => setFlipped(!flipped)}>
                    {/* Front */}
                    <div className="absolute inset-0 backface-hidden rounded-3xl p-8 flex flex-col justify-between shadow-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                        <div className="text-right opacity-50"><Sparkles/></div>
                        <div>
                            <h2 className="text-4xl font-bold mb-2">{d.name}</h2>
                            <p className="text-lg opacity-80">Click to flip</p>
                        </div>
                    </div>
                    {/* Back */}
                    <div className={`absolute inset-0 backface-hidden rotate-y-180 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl ${d.isLight ? 'bg-white text-slate-900' : 'bg-slate-900 border border-slate-700 text-white'}`}>
                        <h3 className="text-2xl font-bold mb-4 text-blue-500">{d.headline}</h3>
                        <p className="mb-8 opacity-70 text-sm leading-relaxed">{d.bio.substring(0, 100)}...</p>
                        <button onClick={(e) => { e.stopPropagation(); d.onVisualize(); }} className="px-8 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg">
                            Open Portfolio
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const Template11 = ({d}) => (
        <div className={`min-h-screen flex items-center justify-center p-8 relative overflow-hidden transition-colors duration-700 ${d.isLight ? 'bg-emerald-50 text-emerald-950' : 'bg-[#05100a] text-emerald-50'}`}>
            <div className="absolute top-0 left-0 w-full h-64 bg-emerald-400/20 rounded-b-[100%] blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-500/20 rounded-t-[100%] blur-3xl"></div>
            <div className="relative z-10 text-center">
                <h1 className="text-6xl md:text-8xl font-serif italic mb-6">{d.name}</h1>
                <p className="text-xl md:text-3xl font-light mb-12 tracking-wide uppercase">{d.headline}</p>
                <button onClick={d.onVisualize} className={`px-10 py-4 rounded-full border-2 font-bold tracking-widest uppercase transition-all hover:scale-105 ${d.isLight ? 'border-emerald-900 text-emerald-900 hover:bg-emerald-900 hover:text-white' : 'border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-black'}`}>
                    Enter
                </button>
            </div>
        </div>
    );

    const Template12 = ({d}) => (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-8 relative overflow-hidden font-sans">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:24px_24px] opacity-30"></div>
            <div className="relative z-10 bg-black/50 p-12 backdrop-blur-xl border border-white/10 rounded-2xl text-center max-w-2xl animate-in zoom-in-95 duration-1000 shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                <div className="w-16 h-16 mx-auto mb-6 bg-white rounded-full flex items-center justify-center text-black font-black text-2xl">
                    {d.name.charAt(0)}
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">{d.name}</h1>
                <p className="text-xl text-slate-400 mb-10">{d.headline}</p>
                <button onClick={d.onVisualize} className="w-full py-4 bg-white text-black font-bold rounded-lg hover:bg-slate-200 transition-colors">
                    Access Portal
                </button>
            </div>
        </div>
    );

    const Template13 = ({d}) => (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#2B00FF] text-yellow-400 p-8 font-mono border-[16px] border-yellow-400">
            <h2 className="text-2xl mb-12 animate-pulse">INSERT COIN TO CONTINUE</h2>
            <h1 className="text-5xl md:text-7xl font-black mb-8 text-center drop-shadow-[4px_4px_0_#FF0055]">{d.name}</h1>
            <p className="text-2xl text-white mb-16 text-center bg-black px-4 py-2 border-2 border-white">{d.headline}</p>
            <button onClick={d.onVisualize} className="text-3xl font-black uppercase text-[#FF0055] hover:text-white transition-colors bg-white hover:bg-[#FF0055] px-8 py-4 border-4 border-yellow-400 shadow-[8px_8px_0_#000]">
                START GAME
            </button>
        </div>
    );

    const Template14 = ({d}) => (
        <div className="min-h-screen relative flex items-end p-8 md:p-16">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2064')] bg-cover bg-center"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
            <div className="relative z-10 w-full flex flex-col md:flex-row justify-between items-end gap-8">
                <div className="text-white animate-in slide-in-from-left-10 duration-1000">
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-2">{d.name}</h1>
                    <p className="text-2xl font-light text-slate-300">{d.headline}</p>
                </div>
                <button onClick={d.onVisualize} className="shrink-0 w-24 h-24 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.3)] group">
                    <ArrowRight className="w-8 h-8 group-hover:-rotate-45 transition-transform" />
                </button>
            </div>
        </div>
    );

    const Template15 = ({d}) => (
        <div className={`min-h-screen flex items-center justify-center p-8 relative overflow-hidden ${d.isLight ? 'bg-slate-100' : 'bg-[#05050A]'}`}>
            <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500 rounded-lg rotate-12 blur-[2px] opacity-50 animate-[bounce_4s_infinite]"></div>
            <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-500 rounded-full blur-[2px] opacity-50 animate-[bounce_5s_infinite_reverse]"></div>
            
            <div className="relative z-10 text-center bg-white/10 backdrop-blur-3xl p-16 rounded-3xl border border-white/20 shadow-2xl animate-in zoom-in-90 duration-1000">
                <h1 className={`text-6xl font-black mb-6 ${d.isLight ? 'text-slate-900' : 'text-white'}`}>{d.name}</h1>
                <p className="text-2xl text-blue-500 mb-12 font-medium">{d.headline}</p>
                <button onClick={d.onVisualize} className={`px-12 py-5 rounded-2xl font-bold tracking-wide transition-all shadow-xl hover:-translate-y-1 ${d.isLight ? 'bg-slate-900 text-white hover:shadow-slate-900/30' : 'bg-white text-slate-900 hover:shadow-white/30'}`}>
                    Visualize Project
                </button>
            </div>
        </div>
    );

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
        <div className="w-full h-screen overflow-y-auto">
            {renderTemplate()}
        </div>
    );
};

export default PortfolioFrontpage;
