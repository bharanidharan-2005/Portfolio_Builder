import React, { useState, useEffect, useRef } from 'react';
import API from '../api';
import { PORTFOLIO_THEMES } from '../canvas/themes';

export default function AIRefinementPanel({
    logs,
    onSubmitPrompt,
    selectedSection,
    onManualUpdate,
    activeTool,
    pages,
    userData,
    setUserData,
    onDataExtracted
}) {
    const [promptText, setPromptText] = useState("");
    const [studioSubTab, setStudioSubTab] = useState("Generate");
    const [localContent, setLocalContent] = useState({});
    const [reviewData, setReviewData] = useState(null);
    const [loadingReview, setLoadingReview] = useState(false);
    const fileInputRef = useRef(null);
    const [imagePrompt, setImagePrompt] = useState("");
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [lastGeneratedImage, setLastGeneratedImage] = useState(null);

    useEffect(() => {
        if (selectedSection && selectedSection.content_data) {
            setLocalContent(selectedSection.content_data);
        } else {
            setLocalContent({});
        }
    }, [selectedSection]);

    useEffect(() => {
        if (studioSubTab === 'Review') {
            setLoadingReview(true);
            API.get('portfolio-review/')
                .then(res => {
                    setReviewData(res.data);
                    setLoadingReview(false);
                })
                .catch(err => {
                    console.error("Failed to load portfolio analysis metrics:", err);
                    setLoadingReview(false);
                });
        }
    }, [studioSubTab, pages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!promptText.trim()) return;
        onSubmitPrompt(promptText);
        setPromptText("");
    };

    const handleFileChange = async(e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('resume', file);

        try {
            console.log("Streaming file to Master Sync Engine:", file.name);
            const res = await API.post("upload-resume/", formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (res.data && res.data.data) {
                if (onDataExtracted) {
                    onDataExtracted(res.data.data);
                }
                alert("Whole Resume Matrix Synced Successfully ✅");
            }
        } catch (error) {
            console.error("Master Sync Failure:", error);
            alert("Failed to parse full resume array structures.");
        } finally {
            e.target.value = null;
        }
    };

    // --- PATCHED: Handle Image Generation Request ---
    const handleGenerateImage = async() => {
        if (!imagePrompt.trim()) return;
        setIsGeneratingImage(true);
        setLastGeneratedImage(null);

        try {
            const res = await API.post('generate-image/', { prompt: imagePrompt });
            if (res.data && res.data.image_url) {
                // ⚡ FIX: Prevent URL stacking if an external placeholder link is returned
                let finalUrl = res.data.image_url;
                if (finalUrl.startsWith('/')) {
                    finalUrl = 'http://localhost:8000' + finalUrl;
                }
                setLastGeneratedImage(finalUrl);
            }
        } catch (error) {
            console.error("Image generation failed:", error);
            alert("Failed to generate image. Check server console for errors.");
        } finally {
            setIsGeneratingImage(false);
            setImagePrompt("");
        }
    };

    const safeToolKey = activeTool ? String(activeTool).toUpperCase().trim() : "";
    const currentType = selectedSection ? (selectedSection.section_type || '').toLowerCase().trim() : "hero";

    const handleFieldChange = (key, value) => {
        const updated = {...localContent, [key]: value };
        setLocalContent(updated);
        onManualUpdate(selectedSection.id, updated);
    };

    const handleArrayItemChange = (arrayKey, index, fieldKey, value) => {
        const listCopy = [...(localContent[arrayKey] || [])];
        if (!listCopy[index]) { listCopy[index] = {}; }
        listCopy[index] = {...listCopy[index], [fieldKey]: value };
        const updated = {...localContent, [arrayKey]: listCopy };
        setLocalContent(updated);

        if (!String(selectedSection.id).includes('education')) {
            onManualUpdate(selectedSection.id, updated);
        }
    };

    const applyImageToBackground = () => {
        if (!selectedSection) {
            alert("Please click the 'Hero' section in the middle canvas first to select it.");
            return;
        }
        if (currentType !== 'hero') {
            alert("Background images are currently only supported on the Hero (top) section. Please select the Hero section.");
            return;
        }

        handleFieldChange('backgroundImage', lastGeneratedImage);
        alert("Background applied! Re-export to see changes.");
    };

    // --- PATCHED: Code Export Logic ---
    const triggerHtmlWebsiteDownload = () => {
            if (!pages || pages.length === 0) {
                alert("No data structure sections found to build.");
                return;
            }

            const themeId = (userData && userData.theme) ? userData.theme : 'cyberpunk_neon';
            const theme = PORTFOLIO_THEMES[themeId] || PORTFOLIO_THEMES['cyberpunk_neon'];
            const activeSections = pages[0].sections || [];

            let sectionsHtml = '';

            activeSections.forEach(sec => {
                        const type = (sec.section_type || '').toLowerCase().trim();
                        // ⚡ FIX: Force the export to use the active localContent if editing, preventing save delays
                        const data = (selectedSection && sec.id === selectedSection.id) ? {...sec.content_data, ...localContent } : (sec.content_data || {});

                        if (type === 'hero') {
                            // ⚡ FIX: Cleaner inline style injection for the background image
                            const bgInlineStyle = data.backgroundImage ?
                                `style="background-image: linear-gradient(rgba(13, 14, 18, 0.85), rgba(13, 14, 18, 0.95)), url('${data.backgroundImage}'); background-size: cover; background-position: center; background-repeat: no-repeat;"` :
                                '';

                            sectionsHtml += `
                <section class="text-center py-32 space-y-6 animate-fade-in border-b ${theme.border}" ${bgInlineStyle}>
                    <div class="relative z-10">
                        <h1 class="text-4xl md:text-6xl ${theme.textPrimary} uppercase tracking-tight">
                            ${data.heading || 'YOUR NAME'}
                        </h1>
                        <p class="text-lg max-w-xl mx-auto ${theme.textSecondary} mt-4">
                            ${data.subheading || 'Professional Track'}
                        </p>
                        
                        <div class="flex justify-center gap-4 pt-8">
                            ${data.liveUrl ? `<a href="${data.liveUrl}" target="_blank" class="px-6 py-2.5 bg-purple-600 text-white text-sm font-bold rounded-full hover:bg-purple-500 transition shadow-lg shadow-purple-500/20">See Live</a>` : ''}
                            ${data.designUrl ? `<a href="${data.designUrl}" target="_blank" class="px-6 py-2.5 border ${theme.border} ${theme.textSecondary} hover:text-white hover:border-slate-500 text-sm font-bold rounded-full transition">Design</a>` : ''}
                        </div>
                    </div>
                </section>\n`;
            } else if (type === 'about') {
                sectionsHtml += `
                <section class="py-12 space-y-4">
                    <h2 class="text-xs uppercase font-black tracking-widest ${theme.accentText}">About Me</h2>
                    <p class="text-sm leading-relaxed ${theme.textSecondary}">
                        ${data.bio || ''}
                    </p>
                </section>\n`;
            } else if (type === 'education') {
                const schoolsHtml = (data.schools || []).map(school => `
                    <div class="border ${theme.cardBg} p-5 rounded-xl">
                        <div class="flex justify-between items-start mb-1">
                            <h3 class="font-bold text-sm ${theme.textPrimary} uppercase">${school.institution || 'Institution'}</h3>
                            <span class="text-[10px] px-2 py-1 rounded ${theme.badge}">${school.years || ''}</span>
                        </div>
                        <p class="text-xs ${theme.accentText} mb-2">${school.degree || ''}</p>
                        <p class="text-[10px] ${theme.textSecondary}">Metric: ${school.score || 'N/A'}</p>
                    </div>
                `).join('');
                sectionsHtml += `<section class="py-12 space-y-6"><h2 class="text-xs uppercase font-black tracking-widest ${theme.accentText}">Education</h2><div class="space-y-4">${schoolsHtml}</div></section>\n`;
            } else if (type === 'skills') {
                const skillsHtml = (data.items || []).map(skill => `
                    <div class="space-y-1.5">
                        <div class="flex justify-between text-[11px] font-bold ${theme.textPrimary}">
                            <span>${skill.name || 'Skill'}</span>
                            <span class="${theme.accentText}">${skill.level || 50}%</span>
                        </div>
                        <div class="w-full bg-slate-800 rounded-full h-1">
                            <div class="bg-purple-500 h-1 rounded-full" style="width: ${skill.level || 50}%"></div>
                        </div>
                    </div>
                `).join('');
                sectionsHtml += `<section class="py-12 space-y-6"><h2 class="text-xs uppercase font-black tracking-widest ${theme.accentText}">Expertise</h2><div class="grid grid-cols-1 md:grid-cols-2 gap-6">${skillsHtml}</div></section>\n`;
            } else if (type === 'projects_grid') {
                const projectsHtml = (data.projects || []).map(proj => `
                    <div class="border ${theme.cardBg} p-6 rounded-xl transition-all">
                        <h3 class="font-bold text-xs mb-3 ${theme.textPrimary} uppercase">${proj.title || 'Project'}</h3>
                        <p class="text-[11px] ${theme.textSecondary} mb-4">${proj.desc || ''}</p>
                        ${proj.projectUrl ? `<a href="${proj.projectUrl}" target="_blank" class="text-[10px] font-bold ${theme.accentText}">View &rarr;</a>` : ''}
                    </div>
                `).join('');
                sectionsHtml += `<section class="py-12 space-y-6"><h2 class="text-xs uppercase font-black tracking-widest ${theme.accentText}">${data.title || 'Projects'}</h2><div class="grid grid-cols-1 md:grid-cols-2 gap-4">${projectsHtml}</div></section>\n`;
            } else if (type === 'contact') {
                sectionsHtml += `
                <section class="py-16 text-center space-y-6 border-t ${theme.border} mt-8">
                    <h2 class="text-xs uppercase font-black tracking-widest ${theme.accentText}">Get In Touch</h2>
                    <p class="text-sm max-w-md mx-auto leading-relaxed ${theme.textSecondary}">
                        ${data.text || 'Reach out to collaborate on future projects.'}
                    </p>
                    <a href="mailto:hello@example.com" class="inline-block px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-purple-500/20">
                        Contact Me
                    </a>
                </section>\n`;
            }
        });

        const fullHtmlDocument = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <title>Portfolio Site</title>
</head>
<body class="${theme.bodyBg} min-h-screen p-6 md:p-12 font-sans">
    <main class="max-w-3xl mx-auto">${sectionsHtml}</main>
</body>
</html>`;

        const blob = new Blob([fullHtmlDocument], { type: 'text/html;charset=utf-8;' });
        const anchorElement = document.createElement('a');
        anchorElement.href = URL.createObjectURL(blob);
        anchorElement.download = "portfolio_site.html";
        document.body.appendChild(anchorElement);
        anchorElement.click();
        document.body.removeChild(anchorElement);
    };

    if (safeToolKey.includes("THEME")) {
        return (
            <div className="w-80 h-full bg-[#13151c] border-l border-[#1f222c] p-6 flex flex-col justify-start select-none shrink-0 overflow-y-auto">
                <div className="mb-6">
                    <h3 className="text-xs uppercase font-black tracking-wider text-purple-400">⚡Workspace Themes</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Select an identity framework to style your live portfolio build canvas cards.</p>
                </div>
                <div className="space-y-3">
                    {Object.values(PORTFOLIO_THEMES || {}).map((themeObj) => {
                        const isSelected = userData && userData.theme === themeObj.id;
                        return (
                            <button
                                key={themeObj.id}
                                type="button"
                                onClick={() => setUserData({ ...userData, theme: themeObj.id })}
                                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-xs font-bold text-left transition-all duration-200 ${
                                    isSelected ? 'border-purple-500 bg-purple-500/10 text-white shadow-lg' : 'border-[#232635] bg-[#0d0e12] text-slate-400 hover:border-slate-700'
                                }`}
                            >
                                <span>{themeObj.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    if (safeToolKey.includes("IMAGE") || safeToolKey.includes("CUSTOMIZER")) {
        return (
            <div className="w-80 h-full bg-[#13151c] border-l border-[#1f222c] p-6 flex flex-col justify-start select-none shrink-0 overflow-y-auto space-y-6">
                <div>
                    <h3 className="text-xs uppercase font-black tracking-wider text-purple-400">⚡Image Customizer</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Generate custom mock vector graphics or placeholder backgrounds using Imagen 3.</p>
                </div>
                <div className="bg-[#0d0e12] border border-[#232635] rounded-xl p-4 space-y-3">
                    <textarea
                        className="w-full bg-[#13151c] border border-[#232635] rounded-lg p-2.5 text-xs text-white outline-none resize-none h-20 focus:border-purple-500 transition-colors"
                        placeholder="e.g., A minimalist vector graphic of a laptop surrounded by glowing neon code..."
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                        disabled={isGeneratingImage}
                    />
                    <button 
                        type="button" 
                        onClick={handleGenerateImage}
                        disabled={isGeneratingImage || !imagePrompt.trim()}
                        className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900 disabled:text-purple-400 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                        {isGeneratingImage ? "🎨 Generating..." : "Generate Asset"}
                    </button>
                </div>

                {lastGeneratedImage && (
                     <div className="space-y-3 animate-fade-in border-t border-[#232635] pt-4">
                         <div className="text-[9px] uppercase font-black tracking-widest text-slate-500">Generated Asset</div>
                         <div className="bg-[#0d0e12] p-2 border border-[#232635] rounded-xl">
                            <img src={lastGeneratedImage} alt="Generated Asset" className="w-full h-auto rounded-lg" />
                         </div>
                         <button 
                             onClick={applyImageToBackground}
                             className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-500/20 transition-all"
                         >
                            Apply as Hero Background
                         </button>
                         <p className="text-[9px] text-slate-500 text-center">Right-click image to save locally</p>
                     </div>
                )}
            </div>
        );
    }

    if (safeToolKey.includes("CODE") || safeToolKey.includes("EXPORT")) {
        return (
            <div className="w-80 h-full bg-[#13151c] border-l border-[#1f222c] p-6 flex flex-col justify-start select-none shrink-0 overflow-y-auto space-y-6">
                <div>
                    <h3 className="text-xs uppercase font-black tracking-wider text-purple-400">⚡Code Export Shell</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Compile your structural template configurations directly into a production-ready web file module asset.</p>
                </div>

                <div className="bg-[#0d0e12] border border-[#232635] rounded-xl p-4 font-mono text-[10px] text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {`<!DOCTYPE html>\n<html>\n  <head>\n    \n  </head>\n  <body>\n    \n  </body>\n</html>`}
                </div>

                <button
                    onClick={triggerHtmlWebsiteDownload}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/10 cursor-pointer active:scale-[0.99]"
                >
                    📥Download Standalone HTML Site
                </button>
            </div>
        );
    }

    if (safeToolKey.includes("GENERATOR")) {
        return (
            <div className="w-80 h-full bg-[#13151c] border-l border-[#1f222c] flex flex-col shrink-0 overflow-hidden">
                <div className="p-4 bg-[#0d0e12]/60 border-b border-[#1f222c] flex items-center justify-between shrink-0">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Section</span>
                    <span className="text-[10px] font-mono font-black px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md">
                        {currentType.toUpperCase()}
                    </span>
                </div>

                <div className="grid grid-cols-3 bg-[#0d0e12] border-b border-[#1f222c] p-1 font-bold text-[10px] uppercase text-center shrink-0">
                    {['Generate', 'Improve', 'Review'].map(tab => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setStudioSubTab(tab)}
                            className={`py-1.5 rounded-lg transition-all cursor-pointer ${studioSubTab === tab ? 'bg-purple-600 text-white font-black' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {studioSubTab === 'Generate' && (
                        <div className="space-y-3">
                            <div className="text-[9px] uppercase font-black tracking-widest text-slate-500 mb-2">Section Blueprints</div>

                            <button
                                type="button"
                                onClick={() => onSubmitPrompt("COMPLETELY REWRITE AND GENERATE a new professional headline. Return keys: heading (Full Name in uppercase), subheading (A highly targeted professional track tagline statement framework). Keep current URLs intact.")}
                                className="w-full p-3 text-left bg-[#0d0e12] border border-purple-500/20 hover:border-purple-500 text-slate-200 text-xs rounded-xl transition-all flex flex-col gap-1 cursor-pointer outline-none font-sans"
                            >
                                <span className="font-bold text-purple-400">✨Generate Hero Section</span>
                                <span className="text-[9px] text-slate-500 font-medium">Assembles profile title structures, name fields, and headlines.</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => onSubmitPrompt("COMPLETELY REWRITE AND GENERATE a new detailed profile narrative bio paragraph tailored exactly to the active structural background context. Return key: bio.")}
                                className="w-full p-3 text-left bg-[#0d0e12] border border-purple-500/20 hover:border-purple-500 text-slate-200 text-xs rounded-xl transition-all flex flex-col gap-1 cursor-pointer outline-none font-sans"
                            >
                                <span className="font-bold text-purple-400">👤Generate About Me Bio</span>
                                <span className="text-[9px] text-slate-500 font-medium">Auto-writes deep comprehensive profile summaries.</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => onSubmitPrompt("COMPLETELY REWRITE AND GENERATE a full professional item array list. Return an array of item objects containing keys 'name' and 'level' (integer percentage). Populate with relevant domain expertise paths.")}
                                className="w-full p-3 text-left bg-[#0d0e12] border border-purple-500/20 hover:border-purple-500 text-slate-200 text-xs rounded-xl transition-all flex flex-col gap-1 cursor-pointer outline-none font-sans"
                            >
                                <span className="font-bold text-purple-400">📊Generate Categorized Skills</span>
                                <span className="text-[9px] text-slate-500 font-medium">Fills metrics charts with specialized capabilities logs.</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => onSubmitPrompt("COMPLETELY REWRITE AND GENERATE professional application project items. Return keys: title ('Showcase of Innovations & System Achievements'), projects (array of objects containing keys: title, desc, tags, projectUrl). Ensure URLs use standard live targets.")}
                                className="w-full p-3 text-left bg-[#0d0e12] border border-purple-500/20 hover:border-purple-500 text-slate-200 text-xs rounded-xl transition-all flex flex-col gap-1 cursor-pointer outline-none font-sans"
                            >
                                <span className="font-bold text-purple-400">🚀Generate Projects Stack</span>
                                <span className="text-[9px] text-slate-500 font-medium">Populates showcase blocks with clean live project records.</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => onSubmitPrompt("COMPLETELY REWRITE AND GENERATE professional academic background metrics. Return array of school objects.")}
                                className="w-full p-3 text-left bg-[#0d0e12] border border-purple-500/20 hover:border-purple-500 text-slate-200 text-xs rounded-xl transition-all flex flex-col gap-1 cursor-pointer outline-none font-sans"
                            >
                                <span className="font-bold text-purple-400">🎓Generate Education</span>
                                <span className="text-[9px] text-slate-500 font-medium">Fills in degree paths, GPA scores, and institution data.</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => onSubmitPrompt("COMPLETELY REWRITE AND GENERATE an inviting call-to-action text block to collaborate on enterprise systems.")}
                                className="w-full p-3 text-left bg-[#0d0e12] border border-purple-500/20 hover:border-purple-500 text-slate-200 text-xs rounded-xl transition-all flex flex-col gap-1 cursor-pointer outline-none font-sans"
                            >
                                <span className="font-bold text-purple-400">📧Generate Contact CTA</span>
                                <span className="text-[9px] text-slate-500 font-medium">Auto-drafts recruiter outreach prompts.</span>
                            </button>
                        </div>
                    )}

                    {studioSubTab === 'Improve' && (
                        <div className="space-y-4">
                            <div>
                                <div className="text-[9px] uppercase font-black tracking-widest text-slate-500 mb-2">Tone Adjustments</div>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { title: '💼 Professional', prompt: 'Rewrite using an advanced, recruiter-friendly corporate voice layout.' },
                                        { title: '⚡ Startup / Agile', prompt: 'Polish wording metrics using a quick, disruptive startup tone.' },
                                        { title: '🔮 Cyberpunk', prompt: 'Translate styling content text streams into high-fidelity neon syntax paradigms.' },
                                        { title: '🎯 Recruiter Pick', prompt: 'Optimize impact measurements and emphasize system achievements for tracking managers.' }
                                    ].map(item => (
                                        <button
                                            key={item.title}
                                            type="button"
                                            onClick={() => onSubmitPrompt(`For this active portfolio block type "${currentType}", please preserve JSON data constraints and execute this instruction: ${item.prompt}`)}
                                            className="p-2.5 text-center bg-[#0d0e12] border border-[#232635] hover:border-purple-500 text-slate-300 text-[10px] font-bold rounded-xl transition-all cursor-pointer outline-none font-sans"
                                        >
                                            {item.title}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-[9px] uppercase font-black tracking-widest text-slate-500">Structural Utilities</div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => onSubmitPrompt(`Compress and shorten text structures for this segment type "${currentType}" to maximize clean presentation readability indices.`)}
                                        className="py-2 bg-[#0d0e12] border border-slate-800 hover:border-purple-500 text-slate-400 text-[10px] font-bold rounded-lg transition-all"
                                    >
                                        🔍Shorten Text
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onSubmitPrompt(`Expand details and add technical metrics depth for this portfolio block item type "${currentType}".`)}
                                        className="py-2 bg-[#0d0e12] border border-slate-800 hover:border-purple-500 text-slate-400 text-[10px] font-bold rounded-lg transition-all"
                                    >
                                        📈Expand Scope
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {studioSubTab === 'Review' && (
                        <div className="space-y-4 font-sans leading-normal">
                            <div className="text-[9px] uppercase font-black tracking-widest text-slate-500">Real-Time Canvas Review</div>

                            {loadingReview ? (
                                <div className="text-center py-6 text-xs text-slate-500 italic animate-pulse">Running portfolio score calculation...</div>
                            ) : reviewData ? (
                                <div className="space-y-4">
                                    <div className="p-4 bg-[#0d0e12] border border-[#232635] rounded-xl space-y-2.5">
                                        <div className="flex justify-between items-center text-xs font-bold">
                                            <span className="text-slate-400">Holistic Score</span>
                                            <span className="text-emerald-400 font-mono font-black text-sm">{reviewData.overall_score}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 transition-all duration-500"
                                                style={{ width: `${reviewData.overall_score}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {reviewData.missing_items && reviewData.missing_items.length > 0 && (
                                        <div className="space-y-1.5">
                                            <div className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Missing Variables</div>
                                            <div className="bg-[#0d0e12]/60 border border-[#232635] p-3 rounded-xl space-y-1">
                                                {reviewData.missing_items.map((item, idx) => (
                                                    <div key={idx} className="text-[11px] text-rose-400 font-medium">⚠️Missing: {item}</div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <div className="text-[9px] uppercase font-black text-slate-500 tracking-wider">AI Suggestions Blueprint</div>
                                        <div className="space-y-1.5">
                                            {reviewData.suggestions.map((suggestion, idx) => (
                                                <div key={idx} className="bg-[#0d0e12] p-2.5 border border-[#1f222c] rounded-xl text-[11px] text-slate-400 leading-normal">
                                                    💡{suggestion}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-4 text-xs text-slate-600 italic">No analysis payload returned from endpoint path.</div>
                            )}
                        </div>
                    )}
                </div>

                <div className="h-24 border-t border-[#1f222c] bg-[#0d0e12]/40 p-3 font-mono text-[10px] text-slate-500 overflow-y-auto shrink-0">
                    <div>// Studio Pipeline Console Log Hook</div>
                    {logs && logs.length > 0 ? (
                        <div className="text-purple-400 mt-1">{typeof logs[0] === 'object' ? logs[0].desc : logs[0]}</div>
                    ) : (
                        <div className="italic mt-1">Ready for inputs...</div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="p-3 border-t border-[#1f222c] bg-[#0d0e12] shrink-0">
                    <div className="relative flex items-center bg-[#13151c] border border-[#232635] rounded-xl focus-within:border-purple-500 transition-all">
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.docx,.txt" className="hidden" />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current && fileInputRef.current.click()}
                            className="pl-3 pr-1 text-slate-500 hover:text-purple-400 transition-colors text-xs font-bold cursor-pointer"
                        >
                            📎
                        </button>
                        <input
                            type="text"
                            placeholder="Ask AI Studio anything..."
                            className="w-full bg-transparent pl-2 pr-10 py-2.5 text-xs text-white outline-none font-medium"
                            value={promptText}
                            onChange={(e) => setPromptText(e.target.value)}
                        />
                        <button type="submit" className="absolute right-3 text-purple-400 hover:text-purple-300 font-bold text-xs cursor-pointer">
                            ⚡
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="w-80 h-full bg-[#13151c] border-l border-[#1f222c] flex flex-col select-none shrink-0 overflow-hidden">
            <div className="p-6 border-b border-[#1f222c] space-y-4 shrink-0 flex-1 overflow-y-auto">
                <div className="mb-2">
                    <h3 className="text-xs uppercase font-black tracking-wider text-slate-200">📝Manual Property Editor</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Direct manual editor mode. Select any element card inside the canvas to edit text by hand.</p>
                </div>

                {selectedSection ? (
                    <div className="space-y-4">
                        <label className="block text-[10px] uppercase font-bold tracking-wider text-purple-400">Editing Target: [{currentType.toUpperCase()}]</label>

                        {currentType === 'hero' && (
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Heading Name</span>
                                    <input
                                        type="text"
                                        className="w-full bg-[#0d0e12] border border-[#232635] rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 outline-none"
                                        value={localContent.heading || ''}
                                        onChange={(e) => handleFieldChange('heading', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Subheading headline</span>
                                    <textarea
                                        rows="3"
                                        className="w-full bg-[#0d0e12] border border-[#232635] rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 outline-none resize-none leading-normal"
                                        value={localContent.subheading || ''}
                                        onChange={(e) => handleFieldChange('subheading', e.target.value)}
                                    />
                                </div>
                                
                                <div className="space-y-1 pt-2 border-t border-[#232635]">
                                    <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Background Image URL (Optional)</span>
                                    <input
                                        type="text"
                                        placeholder="Paste any image URL here..."
                                        className="w-full bg-[#0d0e12] border border-[#232635] rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 outline-none"
                                        value={localContent.backgroundImage || ''}
                                        onChange={(e) => handleFieldChange('backgroundImage', e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    <div className="space-y-1">
                                        <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">See Live Link</span>
                                        <input
                                            type="text"
                                            placeholder="https://..."
                                            className="w-full bg-[#0d0e12] border border-[#232635] rounded-xl px-2.5 py-1.5 text-[11px] text-white focus:border-purple-500 outline-none"
                                            value={localContent.liveUrl || ''}
                                            onChange={(e) => handleFieldChange('liveUrl', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Design link repo</span>
                                        <input
                                            type="text"
                                            placeholder="https://..."
                                            className="w-full bg-[#0d0e12] border border-[#232635] rounded-xl px-2.5 py-1.5 text-[11px] text-white focus:border-purple-500 outline-none"
                                            value={localContent.designUrl || ''}
                                            onChange={(e) => handleFieldChange('designUrl', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentType === 'about' && (
                            <div className="space-y-1">
                                <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Biography Summary text</span>
                                <textarea
                                    rows="5"
                                    className="w-full bg-[#0d0e12] border border-[#232635] rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 outline-none resize-none leading-relaxed"
                                    value={localContent.bio || ''}
                                    onChange={(e) => handleFieldChange('bio', e.target.value)}
                                />
                            </div>
                        )}

                        {currentType === 'education' && (
                            <div className="space-y-3">
                                {(localContent.schools || []).map((school, idx) => (
                                    <div key={idx} className="bg-[#0d0e12] border border-[#232635] p-2.5 rounded-xl space-y-2">
                                        <input
                                            type="text"
                                            className="w-full bg-[#13151c] border border-slate-800 rounded-md px-2 py-1 text-[11px] text-white outline-none"
                                            value={school.institution || ''}
                                            onChange={(e) => handleArrayItemChange('schools', idx, 'institution', e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            className="w-full bg-[#13151c] border border-slate-800 rounded-md px-2 py-1 text-[11px] text-slate-300 outline-none"
                                            value={school.degree || ''}
                                            onChange={(e) => handleArrayItemChange('schools', idx, 'degree', e.target.value)}
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="text"
                                                className="w-full bg-[#13151c] border border-slate-800 rounded-md px-2 py-1 text-[10px] text-slate-400 outline-none"
                                                value={school.years || ''}
                                                onChange={(e) => handleArrayItemChange('schools', idx, 'years', e.target.value)}
                                            />
                                            <input
                                                type="text"
                                                className="w-full bg-[#13151c] border border-slate-800 rounded-md px-2 py-1 text-[10px] text-slate-400 outline-none"
                                                value={school.score || ''}
                                                onChange={(e) => handleArrayItemChange('schools', idx, 'score', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {currentType === 'skills' && (
                            <div className="space-y-3">
                                {(localContent.items || []).map((skill, idx) => (
                                    <div key={idx} className="bg-[#0d0e12] border border-[#232635] p-2.5 rounded-xl space-y-1.5">
                                        <input
                                            type="text"
                                            className="w-full bg-transparent border-b border-slate-800 focus:border-purple-500 pb-0.5 text-[11px] font-bold text-white outline-none"
                                            value={skill.name || ''}
                                            onChange={(e) => handleArrayItemChange('items', idx, 'name', e.target.value)}
                                        />
                                        <div className="flex items-center gap-2 pt-1">
                                            <input
                                                type="range"
                                                min="1"
                                                max="100"
                                                className="flex-1 accent-purple-500 h-1"
                                                value={skill.level || 50}
                                                onChange={(e) => handleArrayItemChange('items', idx, 'level', parseInt(e.target.value))}
                                            />
                                            <span className="text-[10px] font-bold text-purple-400 w-8 text-right">{skill.level}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {currentType === 'projects_grid' && (
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    className="w-full bg-[#0d0e12] border border-[#232635] rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 outline-none"
                                    value={localContent.title || ''}
                                    onChange={(e) => handleFieldChange('title', e.target.value)}
                                />
                                {(localContent.projects || []).map((project, idx) => (
                                    <div key={idx} className="bg-[#0d0e12] border border-[#232635] p-2.5 rounded-xl space-y-2">
                                        <input
                                            type="text"
                                            className="w-full bg-[#13151c] border border-slate-800 rounded-md px-2 py-1 text-[11px] font-bold text-white outline-none"
                                            value={project.title || ''}
                                            onChange={(e) => handleArrayItemChange('projects', idx, 'title', e.target.value)}
                                        />
                                        <textarea
                                            rows="2"
                                            className="w-full bg-[#13151c] border border-slate-800 rounded-md px-2 py-1 text-[10px] text-slate-300 outline-none resize-none"
                                            value={project.desc || ''}
                                            onChange={(e) => handleArrayItemChange('projects', idx, 'desc', e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Project Link Target..."
                                            className="w-full bg-[#13151c] border border-slate-800 rounded-md px-2 py-1 text-[10px] text-white outline-none"
                                            value={project.projectUrl || ''}
                                            onChange={(e) => handleArrayItemChange('projects', idx, 'projectUrl', e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {currentType === 'contact' && (
                            <div className="space-y-1">
                                <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Call to action line text</span>
                                <textarea
                                    rows="3"
                                    className="w-full bg-[#0d0e12] border border-[#232635] rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 outline-none resize-none leading-normal"
                                    value={localContent.text || ''}
                                    onChange={(e) => handleFieldChange('text', e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-[#0d0e12]/40 border border-[#232635]/60 rounded-xl p-3 text-center">
                        <p className="text-[11px] text-slate-500 italic">Click on any section card block in the center canvas to inspect its properties.</p>
                    </div>
                )}
            </div>
        </div>
    );
}