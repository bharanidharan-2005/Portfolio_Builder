const TONE_CLASSES = {
  neutral:
    "bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20",
  accent:
    "bg-indigo-500/12 text-indigo-600 dark:text-indigo-300 border-indigo-500/25",
  success:
    "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
  warning:
    "bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/25",
  danger:
    "bg-rose-500/12 text-rose-700 dark:text-rose-300 border-rose-500/25",
};

const DOT_CLASSES = {
  neutral: "bg-slate-400",
  accent: "bg-indigo-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
};

export function Badge({
  children,
  tone = "neutral",
  dot = false,
  className = "",
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border tracking-tight ${
        TONE_CLASSES[tone] || TONE_CLASSES.neutral
      } ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            DOT_CLASSES[tone] || DOT_CLASSES.neutral
          }`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

export default Badge;
