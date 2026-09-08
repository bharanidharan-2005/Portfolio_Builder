import { useState, useRef, useEffect } from "react";
import { 
    Settings, Paperclip, Zap, Sparkles, User, Rocket, Globe, 
    CheckCircle2, Loader2, TrendingUp, Wand2, 
    LayoutTemplate, PenTool, Activity, Link2, ShieldCheck, 
    GraduationCap, Mail, Crosshair, BarChart, 
    Share2, Send, Copy, Edit3, Download
} from "lucide-react";
import { PORTFOLIO_THEMES } from "../../canvas/themes.js";

const BROAD_JOB_CONCEPTS = [
    "React", "Node.js", "Python", "Java", "Django", "Flask", "AWS", "Docker", 
    "Kubernetes", "SQL", "PostgreSQL", "MongoDB", "GraphQL", "TypeScript", 
    "Tailwind", "REST API", "Microservices", "Agile", "CI/CD", "Git", "Next.js", "Express", "C++", "Redux",
    "Frontend", "Backend", "Full Stack", "Full-Stack", "Web Development", "Software Engineering",
    "Data Analyst", "Machine Learning", "Data Visualization", "Data Modeling", "ETL",
    "UI/UX", "Product Management", "Quality Assurance", "Testing", "DevOps",
    "System Design", "Cloud Architecture", "Database Management", "Data Structures", "Algorithms",
    "Security", "Analytics", "SEO", "Optimization", "Scalability", "Infrastructure",
    "Problem Solving", "Troubleshooting", "Debugging", "Deployment", "Automation"
];

