import { SearchX, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted/20 p-6 text-center">
      <div className="mb-8 relative">
        <h1 className="text-[10rem] font-black tracking-tighter text-muted-foreground/10 select-none">404</h1>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="p-4 rounded-3xl bg-background border shadow-xl">
            <SearchX className="w-16 h-16 text-primary" />
          </div>
        </div>
      </div>
      
      <h2 className="text-4xl font-black tracking-tighter mb-4 text-foreground">Page not found</h2>
      <p className="text-lg text-muted-foreground mb-8 max-w-md font-medium leading-relaxed">
        The page you are looking for doesn't exist or has been moved.
      </p>
      
      <Button 
        onClick={() => navigate('/')} 
        size="lg" 
        className="rounded-xl h-12 px-8 font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
      >
        <Home className="w-5 h-5 mr-2" />
        Back to Home
      </Button>
    </div>
  );
};

export default NotFoundPage;
