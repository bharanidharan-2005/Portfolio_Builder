import React from 'react';
import { Sparkles, User, GraduationCap, Zap, Rocket, Mail, Edit3, Globe, Loader2, Activity, Link2, ShieldCheck, Crosshair, TrendingUp, Palette, CheckCircle2, Image as ImageIcon, Send, Copy, Share2, Download, LayoutTemplate, PenTool } from 'lucide-react';
import { API } from '../../../api';
import { PORTFOLIO_THEMES, PORTFOLIO_FONTS } from '../../../canvas/themes';

export default function RoleMatcherTool(props) {
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
                <span className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}> <Crosshair className="w-4 h-4 text-emerald-500" /> Target Matcher </span>
            </div>

            <p className={`text-[11px] leading-relaxed mb-2 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>
                Paste a Target Job Description. AI extracts missing stack items and injects them directly into your canvas.
            </p>

            <textarea
                rows="5"
                value={jdInput}
                onChange={(e) => setJdInput(e.target.value)}
                placeholder="Paste Target Job Description here..."
                className={`w-full text-xs p-4 rounded-2xl border outline-none resize-none transition-all duration-300 focus:ring-2 focus:ring-emerald-500/50 ${isLight ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400' : 'bg-[#15161D] border-slate-800 text-slate-200 placeholder-slate-500'}`}
            />

            <button
                disabled={isProcessing || !jdInput.trim()}
                onClick={handleAnalyzeJD}
                className={`w-full py-3.5 rounded-xl text-xs font-bold transition-all duration-300 shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${isProcessing || !jdInput.trim() ? 'bg-emerald-900/30 text-emerald-300/50 cursor-not-allowed border border-emerald-900/20 shadow-none' : 'bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-emerald-900/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]'
                    }`}
            >
                {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Extracting Requirements...</> : <><Crosshair className="w-4 h-4" /> Analyze Match</>}
            </button>

            {matchScore !== null && (
                <div className={`p-6 rounded-3xl border flex flex-col items-center justify-center space-y-3 animate-in slide-in-from-bottom-4 duration-500 shadow-xl ${isLight ? 'bg-emerald-50/80 border-emerald-200' : 'bg-[#0B1410] border-emerald-900/50'}`}>
                    <div className={`text-5xl font-black tracking-tighter ${matchScore > 75 ? 'text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-emerald-600' : matchScore > 40 ? 'text-orange-500' : 'text-red-500'}`}>
                        {matchScore}%
                    </div>
                    <div className={`text-[10px] font-bold uppercase tracking-widest ${isLight ? 'text-emerald-700' : 'text-emerald-500'}`}>Alignment Score</div>

                    {missingKeywords.length > 0 ? (
                        <>
                            <div className="text-[11px] text-center my-2 text-slate-400 bg-black/20 p-3 rounded-xl border border-white/5">
                                Missing: <span className="font-bold text-orange-400">{missingKeywords.join(', ')}</span>
                            </div>
                            <button
                                onClick={handleInjectKeywords}
                                className={`w-full mt-2 px-4 py-3 rounded-xl text-[11px] font-bold border transition-all duration-300 cursor-pointer hover:scale-[1.02] ${isLight ? 'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 shadow-sm' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 shadow-[inset_0_1px_1px_rgba(16,185,129,0.1)]'}`}
                            >
                                Auto-Inject Missing Keywords onto Canvas
                            </button>
                        </>
                    ) : matchScore === 0 ? (
                        <div className="text-[11px] text-center my-2 text-red-500 font-bold bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                            No matching skills found.
                        </div>
                    ) : (
                        <div className="text-[11px] text-center my-2 text-emerald-500 font-bold bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                            Fully aligned with requirements!
                        </div>
                    )}
                </div>
            )}
        </div>
    
    );
}
