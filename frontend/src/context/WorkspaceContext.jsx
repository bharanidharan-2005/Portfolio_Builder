/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const fastClone = (obj) => {
    if (!obj) return obj;
    try {
        return typeof structuredClone === 'function' ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));
    } catch {
        return JSON.parse(JSON.stringify(obj));
    }
};
import { API } from '../api';
import { useAppContext } from './AppContext';
import { DEFAULT_BLOCK_DATA, SECTION_ORDER_WEIGHTS, DEFAULT_SHOWCASE_SECTIONS } from '../utils/constants';
import { ensureGoogleFontLoaded } from '../utils/fontLoader';
import { notify } from '../toast';

const FONT_CLASS_TO_FAMILY = {
    'font-craletto': 'Cormorant Garamond',
    'font-bodoni': 'Bodoni Moda',
    'font-cormorant': 'Cormorant Garamond',
    'font-inter': 'Inter',
    'font-sora': 'Sora',
    'font-space-grotesk': 'Space Grotesk',
    'font-manrope': 'Manrope',
    'font-plus-jakarta': 'Plus Jakarta Sans',
    'font-dm-sans': 'DM Sans',
    'font-outfit': 'Outfit',
    'font-poppins': 'Poppins',
    'font-geist': 'Geist',
    'font-urbanist': 'Urbanist',
    'font-syne': 'Syne',
    'font-archivo': 'Archivo',
    'font-ibm-plex': 'IBM Plex Sans',
    'font-space-mono': 'Space Mono',
    'font-jetbrains': 'JetBrains Mono',
    'font-fira': 'Fira Code',
    'font-roboto': 'Roboto',
    'font-montserrat': 'Montserrat',
    'font-raleway': 'Raleway',
    'font-bebas': 'Bebas Neue',
    'font-oswald': 'Oswald',
    'font-playfair': 'Playfair Display',
    'font-lora': 'Lora',
};

export const WorkspaceContext = createContext(null);

export const useWorkspace = () => {
    const context = useContext(WorkspaceContext);
    if (!context) {
        throw new Error('useWorkspace must be used within a WorkspaceProvider');
    }
    return context;
};

