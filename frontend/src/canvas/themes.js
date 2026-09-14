export const PORTFOLIO_THEMES = {
    modern_glass: {
        id: 'modern_glass',
        name: '1. Modern Glass',
        bodyBg: 'bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))]',
        border: 'border-white/10 backdrop-blur-xl shadow-2xl',
        accentText: 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400',
        accentBg: 'bg-gradient-to-r from-blue-400 to-indigo-400',
    },
    developer_pro: {
        id: 'developer_pro',
        name: '2. Developer Pro',
        bodyBg: 'bg-[#0f1115] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]',
        border: 'border-blue-500/20 bg-[#161b22]/80 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)]',
        accentText: 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500',
        accentBg: 'bg-gradient-to-r from-cyan-400 to-blue-500',
    },
    creative_aurora: {
        id: 'creative_aurora',
        name: '3. Creative Aurora',
        bodyBg: 'bg-[#0B0C10] bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.15),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(236,72,153,0.15),transparent_40%)]',
        border: 'border-fuchsia-500/20 bg-white/[0.02] backdrop-blur-3xl shadow-[0_0_40px_rgba(168,85,247,0.1)]',
        accentText: 'text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-pink-500',
        accentBg: 'bg-gradient-to-r from-fuchsia-400 to-pink-500',
    },
    minimal_executive: {
        id: 'minimal_executive',
        name: '4. Minimal Executive',
        bodyBg: 'bg-[#fafafa] dark:bg-[#111111]',
        border: 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a1a1a] shadow-sm',
        accentText: 'text-slate-900 dark:text-[#D4A72C]',
        accentBg: 'bg-slate-900 dark:bg-[#D4A72C]',
    },
    cyber_neon: {
        id: 'cyber_neon',
        name: '5. Cyber Neon',
        bodyBg: 'bg-[#050505] bg-[linear-gradient(to_right,#FF00AA0A_1px,transparent_1px),linear-gradient(to_bottom,#FF00AA0A_1px,transparent_1px)] bg-[size:40px_40px]',
        border: 'border-[#FF00AA]/30 bg-black/60 backdrop-blur-xl shadow-[0_0_15px_rgba(255,0,170,0.15)]',
        accentText: 'text-[#FF00AA] drop-shadow-[0_0_8px_rgba(255,0,170,0.5)]',
        accentBg: 'bg-[#FF00AA] shadow-[0_0_15px_rgba(255,0,170,0.8)]',
    }
};

export const PORTFOLIO_FONTS = [
    { id: 'font-inter', name: 'Inter (Clean & Modern)', style: { fontFamily: "'Inter', sans-serif" } },
    { id: 'font-poppins', name: 'Poppins (Friendly & Round)', style: { fontFamily: "'Poppins', sans-serif" } },
    { id: 'font-roboto', name: 'Roboto (Professional)', style: { fontFamily: "'Roboto', sans-serif" } },
    { id: 'font-outfit', name: 'Outfit (Sleek & Tech)', style: { fontFamily: "'Outfit', sans-serif" } },
    { id: 'font-montserrat', name: 'Montserrat (Bold & Geometric)', style: { fontFamily: "'Montserrat', sans-serif" } },
    { id: 'font-space', name: 'Space Grotesk (Quirky Tech)', style: { fontFamily: "'Space Grotesk', sans-serif" } },
    { id: 'font-fira', name: 'Fira Code (Developer Mono)', style: { fontFamily: "'Fira Code', monospace" } },
    { id: 'font-oswald', name: 'Oswald (Impactful Headers)', style: { fontFamily: "'Oswald', sans-serif" } },
    { id: 'font-playfair', name: 'Playfair (Elegant & Serif)', style: { fontFamily: "'Playfair Display', serif" } },
    { id: 'font-lora', name: 'Lora (Classic & Readable)', style: { fontFamily: "'Lora', serif" } },
];