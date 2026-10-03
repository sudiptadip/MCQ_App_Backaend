import React, { useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Folder,
  ChevronRight,
  ArrowLeft,
  Home,
  Play,
  Clock,
  HelpCircle,
  Hash
} from 'lucide-react';
import { getDisplayViewTree } from '../../features/display-view/api/displayView.api';
import Loading from '../../components/common/Loading';
import Error from '../../components/common/Error';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

interface BreadcrumbItem {
  id: number;
  name: string;
}

interface AttemptTest {
  id: number;
  test_id: number;
  test_name: string;
  duration_minutes: number;
  total_questions: number;
}

const PracticeBrowsePage: React.FC = () => {
  const { nodeId } = useParams<{ nodeId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const currentNodeId = Number(nodeId);

  const { data: allNodes = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['displayViewTree', currentNodeId],
    queryFn: () => getDisplayViewTree(currentNodeId),
    enabled: !!currentNodeId,
  });

  // Calculate immediate children and current node info
  const { children, currentNode, tests } = useMemo(() => {
    const currentNode = allNodes.find(n => n.id === currentNodeId);
    const children = allNodes.filter(n => n.parent_id === currentNodeId);

    // Parse assigned tests if present on current node
    let tests: AttemptTest[] = [];
    if (currentNode?.assigned_tests) {
      try {
        tests = typeof currentNode.assigned_tests === 'string'
          ? JSON.parse(currentNode.assigned_tests)
          : currentNode.assigned_tests;
      } catch (e) {
        tests = [];
      }
    }

    return { children, currentNode, tests };
  }, [allNodes, currentNodeId]);

  // Breadcrumb logic
  const breadcrumbs = (location.state?.breadcrumb || []) as BreadcrumbItem[];

  const handleFolderClick = (child: any) => {
    const newBreadcrumb = [...breadcrumbs, { id: child.id, name: child.display_name }];
    navigate(`/practice/${child.id}`, { state: { breadcrumb: newBreadcrumb } });
  };

  if (isLoading) return <Loading message="Opening folder..." className="h-[500px]" />;

  if (isError) return (
    <div className="p-6">
      <Error title="Failed to load" message="Could not load the selected folder." onRetry={() => refetch()} />
    </div>
  );

  return (
    <div className="container mx-auto p-4 space-y-8 animate-in fade-in duration-500">
      {/* Breadcrumbs & Back Button */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="w-fit flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <nav className="flex items-center gap-2 text-sm font-medium">
          <button
            onClick={() => navigate('/practice')}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            Home
          </button>
          {breadcrumbs.map((item, idx) => (
            <React.Fragment key={item.id}>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
              <button
                onClick={() => {
                  const truncatedBreadcrumb = breadcrumbs.slice(0, idx + 1);
                  navigate(`/practice/${item.id}`, { state: { breadcrumb: truncatedBreadcrumb } });
                }}
                disabled={idx === breadcrumbs.length - 1}
                className={`transition-colors ${idx === breadcrumbs.length - 1 ? 'text-foreground font-bold cursor-default' : 'text-muted-foreground hover:text-primary'}`}
              >
                {item.name}
              </button>
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Header Section */}
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20">
          <Folder className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">{currentNode?.display_name || 'Browse'}</h1>
          <p className="text-muted-foreground font-medium">Explore chapters and available practice tests</p>
        </div>
      </div>

      {/* Folders Section */}
      {children.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <span className="h-px w-8 bg-muted-foreground/20"></span>
            Sub-Folders
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => handleFolderClick(child)}
                className="group flex items-center gap-4 p-5 rounded-2xl border bg-card/50 hover:bg-accent/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg text-left"
              >
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                  <Folder className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground truncate">{child.display_name}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tests Section */}
      {tests.length > 0 && (
        <div className="space-y-4 pt-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <span className="h-px w-8 bg-muted-foreground/20"></span>
            Practice Tests
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => (
              <Card key={test.id} className="group relative overflow-hidden border-indigo-500/10 hover:border-indigo-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="bg-indigo-500/5 text-indigo-500 border-indigo-500/20 text-[10px] font-black tracking-widest">TEST</Badge>
                  </div>
                  <CardTitle className="text-xl font-bold group-hover:text-indigo-600 transition-colors">{test.test_name}</CardTitle>
                  <CardDescription className="line-clamp-2">Complete this test to sharpen your skills in {currentNode?.display_name}.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-muted/50">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Hash className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Questions</span>
                      </div>
                      <span className="text-sm font-black">{test.total_questions} Qs</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Duration</span>
                      </div>
                      <span className="text-sm font-black">{test.duration_minutes} Min</span>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl h-11 gap-2 shadow-lg shadow-indigo-500/25 transition-transform active:scale-95"
                    onClick={() => navigate(`/practice/test/${test.test_id}`)}
                  >
                    <Play className="h-4 w-4 fill-current" /> Start Practice
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {children.length === 0 && tests.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 rounded-[3rem] border-2 border-dashed bg-muted/10">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground/30">
            <HelpCircle className="h-10 w-10" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground/70">No content here yet</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">This folder doesn't have any sub-chapters or tests assigned to it.</p>
          </div>
          <Button variant="outline" className="rounded-xl font-bold" onClick={() => navigate('/practice')}>
            Go Back Home
          </Button>
        </div>
      )}
    </div>
  );
};

export default PracticeBrowsePage;
