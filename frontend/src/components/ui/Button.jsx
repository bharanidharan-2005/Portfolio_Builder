import { Loader2 } from "lucide-react";

const VARIANT_CLASSES = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700 shadow-sm border border-indigo-500/40 disabled:bg-indigo-600/50",
  secondary:
    "bg-[var(--surface-panel)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] shadow-xs",
  subtle:
    "bg-indigo-500/10 text-indigo-500 dark:text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/25",
  ghost:
    "bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] border border-transparent",
  danger:
    "bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700 border border-rose-500/40 shadow-sm",
  dangerOutline:
    "bg-rose-500/10 text-rose-500 dark:text-rose-300 hover:bg-rose-500/20 border border-rose-500/30",
};

const SIZE_CLASSES = {
  xs: "h-7 px-2.5 text-xs gap-1.5 rounded-lg",
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-11 px-5 text-sm gap-2.5 rounded-xl",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon = null,
  type = "button",
  className = "",
  ...rest
}) {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center whitespace-nowrap font-semibold tracking-tight transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none ${
        VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary
      } ${SIZE_CLASSES[size] || SIZE_CLASSES.md} ${className}`}
      {...rest}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" aria-hidden="true" />
      ) : (
        icon && <span className="shrink-0 inline-flex items-center">{icon}</span>
      )}
      {children}
    </button>
  );
}

export default Button;
