export function EmptyState({
  icon = null,
  title,
  description,
  action = null,
  secondaryAction = null,
  className = "",
}) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-panel)]/60 p-8 sm:p-10 text-center flex flex-col items-center justify-center ${className}`}
    >
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-[var(--text-muted)] max-w-md mt-1.5 leading-relaxed">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
