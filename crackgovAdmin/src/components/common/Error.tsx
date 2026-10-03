import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

interface ErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

const Error = ({ 
  title = "Something went wrong", 
  message = "An unexpected error occurred while fetching data.", 
  onRetry,
  className 
}: ErrorProps) => {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-12 text-center bg-destructive/5 rounded-xl border border-destructive/10 animate-in fade-in zoom-in duration-300",
      className
    )}>
      <div className="bg-destructive/10 p-4 rounded-full mb-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
      </div>
      <h3 className="text-xl font-bold text-destructive mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-8">
        {message}
      </p>
      {onRetry && (
        <Button 
          variant="outline" 
          onClick={onRetry}
          className="gap-2 border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
        >
          <RefreshCcw className="h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  );
};

export default Error;
