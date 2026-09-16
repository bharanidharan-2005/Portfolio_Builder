import React from 'react';
import { Sparkles, User, GraduationCap, Zap, Rocket, Mail, Edit3, Globe, Loader2, Activity, Link2, ShieldCheck, Crosshair, TrendingUp, Palette, CheckCircle2, Image as ImageIcon, Send, Copy, Share2, Download, LayoutTemplate, PenTool } from 'lucide-react';
import { API } from '../../../api';
import { PORTFOLIO_THEMES, PORTFOLIO_FONTS } from '../../../canvas/themes';

export default function ImpactQuantifierTool(props) {
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
                <span className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}> <TrendingUp className="w-4 h-4 text-orange-500" /> Impact Quantifier </span>
            </div>
            <p className={`text-[11px] leading-relaxed mb-4 p-3 rounded-xl border ${isLight ? 'text-orange-800 bg-orange-50 border-orange-200' : 'text-orange-400 bg-orange-500/10 border-orange-500/20'}`}>
                Scans canvas content and upgrades descriptions into metric-driven power statements using the STAR framework.
            </p>

            <div className="space-y-3">
                {[
                    { title: "Apply STAR Method", sub: "Restructures bullet points into Task, Action, Result on canvas.", icon: TrendingUp },
                    { title: "Quantify Metrics", sub: "Injects percentage gains and performance numbers into text.", icon: BarChart },
                    { title: "Action Verb Optimizer", sub: "Replaces weak verbs with strong technical verbs.", icon: PenTool },
                    { title: "Grammar & Tone Corrector", sub: "Fixes typos, punctuation, and formalizes phrasing.", icon: CheckCircle2 },
                ].map((bp, i) => (
                    <button
                        key={i}
                        disabled={isProcessing}
                        onClick={() => handleImpactAction(bp.title)}
                        className={`w-full flex items-start gap-3 p-3.5 rounded-2xl border transition-all duration-300 text-left cursor-pointer group hover:-translate-y-0.5 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''} ${isLight ? 'bg-white border-slate-200 hover:border-orange-400 hover:shadow-lg hover:shadow-orange-500/10' : 'bg-[#15161D] border-slate-800 hover:border-orange-500 hover:bg-slate-800 hover:shadow-lg hover:shadow-orange-900/20'}`}
                    >
                        <bp.icon className={`w-4 h-4 mt-0.5 shrink-0 transition-colors ${isLight ? 'text-orange-500 group-hover:text-orange-600' : 'text-orange-400 group-hover:text-orange-300'}`} />
                        <div>
                            <div className={`text-xs font-bold transition-colors ${isLight ? 'text-slate-800' : 'text-slate-200'}`}> {bp.title} </div>
                            <div className={`text-[10px] mt-1 leading-relaxed transition-colors ${isLight ? 'text-slate-500' : 'text-slate-400 group-hover:text-slate-300'}`}> {bp.sub} </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    
    );
}
