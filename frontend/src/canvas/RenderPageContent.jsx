import { useState, useMemo } from "react";
import { notify } from "../toast";
import { sendContactForm } from "../utils/contactUtils";
import EditableText from "./EditableText";
import { PORTFOLIO_THEMES } from "./themes";
import { motion, AnimatePresence } from "framer-motion";
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ResumePDF } from "../components/ResumePDF";
import { HeroParticles } from "./HeroParticles";
import { GitHubCalendar } from 'react-github-calendar';

// --- Subdued Premium Animation Configurations ---
const springTransition = { type: "spring", stiffness: 250, damping: 25 };

const fadeUpConfig = {
    initial: { opacity: 0, y: 20, scale: 0.99 },
    whileInView: { opacity: 1, y: 0, scale: 1 },
    viewport: { once: false, margin: "-40px", amount: 0.1 },
    transition: { ...springTransition, duration: 0.4 }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.05 }
    }
};

const staggerItem = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: springTransition }
};

export const getRoleImage = (subheading) => {
    const role = (subheading || "").toLowerCase();
    if (role.includes('civil') || role.includes('construct') || role.includes('architect')) return '/3d_civil.jpg';
    if (role.includes('design') || role.includes('art') || role.includes('ui/ux') || role.includes('ux')) return '/3d_design.jpg';
    if (role.includes('data') || role.includes('ai') || role.includes('machine learning') || role.includes('ml')) return '/3d_data.jpg';
    if (role.includes('develop') || role.includes('software') || role.includes('engineer') || role.includes('program')) return '/3d_developer_workspace.jpg';
    return '/3d_generic.jpg';
};

