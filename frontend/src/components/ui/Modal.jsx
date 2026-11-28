import { useEffect } from "react";
import { X } from "lucide-react";

const WIDTH_CLASSES = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  size = "md",
  children,
  footer = null,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/65 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={title || "Dialog"}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={`w-full ${
          WIDTH_CLASSES[size] || WIDTH_CLASSES.md
        } rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-primary)] shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh]`}
      >
        {(title || onClose) && (
          <div className="flex items-start justify-between gap-3 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[var(--border-subtle)]">
            <div className="min-w-0">
              {title && (
                <h2 className="text-base font-bold tracking-tight truncate">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="shrink-0 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1">{children}</div>
        {footer && (
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-[var(--border-subtle)] bg-[var(--surface-panel)] flex flex-wrap items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
