import React from 'react';
import { Sparkles, User, GraduationCap, Zap, Rocket, Mail, Edit3, Globe, Loader2, Activity, Link2, ShieldCheck, Crosshair, TrendingUp, Palette, CheckCircle2, Image as ImageIcon, Send, Copy, Share2, Download, LayoutTemplate, PenTool } from 'lucide-react';
import { API } from '../../../api';
import { PORTFOLIO_THEMES, PORTFOLIO_FONTS } from '../../../canvas/themes';

export default function ImageCustomizerTool(props) {
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
            <div className="flex items-center justify-between border-b pb-4 border-slate-800/50">
                <span className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}> 🖼️ Image Studio </span>
            </div>

            <div className={`flex rounded-xl p-1 border shadow-inner ${isLight ? 'bg-slate-100/50 border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
                {[
                    { id: "ai", label: "AI Gen" },
                    { id: "upload", label: "Upload" },
                    { id: "gallery", label: "Gallery" }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setImageTab(tab.id)}
                        className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all duration-300 cursor-pointer ${imageTab === tab.id
                                ? (isLight ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-900/5' : 'bg-slate-700 text-white shadow-md ring-1 ring-white/10')
                                : (isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-white/50' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5')
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="space-y-2">
                <label className={`block text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}> Target Canvas Block </label>
                <select
                    value={selectedTargetSection}
                    onChange={(e) => setSelectedTargetSection(e.target.value)}
                    className={`w-full text-xs font-semibold p-3.5 rounded-xl border outline-none cursor-pointer transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 ${isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#15161D] border-slate-800 text-slate-200'}`}
                >
                    <option value="global_bg">Entire Portfolio (Global Background)</option>
                    {(sections && sections.length > 0) ? (
                        sections.map((sec) => (
                            <option key={sec.id} value={sec.id}> {(sec.section_type || '').toUpperCase().replace('_', ' ')} (ID: {sec.id}) </option>
                        ))
                    ) : null}
                </select>
            </div>

            {imageTab === "ai" ? (
                <div className="space-y-4 animate-in slide-in-from-left-2 duration-300">
                    <div className="space-y-2">
                        <label className={`block text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}> Custom Image Prompt </label>
                        <textarea
                            rows="3"
                            value={imagePrompt}
                            onChange={(e) => setImagePrompt(e.target.value)}
                            placeholder="e.g. Glowing neural network connections..."
                            className={`w-full text-xs p-4 rounded-xl border outline-none resize-none transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 ${isLight ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400' : 'bg-[#15161D] border-slate-800 text-slate-200 placeholder-slate-500'}`}
                        />
                    </div>

                    <button
                        disabled={isProcessing}
                        onClick={async () => {
                            if (!imagePrompt.trim()) return setTerminalLogs(prev => [...prev, { type: "error", text: "[ERROR] Enter prompt." }]
    );
}
