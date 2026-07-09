import React from 'react';

export default function LandingPage({ onStart }) {
    return ( <
        div className = "min-h-screen w-screen bg-[#05050A] text-slate-200 overflow-x-hidden font-sans select-none" >

        <
        div className = "relative flex flex-col justify-center min-h-screen p-6 sm:p-12 lg:p-24" >
        <
        div className = "absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none" > < /div> <
        div className = "absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" > < /div>

        <
        div className = "max-w-[90rem] mx-auto w-full z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center" >

        <
        main className = "space-y-8 animate-fade-in text-center lg:text-left z-20" >

        <
        div className = "inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-[10px] font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(168,85,247,0.2)]" >
        <
        span className = "relative flex h-2 w-2" >
        <
        span className = "animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" > < /span> <
        span className = "relative inline-flex rounded-full h-2 w-2 bg-purple-500" > < /span> < /
        span >
        AuraBuild Studio 1.0 <
        /div>

        <
        h1 className = "text-6xl md:text-7xl lg:text-[5.5rem] font-black tracking-tight leading-[1.05] text-white" >
        Engineer your < br / >
        <
        span className = "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-teal-400" >
        digital legacy. <
        /span> < /
        h1 >

        <
        p className = "text-slate-400 text-lg md:text-xl leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium" >
        Bypass the boilerplate.Generate a stunning, high - performance engineering portfolio in minutes.Customize your environment, integrate your repositories, and deploy instantly. <
        /p>

        <
        div className = "pt-6 flex flex-col sm:flex-row items-center gap-6 justify-center lg:justify-start" >
        <
        button onClick = { onStart }
        className = "px-10 py-4 text-lg bg-white text-black font-black rounded-full transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(168,85,247,0.4)] hover:scale-105 flex items-center gap-3" >
        Initialize Workspace <
        svg className = "w-5 h-5"
        fill = "none"
        stroke = "currentColor"
        viewBox = "0 0 24 24" > < path strokeLinecap = "round"
        strokeLinejoin = "round"
        strokeWidth = "3"
        d = "M14 5l7 7m0 0l-7 7m7-7H3" > < /path></svg >
        <
        /button> < /
        div >

        <
        div className = "pt-12 border-t border-slate-800/50 mt-12" >
        <
        p className = "text-xs font-bold text-slate-500 tracking-widest uppercase mb-4" > Powered by modern web tech < /p> <
        div className = "flex gap-6 justify-center lg:justify-start opacity-50 grayscale" >
        <
        div className = "text-xl font-black tracking-tighter" > REACT < /div> <
        div className = "text-xl font-black tracking-tighter" > DJANGO < /div> <
        div className = "text-xl font-black tracking-tighter" > TAILWIND < /div> < /
        div > <
        /div> < /
        main >

        <
        div className = "relative flex justify-center w-full h-[500px] lg:h-[600px] items-center perspective-1000 mt-12 lg:mt-0" >

        <
        div className = "absolute right-0 top-10 z-10 w-full max-w-lg bg-[#0F111A] rounded-2xl shadow-2xl border border-slate-800 transform transition-transform duration-700 hover:rotate-2 hover:scale-105 translate-x-4 lg:translate-x-12" >
        <
        div className = "h-10 bg-[#161925] rounded-t-2xl border-b border-slate-800 flex items-center px-4 gap-2" >
        <
        div className = "w-3 h-3 rounded-full bg-red-500/80" > < /div> <
        div className = "w-3 h-3 rounded-full bg-yellow-500/80" > < /div> <
        div className = "w-3 h-3 rounded-full bg-green-500/80" > < /div> <
        div className = "ml-4 bg-[#0F111A] w-48 h-5 rounded border border-slate-800 flex items-center px-2" >
        <
        span className = "text-[9px] text-slate-500 font-mono" > localhost: 3000 / portfolio < /span> < /
        div > <
        /div> <
        div className = "p-6 space-y-6 h-[400px]" >
        <
        div className = "flex gap-4 items-center border-b border-slate-800 pb-6" >
        <
        div className = "w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]" > < /div> <
        div >
        <
        div className = "h-4 w-40 bg-slate-200 rounded mb-2" > < /div> <
        div className = "h-2 w-24 bg-slate-600 rounded" > < /div> < /
        div > <
        /div> <
        div className = "grid grid-cols-2 gap-4" >
        <
        div className = "h-24 bg-[#161925] border border-slate-800 rounded-xl p-3" >
        <
        div className = "h-2 w-12 bg-purple-500/50 rounded mb-2" > < /div> <
        div className = "h-2 w-full bg-slate-700 rounded mb-1" > < /div> <
        div className = "h-2 w-2/3 bg-slate-700 rounded" > < /div> < /
        div > <
        div className = "h-24 bg-[#161925] border border-slate-800 rounded-xl p-3" >
        <
        div className = "h-2 w-12 bg-blue-500/50 rounded mb-2" > < /div> <
        div className = "h-2 w-full bg-slate-700 rounded mb-1" > < /div> <
        div className = "h-2 w-1/2 bg-slate-700 rounded" > < /div> < /
        div > <
        /div> < /
        div > <
        /div>

        <
        div className = "absolute left-0 bottom-10 z-20 w-full max-w-sm bg-[#05050A]/90 backdrop-blur-md rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.6)] border border-slate-700/50 transform transition-transform duration-700 hover:-translate-y-4 hover:scale-105 -translate-x-4 lg:-translate-x-8" >
        <
        div className = "h-10 border-b border-slate-800 flex items-center px-4 justify-between" >
        <
        span className = "text-[10px] font-mono text-slate-400" > App.jsx— AuraBuild < /span> <
        span className = "text-[10px] font-mono text-purple-400" > Ready < /span> < /
        div > <
        div className = "p-5 font-mono text-xs leading-relaxed text-slate-300" >
        <
        p > < span className = "text-pink-400" >
        import < /span> {'{'} Workspace {'}'} <span className="text-pink-400">from</span > < span className = "text-green-300" > '@aurabuild/core' < /span>;</p >
        <
        br / >
        <
        p > < span className = "text-blue-400" >
        const < /span> <span className="text-yellow-200">EngineerProfile</span > = () < span className = "text-blue-400" >= { '>' } < /span> {'{'}</p >
        <
        p className = "ml-4" > < span className = "text-blue-400" >
        const < /span> developer = <span className="text-green-300">"M. Bharanidharan"</span > ; < /p> <
        p className = "ml-4" > < span className = "text-pink-400" >
        return </span> (</p >
            <
            p className = "ml-8" > < span className = "text-slate-500" > { '<' } < /span><span className="text-blue-300">Workspace</span > < /p> <
        p className = "ml-12" > < span className = "text-purple-300" > theme < /span>=<span className="text-green-300">"cyberpunk_neon"</span > < /p> <
        p className = "ml-12" > < span className = "text-purple-300" > modules < /span>={'{'}['<span className="text-green-300">FullStack</span>', '<span className="text-green-300">IoT</span>']{'}'}</p >
        <
        p className = "ml-8" > < span className = "text-slate-500" > /{'>'}</span > < /p> <
        p className = "ml-4" > ); < /p> <
    p > { '}' }; < /p> < /
    div > <
        /div>

    <
    div className = "absolute top-0 right-10 z-30 bg-[#0F111A]/80 backdrop-blur-md border border-slate-700 px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 animate-bounce"
    style = {
            { animationDuration: '6s' }
        } >
        <
        div className = "w-2 h-2 bg-green-400 rounded-full animate-pulse" > < /div> <
    div className = "text-[10px] font-bold text-slate-200 tracking-wide" > Live Preview < /div> < /
    div >

        <
        /div> < /
    div > <
        /div>

    <
    div className = "relative z-20 bg-[#0A0B10] border-t border-slate-800/50 py-24 px-6 sm:px-12 lg:px-24" >
        <
        div className = "max-w-7xl mx-auto" >

        <
        div className = "text-center max-w-2xl mx-auto mb-16" >
        <
        h2 className = "text-3xl md:text-4xl font-black text-white mb-4" > Engineered
    for Excellence < /h2> <
    p className = "text-slate-400" > Everything you need to deploy a high - tier professional identity without writing a single line of CSS. < /p> < /
    div >

        <
        div className = "grid grid-cols-1 md:grid-cols-3 gap-8" >

        <
        div className = "bg-[#13151C] border border-slate-800 rounded-3xl p-8 hover:border-purple-500/50 transition-colors group" >
        <
        div className = "w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform" >
        <
        span className = "text-purple-400 text-2xl" > 🧠 < /span> < /
    div > <
        h3 className = "text-xl font-bold text-white mb-3" > AI - Powered Architecture < /h3> <
    p className = "text-slate-400 text-sm leading-relaxed" >
        Our intelligent engine structures your projects, generates professional bios, and aligns your skills with industry standards automatically. <
        /p> < /
    div >

        <
        div className = "bg-[#13151C] border border-slate-800 rounded-3xl p-8 hover:border-blue-500/50 transition-colors group" >
        <
        div className = "w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform" >
        <
        span className = "text-blue-400 text-2xl" > ⚡ < /span> < /
    div > <
        h3 className = "text-xl font-bold text-white mb-3" > Live Canvas Engine < /h3> <
    p className = "text-slate-400 text-sm leading-relaxed" >
        See your changes in absolute real - time.Toggle between Desktop, Tablet, and Mobile views instantly to ensure perfect responsiveness. <
        /p> < /
    div >

        <
        div className = "bg-[#13151C] border border-slate-800 rounded-3xl p-8 hover:border-teal-500/50 transition-colors group" >
        <
        div className = "w-14 h-14 bg-teal-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform" >
        <
        span className = "text-teal-400 text-2xl" > 📥 < /span> < /
    div > <
        h3 className = "text-xl font-bold text-white mb-3" > Zero - Dependency Export < /h3> <
    p className = "text-slate-400 text-sm leading-relaxed" >
        When you 're done, download a pure, optimized HTML package. No vendor lock-in. Host it anywhere, forever. < /
    p > <
        /div>

    <
    /div> < /
    div > <
        /div>

    <
    footer className = "border-t border-slate-800/50 bg-[#05050A] py-8 text-center" >
        <
        p className = "text-slate-600 text-xs font-mono" >
        OPERATOR SHELL // AURA BUILD 1.0 // MOUNT ZION COLLABORATION
        <
        /p> < /
    footer > <
        /div>
);
}