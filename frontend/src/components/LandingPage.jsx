import { lazy, Suspense, useState, useMemo } from 'react';
import { 
    ArrowRight, X, Loader2, User, Mail, Lock, Eye, EyeOff, KeyRound, 
    AlertCircle, CheckCircle2, ChevronDown, Layout, Code2, Paintbrush, 
    Shield, Zap, Terminal, Globe, Sun, Moon, Sparkles 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { API, setAuthTokens } from '../api';
import { GoogleLogin } from '@react-oauth/google';

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

export default function LandingPage() {
    const navigate = useNavigate();
    const { login, socialLogin, setThemeSetting, themeMode } = useAppContext();
    const [showModal, setShowModal] = useState(false);
    const [authMode, setAuthMode] = useState("signup"); // "signup" or "login"
    const [loginMethod, setLoginMethod] = useState("password"); // "password" or "code"
    const [stepState, setStepState] = useState("form"); // "form" or "avatar"
    const [isLoading, setIsLoading] = useState(false);
    const [authError, setAuthError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    // State to track how many avatars are currently visible
    const [visibleAvatars, setVisibleAvatars] = useState(8);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        code: "",
        avatar: "🐱"
    });

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (authError) setAuthError("");
    };

    const openModal = (mode) => {
        setAuthMode(mode);
        setStepState("form");
        setAuthError("");
        setVisibleAvatars(8);
        setShowModal(true);
    };

    // Calculate password strength in real time
    const passwordStrength = useMemo(() => {
        const pass = formData.password || "";
        if (!pass) return { score: 0, label: "", color: "bg-slate-700", text: "text-slate-500" };
        let score = 0;
        if (pass.length >= 8) score += 1;
        if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
        if (/\d/.test(pass)) score += 1;
        if (/[^a-zA-Z0-9]/.test(pass)) score += 1;

        if (score <= 1) return { score: 1, label: "Weak", color: "bg-rose-500", text: "text-rose-400" };
        if (score === 2) return { score: 2, label: "Fair", color: "bg-amber-500", text: "text-amber-400" };
        if (score === 3) return { score: 3, label: "Good", color: "bg-blue-500", text: "text-blue-400" };
        return { score: 4, label: "Strong", color: "bg-emerald-500", text: "text-emerald-400" };
    }, [formData.password]);

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setAuthError("");

        if (loginMethod === "password") {
            if (!formData.email.trim() || !formData.password) {
                setAuthError("Please enter both your email address and password.");
                return;
            }
            if (!/\S+@\S+\.\S+/.test(formData.email.trim())) {
                setAuthError("Please enter a valid email address.");
                return;
            }
        } else {
            if (!formData.code.trim()) {
                setAuthError("Please enter your workspace access code.");
                return;
            }
        }

        setIsLoading(true);

        try {
            const payload = loginMethod === "password"
                ? { email: formData.email.trim(), password: formData.password }
                : { code: formData.code.trim() };

            const res = await API.post('auth/login/', payload);
            const data = res.data;

            if (data.access) {
                setAuthTokens(data.access, data.refresh);
                login({
                    name: (data.user && data.user.name) || "Developer",
                    email: (data.user && data.user.email) || formData.email,
                    code: data.workspace_code || formData.code,
                    theme: "modern_glass"
                });
                navigate("/workspace");
            } else {
                setAuthError(data.error || "Authentication failed. Please verify your credentials.");
            }
        } catch (err) {
            if (!err.response) {
                setAuthError("Unable to connect to the backend server. Please verify that the backend server is running.");
            } else {
                const msg = err.response?.data?.error || err.response?.data?.detail || "Invalid credentials. Please verify your email and password.";
                setAuthError(msg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setAuthError("");

        if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
            setAuthError("Please complete all required fields.");
            return;
        }

        if (!/\S+@\S+\.\S+/.test(formData.email.trim())) {
            setAuthError("Please enter a valid email address format (e.g. name@domain.com).");
            return;
        }

        if (formData.password.length < 8) {
            setAuthError("Password must be at least 8 characters long.");
            return;
        }

        if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
            setAuthError("Passwords do not match. Please verify your password confirmation.");
            return;
        }

        setIsLoading(true);

        try {
            const res = await API.post('auth/register/', {
                name: formData.name.trim(),
                email: formData.email.trim(),
                password: formData.password,
                confirm_password: formData.confirmPassword
            });

            const data = res.data;

            if (data.access) {
                setAuthTokens(data.access, data.refresh);
                setFormData(prev => ({
                    ...prev,
                    code: data.workspace_code || prev.code
                }));
                // Advance to avatar selection step for personalized onboarding
                setStepState("avatar");
            } else {
                setAuthError(data.error || "Failed to create account. Please try again.");
            }
        } catch (err) {
            if (err.response?.status === 409 || err.response?.data?.account_exists) {
                setAuthError("An account with this email already exists. Please sign in instead.");
            } else if (!err.response) {
                setAuthError("Unable to connect to the backend server. Please verify that the backend server is running.");
            } else {
                const msg = err.response?.data?.error || err.response?.data?.detail || "Registration failed. Please check your details and try again.";
                setAuthError(msg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarSelect = (emoji) => {
        setFormData(prev => ({ ...prev, avatar: emoji }));
        login({
            name: formData.name || "Developer",
            email: formData.email,
            code: formData.code,
            theme: "modern_glass",
            avatar: emoji
        });
        navigate("/workspace");
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setIsLoading(true);
        setAuthError("");
        try {
            const response = await fetch(`${API.defaults.baseURL}auth/social/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    provider: 'google',
                    token: credentialResponse.credential
                })
            });
            let data;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await response.json();
            } else {
                const text = await response.text();
                throw new Error(`Server returned status ${response.status}`);
            }

            if (response.ok && data.success) {
                socialLogin({
                    name: data.user.username || data.user.email,
                    email: data.user.email,
                    theme: "modern_glass"
                });
                navigate("/workspace");
            } else {
                setAuthError("Google login failed: " + (data.error || "Unknown error"));
            }
        } catch (err) {
            console.error("Login fetch error:", err);
            setAuthError(`Unable to connect to auth server: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGithubLogin = () => {
        const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID || "placeholder_github_client_id";
        const redirectUri = window.location.origin + "/github/callback";
        window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`;
    };


    return (
        <div className={`min-h-screen w-screen overflow-x-hidden font-sora relative selection:bg-purple-500/30 selection:text-purple-200 ${
            themeMode === "light" ? "bg-slate-50 text-slate-900" : "bg-slate-950 text-slate-200"
        }`}>
            
            {/* FIXED BACKGROUND: Stays in place while content scrolls */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
                <Suspense fallback={null}>
                    <ThreeBackground density={900} />
                </Suspense>
                {/* Soft lavender, subtle blue & teal ambient lighting */}
                <div className={`absolute top-[-10%] left-[-5%] w-[45%] h-[45%] rounded-full blur-[130px] transition-opacity duration-700 ${
                    themeMode === "light" ? "bg-indigo-300/25 opacity-70" : "bg-indigo-600/15 opacity-60"
                }`} />
                <div className={`absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] rounded-full blur-[130px] transition-opacity duration-700 ${
                    themeMode === "light" ? "bg-purple-300/20 opacity-70" : "bg-purple-600/15 opacity-60"
                }`} />
                <div className={`absolute top-[40%] right-[15%] w-[30%] h-[30%] rounded-full blur-[120px] transition-opacity duration-700 ${
                    themeMode === "light" ? "bg-teal-300/15 opacity-50" : "bg-teal-600/10 opacity-40"
                }`} />
            </div>

            {/* SCROLLABLE CONTENT WRAPPER */}
            <div className="relative z-10 flex flex-col w-full">
                
                {/* --- 1. HERO SECTION --- */}
                <section className="min-h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-12 max-w-[90rem] mx-auto w-full relative pt-20 pb-16 lg:py-0">
                    <header className="absolute top-0 left-0 w-full p-4 sm:p-6 lg:p-8 flex justify-end z-50">
                        <div 
                            className={`flex items-center gap-1 backdrop-blur-md border rounded-full px-2 py-1.5 shadow-sm transition-colors ${
                                themeMode === "light" ? "bg-white/80 border-slate-300/80 shadow-slate-900/5" : "bg-[#0B0C10]/80 border-slate-700/80"
                            }`}
                            role="group"
                            aria-label="Theme selection"
                        >
                            <button 
                                onClick={() => setThemeSetting('light')} 
                                className={`p-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 cursor-pointer ${
                                    themeMode === 'light' ? 'text-amber-500 bg-amber-500/10 shadow-xs' : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
                                }`} 
                                aria-label="Switch to light theme"
                                title="Light Theme"
                            >
                                <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                            <button 
                                onClick={() => setThemeSetting('dark')} 
                                className={`p-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 cursor-pointer ${
                                    themeMode === 'dark' ? 'text-blue-400 bg-blue-500/10 shadow-xs' : 'text-slate-400 hover:text-blue-400 hover:bg-slate-800'
                                }`} 
                                aria-label="Switch to dark theme"
                                title="Dark Theme"
                            >
                                <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 xl:gap-14 items-center w-full mt-4 sm:mt-8 lg:mt-0">
                        {/* Left Column: Headline, Copy & CTAs */}
                        <main className="lg:col-span-7 xl:col-span-7 space-y-6 sm:space-y-8 animate-fade-in text-center lg:text-left z-20">
                            {/* Studio Badge */}
                            <div className="inline-flex">
                                <div className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border text-[11px] font-semibold tracking-wider uppercase transition-colors shadow-xs ${
                                    themeMode === "light"
                                        ? "bg-purple-50/90 border-purple-200/90 text-purple-700 shadow-purple-500/5"
                                        : "bg-purple-950/40 border-purple-500/30 text-purple-300 shadow-purple-500/10"
                                }`}>
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                                    </span>
                                    <span>AuraBuild Studio 1.0</span>
                                    <span className={`h-3 w-[1px] ${themeMode === "light" ? "bg-purple-200" : "bg-purple-800/80"}`}></span>
                                    <span className={`text-[10px] tracking-normal font-medium ${themeMode === "light" ? "text-purple-600/80" : "text-purple-300/70"}`}>SaaS Edition</span>
                                </div>
                            </div>

                            {/* Hero Headline */}
                            <h1 className={`text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] xl:text-[4.75rem] font-extrabold tracking-[-0.03em] leading-[1.08] ${
                                themeMode === "light" ? "text-slate-900" : "text-white"
                            }`}>
                                Engineer your <br className="hidden sm:inline" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-violet-500 to-teal-400">
                                    digital legacy.
                                </span>
                            </h1>

                            {/* Supporting Paragraph */}
                            <p className={`text-base sm:text-lg md:text-xl leading-relaxed max-w-xl mx-auto lg:mx-0 font-normal ${
                                themeMode === "light" ? "text-slate-600" : "text-slate-300"
                            }`}>
                                Build a standout developer portfolio in minutes. Connect your repositories, customize your workspace, and publish your digital presence with ease.
                            </p>

                            {/* CTA Action Buttons */}
                            <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-center gap-3.5 sm:gap-4 justify-center lg:justify-start">
                                <button 
                                    onClick={() => openModal("signup")} 
                                    className="px-7 py-3.5 sm:px-8 sm:py-4 text-sm font-semibold rounded-full transition-all duration-300 flex items-center gap-2.5 w-full sm:w-auto justify-center cursor-pointer shadow-lg hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20 hover:shadow-slate-900/30 focus-visible:ring-slate-900 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 dark:shadow-white/15 dark:hover:shadow-white/25 dark:focus-visible:ring-white dark:focus-visible:ring-offset-slate-950"
                                >
                                    <span>Initialize Workspace</span>
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                                </button>

                                <button 
                                    onClick={() => openModal("login")} 
                                    className={`px-7 py-3.5 sm:px-8 sm:py-4 text-sm font-semibold backdrop-blur-sm border rounded-full transition-all duration-200 flex items-center justify-center w-full sm:w-auto cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                                        themeMode === "light" 
                                            ? "bg-white/70 border-slate-300/90 text-slate-700 hover:text-slate-950 hover:bg-white hover:border-slate-400 shadow-xs focus-visible:ring-slate-400" 
                                            : "bg-slate-900/60 border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800/80 hover:border-slate-600 shadow-xs focus-visible:ring-slate-600 dark:focus-visible:ring-offset-slate-950"
                                    }`}
                                >
                                    Log in
                                </button>
                            </div>

                            {/* Tech Stack Indicator */}
                            <div className="pt-6 sm:pt-8 flex flex-col gap-3 items-center lg:items-start">
                                <span className={`text-[11px] font-semibold tracking-widest uppercase ${
                                    themeMode === "light" ? "text-slate-500" : "text-slate-400"
                                }`}>
                                    Powered by Modern Web Stack
                                </span>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 justify-center lg:justify-start">
                                    {['React 19', 'Tailwind CSS', 'Django REST', 'Three.js'].map((tech) => (
                                        <span 
                                            key={tech} 
                                            className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
                                                themeMode === "light"
                                                    ? "bg-white/80 border-slate-200 text-slate-700 shadow-xs"
                                                    : "bg-slate-900/60 border-slate-800 text-slate-300"
                                            }`}
                                        >
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </main>

                        {/* Right Column: Layered SaaS Product Mockup */}
                        <div className="lg:col-span-5 xl:col-span-5 w-full flex justify-center items-center relative mt-6 lg:mt-0">
                            <div className="relative w-full max-w-[460px] xl:max-w-[490px] mx-auto flex flex-col sm:block items-center">
                                {/* Main Browser Portfolio Preview Window */}
                                <div className={`w-full rounded-2xl border backdrop-blur-xl overflow-hidden transition-all duration-500 hover:shadow-2xl ${
                                    themeMode === "light"
                                        ? "bg-[#0c0e14] border-slate-800/90 shadow-[0_20px_50px_rgba(15,23,42,0.18)]"
                                        : "bg-[#0b0d13]/95 border-slate-800/90 shadow-[0_25px_60px_rgba(0,0,0,0.65)]"
                                }`}>
                                    {/* Window Title Bar */}
                                    <div className="h-11 border-b border-slate-800/80 flex items-center px-4 justify-between bg-[#11131b]/90">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                                            <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                                            <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                                        </div>
                                        <div className="bg-slate-950/70 border border-slate-800/80 rounded-md px-3.5 py-1 flex items-center gap-1.5 backdrop-blur-md">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                            <span className="text-[11px] text-slate-400 font-mono font-medium">aurabuild.dev/live</span>
                                        </div>
                                        <div className="w-12 flex justify-end">
                                            <span className="text-[10px] text-slate-500 font-mono">v1.0</span>
                                        </div>
                                    </div>

                                    {/* Browser Window Body */}
                                    <div className="p-5 sm:p-7 bg-gradient-to-b from-slate-950/90 via-slate-950/95 to-[#0b0d13]">
                                        {/* Profile Card Header */}
                                        <div className="flex items-center gap-4 mb-5 sm:mb-6 pb-4 sm:pb-5 border-b border-slate-800/70">
                                            <div className="relative">
                                                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-violet-600 to-teal-400 p-[2px] shadow-lg shadow-violet-900/30">
                                                    <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center text-xl">
                                                        👨‍💻
                                                    </div>
                                                </div>
                                                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900"></span>
                                            </div>
                                            <div className="space-y-1 flex-1 min-w-0 text-left">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-white tracking-tight truncate">M. Bharanidharan</span>
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">PRO</span>
                                                </div>
                                                <p className="text-xs text-slate-400 truncate">Senior Full-Stack &amp; Systems Engineer</p>
                                            </div>
                                        </div>

                                        {/* Portfolio Metrics Strip */}
                                        <div className="grid grid-cols-3 gap-2 sm:gap-2.5 mb-4 sm:mb-5">
                                            <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-2 sm:p-2.5 text-center">
                                                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Projects</div>
                                                <div className="text-xs sm:text-sm font-bold text-white mt-0.5 font-mono">14+</div>
                                            </div>
                                            <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-2 sm:p-2.5 text-center">
                                                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Stack</div>
                                                <div className="text-xs sm:text-sm font-bold text-emerald-400 mt-0.5 font-mono">Python/React</div>
                                            </div>
                                            <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-2 sm:p-2.5 text-center">
                                                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Score</div>
                                                <div className="text-xs sm:text-sm font-bold text-teal-300 mt-0.5 font-mono">99.8%</div>
                                            </div>
                                        </div>

                                        {/* Mini Project Cards */}
                                        <div className="space-y-2 sm:space-y-2.5 text-left">
                                            <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between hover:border-slate-700/80 transition-colors">
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-violet-400"></span>
                                                        <span className="text-xs font-semibold text-slate-200">Portfolio Builder SaaS</span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-400">Next-gen reactive portfolio builder with WebGL</p>
                                                </div>
                                                <span className="text-[10px] font-mono text-slate-400 bg-slate-800/70 px-2 py-0.5 rounded">Active</span>
                                            </div>
                                            <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between hover:border-slate-700/80 transition-colors">
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                                                        <span className="text-xs font-semibold text-slate-200">Distributed IoT Pipeline</span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-400">Low-latency telemetry streaming engine</p>
                                                </div>
                                                <span className="text-[10px] font-mono text-slate-400 bg-slate-800/70 px-2 py-0.5 rounded">v2.4</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Code Editor Mockup - Repositioned cleanly in bottom-left */}
                                <div className="w-full max-w-[460px] sm:max-w-none sm:w-[290px] xl:w-[315px] mt-4 sm:mt-0 sm:absolute sm:-left-5 sm:-bottom-6 lg:-left-6 lg:-bottom-7 xl:-left-8 xl:-bottom-7 z-20 bg-[#0e111a]/95 backdrop-blur-2xl rounded-2xl border border-slate-700/80 shadow-[0_20px_45px_rgba(0,0,0,0.55)] p-4 sm:p-5 text-left sm:-rotate-1 sm:hover:rotate-0 transition-transform duration-300">
                                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-800/80">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                            <span className="text-[11px] text-slate-300 font-mono font-medium">App.jsx</span>
                                        </div>
                                        <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1.5 font-medium">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Ready
                                        </span>
                                    </div>
                                    <div className="text-[11px] font-mono leading-[1.65] select-none">
                                        <div>
                                            <span className="text-pink-400">import</span> <span className="text-white">{"{ Workspace }"}</span> <span className="text-pink-400">from</span> <span className="text-emerald-300">'@aura/core'</span>;
                                        </div>
                                        <div className="mt-1">
                                            <span className="text-blue-400">const</span> <span className="text-amber-300">Profile</span> = () =&gt; (
                                        </div>
                                        <div className="pl-3">
                                            <span className="text-slate-400">&lt;</span><span className="text-blue-400">Workspace</span>
                                        </div>
                                        <div className="pl-6 text-slate-300">
                                            theme=<span className="text-emerald-300">"modern_glass"</span>
                                        </div>
                                        <div className="pl-6 text-slate-300">
                                            modules=<span className="text-teal-300">{"{['Cloud', 'AI']}"}</span>
                                        </div>
                                        <div className="pl-6 text-slate-300">
                                            status=<span className="text-amber-300">"deployed"</span>
                                        </div>
                                        <div className="pl-3">
                                            <span className="text-slate-400">/&gt;</span>
                                        </div>
                                        <div>);</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scroll Indicator */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce opacity-60 hidden lg:flex" aria-hidden="true">
                        <span className={`text-[10px] uppercase tracking-widest font-semibold mb-1.5 ${themeMode === "light" ? "text-slate-500" : "text-slate-400"}`}>
                            Scroll to explore
                        </span>
                        <ChevronDown className="w-4 h-4 text-purple-400" />
                    </div>
                </section>

                {/* --- 2. FEATURES SECTION --- */}
                <section className={`py-24 px-4 sm:px-6 lg:px-12 max-w-[90rem] mx-auto w-full relative z-10 border-t backdrop-blur-sm ${
                    themeMode === "light" ? "border-slate-200/70 bg-white/50" : "border-slate-800/70 bg-slate-950/40"
                }`}>
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className={`text-3xl md:text-4xl font-extrabold tracking-tight mb-4 ${
                            themeMode === "light" ? "text-slate-900" : "text-white"
                        }`}>
                            System Capabilities
                        </h2>
                        <p className={`text-base sm:text-lg leading-relaxed font-normal ${
                            themeMode === "light" ? "text-slate-600" : "text-slate-400"
                        }`}>
                            AuraBuild isn't just a template. It's a complete engineering suite designed to manage and present your professional identity.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {FEATURES.map((feature, idx) => {
                            const Icon = feature.icon;
                            return (
                                <div 
                                    key={idx} 
                                    className={`backdrop-blur-md border rounded-2xl p-7 sm:p-8 hover:-translate-y-1 transition-all duration-300 group shadow-sm hover:shadow-lg ${
                                        themeMode === "light" 
                                            ? "bg-white/85 border-slate-200/90 hover:border-purple-300 hover:shadow-purple-500/5" 
                                            : "bg-[#0B0C10]/85 border-slate-800 hover:border-purple-500/40 hover:shadow-purple-500/10"
                                    }`}
                                >
                                    <div className="w-12 h-12 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center mb-6 group-hover:bg-purple-900/30 group-hover:border-purple-500/40 transition-colors">
                                        <Icon className="w-5 h-5 text-slate-300 group-hover:text-purple-400 transition-colors" />
                                    </div>
                                    <h3 className={`text-xl font-bold mb-2.5 tracking-tight ${themeMode === "light" ? "text-slate-900" : "text-white"}`}>
                                        {feature.title}
                                    </h3>
                                    <p className={`text-sm leading-relaxed font-normal ${themeMode === "light" ? "text-slate-600" : "text-slate-400"}`}>
                                        {feature.desc}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* --- 3. HOW IT WORKS SECTION --- */}
                <section className={`py-24 px-4 sm:px-6 lg:px-12 max-w-[90rem] mx-auto w-full relative z-10 border-t ${
                    themeMode === "light" ? "border-slate-200/70" : "border-slate-800/70"
                }`}>
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
                        <div className="lg:w-1/3 space-y-4 sm:space-y-5 text-center lg:text-left">
                            <h2 className={`text-3xl md:text-4xl font-extrabold tracking-tight ${themeMode === "light" ? "text-slate-900" : "text-white"}`}>
                                The Deployment Pipeline
                            </h2>
                            <p className={`text-base sm:text-lg leading-relaxed font-normal ${themeMode === "light" ? "text-slate-600" : "text-slate-400"}`}>
                                From zero to a fully deployed portfolio in under three minutes. No complicated hosting setups required.
                            </p>
                        </div>
                        
                        <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-3 gap-8 relative w-full">
                            {/* Connecting Line (Desktop) */}
                            <div className="hidden sm:block absolute top-12 left-10 right-10 h-0.5 bg-gradient-to-r from-slate-700/40 via-purple-500/40 to-slate-700/40 z-0" aria-hidden="true"></div>
                            
                            <div className="relative z-10 flex flex-col items-center text-center space-y-3.5">
                                <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-full bg-[#0B0C10] border-2 border-slate-800 flex items-center justify-center shadow-lg transition-transform hover:scale-105">
                                    <Terminal className="w-7 h-7 sm:w-8 sm:h-8 text-blue-400" />
                                </div>
                                <h4 className={`font-bold text-lg tracking-tight ${themeMode === "light" ? "text-slate-900" : "text-white"}`}>
                                    1. Initialize
                                </h4>
                                <p className={`text-sm leading-relaxed ${themeMode === "light" ? "text-slate-600" : "text-slate-400"}`}>
                                    Secure your workspace via email code and enter the builder.
                                </p>
                            </div>
                            
                            <div className="relative z-10 flex flex-col items-center text-center space-y-3.5">
                                <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-full bg-[#0B0C10] border-2 border-purple-500/60 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.18)] transition-transform hover:scale-105">
                                    <Layout className="w-7 h-7 sm:w-8 sm:h-8 text-purple-400" />
                                </div>
                                <h4 className={`font-bold text-lg tracking-tight ${themeMode === "light" ? "text-slate-900" : "text-white"}`}>
                                    2. Construct
                                </h4>
                                <p className={`text-sm leading-relaxed ${themeMode === "light" ? "text-slate-600" : "text-slate-400"}`}>
                                    Inject your projects, configure themes, and format your data.
                                </p>
                            </div>
                            
                            <div className="relative z-10 flex flex-col items-center text-center space-y-3.5">
                                <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-full bg-[#0B0C10] border-2 border-slate-800 flex items-center justify-center shadow-lg transition-transform hover:scale-105">
                                    <Globe className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400" />
                                </div>
                                <h4 className={`font-bold text-lg tracking-tight ${themeMode === "light" ? "text-slate-900" : "text-white"}`}>
                                    3. Launch
                                </h4>
                                <p className={`text-sm leading-relaxed ${themeMode === "light" ? "text-slate-600" : "text-slate-400"}`}>
                                    Export your build or deploy to a live custom URL instantly.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- 4. FOOTER --- */}
                <footer className={`border-t backdrop-blur-lg pt-16 pb-10 relative z-10 ${
                    themeMode === "light" ? "border-slate-200/80 bg-white/90" : "border-slate-800/80 bg-slate-950/90"
                }`}>
                    <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-12 flex flex-col items-center">
                        <div className="flex items-center gap-2.5 mb-6">
                            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.6)]"></div>
                            <span className={`text-lg font-bold tracking-wider uppercase ${themeMode === "light" ? "text-slate-900" : "text-white"}`}>
                                AuraBuild Studio
                            </span>
                        </div>
                        
                        <div className={`flex flex-wrap justify-center gap-6 sm:gap-8 mb-10 text-sm font-medium ${
                            themeMode === "light" ? "text-slate-600" : "text-slate-400"
                        }`}>
                            <a href="#" className="hover:text-purple-500 transition-colors">Documentation</a>
                            <a href="#" className="hover:text-purple-500 transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-purple-500 transition-colors">Terms of Service</a>
                            <a href="#" className="hover:text-purple-500 transition-colors">Contact</a>
                        </div>
                        
                        <div className="text-center space-y-2">
                            <p className={`text-sm ${themeMode === "light" ? "text-slate-500" : "text-slate-400"}`}>
                                Designed and engineered for the modern web.
                            </p>
                            <p className="text-slate-500 text-xs">
                                &copy; {new Date().getFullYear()} AuraBuild Studio. All rights reserved.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>

            {/* --- AUTH MODAL --- */}
            {showModal && (
                <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in duration-200">
                    <div className="bg-[#0f1118]/95 border border-slate-800/80 rounded-3xl max-w-[460px] w-full p-6 sm:p-8 shadow-2xl relative flex flex-col items-center max-h-[92vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                        <button 
                            onClick={() => setShowModal(false)} 
                            className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors p-1.5 cursor-pointer bg-slate-900/60 rounded-full hover:bg-slate-800 border border-slate-800/80"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Modal Header */}
                        <div className="flex flex-col items-center gap-2 mb-6 mt-1 text-center">
                            <div className="w-14 h-14 flex items-center justify-center drop-shadow-[0_0_20px_rgba(168,85,247,0.35)]">
                                <img src="/logo.svg" alt="AuraBuild Logo" className="w-full h-full object-contain" />
                            </div>
                            <h2 className="font-display font-black text-white text-2xl tracking-tight">
                                {stepState === "avatar" 
                                    ? "Personalize Identity" 
                                    : (authMode === "signup" ? "Create Account" : "Welcome Back")}
                            </h2>
                            <p className="text-xs text-slate-400 max-w-xs">
                                {stepState === "avatar"
                                    ? "Choose an avatar to complete your workspace profile."
                                    : (authMode === "signup" 
                                        ? "Set up your developer profile & launch your digital portfolio." 
                                        : "Sign in to manage and edit your live portfolio.")}
                            </p>
                        </div>

                        {/* Top Mode Tabs (Sign In / Create Account) */}
                        {stepState !== "avatar" && (
                            <div className="w-full grid grid-cols-2 p-1 bg-slate-900/80 border border-slate-800 rounded-2xl mb-6 text-xs font-bold">
                                <button
                                    type="button"
                                    onClick={() => { setAuthMode("login"); setAuthError(""); }}
                                    className={`py-2.5 rounded-xl transition-all cursor-pointer ${authMode === "login" ? "bg-white text-slate-950 shadow-md" : "text-slate-400 hover:text-white"}`}
                                >
                                    Sign In
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setAuthMode("signup"); setAuthError(""); }}
                                    className={`py-2.5 rounded-xl transition-all cursor-pointer ${authMode === "signup" ? "bg-white text-slate-950 shadow-md" : "text-slate-400 hover:text-white"}`}
                                >
                                    Create Account
                                </button>
                            </div>
                        )}

                        {/* Inline Error Alert Box */}
                        {authError && (
                            <div className="w-full mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1">
                                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                                <div className="flex-1 leading-relaxed">
                                    {authError}
                                    {authError.includes("already exists") && (
                                        <button 
                                            type="button" 
                                            onClick={() => { setAuthMode("login"); setAuthError(""); }} 
                                            className="block mt-1 text-purple-400 hover:text-purple-300 font-bold underline cursor-pointer"
                                        >
                                            Switch to Sign In →
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* --- SIGN IN FORM --- */}
                        {authMode === "login" && stepState !== "avatar" && (
                            <form onSubmit={handleLoginSubmit} className="w-full space-y-4">
                                {/* Sub-toggle: Password vs Workspace Key */}
                                <div className="flex justify-between items-center pb-1 text-xs">
                                    <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Login Method</span>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => { setLoginMethod("password"); setAuthError(""); }}
                                            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${loginMethod === "password" ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "text-slate-500 hover:text-slate-300"}`}
                                        >
                                            Email & Password
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setLoginMethod("code"); setAuthError(""); }}
                                            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${loginMethod === "code" ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "text-slate-500 hover:text-slate-300"}`}
                                        >
                                            Access Code
                                        </button>
                                    </div>
                                </div>

                                {loginMethod === "password" ? (
                                    <>
                                        {/* Email Input */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1"> Email Address </label>
                                            <div className="relative">
                                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                <input 
                                                    required 
                                                    type="email" 
                                                    name="email" 
                                                    value={formData.email} 
                                                    onChange={handleInputChange} 
                                                    placeholder="developer@domain.com" 
                                                    className="w-full bg-[#0B0C10] border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-[#A855F7] focus:ring-1 focus:ring-[#A855F7]/50 text-white transition-all placeholder:text-slate-600" 
                                                />
                                            </div>
                                        </div>

                                        {/* Password Input with Visibility Toggle */}
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between items-center pl-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest"> Password </label>
                                            </div>
                                            <div className="relative">
                                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                <input 
                                                    required 
                                                    type={showPassword ? "text" : "password"} 
                                                    name="password" 
                                                    value={formData.password} 
                                                    onChange={handleInputChange} 
                                                    placeholder="Enter your password" 
                                                    className="w-full bg-[#0B0C10] border border-slate-800 rounded-xl py-3 pl-10 pr-11 text-sm outline-none focus:border-[#A855F7] focus:ring-1 focus:ring-[#A855F7]/50 text-white transition-all placeholder:text-slate-600" 
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1 cursor-pointer"
                                                    title={showPassword ? "Hide password" : "Show password"}
                                                >
                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    /* Workspace Access Code */
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1"> Workspace Access Code </label>
                                        <div className="relative">
                                            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                            <input 
                                                required 
                                                type="text" 
                                                name="code" 
                                                value={formData.code} 
                                                onChange={handleInputChange} 
                                                placeholder="Paste 20-char key here" 
                                                className="w-full bg-[#0B0C10] border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm font-mono tracking-wider outline-none focus:border-[#A855F7] focus:ring-1 focus:ring-[#A855F7]/50 text-white transition-all placeholder:text-slate-600" 
                                            />
                                        </div>
                                    </div>
                                )}

                                <button 
                                    disabled={isLoading} 
                                    type="submit" 
                                    className="w-full py-3.5 rounded-xl bg-white hover:bg-slate-200 text-slate-950 text-sm font-black transition-all flex justify-center items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 mt-2"
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "SIGN IN TO WORKSPACE"}
                                </button>

                                {/* Social Login Divider */}
                                <div className="relative flex py-3 items-center">
                                    <div className="flex-grow border-t border-slate-800"></div>
                                    <span className="flex-shrink mx-3 text-[10px] uppercase tracking-wider text-slate-500 font-bold">Or continue with</span>
                                    <div className="flex-grow border-t border-slate-800"></div>
                                </div>

                                <div className="flex justify-center gap-4">
                                    <GoogleLogin 
                                        onSuccess={handleGoogleSuccess}
                                        onError={() => setAuthError("Google authentication failed.")}
                                        theme="filled_black"
                                        size="large"
                                        type="icon"
                                        shape="circle"
                                    />
                                    
                                    <button 
                                        type="button" 
                                        onClick={handleGithubLogin} 
                                        className="w-10 h-10 rounded-full bg-[#24292F] hover:bg-[#24292F]/80 text-white transition-all flex justify-center items-center cursor-pointer border border-slate-700 shadow-md"
                                        title="Continue with GitHub"
                                    >
                                        <svg height="20" aria-hidden="true" viewBox="0 0 16 16" width="20" className="fill-white">
                                            <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2.02.27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
                                        </svg>
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* --- REGISTRATION FORM --- */}
                        {authMode === "signup" && stepState !== "avatar" && (
                            <form onSubmit={handleRegisterSubmit} className="w-full space-y-3.5">
                                {/* Name Input */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1"> Developer Name </label>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input 
                                            required 
                                            type="text" 
                                            name="name" 
                                            value={formData.name} 
                                            onChange={handleInputChange} 
                                            placeholder="e.g. John Doe" 
                                            className="w-full bg-[#0B0C10] border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#A855F7] focus:ring-1 focus:ring-[#A855F7]/50 text-white transition-all placeholder:text-slate-600" 
                                        />
                                    </div>
                                </div>

                                {/* Email Input */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1"> Email Address </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input 
                                            required 
                                            type="email" 
                                            name="email" 
                                            value={formData.email} 
                                            onChange={handleInputChange} 
                                            placeholder="developer@domain.com" 
                                            className="w-full bg-[#0B0C10] border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#A855F7] focus:ring-1 focus:ring-[#A855F7]/50 text-white transition-all placeholder:text-slate-600" 
                                        />
                                    </div>
                                </div>

                                {/* Password Input */}
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center pl-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest"> Password </label>
                                        <span className="text-[10px] text-slate-500">Min 8 characters</span>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input 
                                            required 
                                            type={showPassword ? "text" : "password"} 
                                            name="password" 
                                            value={formData.password} 
                                            onChange={handleInputChange} 
                                            placeholder="Create a secure password" 
                                            className="w-full bg-[#0B0C10] border border-slate-800 rounded-xl py-2.5 pl-10 pr-11 text-sm outline-none focus:border-[#A855F7] focus:ring-1 focus:ring-[#A855F7]/50 text-white transition-all placeholder:text-slate-600" 
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1 cursor-pointer"
                                            title={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    {/* Password Strength Indicator */}
                                    {formData.password && (
                                        <div className="pt-1.5 space-y-1 animate-in fade-in">
                                            <div className="flex justify-between items-center text-[10px]">
                                                <span className="text-slate-500">Password Strength</span>
                                                <span className={`font-bold ${passwordStrength.text}`}>{passwordStrength.label}</span>
                                            </div>
                                            <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all ${passwordStrength.score >= 1 ? passwordStrength.color : "bg-slate-800"}`}></div>
                                                <div className={`h-full rounded-full transition-all ${passwordStrength.score >= 2 ? passwordStrength.color : "bg-slate-800"}`}></div>
                                                <div className={`h-full rounded-full transition-all ${passwordStrength.score >= 3 ? passwordStrength.color : "bg-slate-800"}`}></div>
                                                <div className={`h-full rounded-full transition-all ${passwordStrength.score >= 4 ? passwordStrength.color : "bg-slate-800"}`}></div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Password Input */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1"> Confirm Password </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input 
                                            required 
                                            type={showConfirmPassword ? "text" : "password"} 
                                            name="confirmPassword" 
                                            value={formData.confirmPassword} 
                                            onChange={handleInputChange} 
                                            placeholder="Re-type your password" 
                                            className="w-full bg-[#0B0C10] border border-slate-800 rounded-xl py-2.5 pl-10 pr-11 text-sm outline-none focus:border-[#A855F7] focus:ring-1 focus:ring-[#A855F7]/50 text-white transition-all placeholder:text-slate-600" 
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1 cursor-pointer"
                                            title={showConfirmPassword ? "Hide password" : "Show password"}
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                        <p className="text-[10px] text-rose-400 pl-1">Passwords do not match</p>
                                    )}
                                </div>

                                <button 
                                    disabled={isLoading} 
                                    type="submit" 
                                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-[#A855F7] hover:from-purple-500 hover:to-purple-400 text-white text-sm font-bold transition-all flex justify-center items-center gap-2 cursor-pointer shadow-lg shadow-purple-900/30 disabled:opacity-50 mt-3"
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "CREATE WORKSPACE ACCOUNT"}
                                </button>

                                {/* Social Login Divider */}
                                <div className="relative flex py-2 items-center">
                                    <div className="flex-grow border-t border-slate-800"></div>
                                    <span className="flex-shrink mx-3 text-[10px] uppercase tracking-wider text-slate-500 font-bold">Or sign up with</span>
                                    <div className="flex-grow border-t border-slate-800"></div>
                                </div>

                                <div className="flex justify-center gap-4">
                                    <GoogleLogin 
                                        onSuccess={handleGoogleSuccess}
                                        onError={() => setAuthError("Google registration failed.")}
                                        theme="filled_black"
                                        size="large"
                                        type="icon"
                                        shape="circle"
                                    />
                                    
                                    <button 
                                        type="button" 
                                        onClick={handleGithubLogin} 
                                        className="w-10 h-10 rounded-full bg-[#24292F] hover:bg-[#24292F]/80 text-white transition-all flex justify-center items-center cursor-pointer border border-slate-700 shadow-md"
                                        title="Sign up with GitHub"
                                    >
                                        <svg height="20" aria-hidden="true" viewBox="0 0 16 16" width="20" className="fill-white">
                                            <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2.02.27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
                                        </svg>
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* --- ONBOARDING AVATAR STEP --- */}
                        {stepState === "avatar" && (
                            <div className="w-full space-y-5 animate-in zoom-in-95 duration-300 text-center">
                                <div>
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold mb-2">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Account Ready
                                    </div>
                                    <p className="text-sm text-slate-300 font-medium">Welcome, <span className="text-purple-400 font-bold">{formData.name}</span>!</p>
                                    <p className="text-xs text-slate-400 mt-1">Select an avatar for your workspace studio persona:</p>
                                </div>
                                
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

                                {visibleAvatars < FUN_AVATARS.length && (
                                    <div className="flex gap-2 mt-2">
                                        <button 
                                            type="button"
                                            onClick={() => setVisibleAvatars(prev => Math.min(prev + 4, FUN_AVATARS.length))}
                                            className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                                        >
                                            +4 More
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setVisibleAvatars(FUN_AVATARS.length)}
                                            className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                                        >
                                            View All {FUN_AVATARS.length}
                                        </button>
                                    </div>
                                )}
                                
                                <button 
                                    type="button"
                                    onClick={() => handleAvatarSelect("🐱")} 
                                    className="w-full py-2.5 text-xs text-purple-400 hover:text-purple-300 font-bold transition-colors cursor-pointer mt-1"
                                >
                                    Skip & enter workspace directly →
                                </button>
                            </div>
                        )}

                        {/* Modal Footer Switch */}
                        {stepState !== "avatar" && (
                            <div className="w-full text-center mt-6 pt-5 border-t border-slate-800/60">
                                {authMode === "signup" ? (
                                    <button 
                                        type="button" 
                                        onClick={() => { setAuthMode("login"); setAuthError(""); }} 
                                        className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                                    >
                                        Already registered? <span className="text-[#A855F7] font-bold ml-1 hover:underline">Sign In</span>
                                    </button>
                                ) : (
                                    <button 
                                        type="button" 
                                        onClick={() => { setAuthMode("signup"); setAuthError(""); }} 
                                        className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                                    >
                                        New to AuraBuild? <span className="text-[#A855F7] font-bold ml-1 hover:underline">Create an Account</span>
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
