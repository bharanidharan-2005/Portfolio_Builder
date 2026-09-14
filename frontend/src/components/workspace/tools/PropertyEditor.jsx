import React from 'react';
import { PORTFOLIO_THEMES } from '../../../canvas/themes';

export default function PropertyEditor(props) {
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
            } 
            
            {currentType === 'experience' && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                    {(localContent.items || []).map((item, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-3 shadow-sm">
                            <input type="text" placeholder="Job Title" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500" value={item.title || ''} onChange={(e) => handleArrayItemChange('items', idx, 'title', e.target.value)} />
                            <input type="text" placeholder="Company" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 outline-none focus:border-blue-500" value={item.company || ''} onChange={(e) => handleArrayItemChange('items', idx, 'company', e.target.value)} />
                            <input type="text" placeholder="Dates (e.g., 2020 - 2023)" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px] text-slate-600 outline-none focus:border-blue-500" value={item.dates || ''} onChange={(e) => handleArrayItemChange('items', idx, 'dates', e.target.value)} />
                            <textarea rows="3" placeholder="Job Description" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px] text-slate-600 outline-none resize-none focus:border-blue-500" value={item.description || ''} onChange={(e) => handleArrayItemChange('items', idx, 'description', e.target.value)} />
                        </div>
                    ))}
                </div>
            )}

            {currentType === 'services' && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                    {(localContent.items || []).map((item, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-3 shadow-sm">
                            <input type="text" placeholder="Service Title" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500" value={item.title || ''} onChange={(e) => handleArrayItemChange('items', idx, 'title', e.target.value)} />
                            <textarea rows="3" placeholder="Description" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px] text-slate-600 outline-none resize-none focus:border-blue-500" value={item.description || ''} onChange={(e) => handleArrayItemChange('items', idx, 'description', e.target.value)} />
                        </div>
                    ))}
                </div>
            )}

            {currentType === 'testimonials' && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                    {(localContent.items || []).map((item, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-3 shadow-sm">
                            <input type="text" placeholder="Name" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500" value={item.name || ''} onChange={(e) => handleArrayItemChange('items', idx, 'name', e.target.value)} />
                            <input type="text" placeholder="Role / Company" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px] text-slate-600 outline-none focus:border-blue-500" value={item.role || ''} onChange={(e) => handleArrayItemChange('items', idx, 'role', e.target.value)} />
                            <textarea rows="3" placeholder="Quote" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px] text-slate-600 outline-none resize-none focus:border-blue-500" value={item.quote || ''} onChange={(e) => handleArrayItemChange('items', idx, 'quote', e.target.value)} />
                        </div>
                    ))}
                </div>
            )}

            {currentType === 'certifications' && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                    {(localContent.items || []).map((item, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-3 shadow-sm">
                            <input type="text" placeholder="Certification Name" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500" value={item.name || ''} onChange={(e) => handleArrayItemChange('items', idx, 'name', e.target.value)} />
                            <input type="text" placeholder="Issuer" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px] text-slate-600 outline-none focus:border-blue-500" value={item.issuer || ''} onChange={(e) => handleArrayItemChange('items', idx, 'issuer', e.target.value)} />
                            <input type="text" placeholder="Date" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px] text-slate-600 outline-none focus:border-blue-500" value={item.date || ''} onChange={(e) => handleArrayItemChange('items', idx, 'date', e.target.value)} />
                        </div>
                    ))}
                </div>
            )}

            {currentType === 'stats' && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                    {(localContent.items || []).map((item, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-3 shadow-sm">
                            <input type="text" placeholder="Metric (e.g., 50+)" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500" value={item.metric || ''} onChange={(e) => handleArrayItemChange('items', idx, 'metric', e.target.value)} />
                            <input type="text" placeholder="Label (e.g., Projects)" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px] text-slate-600 outline-none focus:border-blue-500" value={item.label || ''} onChange={(e) => handleArrayItemChange('items', idx, 'label', e.target.value)} />
                        </div>
                    ))}
                </div>
            )}

            {currentType === 'blog' && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                    {(localContent.articles || []).map((item, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-3 shadow-sm">
                            <input type="text" placeholder="Article Title" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500" value={item.title || ''} onChange={(e) => handleArrayItemChange('articles', idx, 'title', e.target.value)} />
                            <input type="text" placeholder="Publisher" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px] text-slate-600 outline-none focus:border-blue-500" value={item.publisher || ''} onChange={(e) => handleArrayItemChange('articles', idx, 'publisher', e.target.value)} />
                            <input type="text" placeholder="Date" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px] text-slate-600 outline-none focus:border-blue-500" value={item.date || ''} onChange={(e) => handleArrayItemChange('articles', idx, 'date', e.target.value)} />
                            <input type="text" placeholder="Link (https://)" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px] text-blue-600 outline-none focus:border-blue-500" value={item.link || ''} onChange={(e) => handleArrayItemChange('articles', idx, 'link', e.target.value)} />
                        </div>
                    ))}
                </div>
            )}
            </div>
        )
    } 
    </div> { renderActivityBar() } { renderPromptBar() } </div>
    );
}
