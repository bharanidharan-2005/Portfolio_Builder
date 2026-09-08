import { useState, useEffect, useRef } from 'react';
import API from '../api';
import { PORTFOLIO_THEMES } from '../canvas/themes';
import { notify } from '../toast';
import { buildPortfolioHtml, downloadPortfolioHtml } from '../utils/exportWebsiteHtml';

const SECTION_LABELS = {
    hero: "Hero",
    about: "About Me",
    education: "Education",
    skills: "Skills",
    projects_grid: "Projects",
    contact: "Contact",
};

export default function AIRefinementPanel({
    logs,
    activity,
    onSubmitPrompt,
    selectedSection,
    onManualUpdate,
    activeTool,
    pages,
    activePage,
    userData,
    setUserData,
    onDataExtracted,
    onDeleteSection,
    onUndo,
    onRedo,
    saveState,
    onApplyImage,
    onClose,
    mobileOpen,
    isOpen = true
}) {
    const [promptText, setPromptText] = useState("");
    const [studioSubTab, setStudioSubTab] = useState("Generate");
    const [localContent, setLocalContent] = useState({});
    const [reviewData, setReviewData] = useState(null);
    const [loadingReview, setLoadingReview] = useState(false);
    const fileInputRef = useRef(null);
    const [imagePrompt, setImagePrompt] = useState("");
    const [imageTarget, setImageTarget] = useState("hero");
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [lastGeneratedImage, setLastGeneratedImage] = useState(null);
    const [busyMessage, setBusyMessage] = useState(null);
    const [githubUsername, setGithubUsername] = useState("");
    const [isImportingGithub, setIsImportingGithub] = useState(false);
    const [deploying, setDeploying] = useState(false);

    useEffect(() => {
        if (selectedSection && selectedSection.content_data) {
            setLocalContent(selectedSection.content_data);
        } else {
            setLocalContent({});
        }
    }, [selectedSection]);

    useEffect(() => {
        if (studioSubTab !== 'Review') return;
        let cancelled = false;
        const timer = setTimeout(() => {
            setLoadingReview(true);
            API.get('portfolio-review/').then(res => {
                if (cancelled) return;
                setReviewData(res.data);
                setLoadingReview(false);
            }).catch(err => {
                if (cancelled) return;
                console.error("Failed to load metrics:", err);
                setLoadingReview(false);
            });
        }, 400);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [studioSubTab, pages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!promptText.trim()) return;
        onSubmitPrompt(promptText, currentType);
        setPromptText("");
    };

    const handleFileChange = async(e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('resume', file);
        if (activePage) formData.append('page', activePage);

        try {
            setBusyMessage(`Parsing resume "${file.name}"...`);
            const res = await API.post("upload-resume/", formData);
            if (res.data && res.data.data) {
                if (onDataExtracted) onDataExtracted(res.data.data);
                notify("Resume imported — sections updated", 'success');
            }
        } catch (error) {
            notify(error.response ? .data ? .error || "Failed to parse the resume.", 'error');
        } finally {
            setBusyMessage(null);
            e.target.value = null;
        }
    };

    const handleGenerateImage = async() => {
        if (!imagePrompt.trim()) return;
        setIsGeneratingImage(true);
        setLastGeneratedImage(null);
        setBusyMessage("Generating image...");
        try {
            const res = await API.post('generate-image/', { prompt: imagePrompt });
            if (res.data && res.data.image_url) {
                let finalUrl = res.data.image_url;
                if (finalUrl.startsWith('/')) finalUrl = new URL(finalUrl, API.defaults.baseURL).toString();
                setLastGeneratedImage(finalUrl);
                notify("Image generated successfully.", 'success');
            }
        } catch (error) {
            notify(error.response ? .data ? .error || "Failed to generate image.", 'error');
        } finally {
            setIsGeneratingImage(false);
            setBusyMessage(null);
        }
    };

    const handleGithubImport = async() => {
        const username = githubUsername.trim().replace(/^@/, '');
        if (!username) return notify("Enter a GitHub username.", 'error');
        setIsImportingGithub(true);
        try {
            const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=6`, {
                headers: { 'Accept': 'application/vnd.github+json' },
            });
            if (!res.ok) throw new Error("API Error");
            const repos = await res.json();
            const mapped = repos.filter(r => !r.fork && !r.archived).map(r => ({
                title: r.name || 'Untitled',
                desc: r.description || '',
                link: r.html_url,
                projectUrl: r.html_url,
                tags: r.language ? [r.language] : [],
            }));
            const existingUrls = new Set((localContent.projects || []).map(p => p.projectUrl || p.link).filter(Boolean));
            const merged = [...(localContent.projects || []), ...mapped.filter(p => !existingUrls.has(p.link))];
            const updated = {...localContent, projects: merged };
            setLocalContent(updated);
            onManualUpdate(selectedSection.id, updated);
            notify(`Synced ${mapped.length} repos from @${username}`, 'success');
        } catch (err) {
            notify("GitHub sync failed.", 'error');
        } finally {
            setIsImportingGithub(false);
        }
    };

    const applyImageToSection = () => {
        if (!lastGeneratedImage) return notify("Generate an image first.", 'error');
        const targetType = (imageTarget || 'hero').toLowerCase().trim();
        const target = imageTargetSections.find(s => (s.section_type || '').toLowerCase().trim() === targetType);
        if (!target) return notify(`Add a "${SECTION_LABELS[targetType]}" section first.`, 'error');
        if (onApplyImage) onApplyImage(target.id, lastGeneratedImage);
    };

    const triggerHtmlWebsiteDownload = () => {
        downloadPortfolioHtml({ pages, activePage, selectedSection, localContent, userData });
    };

    const triggerPdfDownload = async() => {
        try {
            const [{ pdf }, { default: PdfResume }] = await Promise.all([
                import ('@react-pdf/renderer'),
                import ('../pdf/PdfResume')
            ]);
            const blob = await pdf( < PdfResume pages = { pages }
                activePage = { activePage }
                userData = { userData }
                />).toBlob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = 'portfolio_resume.pdf'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); notify('ATS resume downloaded', 'success');
            }
            catch (err) {
                notify('Failed to generate PDF.', 'error');
            }
        };

        const triggerDeploy = async() => {
            if (deploying) return;
            setDeploying(true);
            try {
                const html = buildPortfolioHtml({ pages, activePage, selectedSection, localContent, userData });
                const res = await API.post('deploy/', { html_content: html });
                notify(`Deployed! Live at ${res.data.url}`, 'success');
            } catch (err) {
                notify(err.response ? .data ? .error || 'Deployment failed.', 'error');
            } finally {
                setDeploying(false);
            }
        };

        const handleFieldChange = (key, value) => {
            const updated = {...localContent, [key]: value };
            setLocalContent(updated);
            onManualUpdate(selectedSection.id, updated);
        };

        const handleArrayItemChange = (arrayKey, index, fieldKey, value) => {
            const listCopy = [...(localContent[arrayKey] || [])];
            if (!listCopy[index]) listCopy[index] = {};
            listCopy[index] = {...listCopy[index], [fieldKey]: value };
            const updated = {...localContent, [arrayKey]: listCopy };
            setLocalContent(updated);
            onManualUpdate(selectedSection.id, updated);
        };

        const safeToolKey = activeTool ? String(activeTool).toUpperCase().trim() : "";
        const currentType = selectedSection ? (selectedSection.section_type || '').toLowerCase().trim() : "hero";
        const imageTargetSections = (pages || []).find(p => p.name === activePage) ? .sections || [];

        // --- UI RENDERING BLOCKS ---
        const panelRootClass = `w-80 max-w-[90vw] h-full bg-white flex flex-col shrink-0 overflow-hidden fixed inset-y-0 right-0 z-40 shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:z-10 lg:shadow-none lg:border-l lg:border-slate-200 ${!isOpen ? 'lg:w-0 lg:hidden' : ''} ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`;

        const renderMobileHeader = (title) => ( <
            div className = "flex items-center justify-between lg:hidden pb-4 mb-4 border-b border-slate-100" >
            <
            span className = "text-sm font-bold text-slate-800" > { title } < /span> {
            onClose && < button onClick = { onClose }
            className = "p-1 text-slate-400 hover:text-slate-800 rounded-lg" > ✕ < /button>} < /
            div >
        );

        const renderActivityBar = () => {
            const activeMessage = busyMessage || (activity && activity.active ? activity.message : null);
            const latestLog = logs && logs.length > 0 ? (typeof logs[0] === 'object' ? logs[0].desc : logs[0]) : null;
            return ( <
                div className = "h-24 border-t border-slate-100 bg-slate-50 p-3 font-mono text-[10px] text-slate-500 overflow-y-auto shrink-0 shadow-inner" >
                <
                div className = "font-semibold text-slate-400" > System Activity < /div> {
                activeMessage ? ( <
                    div className = "flex items-center gap-2 text-blue-600 mt-1" >
                    <
                    span className = "inline-block w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" / >
                    <
                    span > { activeMessage } < /span> < /
                    div >
                ) : latestLog ? ( <
                    div className = "text-slate-700 mt-1" > { latestLog } < /div>
                ) : < div className = "italic mt-1 text-slate-400" > Ready
                for inputs... < /div>} < /
                div >
            );
        };

        const renderPromptBar = () => ( <
            form onSubmit = { handleSubmit }
            className = "p-3 border-t border-slate-200 bg-white shrink-0" >
            <
            div className = "relative flex items-center bg-slate-50 border border-slate-200 rounded-lg focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all" >
            <
            input type = "file"
            ref = { fileInputRef }
            onChange = { handleFileChange }
            accept = ".pdf,.docx,.txt"
            className = "hidden" / >
            <
            button type = "button"
            onClick = {
                () => fileInputRef.current && fileInputRef.current.click()
            }
            title = "Import Resume"
            className = "pl-3 pr-2 text-slate-400 hover:text-blue-600" > 📎 < /button> <
            input type = "text"
            placeholder = "Ask AI Studio anything..."
            className = "w-full bg-transparent pl-2 pr-10 py-2.5 text-xs text-slate-800 outline-none font-medium"
            value = { promptText }
            onChange = {
                (e) => setPromptText(e.target.value)
            }
            /> <
            button type = "submit"
            className = "absolute right-3 text-blue-600 hover:text-blue-700 font-bold" > ⚡ < /button> < /
            div > <
            /form>
        );

        // 1. Workspace Themes Tool
        if (safeToolKey.includes("THEME")) {
            return ( <
                div className = { panelRootClass } >
                <
                div className = "flex-1 overflow-y-auto p-6 space-y-6" > { renderMobileHeader("Workspace Themes") } <
                div >
                <
                h3 className = "text-xs uppercase font-black tracking-wider text-blue-600" > ⚡Workspace Themes < /h3> <
                p className = "text-[10px] text-slate-500 mt-1" > Select an identity framework to style your live portfolio build. < /p> < /
                div > <
                div className = "space-y-3" > {
                    Object.values(PORTFOLIO_THEMES || {}).map((themeObj) => {
                        const isSelected = userData && userData.theme === themeObj.id;
                        return ( <
                            button key = { themeObj.id }
                            type = "button"
                            onClick = {
                                () => setUserData({...userData, theme: themeObj.id })
                            }
                            className = { `w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-xs font-bold text-left transition-all duration-200 ${
                                        isSelected ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                    }` } >
                            <
                            span > { themeObj.name } < /span> < /
                            button >
                        );
                    })
                } <
                /div> < /
                div > { renderActivityBar() } { renderPromptBar() } <
                /div>
            );
        }

        // 2. Image Customizer Tool
        if (safeToolKey.includes("IMAGE") || safeToolKey.includes("CUSTOMIZER")) {
            return ( <
                div className = { panelRootClass } >
                <
                div className = "flex-1 overflow-y-auto p-6 space-y-6" > { renderMobileHeader("Image Customizer") } <
                div >
                <
                h3 className = "text-xs uppercase font-black tracking-wider text-blue-600" > ⚡Image Customizer < /h3> <
                p className = "text-[10px] text-slate-500 mt-1" > Generate custom mock vector graphics or placeholder backgrounds using Imagen 3. < /p> < /
                div > <
                div className = "bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3" >
                <
                textarea className = "w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 outline-none resize-none h-20 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder = "e.g., A minimalist vector graphic of a laptop..."
                value = { imagePrompt }
                onChange = {
                    (e) => setImagePrompt(e.target.value)
                }
                disabled = { isGeneratingImage }
                /> <
                button type = "button"
                onClick = { handleGenerateImage }
                disabled = { isGeneratingImage || !imagePrompt.trim() }
                className = "w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-bold rounded-lg transition-colors shadow-sm" > { isGeneratingImage ? "🎨 Generating..." : "Generate Asset" } <
                /button> < /
                div >

                {
                    lastGeneratedImage && ( <
                        div className = "space-y-4 animate-fade-in border-t border-slate-100 pt-5" >
                        <
                        div className = "text-[9px] uppercase font-black tracking-widest text-slate-400" > Generated Asset < /div> <
                        div className = "bg-slate-50 p-2 border border-slate-200 rounded-xl shadow-sm" >
                        <
                        img src = { lastGeneratedImage }
                        alt = "Generated Asset"
                        className = "w-full h-auto rounded-lg" / >
                        <
                        /div> <
                        div className = "space-y-2" >
                        <
                        label className = "block text-[9px] uppercase font-black tracking-widest text-slate-400" > Place this image in < /label> <
                        div className = "flex flex-wrap gap-2" > {
                            Object.keys(SECTION_LABELS).map(key => {
                                const exists = imageTargetSections.some(s => (s.section_type || '').toLowerCase().trim() === key);
                                const active = (imageTarget || 'hero') === key;
                                return ( <
                                    button key = { key }
                                    type = "button"
                                    onClick = {
                                        () => setImageTarget(key)
                                    }
                                    className = { `px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                                                    active ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                    : exists ? 'bg-white text-slate-600 border-slate-200 hover:border-blue-500 hover:text-blue-600'
                                                    : 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed'
                                                }` }
                                    title = { exists ? `Place on ${SECTION_LABELS[key]}` : `${SECTION_LABELS[key]} — not on this page` } > { SECTION_LABELS[key] } <
                                    /button>
                                );
                            })
                        } <
                        /div> <
                        p className = "text-[9px] text-slate-500" > Sections not present on this page are disabled. < /p> < /
                        div > <
                        button type = "button"
                        onClick = { applyImageToSection }
                        className = "w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all" >
                        Apply to { SECTION_LABELS[imageTarget] || 'section' } <
                        /button> < /
                        div >
                    )
                } <
                /div> { renderActivityBar() } { renderPromptBar() } < /
                div >
            );
        }

        // 3. Code Export & Deployment Tool
        if (safeToolKey.includes("CODE") || safeToolKey.includes("EXPORT")) {
            return ( <
                div className = { panelRootClass } >
                <
                div className = "flex-1 overflow-y-auto p-6 space-y-6" > { renderMobileHeader("Code Export") } <
                div >
                <
                h3 className = "text-xs uppercase font-black tracking-wider text-blue-600" > ⚡Code Export Shell < /h3> <
                p className = "text-[10px] text-slate-500 mt-1" > Compile your structural template configurations directly into production - ready assets. < /p> < /
                div >

                <
                div className = "bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-[10px] text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner" > { `<!DOCTYPE html>\n<html>\n  <head>\n    \n  </head>\n  <body>\n    \n  </body>\n</html>` } <
                /div>

                <
                div className = "space-y-3" >
                <
                button onClick = { triggerHtmlWebsiteDownload }
                className = "w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all shadow-sm" > 📥Download Standalone HTML <
                /button> <
                button onClick = { triggerPdfDownload }
                className = "w-full py-2.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl transition-all border border-slate-200 shadow-sm" > 📄Download ATS Resume(PDF) <
                /button> <
                button onClick = { triggerDeploy }
                disabled = { deploying }
                className = "w-full py-2.5 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-800 text-xs font-bold rounded-xl transition-all border border-slate-200 shadow-sm" > { deploying ? "🚀 Deploying…" : "🚀 Deploy to Vercel" } <
                /button> < /
                div > <
                /div> { renderActivityBar() } { renderPromptBar() } < /
                div >
            );
        }

        // 4. AI Content Generator Tool
        if (safeToolKey.includes("GENERATOR")) {
            return ( <
                div className = { panelRootClass } >
                <
                div className = "p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0" >
                <
                span className = "text-[10px] text-slate-500 font-bold uppercase tracking-wider" > Current Section < /span> <
                div className = "flex items-center gap-2" >
                <
                span className = "text-[10px] font-mono font-bold px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md" > { currentType.toUpperCase() } <
                /span> {
                onClose && < button onClick = { onClose }
                className = "lg:hidden p-1 text-slate-400 hover:text-slate-800" > ✕ < /button>} < /
                div > <
                /div>

                <
                div className = "flex bg-slate-100 p-1 mx-4 mt-4 rounded-lg text-[10px] font-bold uppercase shrink-0 gap-1" > {
                    ['Generate', 'Improve', 'Design', 'Review'].map(tab => ( <
                        button key = { tab }
                        onClick = {
                            () => setStudioSubTab(tab)
                        }
                        className = { `flex-1 py-2 rounded-md transition-all ${studioSubTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}` } > { tab } <
                        /button>
                    ))
                } <
                /div>

                <
                div className = "flex-1 overflow-y-auto p-4 space-y-4" > {
                    studioSubTab === 'Generate' && ( <
                        div className = "space-y-3" >
                        <
                        div className = "text-[9px] uppercase font-black tracking-widest text-slate-400 mb-2" > Section Blueprints < /div> <
                        button onClick = {
                            () => onSubmitPrompt("COMPLETELY REWRITE AND GENERATE a new professional headline. Return keys: heading (Full Name in uppercase), subheading.", "hero")
                        }
                        className = "w-full p-4 text-left bg-white border border-slate-200 hover:border-blue-500 text-slate-800 text-xs rounded-xl shadow-sm transition-all flex flex-col gap-1.5" >
                        <
                        span className = "font-bold text-blue-600" > ✨Generate Hero Section < /span> <
                        span className = "text-[10px] text-slate-500 font-medium leading-relaxed" > Assembles profile title structures, name fields, and headlines. < /span> < /
                        button > <
                        button onClick = {
                            () => onSubmitPrompt("COMPLETELY REWRITE AND GENERATE a new detailed profile narrative bio paragraph.", "about")
                        }
                        className = "w-full p-4 text-left bg-white border border-slate-200 hover:border-blue-500 text-slate-800 text-xs rounded-xl shadow-sm transition-all flex flex-col gap-1.5" >
                        <
                        span className = "font-bold text-blue-600" > 👤Generate About Me Bio < /span> <
                        span className = "text-[10px] text-slate-500 font-medium leading-relaxed" > Auto - writes deep comprehensive profile summaries. < /span> < /
                        button > <
                        button onClick = {
                            () => onSubmitPrompt("COMPLETELY REWRITE AND GENERATE a full professional item array list of skills. Return array with 'name' and 'level'.", "skills")
                        }
                        className = "w-full p-4 text-left bg-white border border-slate-200 hover:border-blue-500 text-slate-800 text-xs rounded-xl shadow-sm transition-all flex flex-col gap-1.5" >
                        <
                        span className = "font-bold text-blue-600" > 📊Generate Categorized Skills < /span> <
                        span className = "text-[10px] text-slate-500 font-medium leading-relaxed" > Fills metrics charts with specialized capabilities logs. < /span> < /
                        button > <
                        button onClick = {
                            () => onSubmitPrompt("COMPLETELY REWRITE AND GENERATE professional application project items.", "projects_grid")
                        }
                        className = "w-full p-4 text-left bg-white border border-slate-200 hover:border-blue-500 text-slate-800 text-xs rounded-xl shadow-sm transition-all flex flex-col gap-1.5" >
                        <
                        span className = "font-bold text-blue-600" > 🚀Generate Projects Stack < /span> <
                        span className = "text-[10px] text-slate-500 font-medium leading-relaxed" > Populates showcase blocks with clean live project records. < /span> < /
                        button > <
                        button onClick = {
                            () => onSubmitPrompt("COMPLETELY REWRITE AND GENERATE professional academic background metrics.", "education")
                        }
                        className = "w-full p-4 text-left bg-white border border-slate-200 hover:border-blue-500 text-slate-800 text-xs rounded-xl shadow-sm transition-all flex flex-col gap-1.5" >
                        <
                        span className = "font-bold text-blue-600" > 🎓Generate Education < /span> <
                        span className = "text-[10px] text-slate-500 font-medium leading-relaxed" > Fills in degree paths, GPA scores, and institution data. < /span> < /
                        button > <
                        button onClick = {
                            () => onSubmitPrompt("COMPLETELY REWRITE AND GENERATE an inviting call-to-action text block to collaborate.", "contact")
                        }
                        className = "w-full p-4 text-left bg-white border border-slate-200 hover:border-blue-500 text-slate-800 text-xs rounded-xl shadow-sm transition-all flex flex-col gap-1.5" >
                        <
                        span className = "font-bold text-blue-600" > 📧Generate Contact CTA < /span> <
                        span className = "text-[10px] text-slate-500 font-medium leading-relaxed" > Auto - drafts recruiter outreach prompts. < /span> < /
                        button > <
                        /div>
                    )
                }

                {
                    studioSubTab === 'Improve' && ( <
                        div className = "space-y-6" >
                        <
                        div className = "space-y-3" >
                        <
                        div className = "text-[9px] uppercase font-black tracking-widest text-slate-400" > Content Enhancement < /div> <
                        div className = "grid grid-cols-2 gap-3" >
                        <
                        button onClick = {
                            () => onSubmitPrompt(`Analyze and auto-inject relevant industry tech stack tags for "${currentType}".`, currentType)
                        }
                        className = "p-3 bg-white border border-slate-200 hover:border-blue-500 text-slate-700 text-[10px] font-bold rounded-xl shadow-sm transition-all text-center flex flex-col items-center justify-center gap-1" >
                        <
                        span className = "text-sm" > 🔍 < /span> ATS Optimization < /
                        button > <
                        button onClick = {
                            () => onSubmitPrompt(`Convert generic tasks into metrics-driven statements for "${currentType}".`, currentType)
                        }
                        className = "p-3 bg-white border border-slate-200 hover:border-blue-500 text-slate-700 text-[10px] font-bold rounded-xl shadow-sm transition-all text-center flex flex-col items-center justify-center gap-1" >
                        <
                        span className = "text-sm" > 📊 < /span> Impact Quantifier < /
                        button > <
                        /div> < /
                        div > <
                        div className = "space-y-3" >
                        <
                        div className = "text-[9px] uppercase font-black tracking-widest text-slate-400" > Summaries & Sync < /div> <
                        div className = "grid grid-cols-2 gap-3" >
                        <
                        button onClick = {
                            () => onSubmitPrompt(`Synthesize canvas sections into a 3-sentence executive summary.`, currentType)
                        }
                        className = "p-3 bg-white border border-slate-200 hover:border-blue-500 text-slate-700 text-[10px] font-bold rounded-xl shadow-sm transition-all text-center flex flex-col items-center justify-center gap-1" >
                        <
                        span className = "text-sm" > 📝 < /span> Resume Summary < /
                        button > <
                        button onClick = {
                            () => onSubmitPrompt(`Auto-populate project cards from public GitHub API URLs for "${currentType}".`, currentType)
                        }
                        className = "p-3 bg-white border border-slate-200 hover:border-blue-500 text-slate-700 text-[10px] font-bold rounded-xl shadow-sm transition-all text-center flex flex-col items-center justify-center gap-1" >
                        <
                        span className = "text-sm" > 🐙 < /span> Code Sync < /
                        button > <
                        /div> < /
                        div > <
                        div className = "space-y-3" >
                        <
                        div className = "text-[9px] uppercase font-black tracking-widest text-slate-400" > Structural Utilities < /div> <
                        div className = "grid grid-cols-2 gap-3" >
                        <
                        button onClick = {
                            () => onSubmitPrompt(`Compress and shorten text structures for "${currentType}".`, currentType)
                        }
                        className = "p-3 bg-white border border-slate-200 hover:border-blue-500 text-slate-700 text-[10px] font-bold rounded-xl shadow-sm transition-all text-center flex flex-col items-center justify-center gap-1" >
                        <
                        span className = "text-sm" > ✂️ < /span> Shorten Text < /
                        button > <
                        button onClick = {
                            () => onSubmitPrompt(`Expand details and add technical metrics depth for "${currentType}".`, currentType)
                        }
                        className = "p-3 bg-white border border-slate-200 hover:border-blue-500 text-slate-700 text-[10px] font-bold rounded-xl shadow-sm transition-all text-center flex flex-col items-center justify-center gap-1" >
                        <
                        span className = "text-sm" > 📈 < /span> Expand Scope < /
                        button > <
                        /div> < /
                        div > <
                        /div>
                    )
                }

                {
                    studioSubTab === 'Design' && ( <
                        div className = "space-y-6" >
                        <
                        div className = "text-[9px] uppercase font-black tracking-widest text-slate-400 mb-2" > Section Design & Layout < /div>

                        <
                        div className = "space-y-2" >
                        <
                        div className = "text-[9px] uppercase font-black tracking-widest text-slate-400" > Grid Layout < /div> <
                        div className = "grid grid-cols-3 gap-2" >
                        <
                        button type = "button"
                        onClick = {
                            () => onSubmitPrompt(`Set grid layout to 2 Columns for this section type "${currentType}".`, currentType)
                        }
                        className = "py-2 bg-white border border-slate-200 hover:border-blue-500 text-slate-600 text-[10px] font-bold rounded-lg transition-all shadow-sm" >
                        2 Columns <
                        /button> <
                        button type = "button"
                        onClick = {
                            () => onSubmitPrompt(`Set grid layout to 3 Columns for this section type "${currentType}".`, currentType)
                        }
                        className = "py-2 bg-white border border-slate-200 hover:border-blue-500 text-slate-600 text-[10px] font-bold rounded-lg transition-all shadow-sm" >
                        3 Columns <
                        /button> <
                        button type = "button"
                        onClick = {
                            () => onSubmitPrompt(`Set grid layout to Full-Width List for this section type "${currentType}".`, currentType)
                        }
                        className = "py-2 bg-white border border-slate-200 hover:border-blue-500 text-slate-600 text-[10px] font-bold rounded-lg transition-all shadow-sm" >
                        List View <
                        /button> < /
                        div > <
                        /div>

                        {
                            currentType === 'projects_grid' && ( <
                                div className = "space-y-2" >
                                <
                                div className = "text-[9px] uppercase font-black tracking-widest text-slate-400" > Projects Grid Style < /div> <
                                div className = "grid grid-cols-2 gap-2" >
                                <
                                button type = "button"
                                onClick = {
                                    () => onSubmitPrompt(`Switch projects grid to 2 Columns for section type "${currentType}".`, currentType)
                                }
                                className = "py-2 bg-white border border-slate-200 hover:border-blue-500 text-slate-600 text-[10px] font-bold rounded-lg transition-all shadow-sm" > ✓2 Columns <
                                /button> <
                                button type = "button"
                                onClick = {
                                    () => onSubmitPrompt(`Switch projects grid to Full-Width List for section type "${currentType}".`, currentType)
                                }
                                className = "py-2 bg-white border border-slate-200 hover:border-blue-500 text-slate-600 text-[10px] font-bold rounded-lg transition-all shadow-sm" > ✓List View <
                                /button> < /
                                div > <
                                /div>
                            )
                        }

                        {
                            currentType === 'skills' && ( <
                                div className = "space-y-2" >
                                <
                                div className = "text-[9px] uppercase font-black tracking-widest text-slate-400" > Skills Grid Style < /div> <
                                div className = "grid grid-cols-2 gap-2" >
                                <
                                button type = "button"
                                onClick = {
                                    () => onSubmitPrompt(`Switch skills grid to Progress Bars for section type "${currentType}".`, currentType)
                                }
                                className = "py-2 bg-white border border-slate-200 hover:border-blue-500 text-slate-600 text-[10px] font-bold rounded-lg transition-all shadow-sm" > ✓Progress Bars <
                                /button> <
                                button type = "button"
                                onClick = {
                                    () => onSubmitPrompt(`Switch skills grid to Pill Badges for section type "${currentType}".`, currentType)
                                }
                                className = "py-2 bg-white border border-slate-200 hover:border-blue-500 text-slate-600 text-[10px] font-bold rounded-lg transition-all shadow-sm" > ✓Pill Badges <
                                /button> < /
                                div > <
                                /div>
                            )
                        }

                        <
                        div className = "space-y-2" >
                        <
                        div className = "text-[9px] uppercase font-black tracking-widest text-slate-400" > Visual Effects < /div> <
                        div className = "grid grid-cols-2 gap-2" >
                        <
                        button type = "button"
                        onClick = {
                            () => onSubmitPrompt(`Toggle border glow for this section type "${currentType}".`, currentType)
                        }
                        className = "py-2 bg-white border border-slate-200 hover:border-blue-500 text-slate-600 text-[10px] font-bold rounded-lg transition-all shadow-sm" > 🌟Border Glow <
                        /button> <
                        button type = "button"
                        onClick = {
                            () => onSubmitPrompt(`Toggle glassmorphism backdrop blur for this section type "${currentType}".`, currentType)
                        }
                        className = "py-2 bg-white border border-slate-200 hover:border-blue-500 text-slate-600 text-[10px] font-bold rounded-lg transition-all shadow-sm" > 🌫️Glassmorphism <
                        /button> < /
                        div > <
                        /div>

                        <
                        div className = "space-y-2" >
                        <
                        div className = "text-[9px] uppercase font-black tracking-widest text-slate-400" > Accent Color < /div> <
                        div className = "relative" >
                        <
                        input type = "color"
                        name = "accentColor"
                        className = "w-24 h-10 p-0 border-0 rounded cursor-pointer bg-transparent"
                        value = "#3b82f6" / >
                        <
                        span className = "absolute left-28 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-semibold" > Accent < /span> < /
                        div > <
                        /div> < /
                        div >
                    )
                }

                {
                    studioSubTab === 'Review' && ( <
                        div className = "space-y-5" >
                        <
                        div className = "text-[9px] uppercase font-black tracking-widest text-slate-400" > Real - Time Canvas Review < /div> {
                        loadingReview ? ( <
                            div className = "space-y-4 animate-pulse" >
                            <
                            div className = "p-5 bg-white border border-slate-200 rounded-xl space-y-3" >
                            <
                            div className = "w-2/3 h-3 bg-slate-200 rounded" / >
                            <
                            div className = "w-full h-2 bg-slate-100 rounded-full" > < div className = "h-full w-1/3 bg-blue-200 rounded-full" / > < /div> < /
                            div > <
                            div className = "p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3" >
                            <
                            div className = "w-1/2 h-3 bg-slate-200 rounded" / >
                            <
                            div className = "w-full h-2 bg-slate-200 rounded" / >
                            <
                            div className = "w-5/6 h-2 bg-slate-200 rounded" / >
                            <
                            /div> <
                            p className = "text-center text-[10px] text-slate-400 italic mt-6" > Running portfolio score calculation... < /p> < /
                            div >
                        ) : reviewData ? ( <
                            div className = "space-y-5" >
                            <
                            div className = "p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3" >
                            <
                            div className = "flex justify-between items-center text-sm font-bold" >
                            <
                            span className = "text-slate-700" > Holistic Score < /span> <
                            span className = "text-blue-600 font-mono text-base" > { reviewData.overall_score } % < /span> < /
                            div > <
                            div className = "w-full h-2 bg-slate-100 rounded-full overflow-hidden" >
                            <
                            div className = "h-full bg-blue-500 transition-all duration-500"
                            style = {
                                { width: `${reviewData.overall_score}%` }
                            } > < /div> < /
                            div > <
                            /div> {
                            reviewData.missing_items && reviewData.missing_items.length > 0 && ( <
                                div className = "space-y-2" >
                                <
                                div className = "text-[9px] uppercase font-black text-slate-400 tracking-wider" > Missing Variables < /div> <
                                div className = "bg-red-50 border border-red-100 p-4 rounded-xl space-y-2" > {
                                    reviewData.missing_items.map((item, idx) => ( <
                                        div key = { idx }
                                        className = "text-xs text-red-600 font-medium flex items-center gap-2" >
                                        <
                                        span > ⚠️ < /span> Missing: {item} < /
                                        div >
                                    ))
                                } <
                                /div> < /
                                div >
                            )
                        } <
                        div className = "space-y-2" >
                        <
                        div className = "text-[9px] uppercase font-black text-slate-400 tracking-wider" > AI Suggestions < /div> <
                        div className = "space-y-2" > {
                            reviewData.suggestions.map((suggestion, idx) => ( <
                                div key = { idx }
                                className = "bg-white p-3.5 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed shadow-sm flex items-start gap-2" >
                                <
                                span className = "mt-0.5" > 💡 < /span> <span>{suggestion}</span >
                                <
                                /div>
                            ))
                        } <
                        /div> < /
                        div > <
                        /div>
                    ): ( <
                        div className = "text-center py-8 text-xs text-slate-500 italic" > No analysis payload returned from endpoint. < /div>
                    )
                } <
                /div>
            )
        } <
        /div> { renderActivityBar() } { renderPromptBar() } < /
        div >
    );
}

// 5. Default view: Manual Property Editor
return ( <
        div className = { panelRootClass } >
        <
        div className = "p-5 border-b border-slate-200 space-y-5 flex-1 overflow-y-auto bg-white" > { renderMobileHeader("Property Editor") } <
        div className = "flex items-start justify-between gap-3" >
        <
        div >
        <
        h3 className = "text-xs uppercase font-black tracking-wider text-slate-800" > 📝Property Editor < /h3> <
        p className = "text-[10px] text-slate-500 mt-1 leading-relaxed" > Direct manual editor mode.Select any element card inside the canvas to edit text by hand. < /p> < /
        div > {
            selectedSection && onDeleteSection && ( <
                button type = "button"
                onClick = {
                    () => onDeleteSection(selectedSection.id)
                }
                className = "shrink-0 text-[10px] font-bold text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg px-2.5 py-1.5 transition-colors"
                title = "Delete this section" > 🗑Delete <
                /button>
            )
        } <
        /div>

        <
        div className = "flex items-center gap-2 p-1 bg-slate-50 border border-slate-200 rounded-lg" >
        <
        button type = "button"
        onClick = { onUndo }
        title = "Undo (Ctrl+Z)"
        className = "px-3 py-1.5 text-[10px] font-bold text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors" > ↩Undo <
        /button> <
        button type = "button"
        onClick = { onRedo }
        title = "Redo (Ctrl+Shift+Z)"
        className = "px-3 py-1.5 text-[10px] font-bold text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors" > ↪Redo <
        /button> <
        span className = { `ml-auto mr-3 text-[9px] font-bold uppercase tracking-wider ${saveState === 'saved' ? 'text-emerald-500' : saveState === 'saving' ? 'text-slate-400' : 'text-slate-400'}` }
        aria - live = "polite" > { saveState === 'saved' ? '✓ Saved' : saveState === 'saving' ? 'Saving…' : '' } <
        /span> < /
        div >

        {!selectedSection ? ( <
                div className = "bg-slate-50 border border-dashed border-slate-300 rounded-xl p-6 text-center" >
                <
                p className = "text-xs text-slate-500 font-medium" > Click on any section card block in the center canvas to inspect its properties. < /p> < /
                div >
            ) : ( <
                div className = "space-y-5" >
                <
                div className = "inline-block text-[10px] uppercase font-bold tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md" >
                Editing Target: { currentType } <
                /div>

                {
                    currentType === 'hero' && ( <
                        div className = "space-y-4 pt-2 border-t border-slate-100" >
                        <
                        div className = "space-y-1.5" >
                        <
                        label className = "text-[10px] uppercase tracking-wider font-bold text-slate-500" > LinkedIn URL(See Live menu) < /label> <
                        input type = "text"
                        placeholder = "https://linkedin.com/in/..."
                        className = "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-sm"
                        value = { localContent.linkedin || '' }
                        onChange = {
                            (e) => handleFieldChange('linkedin', e.target.value)
                        }
                        /> < /
                        div > <
                        div className = "space-y-1.5" >
                        <
                        label className = "text-[10px] uppercase tracking-wider font-bold text-slate-500" > GitHub URL(See Live menu) < /label> <
                        input type = "text"
                        placeholder = "https://github.com/..."
                        className = "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-sm"
                        value = { localContent.github || '' }
                        onChange = {
                            (e) => handleFieldChange('github', e.target.value)
                        }
                        /> < /
                        div > <
                        /div>
                    )
                }

                {
                    currentType === 'about' && ( <
                        div className = "pt-2 border-t border-slate-100" >
                        <
                        p className = "text-[10px] text-slate-500 italic bg-slate-50 p-4 rounded-xl border border-slate-100" > Biography is edited directly on canvas via inline text editing.Double - click the text on the canvas to begin. < /p> < /
                        div >
                    )
                }

                {
                    currentType === 'education' && ( <
                        div className = "space-y-4 pt-2 border-t border-slate-100" > {
                            (localContent.schools || []).map((school, idx) => ( <
                                div key = { idx }
                                className = "bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-3 shadow-sm" >
                                <
                                input type = "text"
                                placeholder = "Institution"
                                className = "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                                value = { school.institution || '' }
                                onChange = {
                                    (e) => handleArrayItemChange('schools', idx, 'institution', e.target.value)
                                }
                                /> <
                                input type = "text"
                                placeholder = "Degree / Major"
                                className = "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 outline-none focus:border-blue-500"
                                value = { school.degree || '' }
                                onChange = {
                                    (e) => handleArrayItemChange('schools', idx, 'degree', e.target.value)
                                }
                                /> <
                                div className = "grid grid-cols-2 gap-3" >
                                <
                                input type = "text"
                                placeholder = "Years"
                                className = "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px] text-slate-600 outline-none focus:border-blue-500"
                                value = { school.years || '' }
                                onChange = {
                                    (e) => handleArrayItemChange('schools', idx, 'years', e.target.value)
                                }
                                /> <
                                input type = "text"
                                placeholder = "Score / GPA"
                                className = "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px] text-slate-600 outline-none focus:border-blue-500"
                                value = { school.score || '' }
                                onChange = {
                                    (e) => handleArrayItemChange('schools', idx, 'score', e.target.value)
                                }
                                /> < /
                                div > <
                                /div>
                            ))
                        } <
                        /div>
                    )
                }

                {
                    currentType === 'skills' && ( <
                        div className = "space-y-4 pt-2 border-t border-slate-100" > {
                            (localContent.items || []).map((skill, idx) => ( <
                                div key = { idx }
                                className = "bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-3 shadow-sm" >
                                <
                                input type = "text"
                                placeholder = "Skill Name"
                                className = "w-full bg-transparent border-b border-slate-300 focus:border-blue-500 pb-1 text-xs font-bold text-slate-800 outline-none"
                                value = { skill.name || '' }
                                onChange = {
                                    (e) => handleArrayItemChange('items', idx, 'name', e.target.value)
                                }
                                /> <
                                div className = "flex items-center gap-3 pt-2" >
                                <
                                input type = "range"
                                min = "1"
                                max = "100"
                                className = "flex-1 accent-blue-600 h-1.5"
                                value = { skill.level || 50 }
                                onChange = {
                                    (e) => handleArrayItemChange('items', idx, 'level', parseInt(e.target.value))
                                }
                                /> <
                                span className = "text-[10px] font-bold text-blue-600 w-8 text-right bg-blue-50 px-1.5 py-0.5 rounded" > { skill.level } % < /span> < /
                                div > <
                                /div>
                            ))
                        } <
                        /div>
                    )
                }

                {
                    currentType === 'projects_grid' && ( <
                            div className = "space-y-5 pt-2 border-t border-slate-100" >
                            <
                            div className = "space-y-2" >
                            <
                            label className = "text-[10px] uppercase tracking-wider font-bold text-slate-500" > GitHub Import < /label> <
                            div className = "flex items-center gap-2" >
                            <
                            input type = "text"
                            className = "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 outline-none shadow-sm"
                            value = { githubUsername }
                            onChange = {
                                (e) => setGithubUsername(e.target.value)
                            }
                            onKeyDown = {
                                (e) => e.key === 'Enter' && handleGithubImport()
                            }
                            placeholder = "GitHub username to sync..."
                            aria - label = "GitHub username" / >
                            <
                            button type = "button"
                            disabled = { isImportingGithub }
                            onClick = { handleGithubImport }
                            className = "shrink-0 px-4 py-2 bg-slate-800 rounded-lg text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-50 transition-all shadow-sm" > { isImportingGithub ? 'Syncing…' : '🐙 Sync' } <
                            /button> < /
                            div > <
                            /div> <
                            div className = "space-y-2" >
                            <
                            label className = "text-[10px] uppercase tracking-wider font-bold text-slate-500" > Grid Title < /label> <
                            input type = "text"
                            className = "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 outline-none shadow-sm"
                            value = { localContent.title || '' }
                            onChange = {
                                (e) => handleFieldChange('title', e.target.value)
                            }
                            placeholder = "Section Title..." / >
                            <
                            /div> <
                            div className = "space-y-3" >
                            <
                            label className = "text-[10px] uppercase tracking-wider font-bold text-slate-500" > Projects Array < /label> {
                            (localContent.projects || []).map((project, idx) => ( <
                                div key = { idx }
                                className = "bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-3 shadow-sm" >
                                <
                                input type = "text"
                                placeholder = "Project Title"
                                className = "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                                value = { project.title || '' }
                                onChange = {
                                    (e) => handleArrayItemChange('projects', idx, 'title', e.target.value)
                                }
                                /> <
                                textarea rows = "3"
                                placeholder = "Project Description"
                                className = "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px] text-slate-600 outline-none resize-none focus:border-blue-500"
                                value = { project.desc || '' }
                                onChange = {
                                    (e) => handleArrayItemChange('projects', idx, 'desc', e.target.value)
                                }
                                /> <
                                input type = "text"
                                placeholder = "Live URL Link Target..."
                                className = "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px] text-blue-600 outline-none focus:border-blue-500"
                                value = { project.projectUrl || '' }
                                onChange = {
                                    (e) => handleArrayItemChange('projects', idx, 'projectUrl', e.target.value)
                                }
                                /> < /
                                div >
                            ))
                        } <
                        /div> < /
                        div >
                )
            }

            {
                currentType === 'contact' && ( <
                    div className = "space-y-5 pt-2 border-t border-slate-100" >
                    <
                    div className = "space-y-1.5" >
                    <
                    label className = "text-[10px] uppercase tracking-wider font-bold text-slate-500" > Call to action line text < /label> <
                    textarea rows = "3"
                    className = "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 outline-none resize-none leading-relaxed shadow-sm"
                    value = { localContent.text || '' }
                    onChange = {
                        (e) => handleFieldChange('text', e.target.value)
                    }
                    /> < /
                    div > <
                    div className = "grid grid-cols-1 gap-3 border-t border-slate-100 pt-3" >
                    <
                    div className = "grid grid-cols-2 gap-3" >
                    <
                    div className = "space-y-1.5" >
                    <
                    label className = "text-[10px] uppercase tracking-wider font-bold text-slate-500" > Email < /label> <
                    input type = "text"
                    placeholder = "you@example.com"
                    className = "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px] text-slate-800 focus:border-blue-500 outline-none shadow-sm"
                    value = { localContent.email || '' }
                    onChange = {
                        (e) => handleFieldChange('email', e.target.value)
                    }
                    /> < /
                    div > <
                    div className = "space-y-1.5" >
                    <
                    label className = "text-[10px] uppercase tracking-wider font-bold text-slate-500" > Phone < /label> <
                    input type = "text"
                    placeholder = "+1 (555) 000-0000"
                    className = "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px] text-slate-800 focus:border-blue-500 outline-none shadow-sm"
                    value = { localContent.phone || '' }
                    onChange = {
                        (e) => handleFieldChange('phone', e.target.value)
                    }
                    /> < /
                    div > <
                    /div> <
                    div className = "grid grid-cols-2 gap-3" >
                    <
                    div className = "space-y-1.5" >
                    <
                    label className = "text-[10px] uppercase tracking-wider font-bold text-slate-500" > LinkedIn URL < /label> <
                    input type = "text"
                    placeholder = "https://linkedin.com/in/..."
                    className = "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px] text-slate-800 focus:border-blue-500 outline-none shadow-sm"
                    value = { localContent.linkedin || '' }
                    onChange = {
                        (e) => handleFieldChange('linkedin', e.target.value)
                    }
                    /> < /
                    div > <
                    div className = "space-y-1.5" >
                    <
                    label className = "text-[10px] uppercase tracking-wider font-bold text-slate-500" > GitHub URL < /label> <
                    input type = "text"
                    placeholder = "https://github.com/..."
                    className = "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px] text-slate-800 focus:border-blue-500 outline-none shadow-sm"
                    value = { localContent.github || '' }
                    onChange = {
                        (e) => handleFieldChange('github', e.target.value)
                    }
                    /> < /
                    div > <
                    /div> < /
                    div > <
                    /div>
                )
            } <
            /div>
        )
    } <
    /div> { renderActivityBar() } { renderPromptBar() } < /
    div >
);
} <
div className = "text-[9px] uppercase font-black text-slate-400 tracking-wider" > Missing Variables < /div> <
div className = "bg-red-50 border border-red-100 p-4 rounded-xl space-y-2" > {
        reviewData.missing_items.map((item, idx) => ( <
            div key = { idx }
            className = "text-xs text-red-600 font-medium flex items-center gap-2" >
            <
            span > ⚠️ < /span> Missing: {item} < /
            div >
        ))
    } <
    /div> < /
    div >
)
} <
div className = "space-y-2" >
    <
    div className = "text-[9px] uppercase font-black text-slate-400 tracking-wider" > AI Suggestions < /div> <
div className = "space-y-2" > {
        reviewData.suggestions.map((suggestion, idx) => ( <
            div key = { idx }
            className = "bg-white p-3.5 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed shadow-sm flex items-start gap-2" >
            <
            span className = "mt-0.5" > 💡 < /span> <span>{suggestion}</span >
            <
            /div>
        ))
    } <
    /div> < /
    div > <
    /div>
): ( <
    div className = "text-center py-8 text-xs text-slate-500 italic" > No analysis payload returned from endpoint. < /div>
)
} <
/div>
)
} <
/div> { renderActivityBar() } { renderPromptBar() } < /
div >
);
}

// 5. Default view: Manual Property Editor
return ( <
        div className = { panelRootClass } >
        <
        div className = "p-5 border-b border-slate-200 space-y-5 flex-1 overflow-y-auto bg-white" > { renderMobileHeader("Property Editor") } <
        div className = "flex items-start justify-between gap-3" >
        <
        div >
        <
        h3 className = "text-xs uppercase font-black tracking-wider text-slate-800" > 📝Property Editor < /h3> <
        p className = "text-[10px] text-slate-500 mt-1 leading-relaxed" > Direct manual editor mode.Select any element card inside the canvas to edit text by hand. < /p> < /
        div > {
            selectedSection && onDeleteSection && ( <
                button type = "button"
                onClick = {
                    () => onDeleteSection(selectedSection.id)
                }
                className = "shrink-0 text-[10px] font-bold text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg px-2.5 py-1.5 transition-colors"
                title = "Delete this section" > 🗑Delete <
                /button>
            )
        } <
        /div>

        <
        div className = "flex items-center gap-2 p-1 bg-slate-50 border border-slate-200 rounded-lg" >
        <
        button type = "button"
        onClick = { onUndo }
        title = "Undo (Ctrl+Z)"
        className = "px-3 py-1.5 text-[10px] font-bold text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors" > ↩Undo <
        /button> <
        button type = "button"
        onClick = { onRedo }
        title = "Redo (Ctrl+Shift+Z)"
        className = "px-3 py-1.5 text-[10px] font-bold text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors" > ↪Redo <
        /button> <
        span className = { `ml-auto mr-3 text-[9px] font-bold uppercase tracking-wider ${saveState === 'saved' ? 'text-emerald-500' : saveState === 'saving' ? 'text-slate-400' : 'text-slate-400'}` }
        aria - live = "polite" > { saveState === 'saved' ? '✓ Saved' : saveState === 'saving' ? 'Saving…' : '' } <
        /span> < /
        div >

        {!selectedSection ? ( <
                div className = "bg-slate-50 border border-dashed border-slate-300 rounded-xl p-6 text-center" >
                <
                p className = "text-xs text-slate-500 font-medium" > Click on any section card block in the center canvas to inspect its properties. < /p> < /
                div >
            ) : ( <
                div className = "space-y-5" >
                <
                div className = "inline-block text-[10px] uppercase font-bold tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md" >
                Editing Target: { currentType } <
                /div>

                {
                    currentType === 'hero' && ( <
                        div className = "space-y-4 pt-2 border-t border-slate-100" >
                        <
                        div className = "space-y-1.5" >
                        <
                        label className = "text-[10px] uppercase tracking-wider font-bold text-slate-500" > LinkedIn URL(See Live menu) < /label> <
                        input type = "text"
                        placeholder = "https://linkedin.com/in/..."
                        className = "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-sm"
                        value = { localContent.linkedin || '' }
                        onChange = {
                            (e) => handleFieldChange('linkedin', e.target.value)
                        }
                        /> < /
                        div > <
                        div className = "space-y-1.5" >
                        <
                        label className = "text-[10px] uppercase tracking-wider font-bold text-slate-500" > GitHub URL(See Live menu) < /label> <
                        input type = "text"
                        placeholder = "https://github.com/..."
                        className = "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-sm"
                        value = { localContent.github || '' }
                        onChange = {
                            (e) => handleFieldChange('github', e.target.value)
                        }
                        /> < /
                        div > <
                        /div>
                    )
                }

                {
                    currentType === 'about' && ( <
                        div className = "pt-2 border-t border-slate-100" >
                        <
                        p className = "text-[10px] text-slate-500 italic bg-slate-50 p-4 rounded-xl border border-slate-100" > Biography is edited directly on canvas via inline text editing.Double - click the text on the canvas to begin. < /p> < /
                        div >
                    )
                }

                {
                    currentType === 'education' && ( <
                        div className = "space-y-4 pt-2 border-t border-slate-100" > {
                            (localContent.schools || []).map((school, idx) => ( <
                                div key = { idx }
                                className = "bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-3 shadow-sm" >
                                <
                                input type = "text"
                                placeholder = "Institution"
                                className = "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                                value = { school.institution || '' }
                                onChange = {
                                    (e) => handleArrayItemChange('schools', idx, 'institution', e.target.value)
                                }
                                /> <
                                input type = "text"
                                placeholder = "Degree / Major"
                                className = "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 outline-none focus:border-blue-500"
                                value = { school.degree || '' }
                                onChange = {
                                    (e) => handleArrayItemChange('schools', idx, 'degree', e.target.value)
                                }
                                /> <
                                div className = "grid grid-cols-2 gap-3" >
                                <
                                input type = "text"
                                placeholder = "Years"
                                className = "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px] text-slate-600 outline-none focus:border-blue-500"
                                value = { school.years || '' }
                                onChange = {
                                    (e) => handleArrayItemChange('schools', idx, 'years', e.target.value)
                                }
                                /> <
                                input type = "text"
                                placeholder = "Score / GPA"
                                className = "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px] text-slate-600 outline-none focus:border-blue-500"
                                value = { school.score || '' }
                                onChange = {
                                    (e) => handleArrayItemChange('schools', idx, 'score', e.target.value)
                                }
                                /> < /
                                div > <
                                /div>
                            ))
                        } <
                        /div>
                    )
                }

                {
                    currentType === 'skills' && ( <
                        div className = "space-y-4 pt-2 border-t border-slate-100" > {
                            (localContent.items || []).map((skill, idx) => ( <
                                div key = { idx }
                                className = "bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-3 shadow-sm" >
                                <
                                input type = "text"
                                placeholder = "Skill Name"
                                className = "w-full bg-transparent border-b border-slate-300 focus:border-blue-500 pb-1 text-xs font-bold text-slate-800 outline-none"
                                value = { skill.name || '' }
                                onChange = {
                                    (e) => handleArrayItemChange('items', idx, 'name', e.target.value)
                                }
                                /> <
                                div className = "flex items-center gap-3 pt-2" >
                                <
                                input type = "range"
                                min = "1"
                                max = "100"
                                className = "flex-1 accent-blue-600 h-1.5"
                                value = { skill.level || 50 }
                                onChange = {
                                    (e) => handleArrayItemChange('items', idx, 'level', parseInt(e.target.value))
                                }
                                /> <
                                span className = "text-[10px] font-bold text-blue-600 w-8 text-right bg-blue-50 px-1.5 py-0.5 rounded" > { skill.level } % < /span> < /
                                div > <
                                /div>
                            ))
                        } <
                        /div>
                    )
                }

                {
                    currentType === 'projects_grid' && ( <
                            div className = "space-y-5 pt-2 border-t border-slate-100" >
                            <
                            div className = "space-y-2" >
                            <
                            label className = "text-[10px] uppercase tracking-wider font-bold text-slate-500" > GitHub Import < /label> <
                            div className = "flex items-center gap-2" >
                            <
                            input type = "text"
                            className = "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 outline-none shadow-sm"
                            value = { githubUsername }
                            onChange = {
                                (e) => setGithubUsername(e.target.value)
                            }
                            onKeyDown = {
                                (e) => e.key === 'Enter' && handleGithubImport()
                            }
                            placeholder = "GitHub username to sync..."
                            aria - label = "GitHub username" / >
                            <
                            button type = "button"
                            disabled = { isImportingGithub }
                            onClick = { handleGithubImport }
                            className = "shrink-0 px-4 py-2 bg-slate-800 rounded-lg text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-50 transition-all shadow-sm" > { isImportingGithub ? 'Syncing…' : '🐙 Sync' } <
                            /button> < /
                            div > <
                            /div> <
                            div className = "space-y-2" >
                            <
                            label className = "text-[10px] uppercase tracking-wider font-bold text-slate-500" > Grid Title < /label> <
                            input type = "text"
                            className = "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 outline-none shadow-sm"
                            value = { localContent.title || '' }
                            onChange = {
                                (e) => handleFieldChange('title', e.target.value)
                            }
                            placeholder = "Section Title..." / >
                            <
                            /div> <
                            div className = "space-y-3" >
                            <
                            label className = "text-[10px] uppercase tracking-wider font-bold text-slate-500" > Projects Array < /label> {
                            (localContent.projects || []).map((project, idx) => ( <
                                div key = { idx }
                                className = "bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-3 shadow-sm" >
                                <
                                input type = "text"
                                placeholder = "Project Title"
                                className = "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                                value = { project.title || '' }
                                onChange = {
                                    (e) => handleArrayItemChange('projects', idx, 'title', e.target.value)
                                }
                                /> <
                                textarea rows = "3"
                                placeholder = "Project Description"
                                className = "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px] text-slate-600 outline-none resize-none focus:border-blue-500"
                                value = { project.desc || '' }
                                onChange = {
                                    (e) => handleArrayItemChange('projects', idx, 'desc', e.target.value)
                                }
                                /> <
                                input type = "text"
                                placeholder = "Live URL Link Target..."
                                className = "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px] text-blue-600 outline-none focus:border-blue-500"
                                value = { project.projectUrl || '' }
                                onChange = {
                                    (e) => handleArrayItemChange('projects', idx, 'projectUrl', e.target.value)
                                }
                                /> < /
                                div >
                            ))
                        } <
                        /div> < /
                        div >
                )
            }

            {
                currentType === 'contact' && ( <
                    div className = "space-y-5 pt-2 border-t border-slate-100" >
                    <
                    div className = "space-y-1.5" >
                    <
                    label className = "text-[10px] uppercase tracking-wider font-bold text-slate-500" > Call to action line text < /label> <
                    textarea rows = "3"
                    className = "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 outline-none resize-none leading-relaxed shadow-sm"
                    value = { localContent.text || '' }
                    onChange = {
                        (e) => handleFieldChange('text', e.target.value)
                    }
                    /> < /
                    div > <
                    div className = "grid grid-cols-1 gap-3 border-t border-slate-100 pt-3" >
                    <
                    div className = "grid grid-cols-2 gap-3" >
                    <
                    div className = "space-y-1.5" >
                    <
                    label className = "text-[10px] uppercase tracking-wider font-bold text-slate-500" > Email < /label> <
                    input type = "text"
                    placeholder = "you@example.com"
                    className = "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px] text-slate-800 focus:border-blue-500 outline-none shadow-sm"
                    value = { localContent.email || '' }
                    onChange = {
                        (e) => handleFieldChange('email', e.target.value)
                    }
                    /> < /
                    div > <
                    div className = "space-y-1.5" >
                    <
                    label className = "text-[10px] uppercase tracking-wider font-bold text-slate-500" > Phone < /label> <
                    input type = "text"
                    placeholder = "+1 (555) 000-0000"
                    className = "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px] text-slate-800 focus:border-blue-500 outline-none shadow-sm"
                    value = { localContent.phone || '' }
                    onChange = {
                        (e) => handleFieldChange('phone', e.target.value)
                    }
                    /> < /
                    div > <
                    /div> <
                    div className = "grid grid-cols-2 gap-3" >
                    <
                    div className = "space-y-1.5" >
                    <
                    label className = "text-[10px] uppercase tracking-wider font-bold text-slate-500" > LinkedIn URL < /label> <
                    input type = "text"
                    placeholder = "https://linkedin.com/in/..."
                    className = "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px] text-slate-800 focus:border-blue-500 outline-none shadow-sm"
                    value = { localContent.linkedin || '' }
                    onChange = {
                        (e) => handleFieldChange('linkedin', e.target.value)
                    }
                    /> < /
                    div > <
                    div className = "space-y-1.5" >
                    <
                    label className = "text-[10px] uppercase tracking-wider font-bold text-slate-500" > GitHub URL < /label> <
                    input type = "text"
                    placeholder = "https://github.com/..."
                    className = "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px] text-slate-800 focus:border-blue-500 outline-none shadow-sm"
                    value = { localContent.github || '' }
                    onChange = {
                        (e) => handleFieldChange('github', e.target.value)
                    }
                    /> < /
                    div > <
                    /div> < /
                    div > <
                    /div>
                )
            } <
            /div>
        )
    } <
    /div> { renderActivityBar() } { renderPromptBar() } < /
    div >
);
}