export const WorkspaceProvider = ({ children, isPublicPreview = false, previewUserData = null, portfolioId = null }) => {
    const appContext = useAppContext();
    
    // For public previews, we override the user data with reactive local state
    const [publicUserData, setPublicUserData] = useState(previewUserData || {});
    const userData = isPublicPreview ? publicUserData : appContext.userData;
    const setUserData = isPublicPreview ? setPublicUserData : appContext.setUserData;
    const themeMode = appContext.themeMode;

    const userKey = (userData?.name || previewUserData?.name || 'default').toLowerCase().replace(/[^a-z0-9]/g, '');

    // --- Loading & Sync States ---
    const [isSectionsLoading, setIsSectionsLoading] = useState(true);
    const [publicNotFound, setPublicNotFound] = useState(false);
    const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'dirty' | 'error'
    const [lastSavedAt, setLastSavedAt] = useState(null);
    const [portfolioMeta, setPortfolioMeta] = useState({
        id: portfolioId || null,
        title: 'My Portfolio',
        slug: '',
        isPublished: false,
        seoTitle: '',
        seoDescription: '',
        publishedUrl: '',
        careerTrack: 'software_developer',
    });
    const hasLoadedInitialSettingsRef = useRef(false);
    const pendingPatchTimersRef = useRef({});
    const pendingPatchPayloadsRef = useRef({});

    // --- Centralized Backend State (Instant Cached Initialization) ---
    const [pages, setPages] = useState(() => {
        try {
            const cached = localStorage.getItem(`aurabuild_cached_pages_${userKey}`) 
                || localStorage.getItem('aurabuild_cached_pages_latest');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch { /* ignore */ }
        return [{ id: 'default-home', name: 'Home', sections: DEFAULT_SHOWCASE_SECTIONS }];
    });

    const [activePageState, setActivePageState] = useState("Home");
    const activePage = activePageState;

    const [sections, setSections] = useState(() => {
        try {
            const cached = localStorage.getItem(`aurabuild_cached_sections_${userKey}`) 
                || localStorage.getItem('aurabuild_cached_sections_latest');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch { /* ignore */ }
        // Fallback to showcase so public portfolio and workspace load INSTANTLY with zero empty flash
        return DEFAULT_SHOWCASE_SECTIONS;
    });
    
    const sectionsRef = useRef(sections);


    // --- AI Context State ---
    const [activeHighlightSection, setActiveHighlightSection] = useState(null);
    const [aiSuggestionPreview, setAiSuggestionPreview] = useState(null);
    const [resumeReviewData, setResumeReviewData] = useState(null);
    const [selectedSection] = useState(null);
    const [localContent] = useState({});

    // --- GLOBAL BACKGROUND & FONT STATE ---
    const [globalBg, setGlobalBg] = useState(() => {
        return userData?.globalBg || localStorage.getItem(`aurabuild_bg_${userData?.name || 'default'}`) || null;
    });

    const [globalFont, setGlobalFont] = useState(() => {
        return userData?.globalFont || localStorage.getItem(`aurabuild_font_${userData?.name || 'default'}`) || 'font-inter';
    });

    const [customFontSize, setCustomFontSize] = useState("base"); // base, sm, lg, xl
    const [customAccentColor, setCustomAccentColor] = useState(null);

    const updatePortfolioSettings = useCallback(async (patch) => {
        if (isPublicPreview) return;
        const pid = portfolioMeta?.id || portfolioId;
        const qs = pid ? `?portfolio_id=${pid}` : '';
        setSaveStatus('saving');
        try {
            const res = await API.patch(`portfolio-settings/${qs}`, {
                ...patch,
                ...(pid ? { portfolio_id: pid } : {}),
            });
            setSaveStatus('saved');
            setLastSavedAt(Date.now());
            if (res.data) {
                setPortfolioMeta(prev => ({
                    ...prev,
                    id: res.data.id || prev.id,
                    title: res.data.title ?? prev.title,
                    slug: res.data.slug ?? prev.slug,
                    isPublished: res.data.isPublished ?? prev.isPublished,
                    seoTitle: res.data.seoTitle ?? prev.seoTitle,
                    seoDescription: res.data.seoDescription ?? prev.seoDescription,
                    publishedUrl: res.data.publishedUrl ?? prev.publishedUrl,
                    careerTrack: res.data.careerTrack ?? prev.careerTrack,
                }));
            }
            return res.data;
        } catch (err) {
            setSaveStatus('error');
            throw err;
        }
    }, [isPublicPreview, portfolioMeta?.id, portfolioId]);

    useEffect(() => {
        if (globalBg) {
            localStorage.setItem(`aurabuild_bg_${userData?.name || 'default'}`, globalBg);
            if (setUserData) setUserData(prev => ({ ...prev, globalBg }));
        } else {
            localStorage.removeItem(`aurabuild_bg_${userData?.name || 'default'}`);
        }
        if (!isPublicPreview && hasLoadedInitialSettingsRef.current) {
            updatePortfolioSettings({ globalBg: globalBg || "" }).catch(() => {});
        }
    }, [globalBg, userData?.name, setUserData, isPublicPreview, updatePortfolioSettings]);

    useEffect(() => {
        if (globalFont) {
            ensureGoogleFontLoaded(FONT_CLASS_TO_FAMILY[globalFont] || globalFont);
            localStorage.setItem(`aurabuild_font_${userData?.name || 'default'}`, globalFont);
            if (setUserData) setUserData(prev => ({ ...prev, globalFont }));
        }
        if (!isPublicPreview && hasLoadedInitialSettingsRef.current) {
            updatePortfolioSettings({ globalFont }).catch(() => {});
        }
    }, [globalFont, userData?.name, setUserData, isPublicPreview, updatePortfolioSettings]);
    
    // --- Sync Theme to Backend ---
    useEffect(() => {
        if (userData?.theme && !isPublicPreview && hasLoadedInitialSettingsRef.current) {
            updatePortfolioSettings({ theme: userData.theme }).catch(() => {});
        }
    }, [userData?.theme, isPublicPreview, updatePortfolioSettings]);

    // --- Sync Frontpage Template to Backend & LocalStorage ---
    useEffect(() => {
        if (userData?.frontpageTemplate) {
            localStorage.setItem(`aurabuild_frontpage_${userData?.name || 'default'}`, userData.frontpageTemplate);
            localStorage.setItem(`aurabuild_frontpage_default`, userData.frontpageTemplate);
            if (!isPublicPreview && hasLoadedInitialSettingsRef.current) {
                updatePortfolioSettings({ frontpageTemplate: userData.frontpageTemplate }).catch(() => {});
            }
        }
    }, [userData?.frontpageTemplate, userData?.name, isPublicPreview, updatePortfolioSettings]);

    // Derive active theme cleanly
    const currentTheme = (userData && userData.theme) || 'modern_glass';

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

    // Helper to ensure projects are not trapped in experience and sections are in canonical portfolio order
    const sanitizeAndSortSections = (rawSections) => {
        if (!Array.isArray(rawSections)) return [];
        
        let processed = rawSections;
        const experienceSec = rawSections.find(s => s.section_type === 'experience');
        
        if (experienceSec && experienceSec.content_data && Array.isArray(experienceSec.content_data.items)) {
            const expItems = experienceSec.content_data.items;
            const projectIndicators = [
                'assistant', 'builder', 'portal', 'shortlister', 'app', 'system',
                'platform', 'rag', 'intelligence', 'analyzer', 'dashboard', 'tool',
                'bot', 'website', 'clone', 'tracker', 'portfolio'
            ];
            
            const projectsToMigrate = [];
            const genuineExp = [];
            
            for (const item of expItems) {
                const title = String(item.title || '').trim().toLowerCase();
                const company = String(item.company || '').trim().toLowerCase();
                const isProj = !company || company === 'company' || company === 'n/a' || projectIndicators.some(ind => title.includes(ind));
                
                if (isProj) {
                    const candidateUrl = item.projectUrl || item.url || '';
                    const isGit = /github\.com|gitlab\.com|\.git$/i.test(candidateUrl);
                    projectsToMigrate.push({
                        title: item.title,
                        desc: item.description || item.desc || '',
                        tags: item.tags || [],
                        projectUrl: isGit ? '' : candidateUrl,
                        githubUrl: isGit ? candidateUrl : (item.githubUrl || '')
                    });
                } else {
                    genuineExp.push(item);
                }
            }
            
            if (projectsToMigrate.length > 0) {
                processed = processed.map(s => {
                    if (s.section_type === 'projects_grid') {
                        const currentProjects = s.content_data?.projects || [];
                        const titles = new Set(currentProjects.map(p => String(p.title || '').toLowerCase()));
                        const newProjects = [...currentProjects];
                        for (const p of projectsToMigrate) {
                            if (!titles.has(p.title.toLowerCase())) {
                                newProjects.push(p);
                                titles.add(p.title.toLowerCase());
                            }
                        }
                        return {
                            ...s,
                            content_data: { ...s.content_data, projects: newProjects }
                        };
                    }
                    if (s.section_type === 'experience') {
                        return {
                            ...s,
                            content_data: { ...s.content_data, items: genuineExp }
                        };
                    }
                    return s;
                });
            }
        }

        // Sanitize all projects in projects_grid sections to ensure clean separation of live vs github repo links
        processed = processed.map(s => {
            if (s.section_type === 'projects_grid' && s.content_data && Array.isArray(s.content_data.projects)) {
                const normalizedProjects = s.content_data.projects.map(p => {
                    let pUrl = String(p.projectUrl || p.liveUrl || p.demo_link || '').trim();
                    let ghUrl = String(p.githubUrl || p.repoUrl || p.repo_url || '').trim();
                    const isPUrlGit = /github\.com|gitlab\.com|\.git$/i.test(pUrl);
                    if (isPUrlGit && !ghUrl) {
                        ghUrl = pUrl;
                        pUrl = '';
                    }
                    return {
                        ...p,
                        projectUrl: pUrl,
                        githubUrl: ghUrl
                    };
                });
                return {
                    ...s,
                    content_data: {
                        ...s.content_data,
                        projects: normalizedProjects
                    }
                };
            }
            return s;
        });
        
        return [...processed].sort((a, b) => {
            const wA = SECTION_ORDER_WEIGHTS[a.section_type] ?? a.order ?? 100;
            const wB = SECTION_ORDER_WEIGHTS[b.section_type] ?? b.order ?? 100;
            return wA - wB;
        });
    };

    // BOOT SEQUENCE
    useEffect(() => {
        const loadWorkspace = async () => {
            setIsSectionsLoading(true);
            setPublicNotFound(false);
            try {
                let pagesData = [];
                if (isPublicPreview && userData?.name) {
                    const cleanUsername = userData.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const urlParams = new URLSearchParams(window.location.search);
                    const slugParam = urlParams.get('portfolio');
                    const query = slugParam ? `?portfolio=${encodeURIComponent(slugParam)}` : '';
                    const res = await API.get(`public-portfolio/${cleanUsername}/${query}`);
                    pagesData = res.data.pages || res.data;
                    if (res.data.settings) {
                        setGlobalBg(res.data.settings.globalBg || null);
                        setGlobalFont(res.data.settings.globalFont || 'font-inter');
                        const fpTpl = res.data.settings.frontpageTemplate || 'template1';
                            if (setUserData) {
                                setUserData(prev => ({
                                    ...prev,
                                    frontpageTemplate: fpTpl,
                                    ...(res.data.settings.theme ? { theme: res.data.settings.theme } : {}),
                                    ...(res.data.owner_name ? { name: res.data.owner_name } : {})
                                }));
                            }
                            setPortfolioMeta(prev => ({
                            ...prev,
                            title: res.data.title || prev.title,
                            slug: res.data.slug || prev.slug,
                            isPublished: true,
                            seoTitle: res.data.settings.seoTitle || '',
                            seoDescription: res.data.settings.seoDescription || '',
                        }));
                    }
                } else {
                    const pidParam = portfolioId ? { portfolio_id: portfolioId } : {};
                    if (portfolioId) {
                        await API.patch(`portfolios/${portfolioId}/`, { is_active: true }).catch(() => {});
                    }
                    const res = await API.get('pages/', { params: pidParam });
                    pagesData = res.data;
                    try {
                        const settingsRes = await API.get('portfolio-settings/', { params: pidParam });
                        if (settingsRes.data) {
                            setGlobalBg(settingsRes.data.globalBg || null);
                            setGlobalFont(settingsRes.data.globalFont || 'font-inter');
                            const fpTpl = settingsRes.data.frontpageTemplate || 'template1';
                            if (setUserData) {
                                setUserData(prev => ({
                                    ...prev,
                                    frontpageTemplate: fpTpl,
                                    ...(settingsRes.data.theme ? { theme: settingsRes.data.theme } : {})
                                }));
                            }
                            setPortfolioMeta(prev => ({
                                ...prev,
                                id: settingsRes.data.id || portfolioId || prev.id,
                                title: settingsRes.data.title || prev.title,
                                slug: settingsRes.data.slug || prev.slug,
                                isPublished: Boolean(settingsRes.data.isPublished),
                                seoTitle: settingsRes.data.seoTitle || '',
                                seoDescription: settingsRes.data.seoDescription || '',
                                publishedUrl: settingsRes.data.publishedUrl || '',
                                careerTrack: settingsRes.data.careerTrack || 'software_developer',
                            }));
                        }
                    } catch { /* ignore */ }
                    hasLoadedInitialSettingsRef.current = true;
                }
                
                if (pagesData && pagesData.length > 0) {
                    setPages(pagesData);
                    const firstPage = pagesData[0];
                    setActivePageState(firstPage.name);
                    const sorted = sanitizeAndSortSections(firstPage.sections || []);
                    setSections(sorted);
                    lastLoadedPage.current = firstPage.name;
                    setSaveStatus('saved');
                    setLastSavedAt(Date.now());
                    
                    if (!isPublicPreview) {
                        const cleanKey = (userData?.name || 'default').toLowerCase().replace(/[^a-z0-9]/g, '');
                        try {
                            localStorage.setItem(`aurabuild_cached_sections_${cleanKey}`, JSON.stringify(sorted));
                            localStorage.setItem('aurabuild_cached_sections_latest', JSON.stringify(sorted));
                            localStorage.setItem(`aurabuild_cached_pages_${cleanKey}`, JSON.stringify(pagesData));
                            localStorage.setItem('aurabuild_cached_pages_latest', JSON.stringify(pagesData));
                        } catch { /* ignore */ }
                    }
                    
                    setTerminalLogs(prev => [...prev, { type: "success", text: "[SUCCESS] Workspace synchronized with backend database." }]);
                } else if (!isPublicPreview) {
                    try {
                        const pid = portfolioMeta?.id || portfolioId;
                        const createRes = await API.post('pages/create/', {
                            name: 'Home',
                            ...(pid ? { portfolio_id: pid } : {}),
                        });
                        setPages([createRes.data]);
                        setActivePageState(createRes.data.name || 'Home');
                        setSections(sanitizeAndSortSections(createRes.data.sections || []));
                        lastLoadedPage.current = createRes.data.name || 'Home';
                    } catch { /* ignore */ }
                }
            } catch {
                if (isPublicPreview) {
                    setPublicNotFound(true);
                    setSections([]);
                }
                setTerminalLogs(prev => [...prev, { type: "error", text: "[ERROR] Failed to load workspace from server." }]);
            } finally {
                setIsSectionsLoading(false);
            }
        };
        loadWorkspace();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPublicPreview, userData?.name, portfolioId]);

    // Keep active workspace sections persisted to localStorage on every change
    useEffect(() => {
        if (sections && sections.length > 0 && !isPublicPreview) {
            const cleanKey = (userData?.name || 'default').toLowerCase().replace(/[^a-z0-9]/g, '');
            try {
                localStorage.setItem(`aurabuild_cached_sections_${cleanKey}`, JSON.stringify(sections));
                localStorage.setItem('aurabuild_cached_sections_latest', JSON.stringify(sections));
            } catch { /* ignore */ }
        }
    }, [sections, userData?.name, isPublicPreview]);

    const setActivePage = useCallback((nextPageName) => {
        setActivePageState(nextPageName);
        if (lastLoadedPage.current !== nextPageName) {
            const pageObj = pages.find(p => p.name === nextPageName);
            if (pageObj) {
                setSections(sanitizeAndSortSections(pageObj.sections || []));
                setHistory({ past: [], future: [] });
                lastLoadedPage.current = nextPageName;
            }
        }
    }, [pages]);

    // Note: Keep workspace routes clean without leaking secret access codes into browser history.

    // --- BULLETPROOF HISTORY RECORDER ---
    const commitHistory = (newSections, oldSections) => {
        const currentSnapshot = fastClone(oldSections); 
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
        const currentSnapshot = fastClone(sectionsRef.current);
        setHistory({ past: newPast, future: [currentSnapshot, ...history.future] });
        setSections(previous);
        setPages(prev => prev.map(p => p.name === activePage ? { ...p, sections: previous } : p));
        setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Action undone.` }]);
    };

    const handleRedo = () => {
        if (history.future.length === 0) return;
        const next = history.future[0];
        const newFuture = history.future.slice(1);
        const currentSnapshot = fastClone(sectionsRef.current);
        setHistory({ past: [...history.past, currentSnapshot], future: newFuture });
        setSections(next);
        setPages(prev => prev.map(p => p.name === activePage ? { ...p, sections: next } : p));
        setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Action redone.` }]);
    };

    // --- Backend-Synced Data Handlers ---
    const handleAddPage = async (pageName = "New Page") => {
        setSaveStatus('saving');
        try {
            const pid = portfolioMeta?.id || portfolioId;
            const res = await API.post('pages/create/', {
                name: pageName,
                ...(pid ? { portfolio_id: pid } : {}),
            });
            setPages(prev => [...prev, res.data]);
            setActivePage(res.data.name);
            setSaveStatus('saved');
            setLastSavedAt(Date.now());
            setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Created new backend page: ${res.data.name}` }]);
        } catch {
            setSaveStatus('error');
            setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] Failed to create page.` }]);
        }
    };

    const handleRenamePage = async (pageId, newName) => {
        const cleanName = String(newName || '').trim();
        if (!pageId || !cleanName) return;
        setSaveStatus('saving');
        try {
            const res = await API.patch(`pages/${pageId}/`, { name: cleanName });
            setPages(prev => prev.map(p => (p.id === pageId ? { ...p, name: res.data.name || cleanName, slug: res.data.slug || p.slug } : p)));
            setActivePage(prev => {
                const target = pages.find(p => p.id === pageId);
                return target && target.name === prev ? (res.data.name || cleanName) : prev;
            });
            setSaveStatus('saved');
            setLastSavedAt(Date.now());
        } catch (err) {
            setSaveStatus('error');
            notify(err.response?.data?.error || 'Failed to rename page.', 'error');
        }
    };

    const handleDeletePage = async (pageNameToDelete, pageId) => {
        if (pages.length <= 1) {
            setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] Cannot delete the last remaining page.` }]);
            return;
        }
        setSaveStatus('saving');
        try {
            if (pageId) await API.delete(`pages/${pageId}/`);
            const newPages = pages.filter(p => p.id !== pageId);
            setPages(newPages);
            if (activePage === pageNameToDelete) setActivePage(newPages[0].name);
            setSaveStatus('saved');
            setLastSavedAt(Date.now());
            setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Deleted page: ${pageNameToDelete}` }]);
        } catch {
            setSaveStatus('error');
            setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] Failed to delete page on server.` }]);
        }
    };

    const flushPendingSaves = async () => {
        const timers = pendingPatchTimersRef.current;
        const payloads = pendingPatchPayloadsRef.current;
        const keys = Object.keys(payloads);
        if (keys.length === 0) return;
        setSaveStatus('saving');
        for (const secId of keys) {
            if (timers[secId]) {
                clearTimeout(timers[secId]);
                delete timers[secId];
            }
            const contentData = payloads[secId];
            delete payloads[secId];
            try {
                await API.patch(`sections/${secId}/`, { content_data: contentData });
            } catch {
                setSaveStatus('error');
                return;
            }
        }
        setSaveStatus('saved');
        setLastSavedAt(Date.now());
    };

    const handleUpdateSectionContent = (sectionId, key, value) => {
        const currentSections = sectionsRef.current;
        const patch = (typeof key === 'object' && key !== null) ? key : { [key]: value };
        const newSections = currentSections.map(sec => {
            if (String(sec.id) === String(sectionId)) {
                return { ...sec, content_data: { ...sec.content_data, ...patch } };
            }
            return sec;
        });
        
        sectionsRef.current = newSections;
        commitHistory(newSections, currentSections);

        const isNumericId = /^\d+$/.test(String(sectionId));
        if (isNumericId && !isPublicPreview) {
            const targetSec = newSections.find(s => String(s.id) === String(sectionId));
            if (targetSec) {
                setSaveStatus('dirty');
                pendingPatchPayloadsRef.current[sectionId] = targetSec.content_data;
                if (pendingPatchTimersRef.current[sectionId]) {
                    clearTimeout(pendingPatchTimersRef.current[sectionId]);
                }
                pendingPatchTimersRef.current[sectionId] = setTimeout(async () => {
                    const latestData = pendingPatchPayloadsRef.current[sectionId];
                    delete pendingPatchTimersRef.current[sectionId];
                    delete pendingPatchPayloadsRef.current[sectionId];
                    if (!latestData) return;
                    setSaveStatus('saving');
                    try {
                        await API.patch(`sections/${sectionId}/`, { content_data: latestData });
                        setSaveStatus('saved');
                        setLastSavedAt(Date.now());
                    } catch {
                        setSaveStatus('error');
                        setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] Autosave failed for section #${sectionId}` }]);
                    }
                }, 450);
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
        } catch {
            setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] Layout reorder failed to save to database.` }]);
        }
    };

    const handleAddManualSection = async (type) => {
        const tempId = `sec-${Date.now()}`;
        const defaultContent = DEFAULT_BLOCK_DATA[type] || {};
        const newSection = { id: tempId, section_type: type, content_data: defaultContent };
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

        const activePageObj = pages.find(p => p.name === activePage);
        if (!isPublicPreview && activePageObj && /^\d+$/.test(String(activePageObj.id))) {
            setSaveStatus('saving');
            try {
                const res = await API.post('sections/', {
                    page: activePageObj.id,
                    section_type: type,
                    order: insertIndex,
                    content_data: defaultContent,
                });
                const savedSec = res.data;
                setSections(prev => prev.map(s => (s.id === tempId ? savedSec : s)));
                setPages(prevPages => prevPages.map(p => (
                    p.name === activePage
                        ? { ...p, sections: (p.sections || []).map(s => (s.id === tempId ? savedSec : s)) }
                        : p
                )));
                setSaveStatus('saved');
                setLastSavedAt(Date.now());
                setTerminalLogs(prev => [...prev, { type: "success", text: `[SUCCESS] Added ${type} section and saved to database.` }]);
                return;
            } catch {
                setSaveStatus('error');
            }
        }
        setTerminalLogs(prev => [...prev, { type: "success", text: `[SUCCESS] Added ${type} block to canvas.` }]);
    };

    const handleDeleteSection = async (sectionId) => {
        const currentSections = sectionsRef.current;
        const newSections = currentSections.filter(s => String(s.id) !== String(sectionId));
        
        sectionsRef.current = newSections;
        commitHistory(newSections, currentSections);
        
        const isNumericId = /^\d+$/.test(String(sectionId));
        if (isNumericId && !isPublicPreview) {
            setSaveStatus('saving');
            try {
                await API.delete(`sections/${sectionId}/`);
                setSaveStatus('saved');
                setLastSavedAt(Date.now());
                setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Deleted section from database.` }]);
            } catch {
                setSaveStatus('error');
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
        const tempId = `sec-dup-${Date.now()}`;
        const clonedData = JSON.parse(JSON.stringify(originalSection.content_data || {}));

        const clonedSection = {
            id: tempId,
            section_type: originalSection.section_type,
            content_data: clonedData
        };

        const newSections = [
            ...currentSections.slice(0, sectionIndex + 1),
            clonedSection,
            ...currentSections.slice(sectionIndex + 1)
        ];

        sectionsRef.current = newSections;
        commitHistory(newSections, currentSections);

        const isNumericId = /^\d+$/.test(String(sectionId));
        if (!isPublicPreview) {
            setSaveStatus('saving');
            try {
                let res;
                if (isNumericId) {
                    res = await API.post(`sections/${sectionId}/duplicate/`);
                } else {
                    const activePageObj = pages.find(p => p.name === activePage);
                    if (activePageObj && /^\d+$/.test(String(activePageObj.id))) {
                        res = await API.post('sections/', {
                            page: activePageObj.id,
                            section_type: originalSection.section_type,
                            order: sectionIndex + 1,
                            content_data: clonedData,
                        });
                    }
                }
                if (res?.data?.id) {
                    setSections(prev => prev.map(s => (s.id === tempId ? res.data : s)));
                    setSaveStatus('saved');
                    setLastSavedAt(Date.now());
                }
            } catch {
                setSaveStatus('error');
            }
        }
        setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Duplicated section block.` }]);
    };

    const handleResumeParsed = (resData) => {
        if (!resData || !resData.sections || resData.sections.length === 0) {
            setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] No recognizable sections found in resume.` }]);
            return;
        }
        setResumeReviewData(resData);
    };

    const handleApplyResumeData = async (mode, editedSections = null) => {
        const candidateSections = Array.isArray(editedSections) && editedSections.length > 0
            ? editedSections
            : resumeReviewData?.sections;
        if (!candidateSections || candidateSections.length === 0) return;

        const cleanNew = sanitizeAndSortSections(candidateSections);
        const activePageObj = pages.find(p => p.name === activePage);
        const currentSections = sectionsRef.current;

        let targetSections = cleanNew;
        if (mode === 'append') {
            targetSections = sanitizeAndSortSections([...currentSections, ...cleanNew]);
        }

        // Persist reviewed sections to backend database
        if (!isPublicPreview && activePageObj && /^\d+$/.test(String(activePageObj.id))) {
            setSaveStatus('saving');
            try {
                if (mode === 'replace') {
                    for (const oldSec of currentSections) {
                        if (/^\d+$/.test(String(oldSec.id))) {
                            await API.delete(`sections/${oldSec.id}/`).catch(() => {});
                        }
                    }
                }
                const savedSections = [];
                for (let idx = 0; idx < cleanNew.length; idx++) {
                    const sec = cleanNew[idx];
                    const res = await API.post('sections/', {
                        page: activePageObj.id,
                        section_type: sec.section_type,
                        order: mode === 'append' ? currentSections.length + idx : idx,
                        content_data: sec.content_data || {},
                    });
                    savedSections.push(res.data);
                }
                targetSections = mode === 'append'
                    ? sanitizeAndSortSections([...currentSections, ...savedSections])
                    : sanitizeAndSortSections(savedSections);
                setSaveStatus('saved');
                setLastSavedAt(Date.now());
            } catch {
                setSaveStatus('error');
                notify("Applied to canvas, though some sections failed to sync.", "error");
            }
        }

        sectionsRef.current = targetSections;
        if (mode === 'replace') {
            setHistory({ past: [], future: [] });
            setSections(targetSections);
            setPages(prev => prev.map(p => (p.name === activePage ? { ...p, sections: targetSections } : p)));
            setTerminalLogs(prev => [...prev, { type: "success", text: `[SUCCESS] Canvas replaced & saved with reviewed resume data.` }]);
        } else {
            commitHistory(targetSections, currentSections);
            setTerminalLogs(prev => [...prev, { type: "success", text: `[SUCCESS] Reviewed resume sections merged & saved.` }]);
        }
        setResumeReviewData(null);
    };

    const handleCancelResumeData = () => {
        setResumeReviewData(null);
        setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Resume extraction application cancelled.` }]);
    };

    const triggerDeployment = async () => {
        await flushPendingSaves();
        const pid = portfolioMeta?.id || portfolioId;
        const qs = pid ? `?portfolio_id=${pid}` : '';

        setSaveStatus('saving');
        setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Syncing settings and publishing portfolio...` }]);
        notify("Publishing your portfolio...", "info");

        try {
            await updatePortfolioSettings({
                isPublished: true,
                ...(userData?.theme ? { theme: userData.theme } : {}),
                globalBg: globalBg || "",
                ...(globalFont ? { globalFont } : {}),
                ...(userData?.frontpageTemplate ? { frontpageTemplate: userData.frontpageTemplate } : {}),
            });

            const ownerHandle = (userData?.email?.split('@')?.[0] || userData?.name || "developer").toLowerCase().replace(/[^a-z0-9._-]/g, '');
            const slugQuery = portfolioMeta?.slug ? `?portfolio=${encodeURIComponent(portfolioMeta.slug)}` : '';
            let liveUrl = `${window.location.origin}/preview/${encodeURIComponent(ownerHandle)}${slugQuery}`;

            try {
                const deployRes = await API.post(`deploy/${qs}`, {
                    portfolio_id: pid,
                    title: portfolioMeta?.title || `${userData?.name || 'Developer'} Portfolio`,
                    site_url: liveUrl,
                });
                if (deployRes.data?.url) {
                    liveUrl = deployRes.data.url;
                }
            } catch (deployErr) {
                // If deploy hook is not configured (e.g., no Vercel env hook), internal public preview URL is still live!
                if (deployErr.response?.status && deployErr.response.status >= 500 && !deployErr.response?.data?.fallback_preview) {
                    notify(deployErr.response?.data?.error || "External deploy hook unavailable; internal preview link published.", "info");
                }
            }

            setPortfolioMeta(prev => ({ ...prev, isPublished: true, publishedUrl: liveUrl }));
            await navigator.clipboard.writeText(liveUrl).catch(() => {});
            setTerminalLogs(prev => [...prev, { type: "success", text: `[SUCCESS] Portfolio is now live at: ${liveUrl}` }]);
            notify(`Published live! URL copied to clipboard.`, "success");
            window.open(liveUrl, '_blank', 'noopener,noreferrer');
        } catch (err) {
            setSaveStatus('error');
            const msg = err.response?.data?.error || "Failed to publish portfolio. Please check your connection.";
            setTerminalLogs(prev => [...prev, { type: "error", text: `[ERROR] ${msg}` }]);
            notify(msg, "error");
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

    const handleResetWorkspace = async () => {
        if (!window.confirm("Are you sure you want to clear the canvas? This action cannot be undone.")) return;
        const currentSections = sectionsRef.current;
        sectionsRef.current = [];
        commitHistory([], currentSections);
        
        // Clear from database
        for (const sec of currentSections) {
            if (/^\d+$/.test(String(sec.id))) {
                try {
                    await API.delete(`sections/${sec.id}/`);
                } catch { /* ignore */ }
            }
        }
        setTerminalLogs(prev => [...prev, { type: "system", text: `[SYSTEM] Workspace canvas reset.` }]);
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
        handleRenamePage,
        handleDeletePage,
        handleUpdateSectionContent,
        flushPendingSaves,
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
        handleResetWorkspace,
        selectedSection,
        localContent,
        isSectionsLoading,
        publicNotFound,
        saveStatus,
        lastSavedAt,
        portfolioMeta,
        setPortfolioMeta,
        updatePortfolioSettings,
    };

    return (
        <WorkspaceContext.Provider value={value}>
            {children}
        </WorkspaceContext.Provider>
    );
};
