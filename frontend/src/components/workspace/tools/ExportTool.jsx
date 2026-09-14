import React from 'react';
import { PORTFOLIO_THEMES } from '../../../canvas/themes';

export default function ExportTool(props) {
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


        // 4. AI Content Generator Tool
    );
}
