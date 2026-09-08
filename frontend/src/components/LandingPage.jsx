import { lazy, Suspense, useState } from 'react';
import { 
    ArrowRight, X, Loader2, User, Mail, KeyRound, 
    ChevronDown, Layout, Code2, Paintbrush, Shield, Zap, Terminal, Globe 
} from 'lucide-react';
import { setAuthTokens } from '../api';

const ThreeBackground = lazy(() => import('./ThreeBackground'));

// Expanded to 40 Avatars
const FUN_AVATARS = [
    { id: "tiger", emoji: "🐯", label: "Tiger" },
    { id: "lion", emoji: "🦁", label: "Lion" },
    { id: "boat", emoji: "⛵", label: "Boat" },
    { id: "rocket", emoji: "🚀", label: "Rocket" },
    { id: "alien", emoji: "👽", label: "Alien" },
    { id: "robot", emoji: "🤖", label: "Robot" },
    { id: "ninja", emoji: "🥷", label: "Ninja" },
    { id: "dragon", emoji: "🐲", label: "Dragon" },
    { id: "fox", emoji: "🦊", label: "Fox" },
    { id: "panda", emoji: "🐼", label: "Panda" },
    { id: "unicorn", emoji: "🦄", label: "Unicorn" },
    { id: "trex", emoji: "🦖", label: "T-Rex" },
    { id: "wizard", emoji: "🧙", label: "Wizard" },
    { id: "astronaut", emoji: "🧑‍🚀", label: "Astronaut" },
    { id: "ghost", emoji: "👻", label: "Ghost" },
    { id: "vampire", emoji: "🧛", label: "Vampire" },
    { id: "monkey", emoji: "🐵", label: "Monkey" },
    { id: "penguin", emoji: "🐧", label: "Penguin" },
    { id: "owl", emoji: "🦉", label: "Owl" },
    { id: "octopus", emoji: "🐙", label: "Octopus" },
    { id: "frog", emoji: "🐸", label: "Frog" },
    { id: "bee", emoji: "🐝", label: "Bee" },
    { id: "butterfly", emoji: "🦋", label: "Butterfly" },
    { id: "turtle", emoji: "🐢", label: "Turtle" },
    { id: "bear", emoji: "🐻", label: "Bear" },
    { id: "koala", emoji: "🐨", label: "Koala" },
    { id: "sloth", emoji: "🦥", label: "Sloth" },
    { id: "dog", emoji: "🐶", label: "Dog" },
    { id: "cat", emoji: "🐱", label: "Cat" },
    { id: "rabbit", emoji: "🐰", label: "Rabbit" },
    { id: "diamond", emoji: "💎", label: "Diamond" },
    { id: "crown", emoji: "👑", label: "Crown" },
    { id: "sparkles", emoji: "✨", label: "Sparkles" },
    { id: "fire", emoji: "🔥", label: "Fire" },
    { id: "planet", emoji: "🪐", label: "Planet" },
    { id: "star", emoji: "🌟", label: "Star" },
    { id: "computer", emoji: "💻", label: "Computer" },
    { id: "joystick", emoji: "🕹️", label: "Joystick" },
    { id: "pizza", emoji: "🍕", label: "Pizza" },
    { id: "taco", emoji: "🌮", label: "Taco" }
];

const FEATURES = [
    {
        icon: Layout,
        title: "Real-time Canvas",
        desc: "Watch your portfolio evolve instantly. Every tweak to your data, theme, or structure is reflected in milliseconds."
    },
    {
        icon: Code2,
        title: "Engineering Focused",
        desc: "Specifically tailored for software engineers. Showcase Full-Stack, IoT, and Cloud architectures with specialized components."
    },
    {
        icon: Paintbrush,
        title: "Glassmorphic Aesthetics",
        desc: "Access premium, meticulously crafted UI themes out of the box, including Modern Glass, Cyberpunk, and Minimalist."
    },
    {
        icon: Zap,
        title: "Zero Boilerplate",
        desc: "Skip the setup phase. Start with a fully functional, highly optimized React workspace and focus purely on your content."
    },
    {
        icon: Shield,
        title: "Secure Workspace",
        desc: "Your data is protected with stateless magic-link authentication and JWT token architecture."
    },
    {
        icon: Globe,
        title: "Instant Deployment",
        desc: "Export clean, production-ready code or deploy directly to the edge with seamless integration."
    }
];

