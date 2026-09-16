import React from 'react';
import { Sparkles, User, GraduationCap, Zap, Rocket, Mail, Edit3, Globe, Loader2, Activity, Link2, ShieldCheck, Crosshair, TrendingUp, Palette, CheckCircle2, Image as ImageIcon, Send, Copy, Share2, Download, LayoutTemplate, PenTool } from 'lucide-react';
import { API } from '../../../api';
import { PORTFOLIO_THEMES, PORTFOLIO_FONTS } from '../../../canvas/themes';

export default function CodeExportTool(props) {
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
                <span className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}> <Globe className="w-4 h-4 text-cyan-500" /> Code Export Shell </span>
            </div>
            <p className={`text-[11px] leading-relaxed mb-4 p-3 rounded-xl border ${isLight ? 'text-cyan-800 bg-cyan-50 border-cyan-200' : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'}`}>
                Deploy to edge or download your raw React source code.
            </p>

            <div className="space-y-4 pt-2">
                <button
                    disabled={isProcessing}
                    onClick={async () => {
                        setIsProcessing(true
    );
}
