import React from 'react';
import { Sparkles, User, GraduationCap, Zap, Rocket, Mail, Edit3, Globe, Loader2, Activity, Link2, ShieldCheck, Crosshair, TrendingUp, Palette, CheckCircle2, Image as ImageIcon, Send, Copy, Share2, Download, LayoutTemplate, PenTool } from 'lucide-react';
import { API } from '../../../api';
import { PORTFOLIO_THEMES, PORTFOLIO_FONTS } from '../../../canvas/themes';

export default function ActivityLogTool(props) {
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

        <div className="flex-1 space-y-6 flex flex-col h-full animate-in fade-in zoom-in-95 duration-500 ease-out">
            <div className="flex items-center gap-2 mb-2 border-b pb-4 border-slate-800/50 shrink-0">
                <Activity className={`w-4 h-4 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} />
                <span className={`text-[11px] font-black uppercase tracking-widest ${isLight ? 'text-slate-800' : 'text-slate-200'}`}> Activity Log </span>
            </div>

            <div ref={largeLogContainerRef} className={`flex-1 overflow-y-auto space-y-3 p-4 rounded-xl border shadow-inner text-xs font-mono custom-scrollbar ${isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-[#090A0F] border-slate-800 text-slate-400'}`}>
                <div className="flex items-center gap-1.5 mb-4 opacity-50 pb-3 border-b border-slate-700/50 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                    <span className="ml-2 text-[10px] uppercase tracking-widest">Studio Terminal v2.1</span>
                </div>
                {terminalLogs && terminalLogs.map((log, i) => (
                    <div key={i} className={`flex items-start gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300 ${log.type === 'system' ? 'opacity-70' : log.type === 'success' ? 'text-emerald-400 font-bold' : log.type === 'error' ? 'text-red-400 font-bold' : log.type === 'user' ? (isLight ? 'text-blue-600 font-bold' : 'text-orange-400 font-bold') : 'italic opacity-50'
                        }`}>
                        <span className="opacity-50 select-none mt-0.5">{">"}</span>
                        <span className="leading-relaxed whitespace-pre-wrap">{log.text}</span>
                    </div>
                ))}
            </div>
        </div>
    
    );
}
