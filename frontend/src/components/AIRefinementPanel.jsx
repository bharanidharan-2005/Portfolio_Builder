import { SECTION_LABELS, DEFAULT_BLOCK_DATA } from '../utils/constants';
import ThemeTool from './workspace/tools/ThemeTool';
import ImageTool from './workspace/tools/ImageTool';
import ExportTool from './workspace/tools/ExportTool';
import ReviewTool from './workspace/tools/ReviewTool';
import PropertyEditor from './workspace/tools/PropertyEditor';
import { useState, useEffect, useRef } from 'react';
import API from '../api';
import { PORTFOLIO_THEMES } from '../canvas/themes';
import { notify } from '../toast';
import { buildPortfolioHtml, downloadPortfolioHtml } from '../utils/exportWebsiteHtml';


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
                if (onDataExtracted) onDataExtracted(res.data);
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

        const toolProps = {
            localContent, setLocalContent, activeTool, currentType,
            handleFieldChange, handleArrayItemChange, themeMode, currentTheme: userData?.theme || 'modern_glass',
            setUserData, userData, renderMobileHeader, renderActivityBar, renderPromptBar,
            panelRootClass, imagePrompt, setImagePrompt, handleGenerateImage,
            isGeneratingImage, imageTarget, setImageTarget, SECTION_LABELS, applyImageToSection,
            triggerDeploy, deploying, triggerPdfDownload, triggerHtmlWebsiteDownload,
            studioSubTab, setStudioSubTab, reviewData, loadingReview,
            selectedSection, onDeleteSection, onUndo, onRedo, saveState,
            githubUsername, setGithubUsername, handleGithubImport, isImportingGithub
        };

        if (safeToolKey.includes("THEME")) return <ThemeTool {...toolProps} />;
        if (safeToolKey.includes("IMAGE") || safeToolKey.includes("CUSTOMIZER")) return <ImageTool {...toolProps} />;
        if (safeToolKey.includes("CODE") || safeToolKey.includes("EXPORT")) return <ExportTool {...toolProps} />;
        if (safeToolKey.includes("GENERATOR")) return <ReviewTool {...toolProps} />;
        
        return <PropertyEditor {...toolProps} />;
}
