import { AlertCircle, Check, Cloud, Loader2, RefreshCw } from "lucide-react";

export function SaveStatusBadge({ status = "saved", lastSavedAt = null, onRetry }) {
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>Saving...</span>
      </span>
    );
  }

  if (status === "error") {
    return (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-rose-500/12 text-rose-400 border border-rose-500/25 hover:bg-rose-500/20 transition-colors cursor-pointer"
        title="Click to retry sync"
      >
        <AlertCircle className="w-3 h-3" />
        <span>Sync failed</span>
        {onRetry && <RefreshCw className="w-2.5 h-2.5 ml-0.5" />}
      </button>
    );
  }

  if (status === "dirty") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <Cloud className="w-3 h-3" />
        <span>Unsaved</span>
      </span>
    );
  }

  const timeLabel = lastSavedAt
    ? new Date(lastSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
      title={timeLabel ? `Saved at ${timeLabel}` : "All changes saved"}
    >
      <Check className="w-3 h-3" />
      <span className="hidden sm:inline">Saved</span>
    </span>
  );
}

export default SaveStatusBadge;
