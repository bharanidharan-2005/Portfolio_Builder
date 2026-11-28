import { lazy, Suspense, useState, useMemo } from 'react';
import {
    ArrowRight, X, Loader2, User, Mail, Lock, Eye, EyeOff, KeyRound,
    AlertCircle, CheckCircle2, ChevronDown, Layout, Paintbrush,
    Shield, Terminal, Globe, Sun, Moon, Sparkles, FileText, Layers,
    Check, Menu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { API, setAuthTokens, clearAuthTokens } from '../api';
import { GoogleLogin } from '@react-oauth/google';
import { CAREER_TRACKS, FRONTPAGE_LAYOUTS } from '../utils/templatesCatalog';
import { Modal, Badge } from './ui';

const ThreeBackground = lazy(() => import('./ThreeBackground'));

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
        icon: FileText,
        title: "AI Resume Extraction",
        desc: "Upload PDF or DOCX resumes to extract experience, skills, education, projects, certifications, and achievements — reviewed before saving."
    },
    {
        icon: Layout,
        title: "3-Panel Visual Editor",
        desc: "Edit sections inline, drag to reorder, switch mobile/tablet/desktop viewports, and undo or redo edits with live autosave status."
    },
    {
        icon: Layers,
        title: "Unified Structured Data",
        desc: "Switch between career-path templates and layout styles without losing a single project, bullet point, or citation."
    },
    {
        icon: Sparkles,
        title: "Contextual AI Studio",
        desc: "Generate tailored summaries, crisp project descriptions, job-description match checks, and skill recommendations on demand."
    },
    {
        icon: Shield,
        title: "Private Draft Isolation",
        desc: "Drafts remain protected behind JWT authentication. Public URLs only serve explicitly published portfolios."
    },
    {
        icon: Globe,
        title: "Live Hosting & ZIP Export",
        desc: "Publish with custom SEO metadata or download a complete static React + Vite bundle or single-page PDF resume anytime."
    }
];

const FAQS = [
    {
        q: "How does AI resume parsing protect my existing edits?",
        a: "When you upload a PDF or DOCX resume, AuraBuild extracts your profile into an interactive review screen first so you can inspect, tweak, and confirm before updating your portfolio."
    },
    {
        q: "Can students and non-engineering majors use AuraBuild?",
        a: "Yes. Alongside Software, Full-Stack, Data Engineering, and AI/ML templates, AuraBuild includes dedicated Engineering Student and Arts & Science Student tracks with coursework, research, publications, and honors sections."
    },
    {
        q: "Will switching templates erase my content?",
        a: "No. All templates read from the same structured portfolio sections and project schema, so changing themes or layout templates preserves your data."
    },
    {
        q: "Are my draft portfolios visible on the public internet?",
        a: "No. Newly created portfolios default to private Draft mode and return a 404 on public endpoints until you explicitly toggle Publishing on."
    },
    {
        q: "Can I export my code and self-host it?",
        a: "Yes. You can export a full standalone React + Vite project ZIP archive, standalone HTML/CSS build, JSON data backup, or print-ready PDF resume directly from the workspace."
    }
];

const LEGAL_DOCS = {
    docs: {
        title: "AuraBuild Documentation",
        body: [
            "1. Create an account with Email & Password, Google OAuth, GitHub OAuth, or your 20-character Workspace Access Code.",
            "2. From the Dashboard, start from a Career Path template or upload a PDF/DOCX resume in the Editor to pre-populate your sections.",
            "3. Customize typography, colors, section order, and multi-page routes in the Visual Canvas with automatic backend syncing.",
            "4. Toggle Publish when ready to serve your portfolio at /preview/<username>, or export a static bundle via Export ZIP."
        ]
    },
    privacy: {
        title: "Privacy Policy",
        body: [
            "AuraBuild stores only the account details and portfolio sections you create or import.",
            "Unpublished portfolios remain private drafts accessible only to your authenticated session.",
            "Resume files are processed solely to extract structured portfolio fields and are never shared with third parties outside configured AI extraction providers.",
            "You can export your JSON data or delete any portfolio directly from your Dashboard at any time."
        ]
    },
    terms: {
        title: "Terms of Service",
        body: [
            "You retain full ownership of all text, code snippets, project links, and exported bundles created inside AuraBuild.",
            "AI-generated summaries and project suggestions should be reviewed by you for factual accuracy before publishing.",
            "Do not upload unlawful content or attempt unauthorized access to other creators' private drafts."
        ]
    },
    contact: {
        title: "Support & Contact",
        body: [
            "Need help with workspace codes, domain setup, or bug reports?",
            "Email: support@aurabuild.app",
            "Source & Issue Tracker: github.com/bharanidharan-2005/Portfolio_Builder"
        ]
    }
};

