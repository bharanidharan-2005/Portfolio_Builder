export function Card({
  children,
  className = "",
  interactive = false,
  selected = false,
  padding = "p-5",
  onClick,
  ...rest
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border bg-[var(--surface-panel)] text-[var(--text-primary)] transition-all duration-150 ${
        selected
          ? "border-indigo-500 ring-2 ring-indigo-500/20"
          : "border-[var(--border-subtle)]"
      } ${
        interactive
          ? "cursor-pointer hover:border-indigo-500/45 hover:shadow-md"
          : ""
      } ${padding} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export default Card;
