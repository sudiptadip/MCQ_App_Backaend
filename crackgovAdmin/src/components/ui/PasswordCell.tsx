import { useState } from "react";
import { Check, Copy, Eye, EyeOff } from "lucide-react";

interface PasswordCellProps {
  password?: string | null;
  className?: string;
}

/**
 * Displays a masked password with per-row reveal and clipboard copy actions.
 */
export const PasswordCell = ({ password, className = "" }: PasswordCellProps) => {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!password) {
    return <span className={`text-muted-foreground ${className}`}>-</span>;
  }

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API may be unavailable in insecure contexts.
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 font-mono text-xs ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <span className="select-all">
        {visible ? password : "••••••••"}
      </span>
      <button
        type="button"
        title={visible ? "Hide password" : "Show password"}
        onClick={() => setVisible((prev) => !prev)}
        className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        {visible ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
      <button
        type="button"
        title={copied ? "Copied" : "Copy password"}
        onClick={handleCopy}
        className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
      </button>
    </div>
  );
};
