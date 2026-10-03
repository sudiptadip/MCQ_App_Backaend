import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Folder,
  ChevronRight,
  ArrowLeft,
  Home,
  Play,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { getStudentContentTree } from '../../features/student-content/api/studentContent.api';
import Loading from '../../components/common/Loading';
import Error from '../../components/common/Error';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent } from '../../components/ui/dialog';

interface BreadcrumbItem {
  id: number;
  name: string;
}

interface StudyMaterial {
  id: number;
  studyMaterial_id: number;
  name: string;
  type: string;
  url: string;
  description: string;
}

interface Props {
  type: 'notes' | 'videos';
}

const StudentContentBrowsePage: React.FC<Props> = ({ type }) => {
  const { nodeId } = useParams<{ nodeId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const currentNodeId = Number(nodeId);
  const isNotes = type === 'notes';

  const [activeVideo, setActiveVideo] = useState<StudyMaterial | null>(null);

  const { data: allNodes = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['studentContentTree', currentNodeId, type],
    queryFn: () => getStudentContentTree(currentNodeId, type),
    enabled: !!currentNodeId,
  });

  const { children, currentNode, materials } = useMemo(() => {
    const currentNode = allNodes.find(n => n.id === currentNodeId);
    const children = allNodes.filter(n => n.parent_id === currentNodeId);

    let materials: StudyMaterial[] = [];
    if (currentNode?.assigned_study_materials) {
      try {
        materials = typeof currentNode.assigned_study_materials === 'string'
          ? JSON.parse(currentNode.assigned_study_materials)
          : currentNode.assigned_study_materials;
      } catch (e) {
        materials = [];
      }
    }

    return { children, currentNode, materials };
  }, [allNodes, currentNodeId]);

  const breadcrumbs = (location.state?.breadcrumb || []) as BreadcrumbItem[];

  const handleFolderClick = (child: any) => {
    const newBreadcrumb = [...breadcrumbs, { id: child.id, name: child.display_name }];
    navigate(`/${type}/${child.id}`, { state: { breadcrumb: newBreadcrumb } });
  };

  const handleMaterialClick = (material: StudyMaterial) => {
    if (material.type === 'youtube') {
      setActiveVideo(material);
    } else {
      window.open(material.url, '_blank');
    }
  };

  // Utility to extract youtube embed URL
  const getYoutubeEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1` : url;
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
            onClick={() => navigate(`/${type}`)}
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
                  navigate(`/${type}/${item.id}`, { state: { breadcrumb: truncatedBreadcrumb } });
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
        <div className={`h-12 w-12 rounded-2xl ${isNotes ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'} flex items-center justify-center shadow-sm border`}>
          <Folder className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">{currentNode?.display_name || 'Browse'}</h1>
          <p className="text-muted-foreground font-medium">Explore {isNotes ? 'notes' : 'videos'} inside this folder</p>
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
                <div className={`h-10 w-10 rounded-xl ${isNotes ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'} flex items-center justify-center group-hover:scale-110 transition-transform`}>
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

      {/* Content Section */}
      {materials.length > 0 && (
        <div className="space-y-4 pt-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <span className="h-px w-8 bg-muted-foreground/20"></span>
            {isNotes ? 'Notes & Documents' : 'Videos'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.map((material) => (
              <Card key={material.id} className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl ${isNotes ? 'border-amber-500/10 hover:border-amber-500/30 hover:shadow-amber-500/10' : 'border-rose-500/10 hover:border-rose-500/30 hover:shadow-rose-500/10'}`}>
                <div className={`absolute top-0 left-0 w-1 h-full ${isNotes ? 'bg-amber-500' : 'bg-rose-500'}`} />
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className={`${isNotes ? 'bg-amber-500/5 text-amber-500 border-amber-500/20' : 'bg-rose-500/5 text-rose-500 border-rose-500/20'} text-[10px] font-black tracking-widest uppercase`}>
                      {material.type}
                    </Badge>
                  </div>
                  <CardTitle className={`text-xl font-bold transition-colors ${isNotes ? 'group-hover:text-amber-600' : 'group-hover:text-rose-600'}`}>{material.name}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-1" dangerouslySetInnerHTML={{ __html: material.description || '' }}></CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <Button
                    className={`w-full font-black rounded-xl h-11 gap-2 shadow-lg transition-transform active:scale-95 ${isNotes ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/25' : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/25'}`}
                    onClick={() => handleMaterialClick(material)}
                  >
                    {material.type === 'youtube' ? <Play className="h-4 w-4 fill-current" /> : <ExternalLink className="h-4 w-4" />} 
                    {material.type === 'youtube' ? 'Play Video' : 'Open Document'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {children.length === 0 && materials.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 rounded-[3rem] border-2 border-dashed bg-muted/10">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground/30">
            <HelpCircle className="h-10 w-10" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground/70">No content here yet</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">This folder doesn't have any content assigned to it.</p>
          </div>
          <Button variant="outline" className="rounded-xl font-bold" onClick={() => navigate(`/${type}`)}>
            Go Back Home
          </Button>
        </div>
      )}

      {/* Video Modal */}
      {activeVideo && (
        <Dialog open={!!activeVideo} onOpenChange={(open) => !open && setActiveVideo(null)}>
          <DialogContent className="sm:max-w-4xl w-[95vw] p-0 overflow-hidden bg-black border-none">
            <div className="relative w-full pb-[56.25%]">
              <iframe
                src={getYoutubeEmbedUrl(activeVideo.url)}
                title={activeVideo.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full border-0"
              />
            </div>
            <div className="p-4 bg-background text-foreground">
                <h3 className="text-lg font-bold">{activeVideo.name}</h3>
                <div className="text-sm text-muted-foreground mt-1 line-clamp-3" dangerouslySetInnerHTML={{__html: activeVideo.description}}></div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default StudentContentBrowsePage;
