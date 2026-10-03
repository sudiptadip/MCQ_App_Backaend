import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';

const AccessDeniedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted/20 p-6 text-center">
      <div className="mb-8 p-6 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-xl shadow-rose-500/10">
        <ShieldAlert className="w-24 h-24" />
      </div>
      
      <h1 className="text-5xl font-black tracking-tighter mb-4 text-foreground">Access Denied</h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-md font-medium leading-relaxed">
        You do not have permission to access this page or resource.
      </p>
      
      <Button 
        onClick={() => navigate('/')} 
        size="lg" 
        className="rounded-xl h-12 px-8 font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Return to Dashboard
      </Button>
    </div>
  );
};

export default AccessDeniedPage;
