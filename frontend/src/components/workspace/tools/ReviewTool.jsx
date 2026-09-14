import React from 'react';
import { PORTFOLIO_THEMES } from '../../../canvas/themes';

export default function ReviewTool(props) {
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
    );
}
