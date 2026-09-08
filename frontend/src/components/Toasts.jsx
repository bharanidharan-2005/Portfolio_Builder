// Toast stack rendered top-right. Auto-dismissing, with optional action button
// (e.g. "Undo") for non-destructive AI edits. Receives state from App so it
// stays fully controlled; the global 'aurabuild-toast' listener lives in App.
export default function Toasts({ toasts, dismissToast }) {
    return (
        <div className="fixed top-4 right-4 z-[80] flex flex-col gap-2 w-[min(92vw,340px)] pointer-events-none" aria-live="polite">
            {toasts.map(t => (
                <div
                    key={t.id}
                    className={`animate-toast-in pointer-events-auto rounded-xl border px-4 py-3 text-xs font-medium shadow-2xl flex items-start justify-between gap-3 ${
                        t.type === 'success'
                            ? 'bg-[#0d0e12] border-emerald-500/40 text-emerald-300'
                            : t.type === 'error'
                            ? 'bg-[#0d0e12] border-red-500/40 text-red-300'
                            : 'bg-[#0d0e12] border-[#232635] text-slate-200'
                    }`}
                    role="status"
                >
                    <span className="leading-relaxed">{t.message}</span>
                    <span className="flex items-center gap-2 shrink-0">
                        {t.actionLabel && t.onAction && (
                            <button
                                type="button"
                                onClick={() => { t.onAction(); dismissToast(t.id); }}
                                className="text-[10px] font-bold text-purple-400 hover:text-purple-300 uppercase tracking-wider shrink-0"
                            >
                                {t.actionLabel}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => dismissToast(t.id)}
                            className="text-slate-500 hover:text-slate-300 shrink-0"
                            aria-label="Dismiss notification"
                        >
                            ✕
                        </button>
                    </span>
                </div>
            ))}
        </div>
    );
}