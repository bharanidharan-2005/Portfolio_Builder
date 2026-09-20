import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { API } from '../api';
import { useAppContext } from './AppContext';
import { DEFAULT_BLOCK_DATA, SECTION_ORDER_WEIGHTS } from '../utils/constants';
import { deployAnimatedSite } from '../utils/deploymentUtils';

const WorkspaceContext = createContext(null);

export const useWorkspace = () => {
    const context = useContext(WorkspaceContext);
    if (!context) {
        throw new Error('useWorkspace must be used within a WorkspaceProvider');
    }
    return context;
};

export const WorkspaceProvider = ({ children, isPublicPreview = false, previewUserData = null }) => {
    const appContext = useAppContext();
    
    // For public previews, we override the user data
    const userData = isPublicPreview ? previewUserData : appContext.userData;
    const setUserData = isPublicPreview ? () => {} : appContext.setUserData;
    const themeMode = appContext.themeMode;

    // --- Centralized Backend State ---
    const [pages, setPages] = useState([]);
    const [activePage, setActivePage] = useState("Home");
    const [sections, setSections] = useState([]);
    
    const sectionsRef = useRef([]);

    // --- AI Context State ---
    const [activeHighlightSection, setActiveHighlightSection] = useState(null);
    const [aiSuggestionPreview, setAiSuggestionPreview] = useState(null);
    const [resumeReviewData, setResumeReviewData] = useState(null);

    // --- GLOBAL BACKGROUND & FONT STATE ---
    const [globalBg, setGlobalBg] = useState(() => {
        return userData?.globalBg || localStorage.getItem(`aurabuild_bg_${userData?.name || 'default'}`) || null;
    });

    const [globalFont, setGlobalFont] = useState(() => {
        return userData?.globalFont || localStorage.getItem(`aurabuild_font_${userData?.name || 'default'}`) || 'font-inter';
    });

    const [heroCustomImage, setHeroCustomImage] = useState(null);
    const [customFontSize, setCustomFontSize] = useState("base"); // base, sm, lg, xl
    const [customAccentColor, setCustomAccentColor] = useState(null);

    useEffect(() => {
        if (globalBg) {
            localStorage.setItem(`aurabuild_bg_${userData?.name || 'default'}`, globalBg);
            if (setUserData) setUserData(prev => ({ ...prev, globalBg }));
        } else {
            localStorage.removeItem(`aurabuild_bg_${userData?.name || 'default'}`);
        }
        if (!isPublicPreview) API.patch('portfolio-settings/', { globalBg: globalBg || "" }).catch(() => {});
    }, [globalBg, userData?.name, setUserData, isPublicPreview]);

    useEffect(() => {
        if (globalFont) {
            localStorage.setItem(`aurabuild_font_${userData?.name || 'default'}`, globalFont);
            if (setUserData) setUserData(prev => ({ ...prev, globalFont }));
        }
        if (!isPublicPreview) API.patch('portfolio-settings/', { globalFont }).catch(() => {});
    }, [globalFont, userData?.name, setUserData, isPublicPreview]);
    
    // --- Sync Theme to Backend ---
    useEffect(() => {
        if (userData?.theme && !isPublicPreview) {
            API.patch('portfolio-settings/', { theme: userData.theme }).catch(() => {});
        }
    }, [userData?.theme, isPublicPreview]);

    // Local fallback for theme in public preview mode
    const [localTheme, setLocalTheme] = useState(userData?.theme || 'modern_glass');
    
    useEffect(() => {
        if (userData?.theme) setLocalTheme(userData.theme);
    }, [userData?.theme]);

    const currentTheme = (userData && userData.theme) || localTheme;

    // --- Terminal & History State ---
    const [terminalLogsState, setTerminalLogsState] = useState([
        { type: "system", text: "// Studio Pipeline Activity Log", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
        { type: "status", text: "Connecting to secure backend...", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);

    const setTerminalLogs = (updater) => {
        setTerminalLogsState(prev => {
            const newLogs = typeof updater === 'function' ? updater(prev) : updater;
            return newLogs.map(log => log.timestamp ? log : { ...log, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
        });
    };
    
    const terminalLogs = terminalLogsState;

    const [history, setHistory] = useState({ past: [], future: [] });
    const lastLoadedPage = useRef(null);


    useEffect(() => {
        sectionsRef.current = sections;
    }, [sections]);

    // BOOT SEQUENCE
    useEffect(() => {
        const loadWorkspace = async () => {
            try {
                let pagesData = [];
                if (isPublicPreview && userData?.name) {
                    const cleanUsername = userData.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const res = await API.get(`public-portfolio/${cleanUsername}/`);
                    pagesData = res.data.pages || res.data;
                    if (res.data.settings) {
                        setGlobalBg(res.data.settings.globalBg || null);
                        setGlobalFont(res.data.settings.globalFont || 'font-inter');
                        if (res.data.settings.theme) {
                            if (setUserData) setUserData(prev => ({...prev, theme: res.data.settings.theme}));
                            setLocalTheme(res.data.settings.theme);
                        }
                    }
                } else {
                    const res = await API.get('pages/');
                    pagesData = res.data;
                    try {
                        const settingsRes = await API.get('portfolio-settings/');
                        if (settingsRes.data) {
                            setGlobalBg(settingsRes.data.globalBg || null);
                            setGlobalFont(settingsRes.data.globalFont || 'font-inter');
                            if (settingsRes.data.theme) {
                                if (setUserData) setUserData(prev => ({...prev, theme: settingsRes.data.theme}));
                                setLocalTheme(settingsRes.data.theme);
                            }
                        }
                    } catch (e) {}
                }
                
                if (pagesData && pagesData.length > 0) {
                    setPages(pagesData);
                    const firstPage = pagesData[0];
                    setActivePage(firstPage.name);
                    setSections(firstPage.sections || []);
                    lastLoadedPage.current = firstPage.name;
                    setTerminalLogs(prev => [...prev, { type: "success", text: "[SUCCESS] Workspace synchronized with backend database." }]);
                } else {
                    handleAddPage("Home");
                }
            } catch (err) {
                setTerminalLogs(prev => [...prev, { type: "error", text: "[ERROR] Failed to load workspace from server." }]);
            }
        };
        loadWorkspace();
    }, [isPublicPreview, userData?.name]);

    // PAGE SWITCHER
    useEffect(() => {
        if (pages.length > 0 && lastLoadedPage.current !== activePage) {
            const pageObj = pages.find(p => p.name === activePage);
            if (pageObj) {
                setSections(pageObj.sections || []);
                setHistory({ past: [], future: [] }); 
                lastLoadedPage.current = activePage;
            }
        }
    }, [activePage, pages]);

    // --- URL Routing visually (Only apply if NOT in public preview) ---
    useEffect(() => {
        if (!isPublicPreview && userData && userData.name && userData.code) {
            const cleanUsername = userData.name.toLowerCase().replace(/\s+/g, '-');
            const cleanToken = userData.code;
            const newPath = `/workspace/${cleanUsername}/${cleanToken}`;
            window.history.replaceState({}, '', newPath);
        }
    }, [userData, isPublicPreview]);

    // --- BULLETPROOF HISTORY RECORDER ---
    const commitHistory = (newSections, oldSections) => {
        const currentSnapshot = JSON.parse(JSON.stringify(oldSections)); 
        setHistory(prev => ({
            past: [...prev.past, currentSnapshot].slice(-30), 
            future: [] 
        }));
        
        setSections(newSections);
        setPages(prevPages => prevPages.map(p => p.name === activePage ? { ...p, sections: newSections } : p));
    };

    const handleUndo = () => {
        if (history.past.length === 0) return;
        const previous = history.past[history.past.length - 1];
        const newPast = history.past.slice(0, -1);
        const currentSnapshot = JSON.parse(JSON.stringify(sectionsRef.current));
        setHistory({ past: newPast, future: [currentSnapshot, ...history.future] });
        setSections(previous);
        setPages(prev => prev.map(p => p.name === activePage ? { ...p, sections: previous } : p));
        setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Action undone.` }]);
    };

    const handleRedo = () => {
        if (history.future.length === 0) return;
        const next = history.future[0];
        const newFuture = history.future.slice(1);
        const currentSnapshot = JSON.parse(JSON.stringify(sectionsRef.current));
        setHistory({ past: [...history.past, currentSnapshot], future: newFuture });
        setSections(next);
        setPages(prev => prev.map(p => p.name === activePage ? { ...p, sections: next } : p));
        setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Action redone.` }]);
    };

    // --- Backend-Synced Data Handlers ---
    const handleAddPage = async (pageName = "New Page") => {
        try {
            const res = await API.post('pages/create/', { name: pageName });
            setPages(prev => [...prev, res.data]);
            setActivePage(res.data.name);
            setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Created new backend page: ${res.data.name}` }]);
        } catch (err) {
            setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] Failed to create page.` }]);
        }
    };

    const handleDeletePage = async (pageNameToDelete, pageId) => {
        if (pages.length <= 1) {
            setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] Cannot delete the last remaining page.` }]);
            return;
        }
        try {
            if (pageId) await API.delete(`pages/${pageId}/`);
            const newPages = pages.filter(p => p.id !== pageId);
            setPages(newPages);
            if (activePage === pageNameToDelete) setActivePage(newPages[0].name);
            setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Deleted page: ${pageNameToDelete}` }]);
        } catch (err) {
            setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] Failed to delete page on server.` }]);
        }
    };

    const handleUpdateSectionContent = async (sectionId, key, value) => {
        const currentSections = sectionsRef.current;
        const newSections = currentSections.map(sec => {
            if (String(sec.id) === String(sectionId)) {
                return { ...sec, content_data: { ...sec.content_data, [key]: value } };
            }
            return sec;
        });
        
        sectionsRef.current = newSections;
        commitHistory(newSections, currentSections);

        const isNumericId = /^\d+$/.test(String(sectionId));
        if (isNumericId) { 
            try {
                const targetSec = newSections.find(s => String(s.id) === String(sectionId));
                if (targetSec) {
                    await API.patch(`sections/${sectionId}/`, { content_data: targetSec.content_data });
                }
            } catch(e) {
                setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] Autosave failed for section #${sectionId}` }]);
            }
        }
    };

    const handleDropSection = async (activeId, overId) => {
        const currentSections = sectionsRef.current;
        const oldIndex = currentSections.findIndex(s => String(s.id) === String(activeId));
        const newIndex = currentSections.findIndex(s => String(s.id) === String(overId));
        if (oldIndex === -1 || newIndex === -1) return;

        const newSections = [...currentSections];
        const [moved] = newSections.splice(oldIndex, 1);
        newSections.splice(newIndex, 0, moved);
        
        sectionsRef.current = newSections;
        commitHistory(newSections, currentSections); 

        try {
            const activePageObj = pages.find(p => p.name === activePage);
            if (activePageObj) {
                await API.post('sections/reorder/', {
                    page_id: activePageObj.id,
                    ordered_ids: newSections.map(s => s.id)
                });
            }
        } catch (e) {
            setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] Layout reorder failed to save to database.` }]);
        }
    };

    const handleAddManualSection = (type) => {
        const newId = `sec-${Date.now()}`;
        const defaultContent = DEFAULT_BLOCK_DATA[type] || {};

        const newSection = { id: newId, section_type: type, content_data: defaultContent };
        
        const currentSections = sectionsRef.current;
        
        const targetWeight = SECTION_ORDER_WEIGHTS[type] || 999;
        let insertIndex = currentSections.length;
        
        for (let i = 0; i < currentSections.length; i++) {
            const currentWeight = SECTION_ORDER_WEIGHTS[currentSections[i].section_type] || 999;
            if (targetWeight < currentWeight) {
                insertIndex = i;
                break;
            }
        }
        
        const newSections = [
            ...currentSections.slice(0, insertIndex),
            newSection,
            ...currentSections.slice(insertIndex)
        ];

        sectionsRef.current = newSections;
        commitHistory(newSections, currentSections); 
        
        setTerminalLogs(prev => [...prev, { type: "success", text: `[SUCCESS] Added local ${type} block to canvas.` }]);
    };

    const handleDeleteSection = async (sectionId) => {
        const currentSections = sectionsRef.current;
        const newSections = currentSections.filter(s => String(s.id) !== String(sectionId));
        
        sectionsRef.current = newSections;
        commitHistory(newSections, currentSections);
        
        const isNumericId = /^\d+$/.test(String(sectionId));
        if (isNumericId) {
            try {
                await API.delete(`sections/${sectionId}/`);
                setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Deleted section from database.` }]);
            } catch (e) {
                setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] Failed to delete section from database.` }]);
            }
        } else {
            setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Deleted local section.` }]);
        }
    };

    const handleDuplicateSection = async (sectionId) => {
        const currentSections = sectionsRef.current;
        const sectionIndex = currentSections.findIndex(s => String(s.id) === String(sectionId));
        if (sectionIndex === -1) return;
        
        const originalSection = currentSections[sectionIndex];
        const newId = `sec-dup-${Date.now()}`;
        
        const clonedSection = {
            id: newId,
            section_type: originalSection.section_type,
            content_data: JSON.parse(JSON.stringify(originalSection.content_data || {}))
        };
        
        const newSections = [
            ...currentSections.slice(0, sectionIndex + 1),
            clonedSection,
            ...currentSections.slice(sectionIndex + 1)
        ];
        
        sectionsRef.current = newSections;
        commitHistory(newSections, currentSections);
        setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Duplicated section block.` }]);
    };



    const handleResumeParsed = (resData) => {
        if (!resData || !resData.sections || resData.sections.length === 0) {
            setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] No recognizable sections found in resume.` }]);
            return;
        }
        
        // INTERCEPT for review instead of immediately applying
        setResumeReviewData(resData);
    };

    const handleApplyResumeData = (mode) => {
        if (!resumeReviewData || !resumeReviewData.sections) return;
        
        const newSections = resumeReviewData.sections;
        
        if (mode === 'replace') {
            setHistory({ past: [], future: [] }); 
            setSections(newSections);
            setTerminalLogs(prev => [...prev, { type: "success", text: `[SUCCESS] Canvas replaced with extracted sections!` }]);
        } else if (mode === 'append') {
            const currentSections = sectionsRef.current;
            const updatedSections = [...currentSections, ...newSections];
            setSections(updatedSections);
            commitHistory(updatedSections, currentSections);
            setTerminalLogs(prev => [...prev, { type: "success", text: `[SUCCESS] Extracted sections appended to canvas!` }]);
        }
        
        setResumeReviewData(null);
    };

    const handleCancelResumeData = () => {
        setResumeReviewData(null);
        setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Resume extraction application cancelled.` }]);
    };

    const triggerDeployment = async () => {
        setTerminalLogs(prev => [...prev, { type: "system", text: "[SYSTEM] Initiating secure backend deployment..." }]);
        alert("Deploying your portfolio to Vercel edge... This may take up to 20 seconds.");
        const result = await deployAnimatedSite({ pages, activePage, userData });
        if (result.success) {
            setTerminalLogs(prev => [...prev, { type: "success", text: `[SUCCESS] Deployed successfully to ${result.data.projectUrl}` }]);
            alert(`Deployed successfully! View it here: ${result.data.projectUrl}`);
            window.open(result.data.projectUrl, '_blank');
        } else {
            setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] ${result.error}` }]);
            alert(`Deployment Failed: ${result.error}`);
        }
    };

    const handleExportZip = async () => {
        setTerminalLogs(prev => [...prev, { type: "system", text: "[SYSTEM] Compiling source code for ZIP export..." }]);
        try {
            const { exportProjectToZip } = await import('../utils/exportEngine.js');
            await exportProjectToZip(pages, activePage, themeMode, currentTheme, globalBg);
            setTerminalLogs(prev => [...prev, { type: "success", text: "[SUCCESS] Source code downloaded successfully." }]);
        } catch (e) {
            console.error(e);
            setTerminalLogs(prev => [...prev, { type: "error", text: "[ERROR] Failed to compile source code ZIP." }]);
        }
    };

    const value = {
        isPublicPreview,
        userData,
        setUserData,
        themeMode,
        currentTheme,
        pages,
        activePage,
        setActivePage,
        sections,
        activeHighlightSection,
        setActiveHighlightSection,
        aiSuggestionPreview,
        setAiSuggestionPreview,
        globalBg,
        setGlobalBg,
        globalFont,
        setGlobalFont,
        heroCustomImage,
        setHeroCustomImage,
        customFontSize,
        setCustomFontSize,
        customAccentColor,
        setCustomAccentColor,
        terminalLogs,
        setTerminalLogs,
        history,
        handleUndo,
        handleRedo,
        handleAddPage,
        handleDeletePage,
        handleUpdateSectionContent,
        handleDropSection,
        handleAddManualSection,
        handleDeleteSection,
        handleDuplicateSection,
        handleResumeParsed,
        resumeReviewData,
        handleApplyResumeData,
        handleCancelResumeData,
        triggerDeployment,
        handleExportZip,
    };

    return (
        <WorkspaceContext.Provider value={value}>
            {children}
        </WorkspaceContext.Provider>
    );
};