export default function RenderPageContent({ section, portfolioTheme, sections, onInlineEdit, isPreview = false, aiSuggestionPreview = null }) {
    // Memoize the PDF document to prevent massive memory leaks and re-renders on scroll
    const pdfDocument = useMemo(() => isPreview ? <ResumePDF sections={sections} /> : null, [sections, isPreview]);
    const [openMenu, setOpenMenu] = useState(null);
    const [cName, setCName] = useState("");
    const [cEmail, setCEmail] = useState("");
    const [cMessage, setCMessage] = useState("");
    const [cSending, setCSending] = useState(false);

    if (!section) return null;

    const currentType = (section.section_type || "").toLowerCase().trim();
    const data = section.content_data || {};
    const bgImage = data.backgroundImage || null;

    // --- Dynamic Theme Integration ---
    const themeDef = PORTFOLIO_THEMES[portfolioTheme] || PORTFOLIO_THEMES.modern_glass || {};
    
    const borderClass = themeDef.border || "border-white/5";
    const innerBorderClass = (themeDef.border || "").split(' ').find(c => c.startsWith('border-')) || "border-white/5";
    
    // Subdued premium aesthetic defaults
    const accentText = themeDef.accentText || "text-blue-400"; // Focus on solid colors
    const accentBg = themeDef.accentBg || "bg-blue-600";
    const textPrimary = themeDef.textPrimary || "text-slate-50"; 
    const textSecondary = themeDef.textSecondary || "text-slate-400";
    const placeholderClass = themeDef.placeholderClass || "placeholder-slate-600";
    const cardBg = themeDef.cardBg || "bg-white/[0.02] backdrop-blur-2xl"; 
    const trackBg = themeDef.trackBg || "bg-white/[0.03]";
    const trackBgLight = themeDef.trackBgLight || "bg-white/[0.01]";
    const badgeClass = `${themeDef.badgeBg || trackBg} ${themeDef.badgeText || 'text-slate-300'} border ${innerBorderClass} shadow-sm backdrop-blur-md font-mono text-xs`;

    // --- SMART TEXT ROUTER ---
    const TextElement = ({ value, placeholder, onCommit, multiline = false }) => {
        if (isPreview) {
            if (!value) return null; // Do not show placeholders on the live polished site
            return (
                <span className={`block w-full max-w-full break-words ${multiline ? "whitespace-pre-wrap" : "whitespace-normal"} break-words`}>
                    {value}
                </span>
            );
        }
        return (
            <div className="w-full max-w-full whitespace-normal break-words">
                <EditableText value={value} placeholder={placeholder} onCommit={onCommit} multiline={multiline} />
            </div>
        );
    };

    // --- Data Mutation Helpers ---
    const updateScalar = (key, value) => {
        if (onInlineEdit && !isPreview) onInlineEdit(section.id, key, value);
    };

    const updateArrayItem = (key, index, field, value) => {
        if (!onInlineEdit || isPreview) return;
        const list = (data[key] || []).map((item, i) =>
            i === index ? {...item, [field]: value } : item
        );
        onInlineEdit(section.id, key, list);
    };

    const addArrayItem = (key, defaultItem) => {
        if (!onInlineEdit || isPreview) return;
        const list = [...(data[key] || []), defaultItem];
        onInlineEdit(section.id, key, list);
    };

    const removeArrayItem = (key, index) => {
        if (!onInlineEdit || isPreview) return;
        const list = (data[key] || []).filter((_, i) => i !== index);
        onInlineEdit(section.id, key, list);
    };

    // --- SUBMIT CONTACT FIX ---
    const submitContact = async(e) => {
        e.preventDefault();
        
        // BUG FIX: Forms should ONLY be submittable in Preview Mode / Live Website
        if (!isPreview) {
            return notify("Form submissions are disabled inside the editor. Please test this in Live Preview.", 'info');
        }
        
        if (!cName.trim() || !cEmail.trim() || !cMessage.trim()) {
            notify("Please fill in your name, email and message.", 'error');
            return;
        }
        
        setCSending(true);
        const result = await sendContactForm({ 
            name: cName, 
            email: cEmail, 
            message: cMessage,
            owner_email: data.email || "" // Passing the portfolio owner's email so the backend knows who to notify
        });

        if (result.success) {
            notify("Message sent! The owner will be notified.", 'success');
            setCName(""); setCEmail(""); setCMessage("");
        } else {
            notify(result.error, 'error');
        }
        setCSending(false);
    };

    const sectionImageBanner = bgImage ? (
        <motion.img 
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false, amount: 0.1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            src={bgImage}
            alt="Section header"
            className={`w-full h-32 md:h-40 object-cover rounded-2xl mb-6 border ${borderClass} shadow-lg`}
            loading="lazy" 
        />
    ) : null;

    const openExternal = (url) => {
        const targetUrl = url.startsWith("http") ? url : `https://${url}`;
        window.open(targetUrl, "_blank", "noopener,noreferrer");
    };

    const heroProjects = [];
    if (Array.isArray(sections)) {
        const pg = sections.find((s) => { const st = (s.section_type || "").toLowerCase().trim(); return st === "projects_grid" || st === "projects"; });
        if (pg && pg.content_data && pg.content_data.projects) {
            heroProjects.push(...pg.content_data.projects);
        }
    }

    const heroLiveOptions = [];
    if (data.liveUrl) heroLiveOptions.push({ label: "Live Website", url: data.liveUrl });

    const heroDesignOptions = [];
    if (data.designUrl) heroDesignOptions.push({ label: "Design Repository", url: data.designUrl });
    heroProjects.forEach((project) => {
        heroDesignOptions.push({ label: project.title || "Untitled Project", url: project.projectUrl });
    });

    // Check if this section has an active AI Suggestion
    const hasAiSuggestion = aiSuggestionPreview && String(aiSuggestionPreview.targetSectionId) === String(section.id);

    return (
        <div className={`w-full relative ${isPreview ? '' : 'group/section'} ${openMenu ? 'z-50' : 'z-10'}`}>
            {/* AI Suggestion Overlay */}
            {hasAiSuggestion && !isPreview && (
                <div className="absolute inset-0 z-[100] pointer-events-none p-4 animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-full h-full rounded-[2rem] border-2 border-blue-500/50 bg-blue-900/10 backdrop-blur-[2px] flex items-center justify-center">
                        <div className="bg-slate-900/95 border border-blue-500/50 shadow-2xl p-6 rounded-2xl pointer-events-auto max-w-lg text-center backdrop-blur-xl">
                            <h4 className="text-blue-400 font-bold mb-2 flex items-center justify-center gap-2">
                                <Sparkles className="w-4 h-4" /> AI Suggestion: {aiSuggestionPreview.actionTitle || "Content Update"}
                            </h4>
                            <p className="text-sm text-slate-300 mb-4 whitespace-pre-wrap text-left bg-black/40 p-3 rounded-lg border border-slate-700 max-h-40 overflow-y-auto custom-scrollbar">
                                {aiSuggestionPreview.suggestedContent}
                            </p>
                            <div className="text-xs text-slate-500">
                                Review in the Right Panel to Apply or Cancel
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 1. HERO SECTION */}
            {currentType === "hero" && (
                <motion.div 
                    {...fadeUpConfig}
                    className={`py-12 sm:py-24 px-4 sm:px-10 relative rounded-3xl bg-transparent overflow-visible`}
                    style={bgImage ? {
                        backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.8)), url('${bgImage}')`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    } : undefined}
                >
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                        {!bgImage && <HeroParticles isDark={themeDef.bodyBg?.includes('black') || themeDef.bodyBg?.includes('#0')} />}
                    </div>
                    
                    <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-20">
                        
                        {/* LEFT COLUMN: TEXT */}
                        <div className="flex-1 space-y-8 flex flex-col items-center lg:items-start text-center lg:text-left">
                            
                            {/* Status Indicator */}
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold ${borderClass} border shadow-sm ${cardBg} backdrop-blur-md`}
                            >
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className={textSecondary}>Open to opportunities</span>
                            </motion.div>

                            <div className="space-y-4 w-full">
                                <motion.h1
                                    initial={{ opacity: 0, y: 15 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: false, amount: 0.1 }}
                                    transition={springTransition}
                                    className={`font-display font-black tracking-tight leading-[1.05] w-full max-w-3xl text-4xl sm:text-5xl lg:text-6xl xl:text-7xl break-words ${bgImage ? 'text-white' : textPrimary}`}
                                >
                                    <TextElement
                                        value={data.heading || "YOUR NAME"}
                                        placeholder="Your Name"
                                        onCommit={(v) => updateScalar("heading", v)}
                                    />
                                </motion.h1>
                                
                                <motion.p 
                                    initial={{ opacity: 0, y: 15 }} 
                                    whileInView={{ opacity: 1, y: 0 }} 
                                    viewport={{ once: false, amount: 0.1 }}
                                    transition={{ ...springTransition, delay: 0.1 }}
                                    className={`text-xl md:text-2xl font-bold w-full max-w-full ${accentText}`}
                                >
                                    <TextElement 
                                        value={data.subheading || "Junior Data Engineer (GenAI) | Python Developer"}
                                        placeholder="Professional Headline"
                                        onCommit={(v) => updateScalar("subheading", v)}
                                    />
                                </motion.p>
                                
                                <motion.p 
                                    initial={{ opacity: 0, y: 15 }} 
                                    whileInView={{ opacity: 1, y: 0 }} 
                                    viewport={{ once: false, amount: 0.1 }}
                                    transition={{ ...springTransition, delay: 0.15 }}
                                    className={`text-lg md:text-xl leading-relaxed w-full max-w-2xl font-medium ${bgImage ? 'text-white/90' : textSecondary}`}
                                >
                                    <TextElement 
                                        multiline
                                        value={data.description || ""}
                                        placeholder="Introduction ..."
                                        onCommit={(v) => updateScalar("description", v)}
                                    />
                                </motion.p>
                            </div>

                            <motion.div 
                                initial={{ opacity: 0, y: 15 }} 
                                whileInView={{ opacity: 1, y: 0 }} 
                                viewport={{ once: false, amount: 0.1 }}
                                transition={{ ...springTransition, delay: 0.2 }}
                                className="flex flex-col items-center lg:items-start gap-6 pt-4 w-full"
                            >
                                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 w-full">
                                    <motion.button 
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const projectsSection = document.getElementById('preview-node-block-' + (sections.find(s => s.section_type === 'projects_grid')?.id || ''));
                                            if (projectsSection) projectsSection.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        className={`px-8 py-4 rounded-xl text-sm md:text-base font-bold transition-all shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:-translate-y-1 ${accentBg} text-white flex items-center gap-2`}
                                    >
                                        View My Work &rarr;
                                    </motion.button>
                                    
                                    {isPreview && (
                                        <PDFDownloadLink
                                            document={pdfDocument}
                                            fileName={`${data.heading?.replace(/\s+/g, '_') || 'Portfolio'}_Resume.pdf`}
                                            className={`px-8 py-4 rounded-xl text-sm md:text-base font-bold transition-all hover:bg-white/5 border border-white/10 shadow-sm hover:shadow-md hover:-translate-y-1 ${textPrimary} ${borderClass}`}
                                        >
                                            {({ blob, url, loading, error }) => (loading ? 'Preparing...' : 'Download Resume')}
                                        </PDFDownloadLink>
                                    )}
                                </div>
                                
                                {/* Sleek Side-by-Side Dropdowns */}
                                {(heroLiveOptions.length > 0 || heroDesignOptions.length > 0) && (
                                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 w-full mt-2">
                                        
                                        {/* See Live Dropdown */}
                                        {heroLiveOptions.length > 0 && (
                                            <div className="group relative z-50">
                                                <button 
                                                    onClick={(e) => {
                                                        if(heroLiveOptions.length === 1) {
                                                            e.stopPropagation(); 
                                                            openExternal(heroLiveOptions[0].url);
                                                        }
                                                    }}
                                                    className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all border border-white/5 shadow-lg flex items-center gap-2 bg-[#0a0a0f] hover:bg-[#1a1a24] text-white"
                                                >
                                                    See Live {heroLiveOptions.length > 1 ? '▾' : '↗'}
                                                </button>
                                                {heroLiveOptions.length > 1 && (
                                                    <div className="absolute top-full left-0 mt-2 w-48 rounded-xl border border-slate-800 bg-[#0a0a0f]/95 backdrop-blur-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 flex flex-col p-2 max-h-60 overflow-y-auto custom-scrollbar">
                                                        {heroLiveOptions.map((link, i) => (
                                                            <button
                                                                key={`social-${i}`}
                                                                onClick={(e) => { e.stopPropagation(); openExternal(link.url); }}
                                                                className="text-left px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all truncate flex items-center justify-between"
                                                            >
                                                                <span>{link.label}</span>
                                                                <span className="opacity-50 text-[10px]">↗</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* GitHub Button */}
                                        {data.github && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); openExternal(data.github); }}
                                                className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all border border-white/5 shadow-lg flex items-center gap-2 bg-[#0a0a0f] hover:bg-[#1a1a24] text-white"
                                            >
                                                GitHub ↗
                                            </button>
                                        )}
                                        
                                        {/* LinkedIn Button */}
                                        {data.linkedin && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); openExternal(data.linkedin); }}
                                                className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all border border-white/5 shadow-lg flex items-center gap-2 bg-[#0a0a0f] hover:bg-[#1a1a24] text-white"
                                            >
                                                LinkedIn ↗
                                            </button>
                                        )}
                                        
                                        {/* Projects Dropdown */}
                                        {heroDesignOptions.length > 0 && (
                                            <div className="group relative z-50">
                                                <button className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all border border-white/5 shadow-lg flex items-center gap-2 bg-[#0a0a0f] hover:bg-[#1a1a24] text-white">
                                                    Projects ▾
                                                </button>
                                                <div className="absolute top-full left-0 mt-2 w-56 rounded-xl border border-slate-800 bg-[#0a0a0f]/95 backdrop-blur-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 flex flex-col p-2 max-h-60 overflow-y-auto custom-scrollbar">
                                                    {heroDesignOptions.map((link, i) => (
                                                        <button
                                                            key={`proj-${i}`}
                                                            onClick={(e) => { e.stopPropagation(); openExternal(link.url); }}
                                                            className="text-left px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all truncate flex items-center justify-between"
                                                        >
                                                            <span>{link.label}</span>
                                                            <span className="opacity-50 text-[10px]">↗</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        </div>

                        {/* RIGHT COLUMN: 3D VISUAL */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
                            whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                            transition={{ type: "spring", damping: 20, stiffness: 40, delay: 0.3 }}
                            className="flex-1 w-full flex justify-center lg:justify-end relative"
                        >
                            <motion.div 
                                animate={{ y: [-15, 15, -15], rotateZ: [-2, 2, -2] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="relative w-[300px] h-[300px] md:w-[450px] md:h-[450px] lg:w-[500px] lg:h-[500px]"
                            >
                                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-[100px]"></div>
                                <img 
                                    src={getRoleImage(data.subheading || "")} 
                                    alt="3D Workspace" 
                                    className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-90 hover:opacity-100 transition-opacity duration-500 rounded-3xl"
                                    style={{ filter: "drop-shadow(0 0 30px rgba(59,130,246,0.3))" }}
                                />
                            </motion.div>
                        </motion.div>
                    </div>
                </motion.div>
            )}

            {/* 2. ABOUT SECTION */}
            {currentType === "about" && (
                <motion.div {...fadeUpConfig} className="py-12">
                    <div className="flex flex-wrap justify-center items-center gap-10">
                        {bgImage && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: false, amount: 0.2 }}
                                transition={springTransition}
                                className="shrink-0 relative group w-48 h-48 md:w-64 md:h-64 mx-auto md:mx-0"
                            >
                                <div className={`absolute inset-0 rounded-2xl md:rounded-full blur-lg opacity-40 bg-gradient-to-tr from-blue-500 to-purple-500 group-hover:opacity-60 transition-opacity duration-500`}></div>
                                <img 
                                    src={bgImage} 
                                    alt="Profile" 
                                    className={`relative w-full h-full object-cover rounded-2xl md:rounded-[3rem] border-4 ${borderClass} shadow-xl transition-transform duration-500 group-hover:scale-[1.02]`}
                                    loading="lazy"
                                />
                            </motion.div>
                        )}
                        <div className={`flex-[1_1_300px] space-y-5 w-full text-center min-[600px]:text-left`}>
                            <motion.h2 
                            initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: false }}
                            className={`text-3xl sm:text-4xl uppercase font-display font-black tracking-widest mb-10 ${textPrimary}`}
                        >
                            About Me
                        
                        </motion.h2>
                            <div className={`text-lg md:text-xl leading-relaxed break-words max-w-full font-medium ${textSecondary}`}>
                                <TextElement 
                                    multiline 
                                    value={data.bio || ""}
                                    placeholder="Provide a professional summary profile."
                                    onCommit={(v) => updateScalar("bio", v)}
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* 3. EDUCATION SECTION */}
            {currentType === "education" && (
                <motion.div {...fadeUpConfig} className="space-y-6 py-8">
                    {sectionImageBanner}
                    <motion.h2 
                            initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: false }}
                            className={`text-3xl sm:text-4xl uppercase font-display font-black tracking-widest mb-10 ${textPrimary}`}
                        >
                            Educational Background
                        
                        </motion.h2>
                    
                    <motion.div 
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: false, margin: "-20px", amount: 0.1 }}
                        className="space-y-0 relative border-l-2 ml-4 md:ml-8" style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                    >
                        {(data.schools || []).map((school, i) => (
                            <motion.div 
                                variants={staggerItem}
                                key={i}
                                className={`relative group pl-8 md:pl-12 py-6 transition-all`}
                            >
                                {/* Timeline Node */}
                                <div className={`absolute left-0 top-10 -translate-x-1/2 w-4 h-4 rounded-full border-2 ${borderClass} bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]`}></div>
                                
                                <div className={`relative p-6 rounded-2xl border transition-all ${cardBg} ${borderClass} ${!isPreview ? 'hover:shadow-md' : ''}`}>
                                    {!isPreview && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); removeArrayItem('schools', i); }}
                                            className="absolute -top-3 -right-3 w-7 h-7 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all rounded-full bg-red-500 hover:bg-red-600 shadow-md z-20"
                                        >✕</button>
                                    )}
                                    
                                    <div className="flex flex-wrap justify-between items-start gap-4">
                                        <div className="space-y-1.5 w-full sm:w-auto flex-1">
                                            <h3 className={`text-lg font-display font-bold uppercase tracking-wide break-words max-w-full ${textPrimary}`}>
                                                <TextElement 
                                                    value={school.institution || ""}
                                                    placeholder="Institution Name"
                                                    onCommit={(v) => updateArrayItem("schools", i, "institution", v)}
                                                />
                                            </h3>
                                            <p className={`text-base font-medium break-words max-w-full ${textSecondary}`}>
                                                <TextElement 
                                                    value={school.degree || ""}
                                                    placeholder="Degree / Major"
                                                    onCommit={(v) => updateArrayItem("schools", i, "degree", v)}
                                                />
                                            </p>
                                        </div>
                                        <span className={`text-sm font-mono px-4 py-1.5 rounded-lg shrink-0 transition-colors max-w-full truncate ${badgeClass}`}>
                                            <TextElement 
                                                value={school.years || ""}
                                                placeholder="Years"
                                                onCommit={(v) => updateArrayItem("schools", i, "years", v)}
                                            />
                                        </span>
                                    </div>
                                    <div className={`mt-4 pt-4 border-t flex items-center gap-2 text-sm overflow-hidden ${innerBorderClass}`}>
                                        <span className={`shrink-0 ${textSecondary}`}>Performance:</span>
                                        <span className={`font-mono font-bold truncate max-w-full ${accentText}`}>
                                            <TextElement 
                                                value={school.score || ""}
                                                placeholder="GPA / Score"
                                                onCommit={(v) => updateArrayItem("schools", i, "score", v)}
                                            />
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                    
                    {!isPreview && (
                        <div className="pt-4">
                            <button 
                                onClick={(e) => { e.stopPropagation(); addArrayItem('schools', { institution: "New Institution", degree: "New Degree", years: "Year - Year", score: "GPA: 0.0" }); }}
                                className={`w-full py-4 rounded-xl border border-dashed text-base font-bold opacity-50 hover:opacity-100 transition-all hover:bg-white/5 flex justify-center items-center gap-2 ${textPrimary} ${borderClass}`}
                            >
                                + Add Education
                            </button>
                        </div>
                    )}
                </motion.div>
            )}

            {/* 4. SKILLS SECTION */}
            {currentType === "skills" && (
                <motion.div {...fadeUpConfig} className="space-y-8 py-10">
                    {sectionImageBanner}
                    <motion.h2 
                            initial={{ opacity: 0, y: -20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false }}
                            className={`text-3xl sm:text-4xl uppercase font-display font-black tracking-widest text-center mb-14 ${textPrimary}`}
                        >
                            Core Expertise
                        
                        </motion.h2>
                    
                    <div className="flex flex-col gap-6 pt-2 w-full max-w-5xl mx-auto px-2">
                        {(data.items || []).map((skill, i) => {
                            const isEven = i % 2 === 0; 
                            
                            return (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, x: isEven ? -25 : 25, scale: 0.98 }} 
                                    whileInView={{ opacity: 1, x: 0, scale: 1 }}
                                    viewport={{ once: false, margin: "-20px", amount: 0.1 }}
                                    transition={{ ...springTransition, delay: 0.1 }}
                                    className={`relative group space-y-5 p-6 md:p-8 rounded-3xl transition-all w-full md:w-[70%] border shadow-md ${borderClass} ${cardBg} ${
                                        isEven ? 'self-start' : 'self-end'
                                    } ${!isPreview ? 'hover:scale-[1.01] hover:bg-white/5' : ''}`}
                                >
                                    {!isPreview && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); removeArrayItem('items', i); }}
                                            className={`absolute -top-3 ${isEven ? '-right-3' : '-left-3'} w-8 h-8 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all rounded-full bg-red-500 hover:bg-red-600 shadow-md z-20`}
                                        >✕</button>
                                    )}

                                    <div className="flex justify-between items-center text-lg font-bold">
                                        <span className={`break-words max-w-full tracking-wide ${textPrimary}`}>
                                            <TextElement 
                                                value={skill.name || ""}
                                                placeholder="Skill Name"
                                                onCommit={(v) => updateArrayItem("items", i, "name", v)}
                                            />
                                        </span>
                                        <span className={`${accentText} font-mono text-sm flex items-center shrink-0 ${trackBg} px-4 py-2 rounded-xl border ${borderClass} shadow-inner`}>
                                            <TextElement 
                                                value={String(skill.level || 50)}
                                                placeholder="50"
                                                onCommit={(v) => {
                                                    let num = parseInt(v, 10);
                                                    if (isNaN(num)) num = 50;
                                                    num = Math.max(0, Math.min(100, num));
                                                    updateArrayItem("items", i, "level", num);
                                                }}
                                            />%
                                        </span>
                                    </div>
                                    
                                    <div 
                                        className={`w-full h-3.5 rounded-full overflow-hidden border ${borderClass} ${trackBg} relative group/bar transition-all ${!isPreview ? 'cursor-pointer hover:h-4 shadow-inner' : ''}`}
                                        onClick={(e) => {
                                            if (isPreview) return;
                                            e.stopPropagation();
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const newLevel = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
                                            updateArrayItem("items", i, "level", newLevel);
                                        }}
                                    >
                                        <motion.div 
                                            className={`h-full rounded-full ${accentBg}`}
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${skill.level || 50}%` }}
                                            viewport={{ once: false }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            style={{ boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.2)' }}
                                        />
                                        {!isPreview && <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none" />}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                    
                    {!isPreview && (
                        <div className="pt-12">
                            <button 
                                onClick={(e) => { e.stopPropagation(); addArrayItem('items', { name: "New Skill", level: 50 }); }}
                                className={`w-full max-w-5xl mx-auto py-4 rounded-xl border border-dashed text-base font-bold opacity-50 hover:opacity-100 transition-all hover:bg-white/5 flex justify-center items-center ${textPrimary} ${borderClass}`}
                            >
                                + Add Skill
                            </button>
                        </div>
                    )}
                </motion.div>
            )}

            {/* 5. PROJECTS SECTION */}
            {currentType === "projects_grid" && (
                <div className="space-y-8 py-10">
                    {sectionImageBanner}
                    <motion.h2 
                            initial={{ opacity: 0, y: -20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false }}
                            className={`text-3xl sm:text-4xl uppercase font-display font-black tracking-widest text-center mb-14 ${textPrimary}`}
                        >
                            {data.title || "Showcase of Innovations"}
                        
                        </motion.h2>
                    
                    <div className="flex flex-col gap-10 w-full max-w-5xl mx-auto px-2">
                        {(data.projects || []).map((project, i) => (
                            <div 
                                key={i}
                                id={`project-card-${i}`}
                                onMouseMove={(e) => {
                                    if (isPreview) return; // Keep it clean in edit mode or apply only in preview? 
                                    // Actually, it's nice to have everywhere. Let's apply everywhere.
                                    const card = e.currentTarget;
                                    const rect = card.getBoundingClientRect();
                                    const x = e.clientX - rect.left;
                                    const y = e.clientY - rect.top;
                                    const rotateX = ((y - (rect.height / 2)) / (rect.height / 2)) * -5; 
                                    const rotateY = ((x - (rect.width / 2)) / (rect.width / 2)) * 5;
                                    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
                                }}
                                style={{ transition: "transform 0.1s ease-out" }}
                                className={`relative group p-8 md:p-10 rounded-[2rem] border flex flex-col space-y-6 shadow-md backdrop-blur-xl w-full overflow-hidden ${cardBg} ${borderClass} ${!isPreview ? 'hover:shadow-[0_20px_40px_rgb(0,0,0,0.2)] hover:border-white/20 z-10 hover:z-20' : ''}`}
                            >
                                <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 transition-all duration-500 group-hover:w-full bg-current ${accentText}`}></div>

                                {!isPreview && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); removeArrayItem('projects', i); }}
                                        className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all rounded-full bg-red-500 hover:bg-red-600 shadow-md z-30"
                                    >✕</button>
                                )}

                                <motion.h3 
                                    initial={{ opacity: 0, x: -30 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: false, amount: 0.1 }}
                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                    className={`text-2xl md:text-3xl font-black uppercase tracking-wide break-words w-full transition-colors group-hover:text-white ${textPrimary}`}
                                >
                                    <TextElement 
                                        value={project.title || ""}
                                        placeholder="Project Name"
                                        onCommit={(v) => updateArrayItem("projects", i, "title", v)}
                                    />
                                </motion.h3>
                                
                                <motion.div 
                                    initial={{ opacity: 0, x: 30 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: false, amount: 0.1 }}
                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                    className={`text-base leading-relaxed break-words w-full font-medium ${textSecondary}`}
                                >
                                    <TextElement 
                                        multiline 
                                        value={project.desc || ""}
                                        placeholder="Describe the project in detail, highlighting your role and the impact."
                                        onCommit={(v) => updateArrayItem("projects", i, "desc", v)}
                                    />
                                </motion.div>

                                {project.projectUrl && project.projectUrl.trim() !== "" && (
                                    <div className="pt-2">
                                        <motion.button 
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            whileInView={{ scale: 1, opacity: 1 }}
                                            viewport={{ once: false, amount: 0.1 }}
                                            animate={{ 
                                                scale: [1, 1.03, 1], 
                                                opacity: [1, 0.85, 1],
                                                boxShadow: [
                                                    "0 0 0px rgba(59,130,246,0)", 
                                                    "0 0 15px rgba(59,130,246,0.5)", 
                                                    "0 0 0px rgba(59,130,246,0)"
                                                ] 
                                            }}
                                            transition={{ 
                                                scale: { repeat: Infinity, duration: 2.5, ease: "easeInOut" },
                                                opacity: { repeat: Infinity, duration: 2.5, ease: "easeInOut" },
                                                boxShadow: { repeat: Infinity, duration: 2.5, ease: "easeInOut" }
                                            }}
                                            onClick={(e) => { e.stopPropagation(); openExternal(project.projectUrl); }}
                                            className={`inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-sm font-bold transition-all border shadow-sm ${badgeClass}`}
                                        >
                                            View Live ↗
                                        </motion.button>
                                    </div>
                                )}

                                <div className="pt-6 border-t border-dashed flex flex-col gap-5 mt-auto w-full" style={{ borderColor: 'inherit' }}>
                                    <motion.div 
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: false, amount: 0.1 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 18 }}
                                        className="flex flex-wrap gap-2.5"
                                    >
                                        {(project.tags || []).length > 0 ? (
                                            (project.tags || []).map((tag, tIdx) => (
                                                <span key={tIdx} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border ${trackBg} shadow-inner break-words transition-colors hover:brightness-110 ${textPrimary} ${borderClass}`}>
                                                    {tag}
                                                </span>
                                            ))
                                        ) : (
                                            isPreview ? null : <span className={`text-xs italic opacity-50 ${textSecondary}`}>No tools added yet.</span>
                                        )}
                                    </motion.div>
                                    
                                    {!isPreview && (
                                        <div className={`text-xs flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity w-full ${textSecondary}`}>
                                            <span className="shrink-0 font-bold">✎ Edit Tools:</span>
                                            <div className={`flex-1 ${trackBgLight} px-4 py-2 rounded-xl border border-transparent hover:border-slate-500/30 transition-colors w-full overflow-hidden`}>
                                                <TextElement 
                                                    value={(project.tags || []).join(", ")}
                                                    placeholder="React.js, Node.js, MongoDB"
                                                    onCommit={(v) => updateArrayItem("projects", i, "tags", v.split(",").map(t => t.trim()).filter(Boolean))}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {!isPreview && (
                                    <div className={`text-sm font-mono w-full ${textSecondary} flex items-center gap-3 p-3 rounded-xl ${trackBgLight} border ${borderClass}`}>
                                        <span className="text-xl shrink-0">🔗</span>
                                        <div className="flex-1 truncate w-full">
                                            <TextElement 
                                                value={project.projectUrl || ""}
                                                placeholder="Paste Live URL (e.g., https://my-project.com)"
                                                onCommit={(v) => updateArrayItem("projects", i, "projectUrl", v)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {data.githubUsername && data.githubUsername.trim() !== "" && (
                        <div className={`w-full max-w-5xl mx-auto mt-16 p-4 sm:p-8 rounded-3xl border shadow-lg overflow-hidden ${cardBg} ${borderClass}`}>
                            <h3 className={`text-sm font-black tracking-widest uppercase mb-8 text-center w-full ${accentText}`}>
                                Open Source Contributions
                            </h3>
                            <div className={`w-full overflow-x-auto pb-4 ${textPrimary}`}>
                                <div className="w-max mx-auto px-2" style={{ color: 'inherit' }}>
                                    <GitHubCalendar 
                                        username={data.githubUsername.trim()} 
                                        colorScheme={themeDef.bodyBg?.includes('black') || themeDef.bodyBg?.includes('#0') || themeDef.bodyBg?.includes('950') || themeDef.id !== 'minimal_executive' ? 'dark' : 'light'}
                                        blockSize={12}
                                        blockMargin={4}
                                        fontSize={12}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {!isPreview && (
                        <div className="pt-10 w-full px-2 max-w-5xl mx-auto space-y-4">
                            <button 
                                onClick={(e) => { e.stopPropagation(); addArrayItem('projects', { title: "New Project", desc: "Brief description of the project.", tags: ["React", "Tailwind CSS"], projectUrl: "" }); }}
                                className={`w-full py-5 rounded-xl border border-dashed text-base font-bold opacity-50 hover:opacity-100 transition-all hover:bg-white/5 flex flex-col justify-center items-center ${textPrimary} ${borderClass}`}
                            >
                                + Add Another Project
                            </button>
                            
                            <div className={`text-sm font-mono w-full ${textSecondary} flex items-center gap-3 p-3 rounded-xl ${trackBgLight} border ${borderClass}`}>
                                <span className="text-xl shrink-0">🐙</span>
                                <div className="flex-1 truncate w-full">
                                    <TextElement 
                                        value={data.githubUsername || ""}
                                        placeholder="Enter your GitHub Username (e.g., torvalds) to show your contribution graph!"
                                        onCommit={(v) => updateScalar("githubUsername", v)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 6. CONTACT SECTION (FIXED FOR LIVE PREVIEW) */}
            {currentType === "contact" && (
                <div className={`relative text-center py-16 mt-12 border-t ${borderClass}`}>
                    
                    {/* Ambient Animated Glow Orb */}
                    <motion.div 
                        animate={{ scale: [1, 1.05, 1], opacity: [0.1, 0.15, 0.1] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-full max-h-96 bg-blue-500 rounded-full blur-[120px] pointer-events-none z-0"
                    />

                    <div className="relative z-10">
                        {sectionImageBanner}
                        <motion.h2 
                            initial={{ opacity: 0, y: -15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: false, amount: 0.1 }}
                            className={`text-sm uppercase font-display font-black tracking-widest mb-6 ${accentText}`}
                        >
                            Get In Touch
                        </motion.h2>
                        
                        <motion.div 
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: false, amount: 0.1 }}
                            transition={{ delay: 0.1 }}
                            className={`text-base max-w-lg mx-auto leading-relaxed break-words font-medium ${textSecondary}`}
                        >
                            <TextElement 
                                multiline 
                                value={data.text || ""}
                                placeholder="Reach out for collaborations."
                                onCommit={(v) => updateScalar("text", v)}
                            />
                        </motion.div>

                        {(data.email || data.phone || data.linkedin || data.github) && (
                            <motion.div 
                                variants={staggerContainer}
                                initial="hidden"
                                whileInView="show"
                                viewport={{ once: false, amount: 0.1 }}
                                className="flex flex-wrap justify-center gap-4 mt-8"
                            >
                                {data.email && (
                                    <motion.span variants={staggerItem} whileHover={{ scale: 1.03 }} className={`px-5 py-2.5 border rounded-full text-sm font-bold transition-colors shadow-sm ${badgeClass}`}>
                                        <TextElement value={data.email} placeholder="email" onCommit={(v) => updateScalar("email", v)} />
                                    </motion.span>
                                )}
                                {data.phone && (
                                    <motion.span variants={staggerItem} whileHover={{ scale: 1.03 }} className={`px-5 py-2.5 border rounded-full text-sm font-bold transition-colors shadow-sm ${badgeClass}`}>
                                        <TextElement value={data.phone} placeholder="phone" onCommit={(v) => updateScalar("phone", v)} />
                                    </motion.span>
                                )}
                                {data.linkedin && (
                                    <motion.a variants={staggerItem} whileHover={{ scale: 1.03 }} href={data.linkedin.startsWith("http") ? data.linkedin : `https://${data.linkedin}`} target="_blank" rel="noopener noreferrer" className={`px-5 py-2.5 border rounded-full text-sm font-bold transition-colors hover:bg-white/5 shadow-sm ${badgeClass}`}>
                                        LinkedIn
                                    </motion.a>
                                )}
                                {data.github && (
                                    <motion.a variants={staggerItem} whileHover={{ scale: 1.03 }} href={data.github.startsWith("http") ? data.github : `https://${data.github}`} target="_blank" rel="noopener noreferrer" className={`px-5 py-2.5 border rounded-full text-sm font-bold transition-colors hover:bg-white/5 shadow-sm ${badgeClass}`}>
                                        GitHub
                                    </motion.a>
                                )}
                            </motion.div>
                        )}

                        <motion.form 
                            variants={staggerContainer}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: false, amount: 0.1 }}
                            onSubmit={submitContact} 
                            onClick={(e) => e.stopPropagation()} 
                            className={`max-w-md mx-auto mt-12 flex flex-col gap-5 text-left p-8 rounded-3xl border shadow-lg backdrop-blur-xl ${cardBg} ${borderClass}`}
                        >
                            <motion.div variants={staggerItem} className="group/input">
                                {/* FIX: Input is unlocked ONLY when isPreview is true */}
                                <input 
                                    type="text"
                                    value={cName}
                                    onChange={(e) => setCName(e.target.value)}
                                    placeholder="Your name"
                                    readOnly={!isPreview}
                                    className={`w-full px-5 py-4 rounded-xl text-base font-medium outline-none border transition-all duration-300 focus:-translate-y-1 focus:ring-2 focus:ring-blue-500/30 ${trackBgLight} focus:${trackBg} ${borderClass} ${textPrimary} ${placeholderClass} ${!isPreview ? 'opacity-50 cursor-not-allowed' : ''}`}
                                />
                            </motion.div>
                            <motion.div variants={staggerItem} className="group/input">
                                {/* FIX: Input is unlocked ONLY when isPreview is true */}
                                <input 
                                    type="email"
                                    value={cEmail}
                                    onChange={(e) => setCEmail(e.target.value)}
                                    placeholder="you@email.com"
                                    readOnly={!isPreview}
                                    className={`w-full px-5 py-4 rounded-xl text-base font-medium outline-none border transition-all duration-300 focus:-translate-y-1 focus:ring-2 focus:ring-blue-500/30 ${trackBgLight} focus:${trackBg} ${borderClass} ${textPrimary} ${placeholderClass} ${!isPreview ? 'opacity-50 cursor-not-allowed' : ''}`}
                                />
                            </motion.div>
                            <motion.div variants={staggerItem} className="group/input">
                                {/* FIX: Textarea is unlocked ONLY when isPreview is true */}
                                <textarea 
                                    rows="4"
                                    value={cMessage}
                                    onChange={(e) => setCMessage(e.target.value)}
                                    placeholder="Tell me about your project…"
                                    readOnly={!isPreview}
                                    className={`w-full px-5 py-4 rounded-xl text-base font-medium outline-none border resize-none transition-all duration-300 focus:-translate-y-1 focus:ring-2 focus:ring-blue-500/30 ${trackBgLight} focus:${trackBg} ${borderClass} ${textPrimary} ${placeholderClass} ${!isPreview ? 'opacity-50 cursor-not-allowed' : ''}`}
                                />
                            </motion.div>
                            
                            <motion.button 
                                variants={staggerItem}
                                type="submit"
                                // FIX: Button is fully functional ONLY when isPreview is true
                                disabled={cSending || !isPreview}
                                whileHover={isPreview ? { scale: 1.02 } : {}}
                                whileTap={isPreview ? { scale: 0.98 } : {}}
                                className={`w-full py-4 mt-2 rounded-xl text-sm font-bold transition-all shadow-md ${!isPreview ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-blue-500/10 hover:border-white/10'} ${badgeClass}`}
                            >
                                {cSending ? "Sending…" : "Send Message"}
                            </motion.button>
                        </motion.form>
                    </div>
                </div>
            )}
            {/* 6. WORK EXPERIENCE SECTION */}
            {currentType === 'experience' && (
                <div className="py-12 sm:py-24 px-4">
                    {sectionImageBanner}
                    <motion.div {...fadeUpConfig} className="max-w-4xl mx-auto space-y-12">
                        <motion.h2 
                            initial={{ opacity: 0, y: -15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: false, amount: 0.1 }}
                            className={`text-sm uppercase font-black tracking-widest text-center mb-12 ${accentText}`}
                        >
                            Work Experience
                        </motion.h2>
                        <div className="relative border-l-2 border-slate-700/30 ml-3 md:ml-0 md:space-y-12 space-y-8">
                            {(data.items || []).map((item, idx) => (
                                <motion.div key={idx} variants={staggerItem} className="relative pl-6 md:pl-8">
                                    <div className="absolute w-4 h-4 bg-blue-500 rounded-full -left-[9px] top-1.5 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                                    <div className={"p-6 rounded-2xl border backdrop-blur-md shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg " + cardBg + " " + borderClass}>
                                        <h3 className={"text-xl font-bold mb-1 " + textPrimary}>
                                            <TextElement value={item.title} placeholder="Job Title" onCommit={(v) => updateArrayItem('items', idx, 'title', v)} />
                                        </h3>
                                        <div className={"text-sm font-semibold mb-3 text-blue-400"}>
                                            <TextElement value={item.company} placeholder="Company" onCommit={(v) => updateArrayItem('items', idx, 'company', v)} />
                                            <span className="mx-2 opacity-50">•</span>
                                            <span className="opacity-80">
                                                <TextElement value={item.dates} placeholder="Dates" onCommit={(v) => updateArrayItem('items', idx, 'dates', v)} />
                                            </span>
                                        </div>
                                        <p className={"text-sm leading-relaxed " + textSecondary}>
                                            <TextElement multiline value={item.description} placeholder="Description of responsibilities and achievements." onCommit={(v) => updateArrayItem('items', idx, 'description', v)} />
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        {!isPreview && (
                            <div className="pt-10 w-full px-2">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); addArrayItem('items', { title: "New Position", company: "Company", dates: "YYYY - YYYY", description: "Brief description of responsibilities." }); }}
                                    className={`w-full max-w-5xl mx-auto py-5 rounded-xl border border-dashed text-base font-bold opacity-50 hover:opacity-100 transition-all hover:bg-white/5 flex flex-col justify-center items-center ${textPrimary} ${borderClass}`}
                                >
                                    + Add Another Experience
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}

            {/* 7. SERVICES SECTION */}
            {currentType === 'services' && (
                <div className="py-12 sm:py-24 px-4">
                    {sectionImageBanner}
                    <motion.div {...fadeUpConfig} className="max-w-6xl mx-auto space-y-12">
                        <motion.h2 
                            initial={{ opacity: 0, y: -15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: false, amount: 0.1 }}
                            className={`text-sm uppercase font-black tracking-widest text-center mb-12 ${accentText}`}
                        >
                            Services & Offerings
                        </motion.h2>
                        <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(data.items || []).map((item, idx) => (
                                <motion.div key={idx} variants={staggerItem} className={"p-6 sm:p-8 rounded-3xl border shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl " + cardBg + " " + borderClass}>
                                    <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center mb-6 text-2xl">
                                        ⚡
                                    </div>
                                    <h3 className={"text-xl font-bold mb-3 " + textPrimary}>
                                        <TextElement value={item.title} placeholder="Service Name" onCommit={(v) => updateArrayItem('items', idx, 'title', v)} />
                                    </h3>
                                    <p className={"text-sm leading-relaxed " + textSecondary}>
                                        <TextElement multiline value={item.description} placeholder="Detailed description of what you offer." onCommit={(v) => updateArrayItem('items', idx, 'description', v)} />
                                    </p>
                                </motion.div>
                            ))}
                        </motion.div>
                        {!isPreview && (
                            <div className="pt-10 w-full px-2">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); addArrayItem('items', { title: "New Service", description: "Detailed description of what you offer." }); }}
                                    className={`w-full max-w-5xl mx-auto py-5 rounded-xl border border-dashed text-base font-bold opacity-50 hover:opacity-100 transition-all hover:bg-white/5 flex flex-col justify-center items-center ${textPrimary} ${borderClass}`}
                                >
                                    + Add Another Service
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}

            {/* 8. TESTIMONIALS SECTION */}
            {currentType === 'testimonials' && (
                <div className="py-12 sm:py-24 px-4">
                    {sectionImageBanner}
                    <motion.div {...fadeUpConfig} className="max-w-6xl mx-auto space-y-12">
                        <motion.h2 
                            initial={{ opacity: 0, y: -15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: false, amount: 0.1 }}
                            className={`text-sm uppercase font-black tracking-widest text-center mb-12 ${accentText}`}
                        >
                            Client Testimonials
                        </motion.h2>
                        <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.1 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {(data.items || []).map((item, idx) => (
                                <motion.div key={idx} variants={staggerItem} className={"p-8 rounded-3xl border shadow-sm relative " + cardBg + " " + borderClass}>
                                    <div className="absolute top-6 right-6 text-6xl text-blue-500/20 font-serif leading-none">
                                        &quot;
                                    </div>
                                    <p className={"text-lg md:text-xl italic leading-relaxed mb-8 relative z-10 " + textSecondary}>
                                        <TextElement multiline value={item.quote} placeholder="A glowing recommendation from a client or colleague." onCommit={(v) => updateArrayItem('items', idx, 'quote', v)} />
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 shadow-inner flex items-center justify-center text-white font-bold text-lg">
                                            {(item.name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className={"font-bold text-sm sm:text-base " + textPrimary}>
                                                <TextElement value={item.name} placeholder="Person Name" onCommit={(v) => updateArrayItem('items', idx, 'name', v)} />
                                            </h4>
                                            <p className={"text-xs font-medium " + accentText}>
                                                <TextElement value={item.role} placeholder="Role & Company" onCommit={(v) => updateArrayItem('items', idx, 'role', v)} />
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                        {!isPreview && (
                            <div className="pt-10 w-full px-2">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); addArrayItem('items', { quote: "A glowing recommendation.", name: "Client Name", role: "Role & Company" }); }}
                                    className={`w-full max-w-5xl mx-auto py-5 rounded-xl border border-dashed text-base font-bold opacity-50 hover:opacity-100 transition-all hover:bg-white/5 flex flex-col justify-center items-center ${textPrimary} ${borderClass}`}
                                >
                                    + Add Another Testimonial
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}

            {/* 9. CERTIFICATIONS SECTION */}
            {currentType === 'certifications' && (
                <div className="py-12 sm:py-24 px-4">
                    {sectionImageBanner}
                    <motion.div {...fadeUpConfig} className="max-w-4xl mx-auto space-y-12">
                        <motion.h2 
                            initial={{ opacity: 0, y: -15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: false, amount: 0.1 }}
                            className={`text-sm uppercase font-black tracking-widest text-center mb-12 ${accentText}`}
                        >
                            Certifications & Awards
                        </motion.h2>
                        <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.1 }} className="flex flex-col gap-4">
                            {(data.items || []).map((item, idx) => (
                                <motion.div key={idx} variants={staggerItem} className={"flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-2xl border transition-colors hover:bg-white/5 " + cardBg + " " + borderClass}>
                                    <div className="flex items-center gap-4 mb-4 sm:mb-0">
                                        <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-xl shrink-0">
                                            🏆
                                        </div>
                                        <div>
                                            <h3 className={"text-lg font-bold " + textPrimary}>
                                                <TextElement value={item.name} placeholder="Certification Name" onCommit={(v) => updateArrayItem('items', idx, 'name', v)} />
                                            </h3>
                                            <p className={"text-sm " + textSecondary}>
                                                <TextElement value={item.issuer} placeholder="Issuing Organization" onCommit={(v) => updateArrayItem('items', idx, 'issuer', v)} />
                                            </p>
                                        </div>
                                    </div>
                                    <div className={"text-sm font-semibold sm:text-right " + accentText}>
                                        <TextElement value={item.date} placeholder="Year/Date" onCommit={(v) => updateArrayItem('items', idx, 'date', v)} />
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                        {!isPreview && (
                            <div className="pt-10 w-full px-2">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); addArrayItem('items', { name: "New Certification", issuer: "Issuing Organization", date: "Year/Date" }); }}
                                    className={`w-full max-w-5xl mx-auto py-5 rounded-xl border border-dashed text-base font-bold opacity-50 hover:opacity-100 transition-all hover:bg-white/5 flex flex-col justify-center items-center ${textPrimary} ${borderClass}`}
                                >
                                    + Add Another Certification
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}

            {/* 10. STATS SECTION */}
            {currentType === 'stats' && (
                <div className="py-12 sm:py-20 px-4">
                    {sectionImageBanner}
                    <motion.div {...fadeUpConfig} className="max-w-6xl mx-auto">
                        <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {(data.items || []).map((item, idx) => (
                                <motion.div key={idx} variants={staggerItem} className={"text-center p-8 rounded-3xl border " + cardBg + " " + borderClass}>
                                    <div className={"text-4xl sm:text-5xl font-black mb-2 " + accentText}>
                                        <TextElement value={item.metric} placeholder="50+" onCommit={(v) => updateArrayItem('items', idx, 'metric', v)} />
                                    </div>
                                    <div className={"text-xs sm:text-sm font-bold uppercase tracking-widest " + textSecondary}>
                                        <TextElement value={item.label} placeholder="Projects" onCommit={(v) => updateArrayItem('items', idx, 'label', v)} />
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                        {!isPreview && (
                            <div className="pt-10 w-full px-2">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); addArrayItem('items', { metric: "50+", label: "Projects" }); }}
                                    className={`w-full max-w-5xl mx-auto py-5 rounded-xl border border-dashed text-base font-bold opacity-50 hover:opacity-100 transition-all hover:bg-white/5 flex flex-col justify-center items-center ${textPrimary} ${borderClass}`}
                                >
                                    + Add Another Stat
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}

            {/* 11. BLOG SECTION */}
            {currentType === 'blog' && (
                <div className="py-12 sm:py-24 px-4">
                    {sectionImageBanner}
                    <motion.div {...fadeUpConfig} className="max-w-6xl mx-auto space-y-12">
                        <motion.h2 
                            initial={{ opacity: 0, y: -15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: false, amount: 0.1 }}
                            className={`text-sm uppercase font-black tracking-widest text-center mb-12 ${accentText}`}
                        >
                            Publications & Articles
                        </motion.h2>
                        <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(data.articles || []).map((item, idx) => (
                                <motion.a key={idx} variants={staggerItem} href={item.link ? (item.link.startsWith('http') ? item.link : 'https://'+item.link) : '#'} target="_blank" rel="noopener noreferrer" className={"block p-6 sm:p-8 rounded-3xl border shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl group " + cardBg + " " + borderClass}>
                                    <div className={"text-xs font-bold uppercase tracking-wider mb-3 flex items-center justify-between " + accentText}>
                                        <span><TextElement value={item.publisher} placeholder="Publisher" onCommit={(v) => updateArrayItem('articles', idx, 'publisher', v)} /></span>
                                        <span><TextElement value={item.date} placeholder="Date" onCommit={(v) => updateArrayItem('articles', idx, 'date', v)} /></span>
                                    </div>
                                    <h3 className={"text-xl font-bold mb-4 group-hover:text-blue-400 transition-colors " + textPrimary}>
                                        <TextElement value={item.title} placeholder="Article Title" onCommit={(v) => updateArrayItem('articles', idx, 'title', v)} />
                                    </h3>
                                    <div className={"text-sm font-bold flex items-center gap-2 " + textSecondary}>
                                        Read Article <span>→</span>
                                    </div>
                                </motion.a>
                            ))}
                        </motion.div>
                        {!isPreview && (
                            <div className="pt-10 w-full px-2">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); addArrayItem('articles', { publisher: "Publisher", date: "Date", title: "Article Title", link: "" }); }}
                                    className={`w-full max-w-5xl mx-auto py-5 rounded-xl border border-dashed text-base font-bold opacity-50 hover:opacity-100 transition-all hover:bg-white/5 flex flex-col justify-center items-center ${textPrimary} ${borderClass}`}
                                >
                                    + Add Another Article
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}

            {/* DEFAULT FALLBACK FOR UNKNOWN BLOCKS */}
            {!["hero", "about", "education", "skills", "projects_grid", "github_activity", "contact", "services", "testimonials", "certifications", "stats", "articles"].includes(currentType) && (
                <motion.div variants={staggerItem} className={`p-12 border ${borderClass} rounded-3xl ${cardBg} text-center`}>
                    <p className={`text-sm ${textSecondary} mb-4 uppercase tracking-widest font-bold`}>[Empty {currentType} Block]</p>
                    <p className={`text-xs ${textSecondary}`}>Select this block and use the Right Sidebar tools to populate data.</p>
                </motion.div>
            )}
        </div>
    );
}