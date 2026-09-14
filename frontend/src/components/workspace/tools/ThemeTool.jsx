import React from 'react';
import { PORTFOLIO_THEMES } from '../../../canvas/themes';

export default function ThemeTool(props) {
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


        // 2. Image Customizer Tool
    );
}
