import { Construction, Sparkles } from 'lucide-react';

interface ComingSoonPageProps {
  title?: string;
  description?: string;
}

const ComingSoonPage = ({ 
  title = "Coming Soon", 
  description = "We're working hard to bring this feature to you. Stay tuned for updates!" 
}: ComingSoonPageProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-in fade-in zoom-in duration-500">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
        <div className="relative bg-gradient-to-br from-primary/10 to-primary/30 p-6 rounded-3xl border border-primary/20 shadow-xl shadow-primary/10">
          <Construction className="w-20 h-20 text-primary" />
          <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-amber-400 animate-pulse" />
        </div>
      </div>
      
      <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
        {title}
      </h1>
      
      <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed font-medium">
        {description}
      </p>
    </div>
  );
};

export default ComingSoonPage;