export default function LandingPage() {
    const navigate = useNavigate();
    const { login, socialLogin, setThemeSetting, themeMode } = useAppContext();

    const [showModal, setShowModal] = useState(false);
    const [authMode, setAuthMode] = useState("signup"); // "signup" | "login" | "reset"
    const [loginMethod, setLoginMethod] = useState("password"); // "password" | "code"
    const [stepState, setStepState] = useState("form"); // "form" | "avatar"
    const [resetStep, setResetStep] = useState("request"); // "request" | "confirm"
    const [isLoading, setIsLoading] = useState(false);
    const [authError, setAuthError] = useState("");
    const [authNotice, setAuthNotice] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [visibleAvatars, setVisibleAvatars] = useState(8);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Interactive product demo & template gallery state
    const [demoLayout, setDemoLayout] = useState("template4");
    const [templateCategory, setTemplateCategory] = useState("All");
    const [openFaqIdx, setOpenFaqIdx] = useState(0);
    const [infoDocKey, setInfoDocKey] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        code: "",
        resetCode: "",
        avatar: "🐱"
    });

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (authError) setAuthError("");
        if (authNotice) setAuthNotice("");
    };

    const openModal = (mode) => {
        setAuthMode(mode);
        setStepState("form");
        setResetStep("request");
        setAuthError("");
        setAuthNotice("");
        setVisibleAvatars(8);
        setShowModal(true);
    };

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

    const handleRequestResetCode = async (e) => {
        e.preventDefault();
        const email = formData.email.trim();
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            setAuthError("Please enter a valid account email address.");
            return;
        }
        setIsLoading(true);
        setAuthError("");
        setAuthNotice("");
        try {
            const res = await API.post('auth/request-password-reset/', { email });
            setAuthNotice(res.data?.message || "A 6-digit verification code has been sent to your email.");
            setResetStep("confirm");
        } catch (err) {
            setAuthError(err.response?.data?.error || "Unable to send reset verification code.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmPasswordReset = async (e) => {
        e.preventDefault();
        const email = formData.email.trim();
        if (!formData.resetCode.trim()) {
            setAuthError("Enter the 6-digit verification code from your email.");
            return;
        }
        if ((formData.password || "").length < 8) {
            setAuthError("New password must be at least 8 characters long.");
            return;
        }
        setIsLoading(true);
        setAuthError("");
        try {
            const res = await API.post('auth/reset-password/', {
                email,
                reset_code: formData.resetCode.trim(),
                new_password: formData.password,
            });
            const data = res.data;
            if (data.access) {
                setAuthTokens(data.access, data.refresh);
                login({
                    name: data.user?.name || "Developer",
                    email: data.user?.email || email,
                    avatar: data.user?.avatar || "👨‍💻",
                    code: data.workspace_code || formData.code,
                    plan: data.user?.plan || "free",
                    isStaff: Boolean(data.user?.is_staff),
                    theme: "modern_glass"
                });
                navigate(data.user?.is_staff ? "/admin" : "/dashboard");
            } else {
                setAuthError(data.error || "Password reset failed.");
            }
        } catch (err) {
            setAuthError(
                err.response?.data?.error ||
                (Array.isArray(err.response?.data?.password) ? err.response.data.password[0] : null) ||
                "Invalid or expired verification code."
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setAuthError("");

        const email = formData.email.trim();
        if (loginMethod === "password") {
            if (!email || !formData.password) {
                setAuthError("Please enter both your email address and password.");
                return;
            }
            if (!email.includes("@")) {
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
                ? { email, password: formData.password }
                : { code: formData.code.trim() };

            const res = await API.post('auth/login/', payload);
            const data = res.data;

            if (data.access) {
                setAuthTokens(data.access, data.refresh);
                login({
                    name: data.user?.name || "Developer",
                    email: data.user?.email || email,
                    avatar: data.user?.avatar || "👨‍💻",
                    code: data.workspace_code || formData.code,
                    plan: data.user?.plan || "free",
                    isStaff: Boolean(data.user?.is_staff),
                    theme: "modern_glass"
                });
                navigate(data.user?.is_staff ? "/admin" : "/dashboard");
            } else {
                setAuthError(data.error || "Authentication failed. Please verify your credentials.");
            }
        } catch (err) {
            if (!err.response) {
                setAuthError("Unable to connect to the backend server. Please verify that the backend server is running.");
            } else {
                let msg = err.response?.data?.error || err.response?.data?.detail;
                if (!msg && err.response?.data) {
                    const d = err.response.data;
                    if (d.code) {
                        msg = Array.isArray(d.code) ? d.code[0] : d.code;
                    } else if (d.email) {
                        msg = Array.isArray(d.email) ? d.email[0] : d.email;
                    } else if (d.password) {
                        msg = Array.isArray(d.password) ? d.password[0] : d.password;
                    } else if (d.non_field_errors) {
                        msg = Array.isArray(d.non_field_errors) ? d.non_field_errors[0] : d.non_field_errors;
                    }
                }
                if (msg && msg.toLowerCase().includes("token")) {
                    clearAuthTokens();
                    msg = "Invalid credentials or previous session expired. Please try again.";
                } else if (!msg) {
                    msg = "Invalid credentials. Please verify your email and password.";
                }
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
            clearAuthTokens();
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
                const d = err.response?.data;
                let msg = d?.error || d?.detail || (Array.isArray(d?.password) ? d.password[0] : null);
                if (!msg) msg = "Registration failed. Please check your details and try again.";
                setAuthError(msg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarSelect = async (emoji) => {
        setFormData(prev => ({ ...prev, avatar: emoji }));
        try {
            await API.patch('user/profile/', { avatar: emoji });
        } catch {
            // Non-blocking fallback
        }
        login({
            name: formData.name || "Developer",
            email: formData.email,
            code: formData.code,
            plan: "free",
            theme: "modern_glass",
            avatar: emoji
        });
        navigate("/dashboard");
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setIsLoading(true);
        setAuthError("");
        try {
            const { data } = await API.post('auth/social/', {
                provider: 'google',
                token: credentialResponse.credential,
            });

            if (data?.success) {
                socialLogin(
                    {
                        name: data.user?.name || data.user?.username || data.user?.email,
                        email: data.user?.email || "",
                        avatar: data.user?.avatar || "👨‍💻",
                        code: data.workspace_code || "",
                        plan: data.user?.plan || "free",
                        isStaff: Boolean(data.user?.is_staff),
                        theme: "modern_glass"
                    },
                    data.access,
                    data.refresh
                );
                navigate(data.user?.is_staff ? "/admin" : "/dashboard");
            } else {
                setAuthError("Google login failed: " + (data?.error || "Unknown error"));
            }
        } catch (err) {
            const serverError = err.response?.data?.error;
            setAuthError(serverError ? `Google login failed: ${serverError}` : `Unable to connect to auth server: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGithubLogin = () => {
        const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID || "";
        if (!clientId || clientId.includes("placeholder")) {
            setAuthError("GitHub OAuth Client ID is not configured in this environment.");
            return;
        }
        const redirectUri = encodeURIComponent(window.location.origin + "/github/callback");
        window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`;
    };

    const categories = ["All", "Engineering", "Data & AI", "Design", "Students"];
    const filteredTracks = useMemo(() => {
        if (templateCategory === "All") return CAREER_TRACKS;
        if (templateCategory === "Data & AI") {
            return CAREER_TRACKS.filter((t) => t.category.includes("Data") || t.category.includes("Intelligence"));
        }
        if (templateCategory === "Students") {
            return CAREER_TRACKS.filter((t) => t.category.includes("Students"));
        }
        return CAREER_TRACKS.filter((t) => t.category === templateCategory);
    }, [templateCategory]);

    const activeDemoMeta = FRONTPAGE_LAYOUTS.find((l) => l.id === demoLayout) || FRONTPAGE_LAYOUTS[0];
    const isLight = themeMode === "light";

    return (
        <div className={`min-h-screen w-full overflow-x-hidden font-sora relative selection:bg-indigo-500/30 ${isLight ? "bg-slate-50 text-slate-900" : "bg-[#07090F] text-slate-200"
            }`}>
            {/* Subtle Ambient Three.js Backdrop */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
                <Suspense fallback={null}>
                    <ThreeBackground density={650} />
                </Suspense>
            </div>

            {/* STICKY NAVBAR */}
            <header className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${isLight ? "bg-white/85 border-slate-200/80" : "bg-[#07090F]/85 border-slate-800/80"
                }`}>
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
                    <a href="#top" className="flex items-center gap-2 sm:gap-2.5 font-bold tracking-tight min-w-0 shrink-0">
                        <img
                            src="/logo.png"
                            alt="AuraBuild Logo"
                            className="w-8 h-8 object-contain shrink-0"
                        />
                        <span className={`text-sm sm:text-base font-extrabold ${isLight ? "text-slate-900" : "text-white"}`}>
                            AuraBuild
                        </span>
                        <Badge tone="accent" className="hidden sm:inline-flex">AI Studio</Badge>
                    </a>

                    <nav className={`hidden md:flex items-center gap-6 text-sm font-medium ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                        <a href="#templates" className="hover:text-indigo-500 transition-colors">Templates</a>
                        <a href="#features" className="hover:text-indigo-500 transition-colors">Capabilities</a>
                        <a href="#pipeline" className="hover:text-indigo-500 transition-colors">How It Works</a>
                        <a href="#plans" className="hover:text-indigo-500 transition-colors">Plans</a>
                        <a href="#faq" className="hover:text-indigo-500 transition-colors">FAQ</a>
                    </nav>

                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => setThemeSetting(isLight ? "dark" : "light")}
                            aria-label="Toggle theme"
                            className={`p-2 rounded-xl border transition-colors cursor-pointer shrink-0 ${isLight ? "border-slate-200 hover:bg-slate-100 text-slate-700" : "border-slate-800 hover:bg-slate-800 text-slate-300"
                                }`}
                        >
                            {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                        </button>
                        <button
                            type="button"
                            onClick={() => openModal("login")}
                            className={`hidden sm:inline-flex px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${isLight ? "border-slate-300 text-slate-700 hover:bg-slate-100" : "border-slate-700 text-slate-200 hover:bg-slate-800"
                                }`}
                        >
                            Log in
                        </button>
                        <button
                            type="button"
                            onClick={() => openModal("signup")}
                            className="px-3 sm:px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                            <span className="sm:hidden">Get Started</span>
                            <span className="hidden sm:inline">Create Portfolio</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen((v) => !v)}
                            className={`md:hidden p-2 rounded-xl border cursor-pointer shrink-0 ${isLight ? "border-slate-200 text-slate-700 hover:bg-slate-100" : "border-slate-700/50 text-slate-200 hover:bg-slate-800"
                                }`}
                            aria-label="Toggle navigation menu"
                        >
                            <Menu className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {mobileMenuOpen && (
                    <div className={`md:hidden border-t px-4 py-3 flex flex-col gap-2 text-sm font-medium ${isLight ? "bg-white border-slate-200 text-slate-700" : "bg-[#0B0D14] border-slate-800 text-slate-200"
                        }`}>
                        <a href="#templates" onClick={() => setMobileMenuOpen(false)} className="py-1.5">Templates</a>
                        <a href="#features" onClick={() => setMobileMenuOpen(false)} className="py-1.5">Capabilities</a>
                        <a href="#pipeline" onClick={() => setMobileMenuOpen(false)} className="py-1.5">How It Works</a>
                        <a href="#plans" onClick={() => setMobileMenuOpen(false)} className="py-1.5">Plans</a>
                        <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="py-1.5">FAQ</a>
                        <button
                            type="button"
                            onClick={() => { setMobileMenuOpen(false); openModal("login"); }}
                            className="text-left py-1.5 text-indigo-400 font-semibold"
                        >
                            Log in
                        </button>
                    </div>
                )}
            </header>

            <div id="top" className="relative z-10 flex flex-col w-full">
                {/* 1. HERO + INTERACTIVE WORKSPACE DEMO */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-20 lg:pt-20 lg:pb-24 w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
                        <div className="lg:col-span-6 space-y-6 text-center lg:text-left animate-fade-in">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold bg-indigo-500/10 border-indigo-500/25 text-indigo-400">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>AI Resume Parsing + 3-Panel Visual Canvas</span>
                            </div>

                            <h1 className={`font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] ${isLight ? "text-slate-900" : "text-white"
                                }`}>
                                Turn your resume into a{" "}
                                <span className="text-indigo-500">live engineering portfolio.</span>
                            </h1>

                            <p className={`text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 ${isLight ? "text-slate-600" : "text-slate-300"
                                }`}>
                                Import PDF or DOCX resumes, customize career-path templates in a real-time editor, refine bullets with AI, and publish cleanly or export production React code.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start pt-1">
                                <button
                                    type="button"
                                    onClick={() => openModal("signup")}
                                    className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-sm inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
                                >
                                    <span>Create Portfolio</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                                <a
                                    href="#templates"
                                    className={`w-full sm:w-auto px-7 py-3.5 rounded-xl border text-sm font-semibold inline-flex items-center justify-center transition-colors ${isLight
                                        ? "border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
                                        : "border-slate-700 bg-slate-900/70 text-slate-200 hover:bg-slate-800"
                                        }`}
                                >
                                    Explore Templates
                                </a>
                            </div>

                            <div className={`pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-xs ${isLight ? "text-slate-600" : "text-slate-400"
                                }`}>
                                <span className="inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> PDF & DOCX Resume Parser</span>
                                <span className="inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> {FRONTPAGE_LAYOUTS.length} Frontpage Layouts &amp; 7 Tracks</span>
                                <span className="inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Clean ZIP & PDF Export</span>
                            </div>
                        </div>

                        {/* Interactive Layout Preview Card */}
                        <div className="lg:col-span-6">
                            <div className={`rounded-2xl border shadow-2xl overflow-hidden ${isLight ? "bg-white border-slate-200" : "bg-[#0D1018] border-slate-800"
                                }`}>
                                <div className={`px-4 py-3 border-b flex flex-wrap items-center justify-between gap-2 ${isLight ? "bg-slate-50 border-slate-200" : "bg-[#121622] border-slate-800"
                                    }`}>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                                        <span className="ml-2 text-[11px] font-mono text-slate-400">
                                            aurabuild-canvas.preview
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar">
                                        {FRONTPAGE_LAYOUTS.slice(0, 4).map((layout) => (
                                            <button
                                                key={layout.id}
                                                type="button"
                                                onClick={() => setDemoLayout(layout.id)}
                                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${demoLayout === layout.id
                                                    ? "bg-indigo-600 text-white"
                                                    : isLight
                                                        ? "text-slate-600 hover:bg-slate-200"
                                                        : "text-slate-400 hover:bg-slate-800"
                                                    }`}
                                            >
                                                {layout.tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-6 space-y-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <span
                                                className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-white mb-2"
                                                style={{ backgroundColor: activeDemoMeta.accent }}
                                            >
                                                {activeDemoMeta.name}
                                            </span>
                                            <h3 className={`text-lg font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                                                Alex Mercer — Systems & Full-Stack
                                            </h3>
                                            <p className={`text-xs mt-1 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                                                {activeDemoMeta.description}
                                            </p>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/15 border border-emerald-500/25 shrink-0 ${isLight ? "text-emerald-700" : "text-emerald-400"}`}>
                                            Published
                                        </span>
                                    </div>

                                    {demoLayout === "template2" ? (
                                        <div className="grid grid-cols-5 gap-3">
                                            <div className={`col-span-2 rounded-xl border p-3.5 space-y-2 ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/70 border-slate-800"
                                                }`}>
                                                <p className={`text-[11px] font-bold ${isLight ? "text-cyan-700" : "text-cyan-400"}`}>Navigation & Bio</p>
                                                <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>Fixed sidebar navigation, contact triggers, and core stack badges.</p>
                                            </div>
                                            <div className="col-span-3 space-y-2.5">
                                                <div className={`rounded-xl border p-3 ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/70 border-slate-800"}`}>
                                                    <p className="text-xs font-semibold">Telemetry Query Engine</p>
                                                    <p className={`text-[11px] ${isLight ? "text-slate-600" : "text-slate-400"}`}>Python · Kafka · ClickHouse</p>
                                                </div>
                                                <div className={`rounded-xl border p-3 ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/70 border-slate-800"}`}>
                                                    <p className="text-xs font-semibold">Design Token Compiler</p>
                                                    <p className={`text-[11px] ${isLight ? "text-slate-600" : "text-slate-400"}`}>TypeScript · AST · Vite</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : demoLayout === "template3" ? (
                                        <div className="grid grid-cols-3 gap-2.5">
                                            <div className={`col-span-2 rounded-xl border p-3 ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/70 border-slate-800"}`}>
                                                <p className="text-xs font-semibold">Featured Case Study</p>
                                                <p className={`text-[11px] mt-1 ${isLight ? "text-slate-600" : "text-slate-400"}`}>Distributed caching gateway reducing API latency across 4 regions.</p>
                                            </div>
                                            <div className={`rounded-xl border p-3 text-center flex flex-col justify-center ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/70 border-slate-800"}`}>
                                                <p className={`text-base font-bold ${isLight ? "text-emerald-700" : "text-emerald-400"}`}>12+</p>
                                                <p className={`text-[10px] ${isLight ? "text-slate-600" : "text-slate-400"}`}>OSS Repos</p>
                                            </div>
                                            <div className={`rounded-xl border p-3 ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/70 border-slate-800"}`}>
                                                <p className="text-[11px] font-semibold">Backend Stack</p>
                                                <p className={`text-[10px] mt-0.5 ${isLight ? "text-slate-600" : "text-slate-400"}`}>Django · Postgres</p>
                                            </div>
                                            <div className={`col-span-2 rounded-xl border p-3 ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/70 border-slate-800"}`}>
                                                <p className="text-[11px] font-semibold">Resume PDF Ready</p>
                                                <p className={`text-[10px] mt-0.5 ${isLight ? "text-slate-600" : "text-slate-400"}`}>Synced dynamically from your structured portfolio items.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2.5">
                                            <div className={`rounded-xl border p-3.5 flex items-center justify-between ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/70 border-slate-800"}`}>
                                                <div>
                                                    <p className="text-xs font-semibold">Distributed Telemetry Pipeline</p>
                                                    <p className={`text-[11px] ${isLight ? "text-slate-600" : "text-slate-400"}`}>FastAPI, PostgreSQL, Redis Streams</p>
                                                </div>
                                                <Badge tone="accent">Projects Grid</Badge>
                                            </div>
                                            <div className={`rounded-xl border p-3.5 flex items-center justify-between ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/70 border-slate-800"}`}>
                                                <div>
                                                    <p className="text-xs font-semibold">Certifications & Achievements</p>
                                                    <p className={`text-[11px] ${isLight ? "text-slate-600" : "text-slate-400"}`}>Extracted automatically from uploaded resume</p>
                                                </div>
                                                <Badge tone="success">AI Parsed</Badge>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. PORTFOLIO TEMPLATE GALLERY */}
                <section id="templates" className={`py-20 border-t ${isLight ? "border-slate-200/80 bg-white/70" : "border-slate-800/80 bg-[#0A0D15]/80"}`}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <p className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-indigo-600" : "text-indigo-400"}`}>
                                    Career-Path Templates
                                </p>
                                <h2 className={`text-3xl font-extrabold tracking-tight mt-1 ${isLight ? "text-slate-900" : "text-white"}`}>
                                    Built for developers, designers, and students
                                </h2>
                                <p className={`text-sm mt-1 max-w-2xl ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                                    Pick a role-specific starter with pre-mapped sections. You can switch templates inside the editor anytime without losing content.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {categories.map((cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setTemplateCategory(cat)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${templateCategory === cat
                                            ? "bg-indigo-600 border-indigo-500 text-white"
                                            : isLight
                                                ? "border-slate-200 text-slate-600 hover:bg-slate-100"
                                                : "border-slate-800 text-slate-300 hover:bg-slate-800"
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredTracks.map((track) => (
                                <div
                                    key={track.id}
                                    className={`rounded-2xl border p-6 flex flex-col justify-between gap-4 transition-all ${isLight
                                        ? "bg-white border-slate-200 hover:border-indigo-400"
                                        : "bg-[#101420] border-slate-800 hover:border-indigo-500/50"
                                        }`}
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <Badge tone="accent">{track.category}</Badge>
                                            <span
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: track.palette.primary }}
                                                aria-hidden="true"
                                            />
                                        </div>
                                        <h3 className={`text-lg font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                                            {track.label}
                                        </h3>
                                        <p className={`text-xs leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                                            {track.summary}
                                        </p>
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                            {track.recommendedSections.slice(0, 5).map((sec) => (
                                                <span
                                                    key={sec}
                                                    className={`px-2 py-0.5 rounded text-[10px] font-mono ${isLight ? "bg-slate-100 text-slate-700" : "bg-slate-900 text-slate-300"
                                                        }`}
                                                >
                                                    {sec}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => openModal("signup")}
                                        className={`w-full py-2.5 rounded-xl bg-indigo-600/12 hover:bg-indigo-600 hover:text-white border border-indigo-500/25 text-xs font-semibold transition-colors cursor-pointer ${isLight ? "text-indigo-700" : "text-indigo-400"}`}
                                    >
                                        Start with {track.label} →
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className={`rounded-2xl border p-6 space-y-4 ${isLight ? "bg-slate-50 border-slate-200" : "bg-[#0F131E] border-slate-800"}`}>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <h3 className={`text-base font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                                        {FRONTPAGE_LAYOUTS.length} Studio Frontpage Layouts
                                    </h3>
                                    <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                                        Switch frontpage aesthetics anytime inside the studio without losing portfolio content.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => openModal("signup")}
                                    className={`text-xs font-semibold hover:underline cursor-pointer ${isLight ? "text-indigo-700" : "text-indigo-400"}`}
                                >
                                    Try all {FRONTPAGE_LAYOUTS.length} layouts →
                                </button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                                {FRONTPAGE_LAYOUTS.map((layout) => (
                                    <div
                                        key={layout.id}
                                        className={`rounded-xl border px-3 py-2.5 flex items-center gap-2 ${isLight ? "bg-white border-slate-200" : "bg-[#141926] border-slate-800"
                                            }`}
                                    >
                                        <span
                                            className="w-2.5 h-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: layout.accent }}
                                            aria-hidden="true"
                                        />
                                        <div className="min-w-0">
                                            <p className={`text-xs font-semibold truncate ${isLight ? "text-slate-900" : "text-white"}`}>
                                                {layout.name}
                                            </p>
                                            <p className={`text-[10px] truncate ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                                                {layout.tag}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. FEATURES SECTION */}
                <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    <div className="text-center max-w-2xl mx-auto mb-14">
                        <h2 className={`text-3xl font-extrabold tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                            Everything required to ship faster
                        </h2>
                        <p className={`text-sm sm:text-base mt-2 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                            A structured workspace backed by real persistence, resume intelligence, and clean static code generation.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {FEATURES.map((feature, idx) => {
                            const Icon = feature.icon;
                            return (
                                <div
                                    key={idx}
                                    className={`border rounded-2xl p-6 transition-all ${isLight
                                        ? "bg-white border-slate-200 hover:border-indigo-300"
                                        : "bg-[#0F131E] border-slate-800 hover:border-indigo-500/40"
                                        }`}
                                >
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/12 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-4">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <h3 className={`text-base font-bold mb-1.5 ${isLight ? "text-slate-900" : "text-white"}`}>
                                        {feature.title}
                                    </h3>
                                    <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                                        {feature.desc}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* 4. HOW IT WORKS PIPELINE */}
                <section id="pipeline" className={`py-20 border-t ${isLight ? "border-slate-200/80 bg-white/70" : "border-slate-800/80 bg-[#0A0D15]/80"}`}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                        <div className="space-y-3">
                            <p className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-indigo-600" : "text-indigo-400"}`}>Workflow</p>
                            <h2 className={`text-3xl font-extrabold tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                                Three steps from resume to production URL
                            </h2>
                            <p className={`text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                                Keep multiple role-tailored portfolios in your dashboard and publish only what you choose.
                            </p>
                        </div>

                        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className={`p-5 rounded-2xl border ${isLight ? "bg-white border-slate-200" : "bg-[#101420] border-slate-800"}`}>
                                <Terminal className="w-6 h-6 text-indigo-400 mb-3" />
                                <h3 className="font-bold text-sm mb-1">1. Create & Import</h3>
                                <p className={`text-xs leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>Pick a career track or upload a PDF/DOCX resume and review extracted fields.</p>
                            </div>
                            <div className={`p-5 rounded-2xl border ${isLight ? "bg-white border-indigo-200" : "bg-[#101420] border-indigo-500/35"}`}>
                                <Paintbrush className="w-6 h-6 text-cyan-400 mb-3" />
                                <h3 className="font-bold text-sm mb-1">2. Refine & Style</h3>
                                <p className={`text-xs leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>Drag-reorder sections, run AI copy & ATS checks, and preview mobile layouts.</p>
                            </div>
                            <div className={`p-5 rounded-2xl border ${isLight ? "bg-white border-slate-200" : "bg-[#101420] border-slate-800"}`}>
                                <Globe className="w-6 h-6 text-emerald-400 mb-3" />
                                <h3 className="font-bold text-sm mb-1">3. Publish or Export</h3>
                                <p className={`text-xs leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>Toggle public visibility with SEO metadata or export a clean React ZIP & PDF.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 5. PLANS & MONETIZATION READINESS */}
                <section id="plans" className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
                        <p className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-indigo-600" : "text-indigo-400"}`}>
                            Plans & Workspace Access
                        </p>
                        <h2 className={`text-3xl font-extrabold tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                            Start building free, ready to scale
                        </h2>
                        <p className={`text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                            All core portfolio creation, resume parsing, and export features are available now. Paid Pro & Premium tiers are architected and will open once billing launches.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={`rounded-2xl border p-6 sm:p-8 flex flex-col justify-between gap-6 ${isLight ? "bg-white border-slate-200" : "bg-[#0F131E] border-slate-800"}`}>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className={`text-lg font-bold ${isLight ? "text-slate-900" : "text-white"}`}>Free Starter</h3>
                                    <Badge tone="success">Active Today</Badge>
                                </div>
                                <p className={`text-xs leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                                    Everything students, engineers, and designers need to create, customize, and publish portfolios cleanly.
                                </p>
                                <ul className={`space-y-2.5 text-xs ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Multi-portfolio dashboard &amp; public URLs</li>
                                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> PDF / DOCX AI Resume Parser &amp; review modal</li>
                                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> All {FRONTPAGE_LAYOUTS.length} Studio Frontpage Layouts &amp; 7 Tracks</li>
                                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Resume PDF, Standalone HTML &amp; React ZIP exports</li>
                                </ul>
                            </div>
                            <button
                                type="button"
                                onClick={() => openModal("signup")}
                                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                            >
                                Get Started Free →
                            </button>
                        </div>

                        <div className={`rounded-2xl border p-6 sm:p-8 flex flex-col justify-between gap-6 ${isLight ? "bg-slate-50 border-indigo-200" : "bg-[#111728] border-indigo-500/35"}`}>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className={`text-lg font-bold ${isLight ? "text-slate-900" : "text-white"}`}>Pro &amp; Premium Tiers</h3>
                                    <Badge tone="accent">Coming Soon</Badge>
                                </div>
                                <p className={`text-xs leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                                    Plan entitlements and AI credit telemetry are built into the backend. Online checkout and custom pricing will be announced after public beta.
                                </p>
                                <ul className={`space-y-2.5 text-xs ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Expanded AI credit quotas &amp; custom domain mapping</li>
                                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Portfolio version history &amp; multi-resume library</li>
                                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Priority AI image generation &amp; team analytics</li>
                                </ul>
                            </div>
                            <button
                                type="button"
                                onClick={() => openModal("signup")}
                                className={`w-full py-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${isLight ? "border-indigo-300 text-indigo-700 hover:bg-indigo-50" : "border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10"}`}
                            >
                                Join Free Beta First
                            </button>
                        </div>
                    </div>
                </section>

                {/* 6. FAQ */}
                <section id="faq" className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    <div className="text-center mb-10">
                        <h2 className={`text-3xl font-extrabold tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                            Frequently Asked Questions
                        </h2>
                    </div>

                    <div className="space-y-3">
                        {FAQS.map((item, idx) => {
                            const isOpen = openFaqIdx === idx;
                            return (
                                <div
                                    key={idx}
                                    className={`rounded-2xl border overflow-hidden ${isLight ? "bg-white border-slate-200" : "bg-[#0F131E] border-slate-800"
                                        }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setOpenFaqIdx(isOpen ? -1 : idx)}
                                        className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left font-semibold text-sm cursor-pointer"
                                    >
                                        <span>{item.q}</span>
                                        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                                    </button>
                                    {isOpen && (
                                        <div className={`px-5 pb-4 text-xs sm:text-sm leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                                            {item.a}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* 6. FOOTER */}
                <footer className={`border-t py-12 ${isLight ? "border-slate-200 bg-white" : "border-slate-800 bg-[#080A11]"}`}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                            <span className={`text-sm font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                                AuraBuild Studio
                            </span>
                            <span className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                                © {new Date().getFullYear()}
                            </span>
                        </div>
                        <div className={`flex flex-wrap items-center gap-6 text-xs font-medium ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                            <button type="button" onClick={() => setInfoDocKey("docs")} className="hover:text-indigo-400 cursor-pointer">Documentation</button>
                            <button type="button" onClick={() => setInfoDocKey("privacy")} className="hover:text-indigo-400 cursor-pointer">Privacy Policy</button>
                            <button type="button" onClick={() => setInfoDocKey("terms")} className="hover:text-indigo-400 cursor-pointer">Terms of Service</button>
                            <button type="button" onClick={() => setInfoDocKey("contact")} className="hover:text-indigo-400 cursor-pointer">Support</button>
                        </div>
                    </div>
                </footer>
            </div>

            {/* FOOTER INFO MODAL */}
            <Modal
                isOpen={Boolean(infoDocKey)}
                onClose={() => setInfoDocKey(null)}
                title={infoDocKey ? LEGAL_DOCS[infoDocKey]?.title : ""}
                size="md"
            >
                <div className="space-y-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                    {(LEGAL_DOCS[infoDocKey]?.body || []).map((line, i) => (
                        <p key={i}>{line}</p>
                    ))}
                </div>
            </Modal>

            {/* AUTH MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-md">
                    <div className="bg-[#0f1118] border border-slate-800 rounded-3xl max-w-[460px] w-full p-6 sm:p-8 shadow-2xl relative flex flex-col items-center max-h-[92vh] overflow-y-auto custom-scrollbar text-white">
                        <button
                            type="button"
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 cursor-pointer bg-slate-900 rounded-full hover:bg-slate-800 border border-slate-700"
                            aria-label="Close modal"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex flex-col items-center gap-2 mb-5 text-center">
                            <img
                                src="/logo.png"
                                alt="AuraBuild Logo"
                                className="w-12 h-12 object-contain"
                            />
                            <h2 className="font-display font-bold text-white text-xl tracking-tight">
                                {stepState === "avatar"
                                    ? "Personalize Identity"
                                    : authMode === "signup"
                                        ? "Create Account"
                                        : authMode === "reset"
                                            ? "Reset Password"
                                            : "Welcome Back"}
                            </h2>
                            <p className="text-xs text-slate-400 max-w-xs">
                                {stepState === "avatar"
                                    ? "Choose an avatar for your workspace studio profile."
                                    : authMode === "signup"
                                        ? "Set up your workspace & build your portfolio."
                                        : authMode === "reset"
                                            ? "Verify your email via a 6-digit security code."
                                            : "Sign in to open your AuraBuild dashboard."}
                            </p>
                        </div>

                        {stepState !== "avatar" && authMode !== "reset" && (
                            <div className="w-full grid grid-cols-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl mb-5 text-xs font-bold">
                                <button
                                    type="button"
                                    onClick={() => { setAuthMode("login"); setAuthError(""); setAuthNotice(""); }}
                                    className={`py-2 rounded-xl transition-all cursor-pointer ${authMode === "login" ? "bg-white text-slate-950" : "text-slate-400 hover:text-white"}`}
                                >
                                    Sign In
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setAuthMode("signup"); setAuthError(""); setAuthNotice(""); }}
                                    className={`py-2 rounded-xl transition-all cursor-pointer ${authMode === "signup" ? "bg-white text-slate-950" : "text-slate-400 hover:text-white"}`}
                                >
                                    Create Account
                                </button>
                            </div>
                        )}

                        {authNotice && (
                            <div className="w-full mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{authNotice}</span>
                            </div>
                        )}

                        {authError && (
                            <div className="w-full mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                                <div className="flex-1 leading-relaxed">
                                    <div>{authError}</div>
                                    {authError.includes("already exists") && (
                                        <button
                                            type="button"
                                            onClick={() => { setAuthMode("login"); setAuthError(""); }}
                                            className="block mt-1 text-indigo-400 font-bold underline cursor-pointer"
                                        >
                                            Switch to Sign In →
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* RESET PASSWORD FLOW (2-STEP VERIFIED OTP) */}
                        {authMode === "reset" && stepState !== "avatar" && (
                            <form
                                onSubmit={resetStep === "request" ? handleRequestResetCode : handleConfirmPasswordReset}
                                className="w-full space-y-4"
                            >
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Account Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            required
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="developer@domain.com"
                                            className="w-full bg-[#0B0C10] border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                {resetStep === "confirm" && (
                                    <>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">6-Digit Reset Code</label>
                                            <input
                                                required
                                                type="text"
                                                name="resetCode"
                                                value={formData.resetCode}
                                                onChange={handleInputChange}
                                                placeholder="Enter 6-digit code"
                                                className="w-full bg-[#0B0C10] border border-slate-800 rounded-xl py-2.5 px-4 text-sm font-mono tracking-widest text-white focus:outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">New Password (min 8 chars)</label>
                                            <input
                                                required
                                                type="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                placeholder="Choose new password"
                                                className="w-full bg-[#0B0C10] border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                    </>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {resetStep === "request" ? "Send Reset Code" : "Verify & Update Password"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => { setAuthMode("login"); setAuthError(""); setAuthNotice(""); }}
                                    className="w-full text-xs text-slate-400 hover:text-white cursor-pointer"
                                >
                                    ← Back to Sign In
                                </button>
                            </form>
                        )}

                        {/* SIGN IN FORM */}
                        {authMode === "login" && stepState !== "avatar" && (
                            <form onSubmit={handleLoginSubmit} className="w-full space-y-4">
                                <div className="flex justify-between items-center pb-1 text-xs">
                                    <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Method</span>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => { setLoginMethod("password"); setAuthError(""); }}
                                            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg cursor-pointer ${loginMethod === "password" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "text-slate-500 hover:text-slate-300"}`}
                                        >
                                            Email & Password
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setLoginMethod("code"); setAuthError(""); }}
                                            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg cursor-pointer ${loginMethod === "code" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "text-slate-500 hover:text-slate-300"}`}
                                        >
                                            Access Code
                                        </button>
                                    </div>
                                </div>

                                {loginMethod === "password" ? (
                                    <>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Email</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                <input
                                                    required
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    placeholder="developer@domain.com"
                                                    className="w-full bg-[#0B0C10] border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Password</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                <input
                                                    required
                                                    type={showPassword ? "text" : "password"}
                                                    name="password"
                                                    value={formData.password}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter password"
                                                    className="w-full bg-[#0B0C10] border border-slate-800 rounded-xl py-2.5 pl-10 pr-11 text-sm text-white focus:outline-none focus:border-indigo-500"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                                                >
                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            <div className="flex justify-end pt-1">
                                                <button
                                                    type="button"
                                                    onClick={() => { setAuthMode("reset"); setResetStep("request"); setAuthError(""); }}
                                                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                                                >
                                                    Forgot password?
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Workspace Access Code</label>
                                        <div className="relative">
                                            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                            <input
                                                required
                                                type="text"
                                                name="code"
                                                value={formData.code}
                                                onChange={handleInputChange}
                                                placeholder="Paste workspace key"
                                                className="w-full bg-[#0B0C10] border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                    </div>
                                )}

                                <button
                                    disabled={isLoading}
                                    type="submit"
                                    className="w-full py-3 rounded-xl bg-white hover:bg-slate-200 text-slate-950 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {isLoading ? "Signing in..." : "Sign In"}
                                </button>

                                <div className="relative flex py-2 items-center">
                                    <div className="flex-grow border-t border-slate-800" />
                                    <span className="mx-3 text-[10px] uppercase tracking-wider text-slate-500 font-bold">Or continue with</span>
                                    <div className="flex-grow border-t border-slate-800" />
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
                                        className="w-10 h-10 rounded-full bg-[#24292F] hover:bg-[#24292F]/80 text-white flex justify-center items-center cursor-pointer border border-slate-700"
                                        title="Continue with GitHub"
                                    >
                                        <svg height="20" viewBox="0 0 16 16" width="20" className="fill-white">
                                            <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2.02.27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
                                        </svg>
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* REGISTRATION FORM */}
                        {authMode === "signup" && stepState !== "avatar" && (
                            <form onSubmit={handleRegisterSubmit} className="w-full space-y-3.5">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            required
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Ada Lovelace"
                                            className="w-full bg-[#0B0C10] border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            required
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="developer@domain.com"
                                            className="w-full bg-[#0B0C10] border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            required
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            placeholder="Min 8 characters"
                                            className="w-full bg-[#0B0C10] border border-slate-800 rounded-xl py-2.5 pl-10 pr-11 text-sm text-white focus:outline-none focus:border-indigo-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {formData.password && (
                                        <div className="pt-1 space-y-1">
                                            <div className="flex justify-between text-[10px]">
                                                <span className="text-slate-500">Strength</span>
                                                <span className={`font-bold ${passwordStrength.text}`}>{passwordStrength.label}</span>
                                            </div>
                                            <div className="grid grid-cols-4 gap-1 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                                {[1, 2, 3, 4].map((lvl) => (
                                                    <div key={lvl} className={`h-full rounded-full ${passwordStrength.score >= lvl ? passwordStrength.color : "bg-slate-800"}`} />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Confirm Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            required
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            placeholder="Re-type password"
                                            className="w-full bg-[#0B0C10] border border-slate-800 rounded-xl py-2.5 pl-10 pr-11 text-sm text-white focus:outline-none focus:border-indigo-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    disabled={isLoading}
                                    type="submit"
                                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {isLoading ? "Creating Workspace..." : "Create Account"}
                                </button>
                            </form>
                        )}

                        {/* AVATAR STEP */}
                        {stepState === "avatar" && (
                            <div className="w-full space-y-4 text-center">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Account Created
                                </div>
                                <p className="text-xs text-slate-400">Pick an avatar to finish entering your dashboard:</p>
                                <div className="grid grid-cols-4 gap-2.5 max-h-[210px] overflow-y-auto pr-1 custom-scrollbar">
                                    {FUN_AVATARS.slice(0, visibleAvatars).map((avatar) => (
                                        <button
                                            key={avatar.id}
                                            type="button"
                                            onClick={() => handleAvatarSelect(avatar.emoji)}
                                            className="h-14 flex items-center justify-center text-2xl bg-[#0B0C10] border border-slate-800 rounded-xl hover:border-indigo-500 hover:scale-105 transition-all cursor-pointer"
                                            title={avatar.label}
                                        >
                                            {avatar.emoji}
                                        </button>
                                    ))}
                                </div>
                                {visibleAvatars < FUN_AVATARS.length && (
                                    <button
                                        type="button"
                                        onClick={() => setVisibleAvatars(FUN_AVATARS.length)}
                                        className="w-full py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 cursor-pointer"
                                    >
                                        Show All {FUN_AVATARS.length} Avatars
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => handleAvatarSelect("🐱")}
                                    className="text-xs text-indigo-400 hover:underline cursor-pointer"
                                >
                                    Skip & open dashboard →
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
