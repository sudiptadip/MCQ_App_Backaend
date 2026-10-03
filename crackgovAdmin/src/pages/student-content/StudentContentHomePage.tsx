import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Folder, ChevronRight, FileText, Monitor, Layers, List, Grid, ExternalLink, Play } from 'lucide-react';
import { getStudentContentRoots, getStudentContentFlatList } from '../../features/student-content/api/studentContent.api';
import type { StudyMaterial } from '../../features/student-content/api/studentContent.api';
import Loading from '../../components/common/Loading';
import Error from '../../components/common/Error';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent } from '../../components/ui/dialog';

interface Props {
  type: 'notes' | 'videos';
}

const StudentContentHomePage: React.FC<Props> = ({ type }) => {
  const navigate = useNavigate();
  const isNotes = type === 'notes';
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeVideo, setActiveVideo] = useState<StudyMaterial | null>(null);

  const { data: roots = [], isLoading: loadingRoots, isError: isErrorRoots, refetch: refetchRoots } = useQuery({
    queryKey: ['studentContentRoots', type],
    queryFn: () => getStudentContentRoots(type),
  });

  const { data: flatList = [], isLoading: loadingFlat, isError: isErrorFlat, refetch: refetchFlat } = useQuery({
    queryKey: ['studentContentFlat', type],
    queryFn: () => getStudentContentFlatList(type),
  });

  const isLoading = loadingRoots || loadingFlat;
  const isError = isErrorRoots || isErrorFlat;

  if (isLoading) return <Loading message={`Loading ${isNotes ? 'notes' : 'videos'}...`} className="h-[500px]" />;

  if (isError) return (
    <div className="p-6">
      <Error title="Failed to load" message={`Could not load ${isNotes ? 'notes' : 'videos'}.`} onRetry={() => { refetchRoots(); refetchFlat(); }} />
    </div>
  );

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

  const title = isNotes ? "My Notes" : "My Videos";
  const subtitle = isNotes ? "Browse your assigned study notes and documents" : "Watch your assigned video lectures";
  const Icon = isNotes ? FileText : Monitor;

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <div className={`relative mb-10 rounded-3xl overflow-hidden bg-gradient-to-br ${isNotes ? 'from-amber-600 via-orange-500 to-amber-700' : 'from-rose-600 via-red-500 to-rose-700'} dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-8 md:p-12 shadow-2xl shadow-indigo-500/20 dark:shadow-none`}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 flex items-center gap-6">
          <div className="h-16 w-16 rounded-2xl bg-white/20 dark:bg-zinc-800/50 backdrop-blur-sm flex items-center justify-center shadow-xl border border-white/30 dark:border-zinc-700/50">
            <Icon className="h-9 w-9 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-1">
              {title}
            </h1>
            <p className="text-white/80 dark:text-zinc-300 text-base font-medium">
              {subtitle}
            </p>
          </div>
        </div>
        <div className="absolute top-4 right-8 opacity-20">
          <Icon className="h-32 w-32 text-white" />
        </div>
      </div>

      {/* Stats bar */}
      <div className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 px-1">
          <div className="flex items-center gap-2">
            <Layers className={`h-4 w-4 ${isNotes ? 'text-amber-500' : 'text-rose-500'}`} />
            <span className="text-sm font-semibold text-muted-foreground">
              {roots.length} folder{roots.length !== 1 ? 's' : ''}, {flatList.length} item{flatList.length !== 1 ? 's' : ''} available
            </span>
          </div>

          <div className="bg-muted/50 p-1 flex items-center rounded-lg">
            <button 
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 font-medium px-4 py-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Grid className="h-4 w-4" /> Folders
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 font-medium px-4 py-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <List className="h-4 w-4" /> All {isNotes ? 'Notes' : 'Videos'}
            </button>
          </div>
        </div>

        {viewMode === 'grid' && (
          <div className="mt-0 outline-none">
            {roots.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 rounded-3xl border-2 border-dashed border-muted-foreground/20 bg-muted/10">
                <Folder className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-bold text-muted-foreground/60">No {isNotes ? 'notes' : 'videos'} yet</p>
                <p className="text-sm text-muted-foreground/40 mt-1">Ask your instructor to assign content</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {roots.map((root, idx) => {
                  const colors = isNotes ? [
                    { bg: 'from-amber-500 to-yellow-500', light: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-100 dark:border-amber-900/40', icon: 'text-amber-500', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
                    { bg: 'from-orange-500 to-amber-600', light: 'bg-orange-50 dark:bg-orange-950/20', border: 'border-orange-100 dark:border-orange-900/40', icon: 'text-orange-500', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300' },
                  ] : [
                    { bg: 'from-rose-500 to-red-500', light: 'bg-rose-50 dark:bg-rose-950/20', border: 'border-rose-100 dark:border-rose-900/40', icon: 'text-rose-500', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' },
                    { bg: 'from-pink-500 to-rose-600', light: 'bg-pink-50 dark:bg-pink-950/20', border: 'border-pink-100 dark:border-pink-900/40', icon: 'text-pink-500', badge: 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300' },
                  ];
                  const color = colors[idx % colors.length];

                  return (
                    <button
                      key={root.id}
                      onClick={() => navigate(`/${type}/${root.id}`, { state: { breadcrumb: [{ id: root.id, name: root.display_name }] } })}
                      className={`group relative flex flex-col text-left rounded-2xl border ${color.border} ${color.light} p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98] cursor-pointer overflow-hidden`}
                    >
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color.bg} rounded-t-2xl`} />
                      <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${color.bg} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Folder className="h-7 w-7 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground leading-tight mb-2 group-hover:text-foreground/90">
                        {root.display_name}
                      </h3>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${color.badge} mt-auto`}>
                        <Icon className="h-3 w-3" /> Browse
                      </span>
                      <ChevronRight className={`absolute bottom-5 right-5 h-5 w-5 ${color.icon} opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300`} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {viewMode === 'list' && (
          <div className="mt-0 outline-none">
            {flatList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 rounded-3xl border-2 border-dashed border-muted-foreground/20 bg-muted/10">
                <Icon className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-bold text-muted-foreground/60">No {isNotes ? 'notes' : 'videos'} yet</p>
                <p className="text-sm text-muted-foreground/40 mt-1">Ask your instructor to assign content</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {flatList.map((material) => (
                  <Card key={material.studyMaterial_id} className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl ${isNotes ? 'border-amber-500/10 hover:border-amber-500/30 hover:shadow-amber-500/10' : 'border-rose-500/10 hover:border-rose-500/30 hover:shadow-rose-500/10'}`}>
                    <div className={`absolute top-0 left-0 w-1 h-full ${isNotes ? 'bg-amber-500' : 'bg-rose-500'}`} />
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <Badge variant="outline" className={`${isNotes ? 'bg-amber-500/5 text-amber-500 border-amber-500/20' : 'bg-rose-500/5 text-rose-500 border-rose-500/20'} text-[10px] font-black tracking-widest uppercase truncate max-w-[120px]`}>
                          {material.type}
                        </Badge>
                        {material.folder_name && (
                          <div className="flex items-center gap-1 text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full text-[10px] font-bold truncate max-w-[120px]" title={material.folder_name}>
                            <Folder className="h-3 w-3 shrink-0" />
                            <span className="truncate">{material.folder_name}</span>
                          </div>
                        )}
                      </div>
                      <CardTitle className={`text-lg font-bold transition-colors line-clamp-2 ${isNotes ? 'group-hover:text-amber-600' : 'group-hover:text-rose-600'}`}>{material.name}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1 text-xs" dangerouslySetInnerHTML={{ __html: material.description || '' }}></CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <Button
                        className={`w-full font-black rounded-xl h-10 text-sm gap-2 shadow-lg transition-transform active:scale-95 ${isNotes ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/25' : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/25'}`}
                        onClick={() => handleMaterialClick(material)}
                      >
                        {material.type === 'youtube' ? <Play className="h-4 w-4 fill-current" /> : <ExternalLink className="h-4 w-4" />} 
                        {material.type === 'youtube' ? 'Play Video' : 'Open'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

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

export default StudentContentHomePage;
