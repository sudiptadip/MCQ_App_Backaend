// ── Tiny helper ───────────────────────────────────────────────────────────────
export default function ActionButton({
  children,
  title,
  onClick,
  variant = "default",
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  variant?: "default" | "danger";
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`flex items-center justify-center w-7 h-7 rounded transition-colors ${
        variant === "danger"
          ? "text-destructive hover:bg-destructive/10"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      {children}
    </button>
  );
}