import React from 'react';
import { Sparkles, User, GraduationCap, Zap, Rocket, Mail, Edit3, Globe, Loader2, Activity, Link2, ShieldCheck, Crosshair, TrendingUp, Palette, CheckCircle2, Image as ImageIcon, Send, Copy, Share2, Download, LayoutTemplate, PenTool } from 'lucide-react';
import { API } from '../../../api';
import { PORTFOLIO_THEMES, PORTFOLIO_FONTS } from '../../../canvas/themes';

export default function ContentGeneratorTool(props) {
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
                <span className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}> <Sparkles className="w-4 h-4 text-blue-500" /> Content Generator </span>
            </div>

            <div className={`flex rounded-xl p-1.5 border shadow-inner transition-colors duration-300 ${isLight ? 'bg-slate-200/50 border-slate-300' : 'bg-slate-900/90 border-slate-800'}`}>
                {["generate", "improve", "ingest", "review"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setGenTab(tab)}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all duration-300 cursor-pointer relative overflow-hidden ${genTab === tab
                                ? (isLight ? 'bg-white text-blue-600 shadow-md ring-1 ring-blue-500/20' : 'bg-gradient-to-br from-slate-700 to-slate-800 text-blue-400 shadow-[0_4px_15px_rgba(0,0,0,0.5)] ring-1 ring-blue-500/30')
                                : (isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-white/60' : 'text-slate-400 hover:text-slate-100 hover:bg-white/5')
                            }`}
                    >
                        {tab}
                        {genTab === tab && (
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-blue-500 rounded-t-full shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                        )}
                    </button>
                ))}
            </div>

            {genTab === "generate" && (
                <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="space-y-3 pb-8">
                        {[
                            { title: "Generate Hero Section", sub: "Assembles profile structures & headlines.", icon: Sparkles, type: 'hero' },
                            { title: "Generate About Me Bio", sub: "Auto-writes deep professional summaries.", icon: User, type: 'about' },
                            { title: "Generate Education", sub: "Formats academic history and degrees.", icon: GraduationCap, type: 'education' },
                            { title: "Generate Skills Map", sub: "Quantifies technical and soft skill proficiency.", icon: Zap, type: 'skills' },
                            { title: "Generate Project Grid", sub: "Populates showcase grids and case studies.", icon: Rocket, type: 'projects_grid' },
                            { title: "Generate Contact Form", sub: "Builds a functional reach-out section.", icon: Mail, type: 'contact' },
                        ].map((bp, i) => (
                            <button
                                key={i}
                                disabled={isProcessing}
                                onClick={() => handleGenerateSection(bp.title, bp.type)}
                                className={`p-4 border rounded-2xl flex items-start gap-4 text-left transition-all duration-300 group cursor-pointer relative overflow-hidden ${isLight
                                        ? 'bg-gradient-to-b from-white to-slate-50 border-slate-200 hover:border-blue-400 hover:shadow-[0_10px_30px_rgba(37,99,235,0.12)] hover:-translate-y-1'
                                        : 'bg-gradient-to-b from-[#1A1C23] to-[#121319] border-slate-800 hover:border-blue-500/50 hover:shadow-[0_10px_30px_rgba(59,130,246,0.15)] hover:-translate-y-1'
                                    }`}
                            >
                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-r from-blue-500 to-purple-500`}></div>
                                <bp.icon className={`w-4 h-4 mt-0.5 shrink-0 transition-colors ${isLight ? 'text-blue-500 group-hover:text-blue-600' : 'text-blue-400 group-hover:text-blue-300'}`} />
                                <div>
                                    <div className={`text-xs font-bold transition-colors ${isLight ? 'text-slate-800' : 'text-slate-200'}`}> {bp.title} </div>
                                    <div className={`text-[10px] mt-1 leading-relaxed transition-colors ${isLight ? 'text-slate-500' : 'text-slate-400 group-hover:text-slate-300'}`}> {bp.sub} </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {genTab === "improve" && (
                <div className="space-y-5 animate-in slide-in-from-right-2 duration-300">
                    <div className="space-y-2">
                        <label className={`block text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}> Target Canvas Block </label>
                        <select
                            value={selectedAiSection}
                            onChange={(e) => setSelectedAiSection(e.target.value)}
                            className={`w-full text-xs font-semibold p-3.5 rounded-xl border outline-none cursor-pointer transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 ${isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#15161D] border-slate-800 text-slate-200'}`}
                        >
                            <option value="all">Entire Canvas (All Blocks)</option>
                            {(sections || []).map((sec) => (
                                <option key={sec.id} value={sec.id}>
                                    {(sec.section_type || '').toUpperCase().replace('_', ' ')} (ID: {sec.id})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className={`block text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}> Refinement Instructions </label>
                        <textarea
                            rows="4"
                            value={refinePrompt}
                            onChange={(e) => setRefinePrompt(e.target.value)}
                            placeholder="e.g., Make the tone more executive, concise, or focused on leadership..."
                            className={`w-full text-xs p-3.5 rounded-xl border outline-none resize-none transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 ${isLight ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400' : 'bg-[#15161D] border-slate-800 text-slate-200 placeholder-slate-500'}`}
                        />
                    </div>

                    <button
                        disabled={isProcessing || !refinePrompt.trim()}
                        onClick={handleRefineSection}
                        className={`w-full py-3.5 rounded-xl text-xs font-bold transition-all duration-300 shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${isProcessing || !refinePrompt.trim() ? 'bg-blue-900/30 text-blue-300/50 cursor-not-allowed border border-blue-900/20 shadow-none' : 'bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white shadow-blue-900/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]'
                            }`}
                    >
                        {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Rewriting Canvas...</> : <><Edit3 className="w-4 h-4" /> Mutate Target Content</>}
                    </button>
                </div>
            )}

            {genTab === "ingest" && (
                <div className="space-y-4 animate-in slide-in-from-right-2 duration-300">
                    <div className="space-y-2">
                        <label className={`block text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}> GitHub Auto-Ingestion </label>
                        <p className={`text-[10px] leading-relaxed mb-4 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}> Enter your GitHub username to automatically fetch repositories and populate your Projects and Skills sections. Make sure those sections exist on your canvas first!</p>
                        <input
                            type="text"
                            id="gh-username"
                            placeholder="e.g. torvalds"
                            className={`w-full text-xs p-3.5 rounded-xl border outline-none transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 ${isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#15161D] border-slate-800 text-slate-200'}`}
                        />
                    </div>
                    <button
                        disabled={isProcessing}
                        onClick={async () => {
                            const username = document.getElementById('gh-username')?.value;
                            if (!username) return;
                            setIsProcessing(true
    );
}
