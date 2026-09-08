import LandingPage from './LandingPage';
import { notify } from '../toast';

// The multi-step onboarding flow: Landing → Name → Credentials → Login →
// Preferences → AI Prompt. Fully controlled by App via props.
export default function OnboardingWizard({
    step,
    themeMode,
    onToggleTheme,
    userData,
    onUpdateUser,
    errorMessage,
    isProcessing,
    categories,
    customCategoryInput,
    onCustomCategoryInputChange,
    isAddingCustomCategory,
    onToggleCustomCategoryForm,
    aiPrompt,
    onAiPromptChange,
    isGeneratingBlueprint,
    onNameSubmit,
    onCredentialsSubmit,
    onLoginSubmit,
    onAddCustomCategorySubmit,
    onGenerateBlueprint,
    onStepChange,
}) {
    return ( <
        div className = { `flex flex-col h-screen w-screen bg-slate-50 font-sans text-slate-800 ${themeMode === 'light' ? 'theme-light' : ''}` } > { /* Theme Toggle */ } <
        button type = "button"
        onClick = { onToggleTheme } {... { "aria-label": "Toggle light/dark theme" } }
        title = "Toggle light/dark theme"
        className = "fixed top-5 left-5 z-50 w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-blue-600 shadow-sm flex items-center justify-center text-sm transition-colors" >
        { themeMode === 'light' ? '🌙' : '☀️' } <
        /button>

        {
            step === 'LANDING' && ( <
                LandingPage onStart = {
                    () => onStepChange('NAME') }
                onLogin = {
                    () => onStepChange('LOGIN') }
                />
            )
        }

        {
            step !== 'LANDING' && ( <
                div className = "flex flex-col h-full items-center justify-center p-4 relative" >
                <
                button type = "button"
                onClick = {
                    () => onStepChange(localStorage.getItem('aurabuild_access') ? 'WORKSPACE' : 'LOGIN') }
                className = "absolute top-6 right-6 text-xs bg-white hover:bg-slate-50 text-slate-500 font-bold px-4 py-2 border border-slate-200 rounded-full transition-all shadow-sm" >
                Skip Setup⏩ <
                /button>

                <
                div className = "w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-xl" >
                <
                div className = "flex items-center gap-3 mb-8 justify-center" >
                <
                span className = "w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-md" >
                A <
                /span> <
                span className = "font-bold text-slate-800 tracking-tight text-xl" >
                AuraBuild <
                /span> <
                /div>

                {
                    errorMessage && ( <
                        div className = "bg-red-50 border border-red-100 text-red-600 text-xs p-3 rounded-xl mb-6 text-center font-medium" > { errorMessage } <
                        /div>
                    )
                }

                {
                    step === 'NAME' && ( <
                        form onSubmit = { onNameSubmit }
                        className = "space-y-5 animate-fade-in" >
                        <
                        div className = "space-y-1.5" >
                        <
                        label className = "block text-xs uppercase font-bold tracking-wider text-slate-500" >
                        What is your name ?
                        <
                        /label> <
                        input type = "text"
                        autoFocus placeholder = "Introduce yourself..."
                        className = "w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm outline-none text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                        value = { userData.name }
                        onChange = {
                            (e) => onUpdateUser({...userData, name: e.target.value }) }
                        /> <
                        /div> <
                        button type = "submit"
                        className = "w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md shadow-blue-600/20" >
                        Continue Setup <
                        /button> <
                        /form>
                    )
                }

                {
                    step === 'CREDENTIALS' && ( <
                        form onSubmit = { onCredentialsSubmit }
                        className = "space-y-5 animate-fade-in" >
                        <
                        p className = "text-sm text-blue-600 font-semibold text-center mb-6" >
                        Pleasure meeting you, { userData.name }!
                        <
                        /p>

                        <
                        div className = "space-y-3" >
                        <
                        input type = "email"
                        placeholder = "name@domain.com"
                        className = "w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm outline-none text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                        value = { userData.email }
                        onChange = {
                            (e) => onUpdateUser({...userData, email: e.target.value }) }
                        /> <
                        input type = "password"
                        placeholder = "Set a password (8+ chars)"
                        className = "w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm outline-none text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                        value = { userData.password }
                        onChange = {
                            (e) => onUpdateUser({...userData, password: e.target.value }) }
                        /> <
                        /div>

                        <
                        button type = "submit"
                        disabled = { isProcessing }
                        className = "w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md shadow-blue-600/20 mt-2" >
                        { isProcessing ? 'Initializing...' : 'Initialize Workspace' } <
                        /button> <
                        button type = "button"
                        onClick = {
                            () => onStepChange('LANDING') }
                        className = "w-full text-xs font-semibold text-slate-400 hover:text-slate-700 pt-2" >
                        ←Back <
                        /button> <
                        /form>
                    )
                }

                {
                    step === 'LOGIN' && ( <
                        form onSubmit = { onLoginSubmit }
                        className = "space-y-5 animate-fade-in" >
                        <
                        p className = "text-sm text-blue-600 font-semibold text-center mb-6" >
                        Welcome back, operator. <
                        /p>

                        <
                        div className = "space-y-2" >
                        <
                        label className = "block text-xs uppercase font-bold tracking-wider text-slate-500 text-center" >
                        Enter your workspace code <
                        /label> <
                        input type = "text"
                        placeholder = "q23hyQjdnkk9.xbhb"
                        autoFocus className = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-center text-lg tracking-[0.2em] outline-none text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono shadow-inner"
                        value = { userData.code }
                        onChange = {
                            (e) => onUpdateUser({...userData, code: e.target.value }) }
                        /> <
                        /div>

                        <
                        button type = "submit"
                        disabled = { isProcessing }
                        className = "w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md shadow-blue-600/20" >
                        { isProcessing ? 'Signing in...' : 'Log In' } <
                        /button>

                        <
                        p className = "text-xs text-slate-500 text-center leading-relaxed px-4" >
                        Forgot your code ? Re - enter your email on the setup screen and we will resend it. <
                        /p> <
                        button type = "button"
                        onClick = {
                            () => onStepChange('LANDING') }
                        className = "w-full text-xs font-semibold text-slate-400 hover:text-slate-700" >
                        ←Back <
                        /button> <
                        /form>
                    )
                }

                {
                    step === 'PREFERENCES' && ( <
                        div className = "space-y-8 animate-fade-in" > {
                            userData.code && ( <
                                div className = "bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3" >
                                <
                                p className = "text-[10px] font-bold uppercase tracking-wider text-emerald-700" > ✅Workspace initialized— save your login code <
                                /p> <
                                div className = "flex items-center justify-between gap-2 bg-white border border-emerald-100 rounded-lg px-3 py-2 shadow-sm" >
                                <
                                span className = "font-mono text-xs text-slate-800 font-bold break-all select-text" > { userData.code } <
                                /span> <
                                button type = "button"
                                onClick = {
                                    () => {
                                        navigator.clipboard && navigator.clipboard.writeText(userData.code);
                                        notify("Workspace code copied", 'success');
                                    }
                                }
                                className = "text-[10px] font-bold text-emerald-600 hover:text-emerald-700 shrink-0" >
                                ⧉Copy <
                                /button> <
                                /div> <
                                p className = "text-[10px] text-emerald-600 font-medium" >
                                Use this code to log in from any device.It was also emailed to { userData.email }. <
                                /p> <
                                /div>
                            )
                        }

                        <
                        div className = "space-y-3" >
                        <
                        label className = "block text-xs uppercase font-bold tracking-wider text-slate-500" >
                        1. Select Portfolio Theme <
                        /label> <
                        div className = "grid grid-cols-2 gap-3" >
                        <
                        button type = "button"
                        onClick = {
                            () => onUpdateUser({...userData, theme: 'cyberpunk_neon' }) }
                        className = { `py-3 rounded-xl border text-sm font-bold transition-all ${
                                                userData.theme === 'cyberpunk_neon'
                                                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                            }` } >
                        🌙Cyberpunk <
                        /button> <
                        button type = "button"
                        onClick = {
                            () => onUpdateUser({...userData, theme: 'minimal_clean' }) }
                        className = { `py-3 rounded-xl border text-sm font-bold transition-all ${
                                                userData.theme === 'minimal_clean'
                                                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                            }` } >
                        ☀️Minimal <
                        /button> <
                        /div> <
                        /div>

                        <
                        div className = "space-y-3" >
                        <
                        label className = "block text-xs uppercase font-bold tracking-wider text-slate-500" >
                        2. Select Your Category <
                        /label> <
                        div className = "grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar" > {
                            categories.map((cat) => ( <
                                button type = "button"
                                key = { cat }
                                onClick = {
                                    () => onUpdateUser({...userData, category: cat }) }
                                className = { `w-full text-left px-4 py-3.5 rounded-xl text-sm transition-all border flex items-center justify-between ${
                                                    userData.category === cat
                                                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-sm'
                                                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                                }` } >
                                <
                                span > { cat } < /span> {
                                    userData.category === cat && ( <
                                        span className = "text-blue-600 font-bold" > ✓ < /span>
                                    )
                                } <
                                /button>
                            ))
                        } <
                        /div>

                        {
                            isAddingCustomCategory ? ( <
                                form onSubmit = { onAddCustomCategorySubmit }
                                className = "pt-2 space-y-3" >
                                <
                                input type = "text"
                                placeholder = "New category name (e.g., 🎨 Design)"
                                value = { customCategoryInput }
                                onChange = {
                                    (e) => onCustomCategoryInputChange(e.target.value) }
                                autoFocus className = "w-full bg-white border border-blue-400 rounded-xl px-4 py-3 text-sm outline-none text-slate-800 shadow-sm focus:ring-2 focus:ring-blue-500/20" /
                                >
                                <
                                div className = "flex gap-2 justify-end" >
                                <
                                button type = "button"
                                onClick = {
                                    () => onToggleCustomCategoryForm(false) }
                                className = "px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800" >
                                Cancel <
                                /button> <
                                button type = "submit"
                                className = "px-4 py-2 text-xs font-bold bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors shadow-sm" >
                                Add Category <
                                /button> <
                                /div> <
                                /form>
                            ) : ( <
                                button type = "button"
                                onClick = {
                                    () => onToggleCustomCategoryForm(true) }
                                className = "w-full mt-2 py-3 border border-dashed border-slate-300 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:border-slate-400 hover:bg-slate-50 transition-colors" >
                                +Add Custom Category <
                                /button>
                            )
                        } <
                        /div>

                        <
                        button type = "button"
                        disabled = {!userData.theme || !userData.category }
                        onClick = {
                            () => onStepChange('AI_PROMPT') }
                        className = "w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all mt-6 shadow-md shadow-blue-600/20" >
                        Next: AI Blueprint <
                        /button> <
                        /div>
                    )
                }

                {
                    step === 'AI_PROMPT' && ( <
                        div className = "space-y-6 animate-fade-in" >
                        <
                        h3 className = "text-blue-600 font-bold text-center text-lg" > ✨Let 's forge your layout <
                        /h3> <
                        div className = "space-y-2" >
                        <
                        label className = "block text-xs uppercase font-bold tracking-wider text-slate-500" >
                        Describe your design theme goal <
                        /label> <
                        textarea value = { aiPrompt }
                        onChange = {
                            (e) => onAiPromptChange(e.target.value) }
                        placeholder = "e.g. A sleek, minimal layout focused on high-end backend engineering..."
                        className = "w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm outline-none text-slate-800 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 resize-none transition-all shadow-inner"
                        rows = "4" /
                        >
                        <
                        /div> <
                        button type = "button"
                        onClick = { onGenerateBlueprint }
                        disabled = { isGeneratingBlueprint }
                        className = "w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md shadow-blue-600/20" >
                        { isGeneratingBlueprint ? "Generating Template..." : "Generate AI Blueprint" } <
                        /button> <
                        /div>
                    )
                } <
                /div> <
                /div>
            )
        } <
        /div>
    );
}                       <
                        label className = "block text-xs uppercase font-bold tracking-wider text-slate-500" >
                        Describe your design theme goal <
                        /label> <
                        textarea value = { aiPrompt }
                        onChange = {
                            (e) => onAiPromptChange(e.target.value) }
                        placeholder = "e.g. A sleek, minimal layout focused on high-end backend engineering..."
                        className = "w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm outline-none text-slate-800 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 resize-none transition-all shadow-inner"
                        rows = "4" /
                        >
                        <
                        /div> <
                        button type = "button"
                        onClick = { onGenerateBlueprint }
                        disabled = { isGeneratingBlueprint }
                        className = "w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md shadow-blue-600/20" >
                        { isGeneratingBlueprint ? "Generating Template..." : "Generate AI Blueprint" } <
                        /button> <
                        /div>
                    )
                } <
                /div> <
                /div>
            )
        } <
        /div>
    );
}