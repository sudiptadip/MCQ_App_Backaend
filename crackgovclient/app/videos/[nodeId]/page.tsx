"use client";

import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Folder, ChevronRight, ArrowLeft, Home, Play, HelpCircle } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getStudentContentTree } from "@/features/content/api";
import { StudyMaterial } from "@/types/content";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function VideosBrowsePage() {
  const { nodeId } = useParams<{ nodeId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentNodeId = Number(nodeId);
  const [authed, setAuthed] = useState(false);
  const [activeVideo, setActiveVideo] = useState<StudyMaterial | null>(null);

  useEffect(() => {
    if (!localStorage.getItem("token")) router.replace("/login");
    else setAuthed(true);
  }, [router]);

  const { data: allNodes = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["videos-tree", currentNodeId],
    queryFn: () => getStudentContentTree(currentNodeId, "videos"),
    enabled: authed && !!currentNodeId,
  });

  const { children, currentNode, materials } = useMemo(() => {
    const currentNode = allNodes.find(n => n.id === currentNodeId);
    const children = allNodes.filter(n => n.parent_id === currentNodeId);

    let materials: StudyMaterial[] = [];
    if (currentNode?.assigned_study_materials) {
      try {
        materials = typeof currentNode.assigned_study_materials === "string"
          ? JSON.parse(currentNode.assigned_study_materials)
          : currentNode.assigned_study_materials;
      } catch (e) {
        materials = [];
      }
    }

    return { children, currentNode, materials };
  }, [allNodes, currentNodeId]);

  let breadcrumbs: { id: number, name: string }[] = [];
  try {
    const bcStr = searchParams.get("bc");
    if (bcStr) breadcrumbs = JSON.parse(decodeURIComponent(bcStr));
  } catch (e) {}

  const handleFolderClick = (child: any) => {
    const newBreadcrumb = [...breadcrumbs, { id: child.id, name: child.display_name }];
    router.push(`/videos/${child.id}?bc=${encodeURIComponent(JSON.stringify(newBreadcrumb))}`);
  };

  const handleMaterialClick = (material: StudyMaterial) => {
    if (material.type === 'youtube') {
      setActiveVideo(material);
    } else {
      window.open(material.url, '_blank');
    }
  };

  const getYoutubeEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1` : url;
  };

  if (!authed) return null;

  if (isLoading) return (
    <div className="flex flex-1 items-center justify-center h-[500px]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">Opening folder...</p>
      </div>
    </div>
  );

  if (isError) return (
    <div className="p-6 text-center space-y-4">
      <p className="text-destructive font-bold">Could not load the selected folder.</p>
      <Button onClick={() => refetch()} variant="outline">Retry</Button>
    </div>
  );

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-8">
      {/* Breadcrumbs & Back Button */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="w-fit flex items-center gap-2 text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <nav className="flex flex-wrap items-center gap-2 text-sm font-medium">
          <button
            onClick={() => router.push('/videos')}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
          >
            <Home className="h-3.5 w-3.5" /> Home
          </button>
          {breadcrumbs.map((item, idx) => (
            <div key={item.id} className="flex items-center gap-2">
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
              <button
                onClick={() => {
                  const truncated = breadcrumbs.slice(0, idx + 1);
                  router.push(`/videos/${item.id}?bc=${encodeURIComponent(JSON.stringify(truncated))}`);
                }}
                disabled={idx === breadcrumbs.length - 1}
                className={`transition-colors ${idx === breadcrumbs.length - 1 ? 'text-foreground font-semibold cursor-default' : 'text-muted-foreground hover:text-primary'}`}
              >
                {item.name}
              </button>
            </div>
          ))}
        </nav>
      </div>

      {/* Header Section */}
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
          <Folder className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{currentNode?.display_name || 'Browse'}</h1>
          <p className="text-muted-foreground text-sm">Explore video lectures inside this folder</p>
        </div>
      </div>

      {/* Folders Section */}
      {children.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <span className="h-px w-8 bg-border"></span>
            Sub-Folders
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => handleFolderClick(child)}
                className="group flex items-center gap-4 p-4 rounded-xl border bg-card hover:border-primary/50 transition-all text-left shadow-sm hover:shadow-md"
              >
                <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Folder className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{child.display_name}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-transform shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content Section */}
      {materials.length > 0 && (
        <div className="space-y-4 pt-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <span className="h-px w-8 bg-border"></span>
            Videos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.map((material) => (
              <Card key={material.studyMaterial_id} className="group relative overflow-hidden border transition-all hover:border-primary/50 hover:shadow-md bg-card flex flex-col">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary" className="text-[10px] font-bold tracking-widest uppercase">
                      {material.type}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">{material.name}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-1" dangerouslySetInnerHTML={{ __html: material.description || '' }}></CardDescription>
                </CardHeader>
                <CardContent className="pt-2 mt-auto">
                  <Button
                    className="w-full font-semibold h-11 gap-2 transition-transform active:scale-95"
                    onClick={() => handleMaterialClick(material)}
                  >
                    <Play className="h-4 w-4 fill-current" /> Play Video
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {children.length === 0 && materials.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 rounded-2xl border-2 border-dashed bg-muted/20">
          <div className="h-16 w-16 rounded-full bg-background flex items-center justify-center text-muted-foreground border shadow-sm">
            <HelpCircle className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">No content here yet</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">This folder doesn't have any videos or sub-folders assigned to it.</p>
          </div>
          <Button variant="outline" className="font-semibold" onClick={() => router.push('/videos')}>
            Go Back Home
          </Button>
        </div>
      )}

      {/* Video Modal */}
      <Dialog open={!!activeVideo} onOpenChange={(open) => !open && setActiveVideo(null)}>
        <DialogContent className="sm:max-w-4xl w-[95vw] p-0 overflow-hidden bg-black border-none gap-0">
          <DialogTitle className="sr-only">Video Player</DialogTitle>
          <DialogDescription className="sr-only">Watch {activeVideo?.name}</DialogDescription>
          
          <div className="relative w-full pb-[56.25%]">
            {activeVideo && (
              <iframe
                src={getYoutubeEmbedUrl(activeVideo.url)}
                title={activeVideo.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full border-0"
              />
            )}
          </div>
          <div className="p-4 bg-background text-foreground">
            <h3 className="text-lg font-bold">{activeVideo?.name}</h3>
            {activeVideo?.description && (
              <div className="text-sm text-muted-foreground mt-1 line-clamp-3" dangerouslySetInnerHTML={{__html: activeVideo.description}}></div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
