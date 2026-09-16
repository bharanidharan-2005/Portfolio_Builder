import React from 'react';
import { Sparkles, User, GraduationCap, Zap, Rocket, Mail, Edit3, Globe, Loader2, Activity, Link2, ShieldCheck, Crosshair, TrendingUp, Palette, CheckCircle2, Image as ImageIcon, Send, Copy, Share2, Download, LayoutTemplate, PenTool } from 'lucide-react';
import { API } from '../../../api';
import { PORTFOLIO_THEMES, PORTFOLIO_FONTS } from '../../../canvas/themes';

export default function PaletteStudioTool(props) {
    const { 
        isLight, themeMode, activeTool, terminalLogs, setTerminalLogs, 
        sections, onUpdateSectionContent, onUpdateGlobalBg, onAddSection, onDeploy, onExportZip,
        activeTheme, onThemeChange, activeFont, onUpdateFont,
        
        genTab, setGenTab, selectedAiSection, setSelectedAiSection, refinePrompt, setRefinePrompt,
        vibeInput, setVibeInput, selectedTargetSection, setSelectedTargetSection, imagePrompt, setImagePrompt,
        jdInput, setJdInput, matchScore, setMatchScore, missingKeywords, setMissingKeywords,
        pitchTab, setPitchTab, pitchTarget, setPitchTarget, generatedPitchText, setGeneratedPitchText, seoData, setSeoData,
        imageTab, setImageTab, generatedImageUrl, setGeneratedImageUrl, uploadedImagePreview, setUploadedImagePreview,
        isProcessing, setIsProcessing, currentCompleteness,
        largeLogContainerRef,
        
        handleGenerateSection, handleRefineSection, executeAiAction, handleAnalyzeJD, handleInjectKeywords, handleImpactAction, handleGenerateVibe, handleApplyImage, handleGenerateSEO, handleGeneratePitch
    } = props;

    return (

        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 ease-out">
            <div className="flex items-center justify-between mb-4 border-b pb-4 border-slate-800/50">
                <span className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}> <Wand2 className="w-4 h-4 text-purple-500" /> Palette Studio </span>
            </div>

            <div className={`flex rounded-xl p-1.5 border shadow-inner transition-colors duration-300 ${isLight ? 'bg-slate-200/50 border-slate-300' : 'bg-slate-900/90 border-slate-800'}`}>
                {["themes", "fonts"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setPaletteTab(tab)}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all duration-300 cursor-pointer relative overflow-hidden ${paletteTab === tab
                                ? (isLight ? 'bg-white text-purple-600 shadow-md ring-1 ring-purple-500/20' : 'bg-gradient-to-br from-slate-700 to-slate-800 text-purple-400 shadow-[0_4px_15px_rgba(0,0,0,0.5)] ring-1 ring-purple-500/30')
                                : (isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-white/60' : 'text-slate-400 hover:text-slate-100 hover:bg-white/5')
                            }`}
                    >
                        {tab}
                        {paletteTab === tab && (
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-purple-500 rounded-t-full shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div>
                        )}
                    </button>
                ))}
            </div>

            {paletteTab === "themes" && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="space-y-3">
                        <label className={`block text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}> Describe your Vibe (AI Theme Selector) </label>
                        <div className="flex gap-2 relative group/input">
                            <input
                                type="text"
                                value={vibeInput}
                                onChange={(e) => setVibeInput(e.target.value)}
                                placeholder="e.g. Cyberpunk dark, clean minimal..."
                                className={`flex-1 text-xs px-4 py-3.5 rounded-xl border outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-300 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#15161D] border-slate-800'}`}
                            />
                            <button
                                disabled={isProcessing || !vibeInput.trim()}
                                onClick={handleGenerateVibe}
                                className={`bg-gradient-to-b from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white px-5 py-3.5 rounded-xl text-xs font-bold transition-all duration-300 shadow-lg active:scale-95 shadow-purple-900/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] ${isProcessing || !vibeInput.trim() ? 'opacity-50 cursor-not-allowed shadow-none' : 'cursor-pointer hover:shadow-xl hover:-translate-y-0.5'}`}
                            >
                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gen'}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className={`block text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}> Preset Brand Themes </label>
                        <div className="grid grid-cols-1 gap-3 pb-6">
                            {PORTFOLIO_THEMES && Object.entries(PORTFOLIO_THEMES).map(([themeKey, theme]) => {
                                const isSelected = activeTheme === themeKey;
                                return (
                                    <button
                                        key={themeKey}
                                        onClick={() => {
                                            if (onThemeChange) onThemeChange(themeKey
    );
}
