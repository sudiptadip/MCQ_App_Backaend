import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

interface LoadingProps {
  message?: string;
  className?: string;
  fullPage?: boolean;
}

const Loading = ({ message = "Loading...", className, fullPage = false }: LoadingProps) => {
  const content = (
    <div className={cn("flex flex-col items-center justify-center gap-3 p-8", className)}>
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-sm font-medium text-muted-foreground animate-pulse">
        {message}
      </p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};

export default Loading;