export default function LandingPage({ onEnterWorkspace }) {
    const [showModal, setShowModal] = useState(false);
    const [authMode, setAuthMode] = useState("signup");
    const [stepState, setStepState] = useState("name");
    const [isLoading, setIsLoading] = useState(false);
    
    // State to track how many avatars are currently visible
    const [visibleAvatars, setVisibleAvatars] = useState(8);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        code: "",
        avatar: "🐱" // Default
    });

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const openModal = (mode) => {
        setAuthMode(mode);
        setStepState(mode === "login" ? "verify" : "name");
        setVisibleAvatars(8); // Reset avatar view count when opening modal
        setShowModal(true);
    };

    const handleNameSubmit = (e) => {
        e.preventDefault();
        if (formData.name.trim()) {
            setStepState("details");
        }
    };

    const handleDetailsSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch("http://127.0.0.1:8000/api/send-key/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: formData.name, email: formData.email })
            });

            const data = await response.json();
            if (response.ok && data.success) {
                setStepState("verify");
            } else {
                console.warn("Backend error:", data.error);
                setStepState("verify"); 
            }
        } catch (err) {
            console.warn("Django backend offline. Proceeding to verification step.");
            setStepState("verify");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCodeSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            const response = await fetch("http://127.0.0.1:8000/api/send-key/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    code: formData.code,
                    action: "verify"
                })
            });

            const data = await response.json();

            if (response.ok && data.access) {
                setAuthTokens(data.access, data.refresh);
                setStepState("avatar");
            } else {
                alert(data.error || data.message || "Invalid workspace access code.");
            }
        } catch (err) {
            console.error("Authentication error:", err);
            alert("Failed to connect to Django server.");
            // REMOVE THIS IN PRODUCTION: Fallback for frontend testing if django is down
            setStepState("avatar"); 
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarSelect = (emoji) => {
        setFormData({ ...formData, avatar: emoji });
        if (onEnterWorkspace) {
            onEnterWorkspace({
                name: formData.name || "Developer",
                email: formData.email,
                code: formData.code,
                theme: "modern_glass",
                avatar: emoji
            });
        }
    };

    return (
        <div className="min-h-screen w-screen bg-[#05050A] text-slate-200 overflow-x-hidden font-sans relative">
            
            {/* FIXED BACKGROUND: Stays in place while content scrolls */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <Suspense fallback={null}>
                    <ThreeBackground theme="dark" />
                </Suspense>
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full" />
            </div>

            {/* SCROLLABLE CONTENT WRAPPER */}
            <div className="relative z-10 flex flex-col w-full">
                
                {/* --- 1. HERO SECTION --- */}
                <section className="min-h-screen flex flex-col justify-center p-6 lg:p-12 max-w-[90rem] mx-auto w-full relative">
                    <header className="absolute top-0 left-0 w-full p-6 lg:p-8 flex justify-end"></header>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full mt-10">
                        <main className="space-y-8 animate-fade-in text-center lg:text-left z-20">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-900/50 bg-purple-900/20 text-[#A855F7] text-[10px] font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></div>
                                AuraBuild Studio 1.0
                            </div>

                            <h1 className="text-5xl md:text-6xl lg:text-[5rem] font-black tracking-tight leading-[1.05] text-white">
                                Engineer your <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400">
                                    digital legacy.
                                </span>
                            </h1>

                            <p className="text-slate-400 text-lg md:text-xl leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
                                Bypass the boilerplate. Generate a stunning, high-performance engineering portfolio in minutes. Customize your environment, integrate your repositories, and deploy instantly.
                            </p>

                            <div className="pt-4 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                                <button onClick={() => openModal("signup")} className="px-8 py-4 text-sm bg-white text-slate-900 font-black rounded-full transition-all duration-300 shadow-lg shadow-white/10 hover:-translate-y-1 flex items-center gap-2 w-full sm:w-auto justify-center cursor-pointer">
                                    Initialize Workspace <ArrowRight className="w-4 h-4" />
                                </button>

                                <button onClick={() => openModal("login")} className="px-8 py-4 text-sm bg-[#0B0C10]/50 backdrop-blur-sm border border-slate-700 text-white font-bold rounded-full transition-all duration-300 hover:bg-slate-800 hover:border-slate-500 flex items-center gap-2 w-full sm:w-auto justify-center cursor-pointer">
                                    Log in
                                </button>
                            </div>

                            <div className="pt-12 flex flex-col gap-3 justify-center lg:justify-start">
                                <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase"> Powered by Modern Web Tech </span>
                                <div className="flex gap-6 opacity-40 grayscale">
                                    <span className="text-sm font-black tracking-tighter"> REACT </span>
                                    <span className="text-sm font-black tracking-tighter"> DJANGO </span>
                                    <span className="text-sm font-black tracking-tighter"> TAILWIND </span>
                                </div>
                            </div>
                        </main>

                        {/* Floating Editor Graphic */}
                        <div className="relative flex justify-center w-full h-[400px] lg:h-[500px] items-center hidden lg:flex perspective-[1000px]">
                            <div className="absolute right-0 top-0 z-10 w-full max-w-lg bg-[#0B0C10]/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden transform translate-x-4 transition-transform hover:scale-[1.02] duration-500">
                                <div className="h-12 border-b border-slate-800 flex items-center px-4 justify-between bg-[#111218]/90">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                        <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                                        <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                                    </div>
                                    <div className="bg-[#05050A] border border-slate-800 rounded-md px-4 py-1 flex items-center">
                                        <span className="text-[10px] text-slate-500 font-medium"> localhost:3000 / portfolio </span>
                                    </div>
                                    <div className="w-12"></div>
                                </div>
                                <div className="p-8 h-64 bg-[#05050A]/80">
                                    <div className="flex items-center gap-6 mb-8 border-b border-slate-800/50 pb-6">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 shadow-lg shadow-purple-900/20"></div>
                                        <div className="space-y-2">
                                            <div className="h-4 w-40 bg-slate-200 rounded"></div>
                                            <div className="h-2 w-24 bg-slate-700 rounded"></div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="h-16 bg-slate-900/50 border border-slate-800 rounded-xl p-3">
                                            <div className="h-2 w-10 bg-purple-500/40 rounded mb-3"></div>
                                            <div className="h-1.5 w-full bg-slate-800 rounded mb-1.5"></div>
                                            <div className="h-1.5 w-2/3 bg-slate-800 rounded"></div>
                                        </div>
                                        <div className="h-16 bg-slate-900/50 border border-slate-800 rounded-xl p-3">
                                            <div className="h-2 w-10 bg-blue-500/40 rounded mb-3"></div>
                                            <div className="h-1.5 w-full bg-slate-800 rounded mb-1.5"></div>
                                            <div className="h-1.5 w-1/2 bg-slate-800 rounded"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute left-[-20%] bottom-10 z-20 w-80 bg-[#111218]/95 backdrop-blur-xl rounded-xl border border-slate-700 shadow-2xl p-5 transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                                <div className="flex justify-between items-center mb-4 border-b border-slate-800/50 pb-2">
                                    <span className="text-[10px] text-slate-500 font-mono">App.jsx - AuraBuild</span>
                                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Ready
                                    </span>
                                </div>
                                <div className="text-[11px] font-mono leading-relaxed">
                                    <div className="text-pink-400">
                                        import <span className="text-white">{"{ Workspace }"}</span> from <span className="text-emerald-300">'@aurabuild/core'</span>;
                                    </div>
                                    <br />
                                    <div className="text-blue-400">
                                        const <span className="text-amber-300">EngineerProfile</span> = () =&gt; {"{"}
                                    </div>
                                    <div className="pl-4 text-blue-400">
                                        const <span className="text-white">developer</span> = <span className="text-emerald-300">"M. Bharanidharan"</span>;
                                    </div>
                                    <div className="pl-4 text-pink-400">
                                        return <span className="text-white">(</span>
                                    </div>
                                    <div className="pl-8 text-white">&lt;<span className="text-blue-400">Workspace</span></div>
                                    <div className="pl-12 text-slate-300">theme=<span className="text-emerald-300">"modern_glass"</span></div>
                                    <div className="pl-12 text-slate-300">modules=<span className="text-white">{"{['FullStack', 'IoT']}"}</span></div>
                                    <div className="pl-8 text-white">/&gt;</div>
                                    <div className="pl-4 text-white">);</div>
                                    <div className="text-white">{"};"}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scroll Indicator */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce opacity-50 hidden lg:flex">
                        <span className="text-[10px] uppercase tracking-widest font-bold mb-2">Scroll to explore</span>
                        <ChevronDown className="w-5 h-5" />
                    </div>
                </section>

                {/* --- 2. FEATURES SECTION --- */}
                <section className="py-24 px-6 lg:px-12 max-w-[90rem] mx-auto w-full relative z-10 border-t border-slate-800/50 bg-[#05050A]/40 backdrop-blur-sm">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">System Capabilities</h2>
                        <p className="text-slate-400 text-lg">AuraBuild isn't just a template. It's a complete engineering suite designed to manage and present your professional identity.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {FEATURES.map((feature, idx) => {
                            const Icon = feature.icon;
                            return (
                                <div key={idx} className="bg-[#0B0C10]/80 backdrop-blur-md border border-slate-800 rounded-2xl p-8 hover:-translate-y-1 hover:border-purple-500/50 transition-all duration-300 group shadow-lg">
                                    <div className="w-12 h-12 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center mb-6 group-hover:bg-purple-900/20 group-hover:border-purple-500/30 transition-colors">
                                        <Icon className="w-5 h-5 text-slate-400 group-hover:text-purple-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* --- 3. HOW IT WORKS SECTION --- */}
                <section className="py-24 px-6 lg:px-12 max-w-[90rem] mx-auto w-full relative z-10 border-t border-slate-800/50">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="lg:w-1/3 space-y-6 text-center lg:text-left">
                            <h2 className="text-3xl md:text-4xl font-black text-white">The Deployment Pipeline</h2>
                            <p className="text-slate-400 text-lg">From zero to a fully deployed portfolio in under three minutes. No complicated hosting setups required.</p>
                        </div>
                        
                        <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-3 gap-8 relative">
                            {/* Connecting Line (Desktop) */}
                            <div className="hidden sm:block absolute top-12 left-10 right-10 h-0.5 bg-gradient-to-r from-slate-800 via-purple-900/50 to-slate-800 z-0"></div>
                            
                            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                                <div className="w-24 h-24 rounded-full bg-[#0B0C10] border-2 border-slate-800 flex items-center justify-center shadow-xl">
                                    <Terminal className="w-8 h-8 text-blue-400" />
                                </div>
                                <h4 className="text-white font-bold text-lg">1. Initialize</h4>
                                <p className="text-slate-500 text-sm">Secure your workspace via email code and enter the builder.</p>
                            </div>
                            
                            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                                <div className="w-24 h-24 rounded-full bg-[#0B0C10] border-2 border-purple-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.15)]">
                                    <Layout className="w-8 h-8 text-purple-400" />
                                </div>
                                <h4 className="text-white font-bold text-lg">2. Construct</h4>
                                <p className="text-slate-500 text-sm">Inject your projects, configure themes, and format your data.</p>
                            </div>
                            
                            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                                <div className="w-24 h-24 rounded-full bg-[#0B0C10] border-2 border-slate-800 flex items-center justify-center shadow-xl">
                                    <Globe className="w-8 h-8 text-emerald-400" />
                                </div>
                                <h4 className="text-white font-bold text-lg">3. Launch</h4>
                                <p className="text-slate-500 text-sm">Export your build or deploy to a live custom URL instantly.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- 4. FOOTER --- */}
                <footer className="border-t border-slate-800/60 bg-[#05050A]/90 backdrop-blur-lg pt-16 pb-8 relative z-10">
                    <div className="max-w-[90rem] mx-auto px-6 lg:px-12 flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-8">
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                            <span className="text-lg font-black tracking-widest uppercase text-white">AuraBuild Studio</span>
                        </div>
                        
                        <div className="flex gap-6 mb-12 text-sm font-medium text-slate-400">
                            <a href="#" className="hover:text-white transition-colors">Documentation</a>
                            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                            <a href="#" className="hover:text-white transition-colors">Contact</a>
                        </div>
                        
                        <div className="text-center space-y-2">
                            <p className="text-slate-500 text-sm">
                                Designed and engineered for the modern web.
                            </p>
                            <p className="text-slate-600 text-xs">
                                &copy; {new Date().getFullYear()} AuraBuild Studio. All rights reserved. 
                            </p>
                        </div>
                    </div>
                </footer>
            </div>

            {/* --- AUTH MODAL --- */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-[#111218]/95 border border-slate-800/60 rounded-3xl max-w-[440px] w-full p-8 shadow-2xl relative flex flex-col items-center">
                        <button onClick={() => setShowModal(false)} className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors p-1 cursor-pointer bg-slate-900/50 rounded-full hover:bg-slate-800">
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex flex-col items-center gap-3 mb-8 mt-2">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-[#A855F7] rounded-xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-purple-900/20">
                                A
                            </div>
                            <h2 className="font-bold text-white text-xl tracking-tight">
                                {authMode === "signup" ? "Initialize Workspace" : "Access Workspace"}
                            </h2>
                        </div>

                        {/* SIGNUP: Step 1 - Name */}
                        {stepState === "name" && authMode === "signup" && (
                            <form onSubmit={handleNameSubmit} className="w-full space-y-5 animate-in slide-in-from-right-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1"> Developer Name </label>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input required type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="John Doe" className="w-full bg-[#0B0C10] border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-[#A855F7] focus:ring-1 focus:ring-[#A855F7]/50 text-white transition-all" />
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-3 rounded-xl bg-white hover:bg-slate-200 text-slate-900 text-sm font-black transition-all flex justify-center items-center cursor-pointer shadow-lg">
                                    CONTINUE SETUP
                                </button>
                            </form>
                        )}

                        {/* SIGNUP: Step 2 - Email Only */}
                        {stepState === "details" && authMode === "signup" && (
                            <form onSubmit={handleDetailsSubmit} className="w-full space-y-5 animate-in slide-in-from-right-4">
                                <div className="text-center w-full pb-2">
                                    <p className="text-sm text-slate-300"> Welcome aboard, <span className="font-bold text-[#A855F7]">{formData.name}</span>. </p>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1"> Email Address </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input required type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="developer@domain.com" className="w-full bg-[#0B0C10] border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-[#A855F7] focus:ring-1 focus:ring-[#A855F7]/50 text-white transition-all" />
                                    </div>
                                </div>
                                <button disabled={isLoading} type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-[#A855F7] hover:from-purple-500 hover:to-purple-400 text-white text-sm font-bold transition-all flex justify-center items-center cursor-pointer shadow-lg shadow-purple-900/20">
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "SEND VERIFICATION CODE"}
                                </button>
                                <button type="button" onClick={() => setStepState("name")} className="w-full text-center text-xs text-slate-500 hover:text-slate-300 pt-2 transition-colors"> 
                                    ← Back to Name 
                                </button>
                            </form>
                        )}

                        {/* LOGIN / SIGNUP: Step 3 - Access Code */}
                        {stepState === "verify" && (
                            <form onSubmit={handleCodeSubmit} className="w-full space-y-6 animate-in slide-in-from-right-4">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-end pb-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                                            {authMode === "signup" ? "Verification Code" : "Workspace Access Code"}
                                        </label>
                                        {authMode === "signup" && <span className="text-[10px] text-emerald-400">Sent to email</span>}
                                    </div>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input required type="text" name="code" value={formData.code} onChange={handleInputChange} placeholder="Paste secure code here" className="w-full bg-[#0B0C10] border border-slate-800 rounded-xl py-3.5 pl-10 pr-4 text-sm font-mono tracking-wider outline-none focus:border-[#A855F7] focus:ring-1 focus:ring-[#A855F7]/50 text-white transition-all" />
                                    </div>
                                </div>
                                <button disabled={isLoading} type="submit" className="w-full py-3.5 rounded-xl bg-white hover:bg-slate-200 text-slate-900 text-sm font-black transition-all flex justify-center items-center cursor-pointer shadow-lg">
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "VERIFY CODE"}
                                </button>
                            </form>
                        )}

                        {/* FINAL STEP: Gamified Avatar Picker (40 Avatars + Pagination) */}
                        {stepState === "avatar" && (
                            <div className="w-full space-y-5 animate-in zoom-in-95 duration-300 text-center">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1.5">Verified! 🎉</h3>
                                    <p className="text-sm text-slate-400">Pick an avatar for your workspace identity.</p>
                                </div>
                                
                                {/* 
                                  Avatar Grid Container with Custom Scrollbar
                                  max-h-[220px] ensures the modal doesn't stretch past the screen.
                                */}
                                <div className="grid grid-cols-4 gap-3 max-h-[220px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full pb-2">
                                    {FUN_AVATARS.slice(0, visibleAvatars).map((avatar) => (
                                        <button 
                                            key={avatar.id}
                                            onClick={() => handleAvatarSelect(avatar.emoji)}
                                            className="h-16 flex items-center justify-center text-3xl bg-[#0B0C10] border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-[#A855F7] hover:scale-105 transition-all cursor-pointer shadow-sm animate-in fade-in zoom-in-75 duration-200"
                                            title={avatar.label}
                                        >
                                            {avatar.emoji}
                                        </button>
                                    ))}
                                </div>

                                {/* Pagination Controls */}
                                {visibleAvatars < FUN_AVATARS.length && (
                                    <div className="flex gap-2 mt-2">
                                        <button 
                                            onClick={() => setVisibleAvatars(prev => Math.min(prev + 4, FUN_AVATARS.length))}
                                            className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                                        >
                                            +4 More
                                        </button>
                                        <button 
                                            onClick={() => setVisibleAvatars(FUN_AVATARS.length)}
                                            className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                                        >
                                            View All {FUN_AVATARS.length}
                                        </button>
                                    </div>
                                )}
                                
                                <button onClick={() => handleAvatarSelect("🐱")} className="w-full py-2 text-xs text-slate-500 hover:text-slate-300 font-bold transition-colors cursor-pointer mt-2">
                                    Skip & use default 🐱
                                </button>
                            </div>
                        )}

                        {stepState !== "avatar" && (
                            <div className="w-full text-center mt-8 pt-6 border-t border-slate-800/50">
                                {authMode === "signup" ? (
                                    <button type="button" onClick={() => openModal("login")} className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer">
                                        Already have a workspace code? <span className="text-[#A855F7] font-bold ml-1">Log In</span>
                                    </button>
                                ) : (
                                    <button type="button" onClick={() => openModal("signup")} className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer">
                                        Need a new workspace? <span className="text-[#A855F7] font-bold ml-1">Initialize</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}