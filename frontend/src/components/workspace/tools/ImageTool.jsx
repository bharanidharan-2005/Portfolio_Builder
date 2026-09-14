import React from 'react';
import { PORTFOLIO_THEMES } from '../../../canvas/themes';

export default function ImageTool(props) {
    const {
        localContent, setLocalContent, activeTool, currentType,
        handleFieldChange, handleArrayItemChange, themeMode, currentTheme,
        setUserData, userData, renderMobileHeader, renderActivityBar, renderPromptBar,
        panelRootClass, imagePrompt, setImagePrompt, handleGenerateImage,
        isGeneratingImage, imageTarget, setImageTarget, SECTION_LABELS, applyImageToSection,
        triggerDeploy, deploying, triggerPdfDownload, triggerHtmlWebsiteDownload,
        studioSubTab, setStudioSubTab, reviewData, loadingReview,
        selectedSection, onDeleteSection, onUndo, onRedo, saveState,
        githubUsername, setGithubUsername, handleGithubImport, isImportingGithub
    } = props;

    return (
         <
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


        // 3. Code Export & Deployment Tool
    );
}