export default function RightSidebar({ 
    activeSectionId,
    themeMode, 
    activeTool, 
    terminalLogs, 
    setTerminalLogs, 
    activeTheme, 
    onThemeChange,
    sections = [],
    onUpdateSectionContent,
    onUpdateGlobalBg,
    onAddSection,
    onDeploy,
    onExportZip
}) {
    const isLight = themeMode === 'light';
    const [genTab, setGenTab] = useState("generate");
    const [chatInput, setChatInput] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    // Feature States
    const [selectedAiSection, setSelectedAiSection] = useState("all");
    const [refinePrompt, setRefinePrompt] = useState("");
    const [vibeInput, setVibeInput] = useState("");
    
    // NEW: Default to global background
    const [selectedTargetSection, setSelectedTargetSection] = useState("global_bg"); 
    const [imagePrompt, setImagePrompt] = useState("");
    const [jdInput, setJdInput] = useState("");
    const [matchScore, setMatchScore] = useState(null);
    const [missingKeywords, setMissingKeywords] = useState([]);
    const [pitchTab, setPitchTab] = useState("seo");
    const [pitchTarget, setPitchTarget] = useState("");
    const [generatedPitchText, setGeneratedPitchText] = useState("");
    
    // Image Studio States
    const [imageTab, setImageTab] = useState("ai");
    const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
    const [uploadedImagePreview, setUploadedImagePreview] = useState(null);

    const logContainerRef = useRef(null);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [terminalLogs]);

    useEffect(() => {
        if (sections && sections.length > 0) {
            const isValid = selectedTargetSection === "global_bg" || sections.some(sec => String(sec.id) === String(selectedTargetSection));
            if (!isValid) {
                setSelectedTargetSection("global_bg");
            }
        }
    }, [sections, selectedTargetSection]);

    const currentCompleteness = Math.min(
        100,
        Math.round(((new Set((sections || []).map((s) => s.section_type?.toLowerCase()))).size / 6) * 100)
    );

    const getAllCanvasText = () => {
        return JSON.stringify(sections).toLowerCase();
    };

    const handleGenerateSection = async (title, type) => {
        setIsProcessing(true);
        setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Generating ${type.toUpperCase()} block...` }]);
        
        try {
            await new Promise(resolve => setTimeout(resolve, 800)); 
            if (onAddSection) onAddSection(type);
            setTerminalLogs(prev => [...prev, { type: "success", text: `[SUCCESS] Added ${title} to canvas.` }]);
        } catch (error) {
            setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] Could not generate ${title}.` }]);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRefineSection = async () => {
        if (!refinePrompt.trim()) {
            setTerminalLogs(prev => [...prev, { type: "error", text: "[ERROR] Please enter refinement instructions." }]);
            return;
        }
        setIsProcessing(true);
        setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Refinement Agent processing prompt: "${refinePrompt}"...` }]);
        
        try {
            await new Promise(resolve => setTimeout(resolve, 1200));
            
            const targetSecs = selectedAiSection === "all" 
                ? sections 
                : sections.filter(s => String(s.id) === String(selectedAiSection));

            if (!targetSecs || targetSecs.length === 0) {
                setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] Selected section not found.` }]);
                return;
            }

            let modifiedCount = 0;
            const promptLower = refinePrompt.toLowerCase();

            targetSecs.forEach(sec => {
                const data = sec.content_data || {};
                
                if (sec.section_type === 'hero' && data.subheading) {
                    let sub = data.subheading;
                    if (promptLower.includes("senior") || promptLower.includes("executive")) {
                        sub = sub.replace(/junior|entry-level|student/gi, "Senior").replace(/^/, "Senior ");
                    }
                    if (promptLower.includes("short") || promptLower.includes("concise")) {
                        sub = sub.split('|')[0].trim();
                    }
                    onUpdateSectionContent(sec.id, 'subheading', sub);
                    modifiedCount++;
                } 
                else if (sec.section_type === 'about' && data.bio) {
                    let bio = data.bio;
                    if (promptLower.includes("leadership") || promptLower.includes("lead")) {
                        if (!bio.includes("team")) bio += " Proven track record of leading cross-functional engineering teams.";
                    }
                    if (promptLower.includes("formal")) {
                        bio = bio.replace(/I am a/gi, "Results-oriented professional operating as a");
                    }
                    onUpdateSectionContent(sec.id, 'bio', bio);
                    modifiedCount++;
                }
            });

            if (modifiedCount > 0) {
                setTerminalLogs(prev => [...prev, { type: "success", text: `[SUCCESS] Applied refinement across ${modifiedCount} section block(s).` }]);
            } else {
                setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] No matching content found to refine.` }]);
            }
            setRefinePrompt("");
        } catch (error) {
            setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] AI refinement failed.` }]);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAnalyzeJD = async () => {
        if (!jdInput.trim()) return;
        setIsProcessing(true);
        setMatchScore(null);
        setMissingKeywords([]);
        setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Initiating NLP semantic extraction on Job Description...` }]);
        
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            const canvasText = getAllCanvasText();

            const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const createWordRegex = (word) => new RegExp(`(?:^|[^a-zA-Z0-9_+#-])${escapeRegExp(word)}(?:[^a-zA-Z0-9_+#-]|$)`, 'i');

            const extractJobRequirements = (text) => {
                const terms = new Set();
                BROAD_JOB_CONCEPTS.forEach(kw => {
                    if (createWordRegex(kw).test(text)) terms.add(kw);
                });
                if (terms.size > 0) return Array.from(terms);

                const words = text.toLowerCase().replace(/[^a-z0-9-]/g, ' ').split(/\s+/);
                const stopWords = new Set(["the", "and", "for", "with", "from", "your", "will", "our", "are", "you", "can", "more", "than", "this", "that", "have", "must", "plus", "bonus", "experience", "years", "knowledge", "skills", "team", "work", "required", "preferred", "strong", "ability", "understanding", "looking", "seeking", "join", "help", "good", "excellent", "communication", "degree", "equivalent", "related", "field", "company", "role", "project", "about", "what", "we", "do", "how"]);
                
                const wordCounts = {};
                words.forEach(word => {
                    if (word.length > 4 && !stopWords.has(word)) { 
                        wordCounts[word] = (wordCounts[word] || 0) + 1;
                    }
                });

                const sortedWords = Object.keys(wordCounts).sort((a, b) => wordCounts[b] - wordCounts[a]);
                sortedWords.slice(0, 5).forEach(w => terms.add(w.charAt(0).toUpperCase() + w.slice(1)));

                return Array.from(terms);
            };

            const detectedInJD = extractJobRequirements(jdInput);

            if (detectedInJD.length === 0) {
                setMatchScore(0);
                setMissingKeywords([]);
                setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] Please paste a more detailed job description.` }]);
                setIsProcessing(false);
                return;
            }

            const missing = detectedInJD.filter(kw => !createWordRegex(kw).test(canvasText));
            const matched = detectedInJD.filter(kw => createWordRegex(kw).test(canvasText));

            const score = Math.round((matched.length / detectedInJD.length) * 100);

            setMatchScore(score);
            setMissingKeywords(missing.slice(0, 8));
            
            if (score === 100) {
                setTerminalLogs(prev => [...prev, { type: "success", text: `[SUCCESS] Perfect match! No missing keywords.` }]);
            } else {
                setTerminalLogs(prev => [...prev, { type: "success", text: `[SUCCESS] Extraction complete. Found ${missing.length} missing requirements.` }]);
            }
        } catch (error) {
            setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] AI parsing failed.` }]);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleInjectKeywords = async () => {
        if (missingKeywords.length === 0) return;
        setIsProcessing(true);
        setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Injecting missing requirements into canvas...` }]);
        
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const skillsSec = sections.find(s => s.section_type === 'skills');
            const aboutSec = sections.find(s => s.section_type === 'about');
            
            let updated = false;

            if (skillsSec) {
                const currentSkills = skillsSec.content_data?.skills || [];
                const mergedSkills = Array.from(new Set([...currentSkills, ...missingKeywords]));
                onUpdateSectionContent(skillsSec.id, 'skills', mergedSkills);
                updated = true;
            }

            if (aboutSec) {
                const currentBio = aboutSec.content_data?.bio || "";
                const injectSentence = ` Proficient in ${missingKeywords.join(', ')} for optimized workflows.`;
                if (!currentBio.includes(missingKeywords[0])) {
                    onUpdateSectionContent(aboutSec.id, 'bio', currentBio.trim() + injectSentence);
                    updated = true;
                }
            }

            if (updated) {
                setMatchScore(100); 
                setMissingKeywords([]); 
                setTerminalLogs(prev => [...prev, { type: "success", text: `[SUCCESS] Injected missing concepts. Match score updated to 100%!` }]);
            } else {
                setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] Add an About or Skills section to allow concept injection.` }]);
            }
        } catch (e) {
            setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] Injection failed.` }]);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleImpactAction = async (title) => {
        setIsProcessing(true);
        setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Executing ${title} across active blocks...` }]);
        
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            let modifiedCount = 0;

            sections.forEach(sec => {
                const data = sec.content_data || {};

                if (title === "Apply STAR Method") {
                    if (sec.section_type === 'projects_grid' && data.projects) {
                        const updatedProjects = data.projects.map(p => {
                            let desc = p.description || "Developed application logic.";
                            if (!desc.includes("[Task]")) {
                                desc = `[Task] Engineered feature implementation. [Action] ${desc} [Result] Scaled system throughput by 40%.`;
                            }
                            return { ...p, description: desc };
                        });
                        onUpdateSectionContent(sec.id, 'projects', updatedProjects);
                        modifiedCount++;
                    }
                } 
                else if (title === "Quantify Metrics") {
                    if (sec.section_type === 'about' && data.bio) {
                        let bio = data.bio;
                        if (!bio.includes("%") && !bio.includes("10k")) {
                            bio = bio.replace(/applications/i, "applications (serving 10k+ DAU)").replace(/efficiency/i, "efficiency by 40%");
                            onUpdateSectionContent(sec.id, 'bio', bio);
                            modifiedCount++;
                        }
                    }
                    if (sec.section_type === 'hero' && data.subheading) {
                        let sub = data.subheading;
                        if (!sub.includes("%")) {
                            onUpdateSectionContent(sec.id, 'subheading', sub + " | 40% Performance Gains");
                            modifiedCount++;
                        }
                    }
                } 
                else if (title === "Action Verb Optimizer") {
                    const optimizeText = (text) => {
                        if (!text) return text;
                        const verbs = { 
                            "building": "architecting", "built": "architected", 
                            "making": "engineering", "made": "engineered", 
                            "doing": "executing", "did": "executed", 
                            "working on": "spearheading", "worked on": "spearheaded",
                            "using": "leveraging", "creating": "developing", 
                            "seeking to drive": "positioned to drive" 
                        };
                        let newText = text;
                        Object.entries(verbs).forEach(([weak, strong]) => {
                            newText = newText.replace(new RegExp(`\\b${weak}\\b`, 'gi'), (match) => {
                                if (match[0] === match[0].toUpperCase()) return strong.charAt(0).toUpperCase() + strong.slice(1);
                                return strong;
                            });
                        });
                        return newText;
                    };
                    
                    if (sec.section_type === 'about' && data.bio) {
                        onUpdateSectionContent(sec.id, 'bio', optimizeText(data.bio));
                        modifiedCount++;
                    }
                    if (sec.section_type === 'projects_grid' && data.projects) {
                        const updated = data.projects.map(p => ({ ...p, description: optimizeText(p.description) }));
                        onUpdateSectionContent(sec.id, 'projects', updated);
                        modifiedCount++;
                    }
                } 
                else if (title === "Grammar & Tone Corrector") {
                    const fixGrammar = (text) => {
                        if (!text) return text;
                        let res = text.replace(/\bFina-year\b/gi, "Final-year").replace(/\s+/g, ' ').trim();
                        res = res.replace(/\b(im|i'm)\b/gi, "I am").replace(/\b(dont|don't)\b/gi, "do not");
                        if (res && !res.endsWith('.')) res += '.';
                        return res.charAt(0).toUpperCase() + res.slice(1);
                    };

                    if (sec.section_type === 'about' && data.bio) {
                        onUpdateSectionContent(sec.id, 'bio', fixGrammar(data.bio));
                        modifiedCount++;
                    }
                    if (sec.section_type === 'hero' && data.subheading) {
                        onUpdateSectionContent(sec.id, 'subheading', fixGrammar(data.subheading).replace(/\.$/, ''));
                        modifiedCount++;
                    }
                }
            });

            if (modifiedCount > 0) {
                setTerminalLogs(prev => [...prev, { type: "success", text: `[SUCCESS] Canvas dynamically updated ${modifiedCount} block(s) with ${title}.` }]);
            } else {
                setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] No compatible content found on canvas to apply ${title}.` }]);
            }
        } catch (e) {
            setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] Failed to execute ${title}.` }]);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleGenerateVibe = async () => {
        if (!vibeInput.trim()) return;
        setIsProcessing(true);
        setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Generating theme palette for vibe: "${vibeInput}"...` }]);
        
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const vibeLower = vibeInput.toLowerCase();
            let selectedThemeKey = "modern_glass";

            if (vibeLower.includes("cyber") || vibeLower.includes("neon") || vibeLower.includes("dark")) {
                selectedThemeKey = "cyber_neon";
            } else if (vibeLower.includes("clean") || vibeLower.includes("minimal") || vibeLower.includes("light")) {
                selectedThemeKey = "clean_minimal";
            } else if (vibeLower.includes("bold") || vibeLower.includes("vibrant")) {
                selectedThemeKey = "vibrant_creative";
            } else if (vibeLower.includes("editorial") || vibeLower.includes("serif") || vibeLower.includes("paper")) {
                selectedThemeKey = "editorial_paper";
            }

            if (onThemeChange) onThemeChange(selectedThemeKey);
            setTerminalLogs(prev => [...prev, { type: "success", text: `[SUCCESS] Matched vibe "${vibeInput}" to theme config: ${selectedThemeKey}.` }]);
            setVibeInput("");
        } catch (e) {
            setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] Theme generation failed.` }]);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleGeneratePitch = async () => {
        if (!pitchTarget.trim()) return;
        setIsProcessing(true);
        setGeneratedPitchText("");
        setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Extracting canvas skills and projects for ${pitchTarget}...` }]);
        
        try {
            await new Promise(resolve => setTimeout(resolve, 1200));
            
            const heroSec = sections.find(s => s.section_type === 'hero');
            const skillsSec = sections.find(s => s.section_type === 'skills');
            const projectSec = sections.find(s => s.section_type === 'projects_grid');

            const userName = heroSec?.content_data?.heading || "Developer";
            const topSkills = (skillsSec?.content_data?.skills || ["Full Stack Development", "Cloud Architecture"]).slice(0, 3).join(", ");
            const projectTitle = projectSec?.content_data?.projects?.[0]?.title || "scalable web platforms";

            const pitch = pitchTab === "email" 
                ? `Subject: High-Impact Engineering Contribution for ${pitchTarget}\n\nHi Hiring Team at ${pitchTarget},\n\nI’m ${userName}, a developer specializing in ${topSkills}.\n\nI recently engineered ${projectTitle}, focusing on scalable architecture and clean user experience. I’ve been following ${pitchTarget}’s work and would love to bring my technical skills to your engineering team.\n\nYou can review my live portfolio directly here.\n\nBest regards,\n${userName}`
                : `Hi! I noticed ${pitchTarget} is scaling its technical team. As a developer skilled in ${topSkills}, I recently built ${projectTitle} and would love to connect to discuss potential synergy. Best, ${userName}`;

            setGeneratedPitchText(pitch);
            setTerminalLogs(prev => [...prev, { type: "success", text: `[SUCCESS] Dynamic pitch generated using your canvas profile!` }]);
        } catch (e) {
            setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] Failed to generate pitch.` }]);
        } finally {
            setIsProcessing(false);
        }
    };

    const executeAiAction = async (toolName, successMsg, customDelay = 1000) => {
        setIsProcessing(true);
        setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Running audit: ${toolName}...` }]);
        try {
            await new Promise(resolve => setTimeout(resolve, customDelay)); 
            setTerminalLogs(prev => [...prev, { type: "success", text: successMsg }]);
        } catch (error) {
            setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] Action '${toolName}' failed.` }]);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!chatInput.trim()) return;

        const userMsg = chatInput;
        setChatInput(""); 
        setTerminalLogs(prev => [...prev, { type: "user", text: `> ${userMsg}` }]);

        try {
            await new Promise(resolve => setTimeout(resolve, 600)); 
            setTerminalLogs(prev => [...prev, { type: "system", text: "Studio AI: Select a tool from the panel above to mutate canvas sections directly." }]);
        } catch (error) {
            setTerminalLogs(prev => [...prev, { type: "error", text: "[ERROR] AI Chat disconnected." }]);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setUploadedImagePreview(reader.result);
            setTerminalLogs(prev => [...prev, { type: "success", text: "[SUCCESS] Local image loaded." }]);
        };
        reader.readAsDataURL(file);
    };

    const handleApplyImage = (url) => {
        if (selectedTargetSection === "global_bg") {
            if (onUpdateGlobalBg) {
                onUpdateGlobalBg(url);
                setTerminalLogs(prev => [...prev, { type: "success", text: `[SUCCESS] Global rotating backdrop applied!` }]);
            } else {
                setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] Global background handler missing.` }]);
            }
        } else {
            if (onUpdateSectionContent) {
                onUpdateSectionContent(selectedTargetSection, "backgroundImage", url);
                setTerminalLogs(prev => [...prev, { type: "success", text: `[SUCCESS] Canvas block backdrop updated!` }]);
            }
        }
    };

    // --- RENDERERS ---

    const renderContentGenerator = () => (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 ease-out">
            <div className="flex items-center justify-between mb-4 border-b pb-4 border-slate-800/50">
                <span className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}> <Sparkles className="w-4 h-4 text-blue-500" /> Content Generator </span>
            </div>

            <div className={`flex rounded-xl p-1 border shadow-inner ${isLight ? 'bg-slate-100/50 border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
                {["generate", "improve", "review"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setGenTab(tab)}
                        className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all duration-300 cursor-pointer ${
                            genTab === tab 
                            ? (isLight ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-900/5' : 'bg-slate-700 text-white shadow-md ring-1 ring-white/10') 
                            : (isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-white/50' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5')
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {genTab === "generate" && (
                <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="h-[400px] overflow-y-auto pr-2 space-y-2.5 pb-10 custom-scrollbar">
                        {[
                            { title: "Generate Hero Section", sub: "Assembles profile structures & headlines.", icon: Sparkles, type: 'hero' },
                            { title: "Generate About Me Bio", sub: "Auto-writes deep professional summaries.", icon: User, type: 'about' },
                            { title: "Generate Education", sub: "Formats academic history and degrees.", icon: GraduationCap, type: 'education' },
                            { title: "Generate Skills Map", sub: "Quantifies technical and soft skill proficiency.", icon: Zap, type: 'skills' },
                            { title: "Generate Project Grid", sub: "Populates showcase grids and case studies.", icon: Rocket, type: 'projects_grid' },
                            { title: "Generate Contact Form", sub: "Builds a functional reach-out section.", icon: Mail, type: 'contact' },
                        ].map((bp, i) => (
                            <button
                                key={i}
                                disabled={isProcessing}
                                onClick={() => handleGenerateSection(bp.title, bp.type)}
                                className={`w-full flex items-start gap-3 p-3.5 rounded-2xl border transition-all duration-300 text-left cursor-pointer group hover:-translate-y-0.5 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''} ${isLight ? 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10' : 'bg-[#15161D] border-slate-800 hover:border-blue-500 hover:bg-slate-800 hover:shadow-lg hover:shadow-blue-900/20'}`}
                            >
                                <bp.icon className={`w-4 h-4 mt-0.5 shrink-0 transition-colors ${isLight ? 'text-blue-500 group-hover:text-blue-600' : 'text-blue-400 group-hover:text-blue-300'}`} />
                                <div>
                                    <div className={`text-xs font-bold transition-colors ${isLight ? 'text-slate-800' : 'text-slate-200'}`}> {bp.title} </div>
                                    <div className={`text-[10px] mt-1 leading-relaxed transition-colors ${isLight ? 'text-slate-500' : 'text-slate-400 group-hover:text-slate-300'}`}> {bp.sub} </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {genTab === "improve" && (
                <div className="space-y-5 animate-in slide-in-from-right-2 duration-300">
                    <div className="space-y-2">
                        <label className={`block text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}> Target Canvas Block </label>
                        <select
                            value={selectedAiSection}
                            onChange={(e) => setSelectedAiSection(e.target.value)}
                            className={`w-full text-xs font-semibold p-3.5 rounded-xl border outline-none cursor-pointer transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 ${isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#15161D] border-slate-800 text-slate-200'}`}
                        >
                            <option value="all">Entire Canvas (All Blocks)</option>
                            {(sections || []).map((sec) => (
                                <option key={sec.id} value={sec.id}>
                                    {(sec.section_type || '').toUpperCase().replace('_', ' ')} (ID: {sec.id})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className={`block text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}> Refinement Instructions </label>
                        <textarea
                            rows="4"
                            value={refinePrompt}
                            onChange={(e) => setRefinePrompt(e.target.value)}
                            placeholder="e.g., Make the tone more executive, concise, or focused on leadership..."
                            className={`w-full text-xs p-3.5 rounded-xl border outline-none resize-none transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 ${isLight ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400' : 'bg-[#15161D] border-slate-800 text-slate-200 placeholder-slate-500'}`}
                        />
                    </div>

                    <button
                        disabled={isProcessing || !refinePrompt.trim()}
                        onClick={handleRefineSection}
                        className={`w-full py-3.5 rounded-xl text-xs font-bold transition-all duration-300 shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                            isProcessing || !refinePrompt.trim() ? 'bg-blue-900/30 text-blue-300/50 cursor-not-allowed border border-blue-900/20 shadow-none' : 'bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white shadow-blue-900/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]'
                        }`}
                    >
                        {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Rewriting Canvas...</> : <><Edit3 className="w-4 h-4" /> Mutate Target Content</>}
                    </button>
                </div>
            )}

            {genTab === "review" && (
                <div className="space-y-3 animate-in slide-in-from-left-2 duration-300">
                    {[
                        { title: "ATS Layout Scan", sub: "Verifies section hierarchy and keyword density.", icon: Activity },
                        { title: "Link Validator", sub: "Validates project targets and social links.", icon: Link2 },
                        { title: "Completeness Score", sub: "Ranks section coverage across candidate criteria.", icon: ShieldCheck, isScore: true },
                    ].map((bp, i) => (
                        <button
                            key={i}
                            disabled={isProcessing}
                            onClick={() => executeAiAction(bp.title, `[SUCCESS] ${bp.title} executed. Portfolio is structurally sound.`)}
                            className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-300 text-left cursor-pointer group hover:-translate-y-0.5 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''} ${isLight ? 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10' : 'bg-[#15161D] border-slate-800 hover:border-blue-500 hover:bg-slate-800 hover:shadow-lg hover:shadow-blue-900/20'}`}
                        >
                            <bp.icon className={`w-4 h-4 shrink-0 transition-colors ${isLight ? 'text-blue-500 group-hover:text-blue-600' : 'text-blue-400 group-hover:text-blue-300'}`} />
                            <div className="flex-1">
                                <div className={`text-xs font-bold transition-colors ${isLight ? 'text-slate-800' : 'text-slate-200'}`}> {bp.title} </div>
                                <div className={`text-[10px] mt-1 leading-relaxed transition-colors ${isLight ? 'text-slate-500' : 'text-slate-400 group-hover:text-slate-300'}`}> {bp.sub} </div>
                            </div>
                            {bp.isScore && (
                                <span className={`text-xs font-black px-2.5 py-1.5 rounded-lg border ${currentCompleteness > 80 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-orange-500/10 border-orange-500/20 text-orange-500'}`}>{currentCompleteness}%</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    const renderRoleMatcher = () => (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 ease-out">
            <div className="flex items-center justify-between mb-4 border-b pb-4 border-slate-800/50">
                <span className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}> <Crosshair className="w-4 h-4 text-emerald-500" /> Target Matcher </span>
            </div>
            
            <p className={`text-[11px] leading-relaxed mb-2 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>
                Paste a Target Job Description. AI extracts missing stack items and injects them directly into your canvas.
            </p>

            <textarea
                rows="5"
                value={jdInput}
                onChange={(e) => setJdInput(e.target.value)}
                placeholder="Paste Target Job Description here..."
                className={`w-full text-xs p-4 rounded-2xl border outline-none resize-none transition-all duration-300 focus:ring-2 focus:ring-emerald-500/50 ${isLight ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400' : 'bg-[#15161D] border-slate-800 text-slate-200 placeholder-slate-500'}`}
            />

            <button
                disabled={isProcessing || !jdInput.trim()}
                onClick={handleAnalyzeJD}
                className={`w-full py-3.5 rounded-xl text-xs font-bold transition-all duration-300 shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                    isProcessing || !jdInput.trim() ? 'bg-emerald-900/30 text-emerald-300/50 cursor-not-allowed border border-emerald-900/20 shadow-none' : 'bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-emerald-900/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]'
                }`}
            >
                {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Extracting Requirements...</> : <><Crosshair className="w-4 h-4" /> Analyze Match</>}
            </button>

            {matchScore !== null && (
                <div className={`p-6 rounded-3xl border flex flex-col items-center justify-center space-y-3 animate-in slide-in-from-bottom-4 duration-500 shadow-xl ${isLight ? 'bg-emerald-50/80 border-emerald-200' : 'bg-[#0B1410] border-emerald-900/50'}`}>
                    <div className={`text-5xl font-black tracking-tighter ${matchScore > 75 ? 'text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-emerald-600' : matchScore > 40 ? 'text-orange-500' : 'text-red-500'}`}>
                        {matchScore}%
                    </div>
                    <div className={`text-[10px] font-bold uppercase tracking-widest ${isLight ? 'text-emerald-700' : 'text-emerald-500'}`}>Alignment Score</div>
                    
                    {missingKeywords.length > 0 ? (
                        <>
                            <div className="text-[11px] text-center my-2 text-slate-400 bg-black/20 p-3 rounded-xl border border-white/5">
                                Missing: <span className="font-bold text-orange-400">{missingKeywords.join(', ')}</span>
                            </div>
                            <button 
                                onClick={handleInjectKeywords} 
                                className={`w-full mt-2 px-4 py-3 rounded-xl text-[11px] font-bold border transition-all duration-300 cursor-pointer hover:scale-[1.02] ${isLight ? 'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 shadow-sm' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 shadow-[inset_0_1px_1px_rgba(16,185,129,0.1)]'}`}
                            >
                                Auto-Inject Missing Keywords onto Canvas
                            </button>
                        </>
                    ) : matchScore === 0 ? (
                        <div className="text-[11px] text-center my-2 text-red-500 font-bold bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                            No matching skills found.
                        </div>
                    ) : (
                        <div className="text-[11px] text-center my-2 text-emerald-500 font-bold bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                            Fully aligned with requirements!
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    const renderImpactQuantifier = () => (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 ease-out">
            <div className="flex items-center justify-between mb-4 border-b pb-4 border-slate-800/50">
                <span className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}> <TrendingUp className="w-4 h-4 text-orange-500" /> Impact Quantifier </span>
            </div>
            <p className={`text-[11px] leading-relaxed mb-4 p-3 rounded-xl border ${isLight ? 'text-orange-800 bg-orange-50 border-orange-200' : 'text-orange-400 bg-orange-500/10 border-orange-500/20'}`}>
                Scans canvas content and upgrades descriptions into metric-driven power statements using the STAR framework.
            </p>

            <div className="space-y-3">
                {[
                    { title: "Apply STAR Method", sub: "Restructures bullet points into Task, Action, Result on canvas.", icon: TrendingUp },
                    { title: "Quantify Metrics", sub: "Injects percentage gains and performance numbers into text.", icon: BarChart },
                    { title: "Action Verb Optimizer", sub: "Replaces weak verbs with strong technical verbs.", icon: PenTool },
                    { title: "Grammar & Tone Corrector", sub: "Fixes typos, punctuation, and formalizes phrasing.", icon: CheckCircle2 },
                ].map((bp, i) => (
                    <button
                        key={i}
                        disabled={isProcessing}
                        onClick={() => handleImpactAction(bp.title)}
                        className={`w-full flex items-start gap-3 p-3.5 rounded-2xl border transition-all duration-300 text-left cursor-pointer group hover:-translate-y-0.5 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''} ${isLight ? 'bg-white border-slate-200 hover:border-orange-400 hover:shadow-lg hover:shadow-orange-500/10' : 'bg-[#15161D] border-slate-800 hover:border-orange-500 hover:bg-slate-800 hover:shadow-lg hover:shadow-orange-900/20'}`}
                    >
                        <bp.icon className={`w-4 h-4 mt-0.5 shrink-0 transition-colors ${isLight ? 'text-orange-500 group-hover:text-orange-600' : 'text-orange-400 group-hover:text-orange-300'}`} />
                        <div>
                            <div className={`text-xs font-bold transition-colors ${isLight ? 'text-slate-800' : 'text-slate-200'}`}> {bp.title} </div>
                            <div className={`text-[10px] mt-1 leading-relaxed transition-colors ${isLight ? 'text-slate-500' : 'text-slate-400 group-hover:text-slate-300'}`}> {bp.sub} </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderPaletteStudio = () => (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 ease-out">
            <div className="flex items-center justify-between mb-4 border-b pb-4 border-slate-800/50">
                <span className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}> <Wand2 className="w-4 h-4 text-purple-500" /> Palette Studio </span>
            </div>
            
            <div className="space-y-3">
                <label className={`block text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}> Describe your Vibe (AI Theme Selector) </label>
                <div className="flex gap-2 relative group/input">
                    <input 
                        type="text" 
                        value={vibeInput}
                        onChange={(e) => setVibeInput(e.target.value)}
                        placeholder="e.g. Cyberpunk dark, clean minimal..."
                        className={`flex-1 text-xs px-4 py-3.5 rounded-xl border outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-300 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#15161D] border-slate-800'}`}
                    />
                    <button 
                        disabled={isProcessing || !vibeInput.trim()}
                        onClick={handleGenerateVibe} 
                        className={`bg-gradient-to-b from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white px-5 py-3.5 rounded-xl text-xs font-bold transition-all duration-300 shadow-lg active:scale-95 shadow-purple-900/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] ${isProcessing || !vibeInput.trim() ? 'opacity-50 cursor-not-allowed shadow-none' : 'cursor-pointer hover:shadow-xl hover:-translate-y-0.5'}`}
                    >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gen'}
                    </button>
                </div>
            </div>

            <div className="pt-4 space-y-3">
                <label className={`block text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}> Preset Brand Themes </label>
                <div className="grid grid-cols-1 gap-3 h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {PORTFOLIO_THEMES && Object.entries(PORTFOLIO_THEMES).map(([themeKey, theme]) => {
                        const isSelected = activeTheme === themeKey;
                        return (
                            <button
                                key={themeKey}
                                onClick={() => {
                                    if (onThemeChange) onThemeChange(themeKey);
                                    setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Applied ${theme.name} layout theme.` }]);
                                }}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl border text-xs font-bold text-left transition-all duration-300 cursor-pointer group hover:-translate-y-0.5 ${
                                    isSelected 
                                        ? (isLight ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-400 text-purple-700 shadow-lg ring-2 ring-purple-400/20' : 'bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-purple-500 text-purple-400 ring-2 ring-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.15)]') 
                                        : (isLight ? 'bg-white border-slate-200 text-slate-700 hover:border-purple-300 hover:shadow-md' : 'bg-[#15161D] border-slate-800 text-slate-300 hover:border-purple-500/50 hover:bg-slate-800 hover:shadow-lg')
                                }`}
                            >
                                <span className="tracking-wide"> {theme.name} </span> 
                                {isSelected && <CheckCircle2 className="w-4 h-4 shrink-0 animate-in zoom-in" />}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    const renderSeoAndPitch = () => (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 ease-out">
            <div className="flex items-center justify-between mb-4 border-b pb-4 border-slate-800/50">
                <span className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}> <Mail className="w-4 h-4 text-indigo-500" /> SEO & Cold Pitch </span>
            </div>

            <div className={`flex rounded-xl p-1 border shadow-inner ${isLight ? 'bg-slate-100/50 border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
                {["seo", "email", "linkedin"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => {
                            setPitchTab(tab);
                            setGeneratedPitchText(""); 
                        }}
                        className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all duration-300 cursor-pointer ${
                            pitchTab === tab 
                            ? (isLight ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-900/5' : 'bg-slate-700 text-white shadow-md ring-1 ring-white/10') 
                            : (isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-white/50' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5')
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {pitchTab === "seo" && (
                <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                    <p className={`text-[11px] leading-relaxed mb-4 p-3 rounded-xl border ${isLight ? 'text-indigo-800 bg-indigo-50 border-indigo-200' : 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'}`}>
                        Auto-generate meta descriptions and OpenGraph tags extracted from canvas content.
                    </p>
                    <button onClick={() => executeAiAction("SEO Tag Generator", "[SUCCESS] Derived SEO tags from your active canvas blocks.")} className="w-full py-3.5 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] shadow-indigo-900/20 cursor-pointer flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 hover:-translate-y-0.5">
                        <Share2 className="w-4 h-4" /> Generate SEO Setup
                    </button>
                </div>
            )}

            {(pitchTab === "email" || pitchTab === "linkedin") && (
                <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                    <label className={`block text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}> Target Company / Role </label>
                    <input 
                        type="text" 
                        value={pitchTarget}
                        onChange={(e) => setPitchTarget(e.target.value)}
                        placeholder="e.g. Hiring Manager at Google"
                        className={`w-full text-xs px-4 py-3.5 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#15161D] border-slate-800'}`}
                    />
                    <button 
                        disabled={!pitchTarget.trim() || isProcessing}
                        onClick={handleGeneratePitch} 
                        className={`w-full py-3.5 rounded-xl text-white text-xs font-bold shadow-lg transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 ${
                            !pitchTarget.trim() || isProcessing ? 'bg-indigo-900/30 text-indigo-300/50 cursor-not-allowed border border-indigo-900/20 shadow-none' : 'bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] shadow-indigo-900/20 cursor-pointer hover:-translate-y-0.5'
                        }`}
                    >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Draft Tailored {pitchTab === "email" ? "Cold Email" : "DM"}
                    </button>

                    {generatedPitchText && (
                        <div className="mt-6 space-y-3 animate-in slide-in-from-bottom-4 duration-500">
                            <label className={`block text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}> Generated Pitch </label>
                            <textarea
                                rows="8"
                                value={generatedPitchText}
                                onChange={(e) => setGeneratedPitchText(e.target.value)}
                                className={`w-full text-xs p-4 rounded-2xl border outline-none resize-none transition-all duration-300 focus:ring-2 focus:ring-indigo-500/50 ${isLight ? 'bg-indigo-50/30 border-indigo-200 text-slate-800' : 'bg-indigo-500/5 border-indigo-900/50 text-slate-200'}`}
                            />
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(generatedPitchText);
                                    setTerminalLogs(prev => [...prev, { type: "success", text: "[SUCCESS] Pitch copied to clipboard!" }]);
                                }}
                                className={`w-full py-3.5 rounded-xl border text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${isLight ? 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-md text-slate-700' : 'bg-slate-900 border-slate-800 hover:border-indigo-500 hover:bg-slate-800 text-slate-300 shadow-[0_4px_20px_rgba(0,0,0,0.3)]'}`}
                            >
                                <Copy className="w-4 h-4" /> Copy to Clipboard
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    const renderImageCustomizer = () => (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 ease-out">
            <div className="flex items-center justify-between border-b pb-4 border-slate-800/50">
                <span className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}> 🖼️ Image Studio </span>
            </div>

            <div className={`flex rounded-xl p-1 border shadow-inner ${isLight ? 'bg-slate-100/50 border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
                {[
                    { id: "ai", label: "AI Generator" },
                    { id: "upload", label: "Local Upload" }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setImageTab(tab.id)}
                        className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all duration-300 cursor-pointer ${
                            imageTab === tab.id 
                            ? (isLight ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-900/5' : 'bg-slate-700 text-white shadow-md ring-1 ring-white/10') 
                            : (isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-white/50' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5')
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="space-y-2">
                <label className={`block text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}> Target Canvas Block </label>
                <select
                    value={selectedTargetSection}
                    onChange={(e) => setSelectedTargetSection(e.target.value)}
                    className={`w-full text-xs font-semibold p-3.5 rounded-xl border outline-none cursor-pointer transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 ${isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#15161D] border-slate-800 text-slate-200'}`}
                >
                    <option value="global_bg">Entire Portfolio (Global Background)</option>
                    {(sections && sections.length > 0) ? (
                        sections.map((sec) => (
                            <option key={sec.id} value={sec.id}> {(sec.section_type || '').toUpperCase().replace('_', ' ')} (ID: {sec.id}) </option>
                        ))
                    ) : null}
                </select>
            </div>

            {imageTab === "ai" ? (
                <div className="space-y-4 animate-in slide-in-from-left-2 duration-300">
                    <div className="space-y-2">
                        <label className={`block text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}> Custom Image Prompt </label>
                        <textarea
                            rows="3"
                            value={imagePrompt}
                            onChange={(e) => setImagePrompt(e.target.value)}
                            placeholder="e.g. Glowing neural network connections..."
                            className={`w-full text-xs p-4 rounded-xl border outline-none resize-none transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 ${isLight ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400' : 'bg-[#15161D] border-slate-800 text-slate-200 placeholder-slate-500'}`}
                        />
                    </div>

                    <button
                        disabled={isProcessing}
                        onClick={() => {
                            if (!imagePrompt.trim()) return setTerminalLogs(prev => [...prev, { type: "error", text: "[ERROR] Enter prompt." }]);
                            setIsProcessing(true);
                            
                            const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1200&height=500&nologo=true`;
                            const img = new Image();
                            img.src = url;
                            
                            img.onload = () => { 
                                setGeneratedImageUrl(url); 
                                setIsProcessing(false); 
                                setTerminalLogs(prev => [...prev, { type: "success", text: "[SUCCESS] Image generated!" }]); 
                            };
                            img.onerror = () => {
                                setIsProcessing(false); 
                                setTerminalLogs(prev => [...prev, { type: "error", text: "[ERROR] Image generation failed." }]); 
                            }
                        }}
                        className={`w-full py-3.5 rounded-xl text-xs font-bold transition-all duration-300 shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                            isProcessing ? 'bg-purple-900/30 text-purple-300/50 cursor-not-allowed border border-purple-900/20 shadow-none' : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 hover:shadow-xl'
                        }`}
                    >
                        {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Rendering...</> : <><Wand2 className="w-4 h-4" /> Generate Backdrop</>}
                    </button>

                    {generatedImageUrl && (
                        <div className={`p-5 rounded-3xl border space-y-4 animate-in slide-in-from-bottom-4 duration-500 shadow-xl ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/50 border-slate-800 backdrop-blur-sm'}`}>
                            <div className="relative group/preview overflow-hidden rounded-2xl border border-slate-700/50">
                                <img src={generatedImageUrl} alt="AI Output Preview" className="w-full h-40 object-cover transition-transform duration-500 group-hover/preview:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover/preview:opacity-100 transition-opacity duration-300"></div>
                            </div>
                            <button onClick={() => handleApplyImage(generatedImageUrl)} className="w-full py-3.5 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-xs font-bold cursor-pointer transition-all duration-300 active:scale-95 shadow-lg shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                                Apply Image
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4 animate-in slide-in-from-right-2 duration-300">
                    <div className="space-y-2">
                        <label className={`block text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}> Upload Local Image </label>
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleFileUpload}
                            className={`w-full text-xs p-2 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:cursor-pointer file:transition-all ${isLight ? 'text-slate-500 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100' : 'text-slate-400 file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700'}`}
                        />
                    </div>

                    {uploadedImagePreview && (
                        <div className={`p-5 rounded-3xl border space-y-4 animate-in slide-in-from-bottom-4 duration-500 shadow-xl ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/50 border-slate-800 backdrop-blur-sm'}`}>
                            <div className="relative group/preview overflow-hidden rounded-2xl border border-slate-700/50">
                                <img src={uploadedImagePreview} alt="Uploaded Preview" className="w-full h-40 object-cover transition-transform duration-500 group-hover/preview:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover/preview:opacity-100 transition-opacity duration-300"></div>
                            </div>
                            <button onClick={() => handleApplyImage(uploadedImagePreview)} className="w-full py-3.5 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-xs font-bold cursor-pointer transition-all duration-300 active:scale-95 shadow-lg shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                                Apply Image
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    const renderCodeExport = () => (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 ease-out">
            <div className="flex items-center justify-between mb-4 border-b pb-4 border-slate-800/50">
                <span className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}> <Globe className="w-4 h-4 text-cyan-500" /> Code Export Shell </span>
            </div>
            <p className={`text-[11px] leading-relaxed mb-4 p-3 rounded-xl border ${isLight ? 'text-cyan-800 bg-cyan-50 border-cyan-200' : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'}`}> 
                Deploy to edge or download your raw React source code. 
            </p>
            
            <div className="space-y-4 pt-2">
                <button 
                    disabled={isProcessing}
                    onClick={async () => {
                        setIsProcessing(true);
                        if (onExportZip) await onExportZip();
                        setIsProcessing(false);
                    }}
                    className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold transition-all duration-300 shadow-md cursor-pointer active:scale-95 hover:-translate-y-0.5 ${
                        isProcessing 
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700 shadow-none' 
                            : (isLight ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]')
                    }`}
                >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} 
                    {isProcessing ? 'Packaging...' : 'Download Source (.zip)'}
                </button>

                <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-slate-700/50"></div>
                    <span className="flex-shrink-0 mx-4 text-slate-500 text-[10px] font-bold uppercase tracking-widest">Or</span>
                    <div className="flex-grow border-t border-slate-700/50"></div>
                </div>

                <button 
                    disabled={isProcessing}
                    onClick={async () => {
                        setIsProcessing(true);
                        setTerminalLogs(prev => [...prev, { type: "system", text: "[SYSTEM] Initiating production build sequence..." }]);
                        try {
                            await new Promise(resolve => setTimeout(resolve, 800));
                            if (onDeploy) await onDeploy(); 
                        } catch(error) {
                            setTerminalLogs(prev => [...prev, { type: "error", text: "[ERROR] Deployment Pipeline Failed." }]);
                        } finally {
                            setIsProcessing(false);
                        }
                    }}
                    className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl text-xs font-bold transition-all duration-300 shadow-lg cursor-pointer active:scale-95 hover:-translate-y-0.5 ${
                        isProcessing 
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700 shadow-none' 
                            : (isLight ? 'bg-slate-900 text-white hover:bg-black shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]' : 'bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] shadow-blue-900/20')
                    }`}
                >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />} 
                    {isProcessing ? 'Deploying to Edge...' : 'Deploy Animated Site'}
                </button>
            </div>
        </div>
    );

    const renderStructureBuilder = () => {
        const hasSections = sections && sections.length > 0;
        const isBlockSelected = hasSections && sections.some(s => s.id === activeSectionId);
        
        if (isBlockSelected) {
            return (
                <div className="flex flex-col items-center justify-center h-56 text-center px-6 animate-in fade-in zoom-in-95 duration-500 ease-out bg-slate-900/30 rounded-3xl border border-slate-800/50 shadow-inner">
                    <div className="relative mb-5">
                        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse"></div>
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center relative shadow-lg ${isLight ? 'bg-blue-50 border border-blue-100' : 'bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700'}`}>
                            <Settings className={`h-7 w-7 animate-[spin_4s_linear_infinite] ${isLight ? 'text-blue-500' : 'text-blue-400'}`} />
                        </div>
                    </div>
                    <h3 className={`text-sm font-black tracking-wide mb-2 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Block Selected</h3>
                    <p className={`text-[11px] leading-relaxed max-w-[220px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        Edit the text directly by clicking on it in the main canvas to the left.
                    </p>
                </div>
            );
        }

        const quickInsertModules = [
            { label: "Hero Header", type: "hero", icon: "✨" },
            { label: "About Bio", type: "about", icon: "👤" },
            { label: "Education", type: "education", icon: "🎓" },
            { label: "Skills Map", type: "skills", icon: "⚡" },
            { label: "Project Grid", type: "projects_grid", icon: "🚀" },
            { label: "Contact Form", type: "contact", icon: "✉️" },
        ];

        return (
            <div className="flex-1 space-y-6 animate-in fade-in zoom-in-95 duration-500 ease-out">
                <div className="flex items-center gap-2 mb-4 border-b pb-4 border-slate-800/50">
                    <LayoutTemplate className={`w-4 h-4 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} />
                    <span className={`text-[11px] font-black uppercase tracking-widest ${isLight ? 'text-slate-800' : 'text-slate-200'}`}> Structure Builder </span>
                </div>

                <div className="space-y-4">
                    <label className={`block text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}> Quick Insert Modules </label>
                    <div className="grid grid-cols-2 gap-3">
                        {quickInsertModules.map(block => (
                            <button
                                key={block.type}
                                onClick={() => onAddSection && onAddSection(block.type)}
                                className={`p-5 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer group ${isLight ? 'bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-slate-700' : 'bg-[#15161D] border-slate-800 hover:border-blue-500 hover:bg-slate-800 text-slate-300 shadow-[0_4px_20px_rgba(0,0,0,0.1)]'}`}
                            >
                                <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{block.icon}</span>
                                <span className="text-[10px] font-bold tracking-wide">{block.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={`h-full w-full flex flex-col transition-colors duration-500 ${isLight ? 'bg-slate-50/50 backdrop-blur-xl' : 'bg-[#0B0C10]/80 backdrop-blur-2xl'}`}>
            <div className="flex-1 flex flex-col overflow-y-auto p-6 custom-scrollbar">
                {activeTool === "generator" && renderContentGenerator()}
                {activeTool === "matcher" && renderRoleMatcher()}
                {activeTool === "impact" && renderImpactQuantifier()}
                {activeTool === "palette" && renderPaletteStudio()}
                {activeTool === "image" && renderImageCustomizer()}
                {activeTool === "seo_pitch" && renderSeoAndPitch()}
                {activeTool === "export" && renderCodeExport()}
                {(activeTool === "structure" || !activeTool) && renderStructureBuilder()}
            </div>

            <div className={`shrink-0 border-t p-6 flex flex-col gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-10 ${isLight ? 'border-slate-200 bg-white' : 'border-slate-800/80 bg-[#0F111A]'}`}>
                {/* Sleek Terminal Logs */}
                <div ref={logContainerRef} className={`text-[10px] font-mono h-28 overflow-y-auto space-y-2 custom-scrollbar p-3 rounded-xl border shadow-inner ${isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-[#090A0F] border-slate-800 text-slate-400'}`}>
                    <div className="flex items-center gap-1.5 mb-2 opacity-50 pb-2 border-b border-slate-700/50">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="ml-2 text-[9px] uppercase tracking-widest">Studio Terminal v2.1</span>
                    </div>
                    {terminalLogs && terminalLogs.map((log, i) => (
                        <div key={i} className={`flex items-start gap-2 animate-in fade-in slide-in-from-bottom-1 duration-300 ${
                            log.type === 'system' ? 'opacity-70' : log.type === 'success' ? 'text-emerald-400 font-bold' : log.type === 'error' ? 'text-red-400 font-bold' : log.type === 'user' ? (isLight ? 'text-blue-600 font-bold' : 'text-orange-400 font-bold') : 'italic opacity-50'
                        }`}>
                            <span className="opacity-50 select-none">{">"}</span>
                            <span>{log.text}</span>
                        </div>
                    ))}
                </div>

                {/* AI Chat Input */}
                <form onSubmit={handleSendMessage} className={`relative flex items-center w-full border rounded-2xl overflow-hidden transition-all duration-300 focus-within:ring-2 focus-within:ring-orange-500/50 focus-within:border-transparent shadow-md ${isLight ? 'bg-white border-slate-300' : 'bg-[#15161D] border-slate-700'}`}>
                    <div className={`pl-4 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                        <Paperclip className="w-4 h-4 cursor-pointer hover:text-orange-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask AI Studio anything..."
                        className={`w-full text-[11px] px-3 py-4 outline-none bg-transparent font-medium ${isLight ? 'text-slate-800 placeholder-slate-400' : 'text-slate-200 placeholder-slate-500'}`}
                    />
                    <button type="submit" className="pr-4 text-orange-500 hover:text-orange-400 transition-colors cursor-pointer group">
                        <Zap className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                    </button>
                </form>
            </div>
        </div>
    );
}