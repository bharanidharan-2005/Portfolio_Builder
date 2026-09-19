import React from 'react';
import { FileText, CheckCircle, XCircle } from 'lucide-react';

export default function ResumeReviewModal({ isOpen, onClose, resumeData, onApply, isLight }) {
    if (!isOpen || !resumeData) return null;

    const sections = resumeData.sections || [];
    const extractedSectionNames = sections.map(s => s.section_type).filter(Boolean).join(", ");

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700 text-slate-200'}`}>
                
                <div className={`p-6 border-b flex items-center gap-3 ${isLight ? 'border-slate-100 bg-slate-50' : 'border-slate-800 bg-slate-800/50'}`}>
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">Review Extracted Data</h2>
                        <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            The AI successfully processed your resume.
                        </p>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[50vh] custom-scrollbar space-y-4">
                    
                    <div className={`p-4 rounded-xl border ${isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-900/10 border-emerald-500/20 text-emerald-400'}`}>
                        <h3 className="font-bold flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4" /> Extraction Success
                        </h3>
                        <p className="text-sm opacity-80">
                            We extracted {sections.length} distinct sections from your resume: {extractedSectionNames}.
                        </p>
                    </div>

                    <div className={`p-4 rounded-xl border ${isLight ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-blue-900/10 border-blue-500/20 text-blue-400'}`}>
                        <h3 className="font-bold mb-2">How would you like to proceed?</h3>
                        <p className="text-sm opacity-80 mb-4">
                            You can choose to completely overwrite your existing canvas, or intelligently merge these new sections into your current portfolio.
                        </p>
                    </div>
                    
                </div>

                <div className={`p-6 border-t flex flex-col sm:flex-row items-center justify-end gap-3 ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-slate-800/30 border-slate-800'}`}>
                    <button 
                        onClick={onClose}
                        className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold transition-all border ${isLight ? 'text-slate-600 border-slate-200 hover:bg-slate-100' : 'text-slate-300 border-slate-700 hover:bg-slate-800'}`}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => onApply('append')}
                        className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md ${isLight ? 'bg-white border-slate-200 text-blue-600 hover:bg-slate-50 border' : 'bg-slate-800 border-slate-700 text-blue-400 hover:bg-slate-700 border'}`}
                    >
                        Append to Canvas
                    </button>
                    <button 
                        onClick={() => onApply('replace')}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
                    >
                        Replace Entire Canvas
                    </button>
                </div>
            </div>
        </div>
    );
}
