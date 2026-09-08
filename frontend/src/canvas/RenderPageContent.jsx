import { useState } from "react";
import { notify } from "../toast";
import { sendContactForm } from "../utils/contactUtils";
import EditableText from "./EditableText";
import { PORTFOLIO_THEMES } from "./themes";
import { motion, AnimatePresence } from "framer-motion";

// --- Subdued Premium Animation Configurations ---
const springTransition = { type: "spring", stiffness: 80, damping: 20 };

const fadeUpConfig = {
    initial: { opacity: 0, y: 20, scale: 0.99 },
    whileInView: { opacity: 1, y: 0, scale: 1 },
    viewport: { once: false, margin: "-40px", amount: 0.1 },
    transition: { ...springTransition, duration: 0.8 }
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

export default function RenderPageContent({ section, portfolioTheme, sections, onInlineEdit, isPreview = false }) {
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
    
    const borderClass = themeDef.border || "border-slate-700";
    const accentText = themeDef.accentText || "text-blue-400";
    const textPrimary = "text-slate-50"; 
    const textSecondary = "text-slate-300";
    const placeholderClass = "placeholder-slate-500";
    const cardBg = "bg-white/[0.03] backdrop-blur-xl"; 
    const badgeClass = `bg-black/40 text-slate-200 border ${borderClass} shadow-sm backdrop-blur-md`;

    // --- SMART TEXT ROUTER ---
    const TextElement = ({ value, placeholder, onCommit, multiline = false }) => {
        if (isPreview) {
            return (
                <span className={`block w-full max-w-full break-words ${multiline ? "whitespace-pre-wrap" : "whitespace-normal"} [word-break:break-word]`}>
                    {value || placeholder}
                </span>
            );
        }
        return (
            <div className="w-full max-w-full whitespace-normal [word-break:break-word]">
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

    const submitContact = async(e) => {
        e.preventDefault();
        if (isPreview) return notify("Forms are disabled in preview mode.", 'info');
        
        if (!cName.trim() || !cEmail.trim() || !cMessage.trim()) {
            notify("Please fill in your name, email and message.", 'error');
            return;
        }
        
        setCSending(true);
        const result = await sendContactForm({ name: cName, email: cEmail, message: cMessage });

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
            transition={{ duration: 0.8, ease: "easeOut" }}
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
        const pg = sections.find((s) => (s.section_type || "").toLowerCase().trim() === "projects_grid");
        if (pg && pg.content_data && pg.content_data.projects) {
            heroProjects.push(...pg.content_data.projects);
        }
    }

    const heroLiveOptions = [];
    if (data.liveUrl) heroLiveOptions.push({ label: "Live Website", url: data.liveUrl });
    if (data.linkedin) heroLiveOptions.push({ label: "LinkedIn", url: data.linkedin });
    if (data.github) heroLiveOptions.push({ label: "GitHub", url: data.github });

    const heroDesignOptions = [];
    if (data.designUrl) heroDesignOptions.push({ label: "Design Repository", url: data.designUrl });
    heroProjects.forEach((project) => {
        heroDesignOptions.push({ label: project.title || "Untitled Project", url: project.projectUrl });
    });

    return (
        <div className={`w-full relative ${isPreview ? '' : 'group/section'}`}>
            {/* 1. HERO SECTION */}
            {currentType === "hero" && (
                <motion.div 
                    {...fadeUpConfig}
                    className={`text-center py-10 sm:py-20 px-4 space-y-6 relative overflow-hidden rounded-3xl ${!bgImage ? cardBg : ""}`}
                    style={bgImage ? {
                        backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.8)), url('${bgImage}')`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    } : undefined}
                >
                    <div className="relative z-10 space-y-4 max-w-3xl mx-auto flex flex-col items-center w-full">
                        <motion.h1
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: false, amount: 0.1 }}
                            transition={springTransition}
                            className={`font-black tracking-tight leading-tight text-center w-full ${
                                bgImage ? 'text-white' : textPrimary
                            }`}
                            style={{
                                fontSize: 'clamp(32px, 6vw, 64px)',
                                whiteSpace: 'normal',
                                wordBreak: 'normal',
                                overflowWrap: 'normal',
                                hyphens: 'none',
                                maxWidth: '100%',
                            }}
                        >
                            <TextElement
                                value={data.heading || ""}
                                placeholder="Your Name"
                                onCommit={(v) => updateScalar("heading", v)}
                            />
                        </motion.h1>
                        
                        <motion.p 
                            initial={{ opacity: 0, y: 15 }} 
                            whileInView={{ opacity: 1, y: 0 }} 
                            viewport={{ once: false, amount: 0.1 }}
                            transition={{ ...springTransition, delay: 0.1 }}
                            className={`text-base sm:text-lg leading-relaxed w-full max-w-full font-medium ${bgImage ? 'text-white/90' : textSecondary}`}
                        >
                            <TextElement 
                                value={data.subheading || ""}
                                placeholder="Professional Headline"
                                onCommit={(v) => updateScalar("subheading", v)}
                            />
                        </motion.p>

                        <motion.div 
                            initial={{ opacity: 0, y: 15 }} 
                            whileInView={{ opacity: 1, y: 0 }} 
                            viewport={{ once: false, amount: 0.1 }}
                            transition={{ ...springTransition, delay: 0.2 }}
                            className="flex flex-wrap justify-center gap-4 pt-6 w-full"
                        >
                            <div className="relative">
                                <motion.button 
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (heroLiveOptions.length === 0) return notify("No live links configured.", 'error');
                                        setOpenMenu(openMenu === "live" ? null : "live");
                                    }}
                                    className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${badgeClass} shadow-md hover:shadow-lg`}
                                >
                                    See Live ▾
                                </motion.button>
                                <AnimatePresence>
                                    {openMenu === "live" && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 5, scale: 0.98 }} 
                                            animate={{ opacity: 1, y: 0, scale: 1 }} 
                                            exit={{ opacity: 0, y: 5, scale: 0.98 }}
                                            className={`absolute z-20 top-full mt-3 w-48 rounded-xl p-2 shadow-xl border ${cardBg} ${borderClass} left-1/2 -translate-x-1/2`}
                                        >
                                            {heroLiveOptions.map((opt, i) => (
                                                <button 
                                                    key={i}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenu(null);
                                                        openExternal(opt.url);
                                                    }}
                                                    className={`block w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold transition-colors hover:bg-white/10 ${textPrimary}`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="relative">
                                <motion.button 
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (heroDesignOptions.length === 0) return notify("No design links configured.", 'error');
                                        setOpenMenu(openMenu === "design" ? null : "design");
                                    }}
                                    className={`px-6 py-3 rounded-xl text-sm font-bold transition-all bg-transparent hover:bg-white/5 border shadow-md hover:shadow-lg ${textPrimary} ${borderClass}`}
                                >
                                    Projects ▾
                                </motion.button>
                                <AnimatePresence>
                                    {openMenu === "design" && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 5, scale: 0.98 }} 
                                            animate={{ opacity: 1, y: 0, scale: 1 }} 
                                            exit={{ opacity: 0, y: 5, scale: 0.98 }}
                                            className={`absolute z-20 top-full mt-3 w-56 rounded-xl p-2 shadow-xl border ${cardBg} ${borderClass} left-1/2 -translate-x-1/2`}
                                        >
                                            {heroDesignOptions.map((opt, i) => (
                                                <button 
                                                    key={i}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenu(null);
                                                        if (opt.url) openExternal(opt.url);
                                                        else notify("No link set for this project.", 'error');
                                                    }}
                                                    className={`block w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold transition-colors hover:bg-white/10 ${textPrimary}`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
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
                            <h2 className={`text-sm uppercase font-black tracking-widest ${accentText}`}>
                                About Me
                            </h2>
                            <div className={`text-base md:text-lg leading-relaxed break-words max-w-full font-medium ${textSecondary}`}>
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
                    <h2 className={`text-sm uppercase font-black tracking-widest ${accentText}`}>
                        Educational Background
                    </h2>
                    
                    <motion.div 
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: false, margin: "-20px", amount: 0.1 }}
                        className="space-y-4"
                    >
                        {(data.schools || []).map((school, i) => (
                            <motion.div 
                                variants={staggerItem}
                                key={i}
                                className={`relative group p-6 rounded-2xl border transition-all ${cardBg} ${borderClass} ${!isPreview ? 'hover:shadow-md' : ''}`}
                            >
                                {!isPreview && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); removeArrayItem('schools', i); }}
                                        className="absolute -top-3 -right-3 w-7 h-7 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all rounded-full bg-red-500 hover:bg-red-600 shadow-md z-20"
                                    >✕</button>
                                )}
                                
                                <div className="flex flex-wrap justify-between items-start gap-4">
                                    <div className="space-y-1.5 w-full sm:w-auto flex-1">
                                        <h3 className={`text-base font-bold uppercase tracking-wide break-words max-w-full ${textPrimary}`}>
                                            <TextElement 
                                                value={school.institution || ""}
                                                placeholder="Institution Name"
                                                onCommit={(v) => updateArrayItem("schools", i, "institution", v)}
                                            />
                                        </h3>
                                        <p className={`text-sm font-medium break-words max-w-full ${textSecondary}`}>
                                            <TextElement 
                                                value={school.degree || ""}
                                                placeholder="Degree / Major"
                                                onCommit={(v) => updateArrayItem("schools", i, "degree", v)}
                                            />
                                        </p>
                                    </div>
                                    <span className={`text-xs font-mono px-4 py-1.5 rounded-lg shrink-0 transition-colors max-w-full truncate ${badgeClass}`}>
                                        <TextElement 
                                            value={school.years || ""}
                                            placeholder="Years"
                                            onCommit={(v) => updateArrayItem("schools", i, "years", v)}
                                        />
                                    </span>
                                </div>
                                <div className={`mt-4 pt-4 border-t flex items-center gap-2 text-sm overflow-hidden ${borderClass}`}>
                                    <span className={`shrink-0 ${textSecondary}`}>Performance:</span>
                                    <span className={`font-mono font-bold truncate max-w-full ${accentText}`}>
                                        <TextElement 
                                            value={school.score || ""}
                                            placeholder="GPA / Score"
                                            onCommit={(v) => updateArrayItem("schools", i, "score", v)}
                                        />
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                    
                    {!isPreview && (
                        <div className="pt-4">
                            <button 
                                onClick={(e) => { e.stopPropagation(); addArrayItem('schools', { institution: "New Institution", degree: "New Degree", years: "Year - Year", score: "GPA: 0.0" }); }}
                                className={`w-full py-4 rounded-xl border border-dashed text-sm font-bold opacity-50 hover:opacity-100 transition-all hover:bg-white/5 flex justify-center items-center gap-2 ${textPrimary} ${borderClass}`}
                            >
                                + Add Education
                            </button>
                        </div>
                    )}
                </motion.div>
            )}

            {/* 4. SKILLS SECTION (ZIGZAG LAYOUT) */}
            {currentType === "skills" && (
                <motion.div {...fadeUpConfig} className="space-y-8 py-10">
                    {sectionImageBanner}
                    <h2 className={`text-sm uppercase font-black tracking-widest text-center mb-12 ${accentText}`}>
                        Core Expertise
                    </h2>
                    
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
                                        <span className={`${accentText} font-mono text-sm flex items-center shrink-0 bg-black/40 px-4 py-2 rounded-xl border ${borderClass} shadow-inner`}>
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
                                        className={`w-full h-3.5 rounded-full overflow-hidden border ${borderClass} bg-black/40 relative group/bar transition-all ${!isPreview ? 'cursor-pointer hover:h-4 shadow-inner' : ''}`}
                                        onClick={(e) => {
                                            if (isPreview) return;
                                            e.stopPropagation();
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const newLevel = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
                                            updateArrayItem("items", i, "level", newLevel);
                                        }}
                                    >
                                        <motion.div 
                                            className={`h-full rounded-full bg-current ${accentText}`}
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
                                className={`w-full max-w-5xl mx-auto py-4 rounded-xl border border-dashed text-sm font-bold opacity-50 hover:opacity-100 transition-all hover:bg-white/5 flex justify-center items-center ${textPrimary} ${borderClass}`}
                            >
                                + Add Skill
                            </button>
                        </div>
                    )}
                </motion.div>
            )}

            {/* 5. PROJECTS SECTION (SUBDUED ANIMATIONS) */}
            {currentType === "projects_grid" && (
                <div className="space-y-8 py-10">
                    {sectionImageBanner}
                    <motion.h2 
                        initial={{ opacity: 0, y: -15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false, amount: 0.1 }}
                        className={`text-sm uppercase font-black tracking-widest text-center mb-12 ${accentText}`}
                    >
                        {data.title || "Showcase of Innovations"}
                    </motion.h2>
                    
                    <div className="flex flex-col gap-10 w-full max-w-5xl mx-auto px-2">
                        {(data.projects || []).map((project, i) => (
                            <div 
                                key={i}
                                className={`relative group p-8 md:p-10 rounded-[2rem] border flex flex-col space-y-6 shadow-md backdrop-blur-xl transition-all duration-300 w-full overflow-hidden ${cardBg} ${borderClass} ${!isPreview ? 'hover:shadow-[0_10px_30px_rgb(0,0,0,0.15)] hover:border-white/10' : ''}`}
                            >
                                {/* Expanding bottom glow line */}
                                <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 transition-all duration-500 group-hover:w-full bg-current ${accentText}`}></div>

                                {!isPreview && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); removeArrayItem('projects', i); }}
                                        className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all rounded-full bg-red-500 hover:bg-red-600 shadow-md z-20"
                                    >✕</button>
                                )}

                                {/* 1. HEADING: Subdued Left to Right */}
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
                                
                                {/* 2. CONTENT / DESCRIPTION: Subdued Right to Left */}
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

                                {/* 3. VIEW PROJECT BUTTON: Gentler Pulse */}
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

                                {/* 4. TOOLS / TAGS: Softer Jump */}
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
                                                <span key={tIdx} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border bg-black/40 shadow-inner break-words transition-colors hover:bg-black/60 ${textPrimary} ${borderClass}`}>
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
                                            <div className="flex-1 bg-black/20 px-4 py-2 rounded-xl border border-transparent hover:border-slate-500/30 transition-colors w-full overflow-hidden">
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
                                    <div className={`text-xs font-mono w-full ${textSecondary} flex items-center gap-3 p-3 rounded-xl bg-black/20 border ${borderClass}`}>
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

                    {!isPreview && (
                        <div className="pt-10 w-full px-2">
                            <button 
                                onClick={(e) => { e.stopPropagation(); addArrayItem('projects', { title: "New Project", desc: "Brief description of the project.", tags: ["React", "Tailwind CSS"], projectUrl: "" }); }}
                                className={`w-full max-w-5xl mx-auto py-5 rounded-xl border border-dashed text-sm font-bold opacity-50 hover:opacity-100 transition-all hover:bg-white/5 flex flex-col justify-center items-center ${textPrimary} ${borderClass}`}
                            >
                                + Add Another Project
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* 6. CONTACT SECTION (SUBDUED ANIMATED FORM) */}
            {currentType === "contact" && (
                <div className={`relative text-center py-16 mt-12 border-t ${borderClass}`}>
                    
                    {/* Ambient Animated Glow Orb - Softer */}
                    <motion.div 
                        animate={{ scale: [1, 1.05, 1], opacity: [0.1, 0.15, 0.1] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-full max-h-96 bg-blue-500 rounded-full blur-[120px] pointer-events-none z-0"
                    />

                    <div className="relative z-10">
                        {sectionImageBanner}
                        <motion.h2 
                            initial={{ opacity: 0, y: -15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: false, amount: 0.1 }}
                            className={`text-sm uppercase font-black tracking-widest mb-6 ${accentText}`}
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
                                <input 
                                    type="text"
                                    value={cName}
                                    onChange={(e) => setCName(e.target.value)}
                                    placeholder="Your name"
                                    readOnly={isPreview}
                                    className={`w-full px-5 py-4 rounded-xl text-sm font-medium outline-none border transition-all duration-300 focus:-translate-y-1 focus:ring-2 focus:ring-blue-500/30 bg-black/20 hover:bg-black/40 ${borderClass} ${textPrimary} ${placeholderClass} ${isPreview ? 'opacity-70 cursor-not-allowed' : ''}`}
                                />
                            </motion.div>
                            <motion.div variants={staggerItem} className="group/input">
                                <input 
                                    type="email"
                                    value={cEmail}
                                    onChange={(e) => setCEmail(e.target.value)}
                                    placeholder="you@email.com"
                                    readOnly={isPreview}
                                    className={`w-full px-5 py-4 rounded-xl text-sm font-medium outline-none border transition-all duration-300 focus:-translate-y-1 focus:ring-2 focus:ring-blue-500/30 bg-black/20 hover:bg-black/40 ${borderClass} ${textPrimary} ${placeholderClass} ${isPreview ? 'opacity-70 cursor-not-allowed' : ''}`}
                                />
                            </motion.div>
                            <motion.div variants={staggerItem} className="group/input">
                                <textarea 
                                    rows="4"
                                    value={cMessage}
                                    onChange={(e) => setCMessage(e.target.value)}
                                    placeholder="Tell me about your project…"
                                    readOnly={isPreview}
                                    className={`w-full px-5 py-4 rounded-xl text-sm font-medium outline-none border resize-none transition-all duration-300 focus:-translate-y-1 focus:ring-2 focus:ring-blue-500/30 bg-black/20 hover:bg-black/40 ${borderClass} ${textPrimary} ${placeholderClass} ${isPreview ? 'opacity-70 cursor-not-allowed' : ''}`}
                                />
                            </motion.div>
                            <motion.button 
                                variants={staggerItem}
                                type="submit"
                                disabled={cSending || isPreview}
                                whileHover={!isPreview ? { scale: 1.02 } : {}}
                                whileTap={!isPreview ? { scale: 0.98 } : {}}
                                className={`w-full py-4 mt-2 rounded-xl text-sm font-bold transition-all shadow-md ${isPreview ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-blue-500/10 hover:border-white/10'} ${badgeClass}`}
                            >
                                {cSending ? "Sending…" : "Send Message"}
                            </motion.button>
                        </motion.form>
                    </div>
                </div>
            )}
        </div>
    );
}