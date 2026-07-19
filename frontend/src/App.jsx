import React, { useState, useEffect } from 'react';
import API from './api';
import PipelineBar from './components/PipelineBar';
import LeftNavSidebar from './components/LeftNavSidebar';
import AIRefinementPanel from './components/AIRefinementPanel';
import CanvasContainer from './canvas/CanvasContainer';
import LandingPage from './components/LandingPage';

export default function App() {
    // 🧭 STATE MACHINE: LANDING -> NAME -> CREDENTIALS -> VERIFICATION -> PREFERENCES -> AI_PROMPT -> WORKSPACE
    const [onboardingStep, setOnboardingStep] = useState('LANDING');

    const [userData, setUserData] = useState({
        name: '',
        email: '',
        password: '',
        category: '',
        theme: 'cyberpunk_neon',
    });
    const [errorMessage, setErrorMessage] = useState('');

    // Auth & OTP States
    const [otpCode, setOtpCode] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // AI Blueprint States
    const [aiPrompt, setAiPrompt] = useState("create a portfolio for a 3rd year Computer Science and Engineering (CSE) student");
    const [isGeneratingBlueprint, setIsGeneratingBlueprint] = useState(false);

    // Dynamic Categories State
    const [categories, setCategories] = useState([
        '🏗️ Engineering',
        '🎓 Arts & Science',
        '💼 Management',
        '⚕️ Medical & Health Sciences',
        '🌾 Agriculture & Allied Sciences'
    ]);

    // Core Application Layout States
    const [pages, setPages] = useState([]);
    const [activePage, setActivePage] = useState("");
    const [activeSectionId, setActiveSectionId] = useState(null);
    const [viewMode, setViewMode] = useState("Desktop");
    const [aiLogs, setAiLogs] = useState([]);
    const [activeTool, setActiveTool] = useState(null);

    // 🌐 Fetch state array rows layout loop from Python backend engine
    const fetchWorkspaceData = () => {
        API.get('pages/')
            .then(res => {
                setPages(res.data);
                if (res.data.length > 0 && !activePage) {
                    setActivePage(res.data[0].name);
                    if (res.data[0].sections && res.data[0].sections.length > 0) {
                        setActiveSectionId(res.data[0].sections[0].id);
                    }
                }
            })
            .catch(err => console.error("Database connection dropped:", err));
    };

    // 🌐 DYNAMIC URL SYNC
    useEffect(() => {
        if (onboardingStep === 'WORKSPACE') {
            fetchWorkspaceData();
            if (userData.name && userData.name.trim() !== '') {
                const formattedName = userData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                window.history.pushState({}, '', `/${formattedName}/workspace`);
            } else {
                window.history.pushState({}, '', `/guest/workspace`);
            }
        } else if (onboardingStep === 'LANDING') {
            window.history.pushState({}, '', `/`);
        }
    }, [onboardingStep, userData.name]);

    // ---------------------------------------------------------
    // 🚀 ONBOARDING FLOW HANDLERS
    // ---------------------------------------------------------

    const handleNameSubmit = (e) => {
        e.preventDefault();
        if (userData.name && userData.name.trim().length > 0) {
            setErrorMessage('');
            setOnboardingStep('CREDENTIALS');
        } else {
            setErrorMessage('Please introduce your name first.');
        }
    };

    const handleCredentialsSubmit = (e) => {
        e.preventDefault();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) { setErrorMessage('Please enter a valid email format.'); return; }
        if (userData.password.length < 8) { setErrorMessage('Password must be 8+ characters.'); return; }

        setIsProcessing(true);
        setErrorMessage('');

        API.post('send-otp/', { email: userData.email })
            .then(() => {
                setIsProcessing(false);
                setOnboardingStep('VERIFICATION');
            })
            .catch(() => {
                setIsProcessing(false);
                setErrorMessage('Failed to send verification code. Check server.');
            });
    };

    const handleVerificationSubmit = (e) => {
        e.preventDefault();
        if (otpCode.length !== 6) { setErrorMessage('Enter the 6-digit code.'); return; }

        setIsProcessing(true);

        API.post('verify-otp/', { email: userData.email, otp: otpCode })
            .then(() => {
                setIsProcessing(false);
                setErrorMessage('');
                setOnboardingStep('PREFERENCES');
            })
            .catch(() => {
                setIsProcessing(false);
                setErrorMessage('Invalid or expired verification code.');
            });
    };

    const handleAddCategory = () => {
        const newCat = prompt("Enter new category name (e.g., 🎨 Design):");
        if (newCat && newCat.trim()) {
            setCategories([...categories, newCat.trim()]);
        }
    };

    const handleGenerateBlueprint = () => {
        setIsGeneratingBlueprint(true);
        setErrorMessage('');

        API.post('generate-template/', { goal: aiPrompt })
            .then(() => {
                setIsGeneratingBlueprint(false);
                setOnboardingStep('WORKSPACE');
            })
            .catch(() => {
                setIsGeneratingBlueprint(false);
                setErrorMessage('AI orchestration failed or connection timed out. Verify your API Key configuration.');
            });
    };

    // ---------------------------------------------------------
    // 🎨 WORKSPACE ACTION HANDLERS
    // ---------------------------------------------------------

    const handleNewPrompt = (promptPayload, isFile = false) => {
        let requestData;
        let configHeaders = {};

        if (isFile) {
            requestData = promptPayload;
            configHeaders = { headers: { 'Content-Type': 'multipart/form-data' } };
        } else {
            requestData = { prompt: promptPayload, section_id: activeSectionId };
        }

        API.post('ai-refinement/', requestData, configHeaders)
            .then(res => {
                setAiLogs(prev => [res.data.log, ...prev]);
                API.get('pages/')
                    .then(pagesRes => {
                        setPages(pagesRes.data);
                        if (pagesRes.data.length > 0 && activePage) {
                            const updatedPage = pagesRes.data.find(p => p.name === activePage);
                            if (updatedPage && updatedPage.sections && updatedPage.sections.length > 0 && !activeSectionId) {
                                setActiveSectionId(updatedPage.sections[0].id);
                            }
                        }
                    })
                    .catch(syncErr => console.error("Post-parse workspace matrix sync failed:", syncErr));
            })
            .catch(err => console.error("AI mutation pipeline error:", err));
    };

    const handleMasterResumeDataExtracted = (fullExtractedData) => {
        API.get('pages/')
            .then(res => {
                setPages(res.data);
                if (res.data.length > 0 && res.data[0].sections && res.data[0].sections.length > 0) {
                    setActiveSectionId(res.data[0].sections[0].id);
                }
            })
            .catch(err => console.error("Post-upload schema synchronizer refresh failed:", err));
    };

    const handleManualSectionSave = (sectionId, updatedContentData) => {
        if (String(sectionId).includes('education')) {
            setPages(prevPages => prevPages.map(page => ({
                ...page,
                sections: page.sections.map(sec =>
                    sec.section_type === 'education' ? {...sec, content_data: updatedContentData } : sec
                )
            })));
            return;
        }

        API.patch(`sections/${sectionId}/`, { content_data: updatedContentData })
            .then(() => fetchWorkspaceData())
            .catch(err => console.error("Manual adjustment update error:", err));
    };

    // ---------------------------------------------------------
    // 🖥️ RENDER: ONBOARDING WIZARD & LANDING PAGE
    // ---------------------------------------------------------

    if (onboardingStep !== 'WORKSPACE') {
        return ( <
            div className = "flex flex-col h-screen w-screen bg-[#090a0f] font-sans" >

            { /* --- 1. SHOW LANDING PAGE --- */ } {
                onboardingStep === 'LANDING' && ( <
                    LandingPage onStart = {
                        () => setOnboardingStep('NAME')
                    }
                    />
                )
            }

            { /* --- 2. SHOW SETUP WIZARD --- */ } {
                onboardingStep !== 'LANDING' && ( <
                    div className = "flex flex-col h-full items-center justify-center p-4 relative" >
                    <
                    button onClick = {
                        () => setOnboardingStep('WORKSPACE')
                    }
                    className = "absolute top-6 right-6 text-[10px] bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 font-bold px-3 py-1.5 border border-purple-500/20 rounded-lg transition-all" > ⏩Skip Setup wizard < /button>

                    <
                    div className = "w-full max-w-md bg-[#13151c] border border-[#1f222c] rounded-2xl p-8 shadow-2xl" >
                    <
                    div className = "flex items-center gap-2.5 mb-6 justify-center" >
                    <
                    span className = "w-8 h-8 bg-[#a855f7] rounded-xl flex items-center justify-center font-black text-white text-sm shadow-lg" > A < /span>  <
                    span className = "font-bold text-white tracking-wide text-md" > AuraBuild Workspace < /span>  < /
                    div >

                    {
                        errorMessage && ( <
                            div className = "bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl mb-4 text-center" > { errorMessage } < /div>
                        )
                    }

                    {
                        onboardingStep === 'NAME' && ( <
                            form onSubmit = { handleNameSubmit }
                            className = "space-y-4" >
                            <
                            label className = "block text-[10px] uppercase font-bold tracking-wider text-slate-500" > What is your user name ? < /label>  <
                            input type = "text"
                            autoFocus placeholder = "Introduce yourself..."
                            className = "w-full bg-[#181a24] border border-[#232635] rounded-xl px-4 py-3 text-xs outline-none text-white focus:border-[#a855f7]"
                            value = { userData.name }
                            onChange = {
                                (e) => setUserData({...userData, name: e.target.value })
                            }
                            />  <
                            button type = "submit"
                            className = "w-full bg-[#a855f7] text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest" > Continue Setup < /button>  < /
                            form >
                        )
                    }

                    {
                        onboardingStep === 'CREDENTIALS' && ( <
                            form onSubmit = { handleCredentialsSubmit }
                            className = "space-y-4" >
                            <
                            p className = "text-xs text-[#a855f7] font-semibold" > Pleasure meeting you, { userData.name }! < /p>  <
                            input type = "text"
                            placeholder = "name@domain.com"
                            className = "w-full bg-[#181a24] border border-[#232635] rounded-xl px-4 py-3 text-xs outline-none text-white focus:border-[#a855f7]"
                            value = { userData.email }
                            onChange = {
                                (e) => setUserData({...userData, email: e.target.value })
                            }
                            />  <
                            input type = "password"
                            placeholder = "Set a password (8+ chars)"
                            className = "w-full bg-[#181a24] border border-[#232635] rounded-xl px-4 py-3 text-xs outline-none text-white focus:border-[#a855f7]"
                            value = { userData.password }
                            onChange = {
                                (e) => setUserData({...userData, password: e.target.value })
                            }
                            />  <
                            button type = "submit"
                            disabled = { isProcessing }
                            className = "w-full bg-[#a855f7] disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition-all" > { isProcessing ? 'Sending Code...' : 'Send Verification Code' } < /button>  < /
                            form >
                        )
                    }

                    {
                        onboardingStep === 'VERIFICATION' && ( <
                            form onSubmit = { handleVerificationSubmit }
                            className = "space-y-4" >
                            <
                            p className = "text-xs text-[#a855f7] font-semibold text-center mb-2" > We sent a 6 - digit code to { userData.email } < /p>  <
                            input type = "text"
                            maxLength = "6"
                            placeholder = "000000"
                            className = "w-full bg-[#181a24] border border-[#232635] rounded-xl px-4 py-4 text-center text-2xl tracking-[0.5em] outline-none text-white focus:border-[#a855f7] font-mono"
                            value = { otpCode }
                            onChange = {
                                (e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))
                            }
                            />  <
                            button type = "submit"
                            disabled = { isProcessing }
                            className = "w-full bg-[#a855f7] disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition-all" > { isProcessing ? 'Verifying...' : 'Verify Code' } < /button>  < /
                            form >
                        )
                    }

                    {
                        onboardingStep === 'PREFERENCES' && ( <
                            div className = "space-y-6" >
                            <
                            div className = "space-y-3" >
                            <
                            label className = "block text-[10px] uppercase font-bold tracking-wider text-slate-500" > 1. Select Portfolio Theme < /label>  <
                            div className = "grid grid-cols-2 gap-3" >
                            <
                            button type = "button"
                            onClick = {
                                () => setUserData({...userData, theme: 'cyberpunk_neon' })
                            }
                            className = { `py-2.5 rounded-xl border text-xs font-bold transition-all ${userData.theme === 'cyberpunk_neon' ? 'border-[#a855f7] bg-[#a855f7]/10 text-white shadow-lg' : 'border-[#232635] bg-[#181a24] text-slate-400 hover:border-slate-700'}` } > 🌙Cyberpunk < /button>  <
                            button type = "button"
                            onClick = {
                                () => setUserData({...userData, theme: 'minimal_clean' })
                            }
                            className = { `py-2.5 rounded-xl border text-xs font-bold transition-all ${userData.theme === 'minimal_clean' ? 'border-[#a855f7] bg-[#a855f7]/10 text-white shadow-lg' : 'border-[#232635] bg-[#181a24] text-slate-400 hover:border-slate-700'}` } > ☀️Minimal < /button>  < /
                            div > <
                            /div>  <
                            div className = "space-y-3" >
                            <
                            label className = "block text-[10px] uppercase font-bold tracking-wider text-slate-500" > 2. Select Your Category / Field < /label>  <
                            div className = "grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-2" > {
                                categories.map(cat => ( <
                                    button type = "button"
                                    key = { cat }
                                    onClick = {
                                        () => setUserData({...userData, category: cat })
                                    }
                                    className = { `w-full text-left px-4 py-3 rounded-xl text-xs transition-all border ${userData.category === cat ? 'border-[#a855f7] bg-[#a855f7]/10 text-white font-bold' : 'bg-[#181a24] border-[#232635] text-slate-300 hover:border-[#a855f7]'}` } > { cat } < /button>
                                ))
                            } <
                            /div>  <
                            button type = "button"
                            onClick = { handleAddCategory }
                            className = "w-full mt-2 py-2.5 border border-dashed border-[#232635] rounded-xl text-xs text-slate-400 hover:text-white hover:border-slate-500 transition-colors" > +Add Custom Category < /button>  < /
                            div > <
                            button type = "button"
                            disabled = {!userData.theme || !userData.category }
                            onClick = {
                                () => setOnboardingStep('AI_PROMPT')
                            }
                            className = "w-full bg-[#a855f7] hover:bg-purple-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition-all mt-4 shadow-lg shadow-purple-500/20" > Next: AI Blueprint < /button>  < /
                            div >
                        )
                    }

                    {
                        onboardingStep === 'AI_PROMPT' && ( <
                            div className = "space-y-4" >
                            <
                            h3 className = "text-[#a855f7] font-semibold mb-2 text-center" > ✨Let 's forge your layout matrix framework</h3> <
                            label className = "block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-2" >
                            Describe your portfolio design theme goal <
                            /label> <
                            textarea value = { aiPrompt }
                            onChange = {
                                (e) => setAiPrompt(e.target.value)
                            }
                            className = "w-full bg-[#181a24] border border-[#232635] rounded-xl p-4 text-xs outline-none text-white focus:border-[#a855f7] resize-none"
                            rows = "3" /
                            >
                            <
                            button type = "button"
                            onClick = { handleGenerateBlueprint }
                            disabled = { isGeneratingBlueprint }
                            className = "w-full bg-[#a855f7] hover:bg-purple-500 disabled:opacity-40 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-widest transition-colors shadow-lg shadow-purple-500/20" > { isGeneratingBlueprint ? "GENERATING..." : "GENERATE AI TEMPLATE BLUEPRINT" } <
                            /button> < /
                            div >
                        )
                    }

                    <
                    /div>  < /
                    div >
                )
            } <
            /div>
        );
    }

    // ---------------------------------------------------------
    // 🖥️ RENDER: MAIN WORKSPACE DASHBOARD
    // ---------------------------------------------------------

    const activePageObj = pages.find(p => p.name === activePage);
    const visibleSections = activePageObj ? activePageObj.sections : [];
    const currentSelectedSection = visibleSections.find(s => s.id === activeSectionId);

    return ( <
        div className = "flex flex-col h-screen w-screen font-sans overflow-hidden select-none bg-[#0d0e12] text-slate-200" >
        <
        header className = "h-14 border-b border-[#1f222c] bg-[#13151c] px-6 flex justify-between items-center text-sm shrink-0" >
        <
        div className = "flex items-center gap-8" >
        <
        div className = "flex items-center gap-2" >
        <
        span className = "w-6 h-6 bg-[#a855f7] rounded-lg flex items-center justify-center font-black text-white text-xs" > A < /span>  <
        span className = "font-bold tracking-wide text-white" > AuraBuild Workspace Studio < /span>  < /
        div > <
        span className = "text-[10px] px-2.5 py-0.5 border bg-[#1e2330] text-[#a855f7] border-[#a855f7]/20 rounded font-bold uppercase tracking-wider" >
        Operator Shell: { userData.name || "Guest" } { "//" } { userData.category ? userData.category.toUpperCase() : "UNASSIGNED" } <
        /span>  < /
        div > <
        div className = "text-xs flex gap-4 font-medium items-center text-slate-400" >
        <
        span > Theme: { userData.theme ? userData.theme.toUpperCase() : "NONE" } < /span>  <
        button onClick = {
            () => {
                setOnboardingStep('LANDING');
                setOtpCode('');
            }
        }
        className = "text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition-colors" > Reset Flow < /button>  < /
        div > <
        /header>

        {
            onboardingStep !== 'WORKSPACE' && < PipelineBar currentStep = { onboardingStep }
            />}

            <
            div className = "flex flex-1 overflow-hidden" >
                <
                LeftNavSidebar pages = { pages }
            activePage = { activePage }
            setActivePage = {
                (pageName) => { setActivePage(pageName); const targetPage = pages.find(p => p.name === pageName); if (targetPage && targetPage.sections && targetPage.sections.length > 0) setActiveSectionId(targetPage.sections[0].id); }
            }
            onSelectTool = {
                (toolKey) => setActiveTool(activeTool === toolKey ? null : toolKey)
            }
            activeTool = { activeTool }
            /> <
            main className = "flex-1 p-6 bg-[#090a0f] overflow-y-auto flex flex-col items-center justify-start" >
                <
                CanvasContainer viewMode = { viewMode }
            setViewMode = { setViewMode }
            activePage = { activePage }
            sections = { visibleSections }
            activeSectionId = { activeSectionId }
            setActiveSectionId = {
                (id) => setActiveSectionId(id)
            }
            portfolioTheme = { userData.theme }
            />  < /
            main >

                <
                AIRefinementPanel logs = { aiLogs }
            onSubmitPrompt = { handleNewPrompt }
            selectedSection = { currentSelectedSection }
            onManualUpdate = { handleManualSectionSave }
            activeTool = { activeTool }
            pages = { pages }
            userData = { userData }
            setUserData = { setUserData }
            onDataExtracted = { handleMasterResumeDataExtracted }
            />  < /
            div > <
                /div>
        );
    }