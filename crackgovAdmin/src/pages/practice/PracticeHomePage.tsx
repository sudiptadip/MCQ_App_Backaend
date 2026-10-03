import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Folder, ChevronRight, BookOpen, Layers, GraduationCap, History, Sliders, Sparkles } from 'lucide-react';
import { getDisplayViewsForStudent } from '../../features/display-view/api/displayView.api';
import Loading from '../../components/common/Loading';
import Error from '../../components/common/Error';

const PracticeHomePage: React.FC = () => {
  const navigate = useNavigate();

  const { data: roots = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['practiceRoots'],
    queryFn: getDisplayViewsForStudent,
  });

  if (isLoading) return <Loading message="Loading practice modules..." className="h-[500px]" />;

  if (isError) return (
    <div className="p-6">
      <Error title="Failed to load" message="Could not load practice modules." onRetry={() => refetch()} />
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <div className="relative mb-10 rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-8 md:p-12 shadow-2xl shadow-indigo-500/20 dark:shadow-none">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 flex items-center gap-6">
          <div className="h-16 w-16 rounded-2xl bg-white/20 dark:bg-zinc-800/50 backdrop-blur-sm flex items-center justify-center shadow-xl border border-white/30 dark:border-zinc-700/50">
            <GraduationCap className="h-9 w-9 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-1">
              Practice Hub
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
               <p className="text-indigo-200 dark:text-zinc-300 text-base font-medium">
                Choose a subject to begin your practice session
              </p>
              <div className="hidden sm:block h-1 w-1 rounded-full bg-indigo-300/30" />
              <button 
                onClick={() => navigate('/practice/history')}
                className="flex items-center gap-1.5 text-white/90 hover:text-white font-bold text-sm bg-white/10 dark:bg-zinc-800/40 hover:bg-white/20 dark:hover:bg-zinc-700/50 px-3 py-1 rounded-lg border border-white/10 dark:border-zinc-700/30 transition-all"
              >
                <History size={16} /> View History
              </button>
            </div>
          </div>
        </div>
        <div className="absolute top-4 right-8 opacity-20">
          <BookOpen className="h-32 w-32 text-white" />
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-2 mb-8 px-1">
        <Layers className="h-4 w-4 text-indigo-500" />
        <span className="text-sm font-semibold text-muted-foreground">
          {roots.length} module{roots.length !== 1 ? 's' : ''} available
        </span>
      </div>

      {/* Custom Practice Generator Banner */}
      <div className="relative mb-10 rounded-[2rem] overflow-hidden bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 dark:from-slate-900/50 dark:to-slate-800/50 border border-emerald-500/20 dark:border-zinc-800/80 p-6 md:p-8 shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-4 w-4 fill-current animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Interactive Practice Generator</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-zinc-50 tracking-tight">
              Create Your Own Practice Session
            </h2>
            <p className="text-muted-foreground text-sm max-w-2xl font-medium">
              Mix and match multiple categories & subcategories from a tree structure. Filter by difficulty, target unpracticed questions, select bookmarks, and set your own timer parameters.
            </p>
          </div>
          <button
            onClick={() => navigate('/practice/custom')}
            className="flex items-center justify-center gap-2 text-white font-black text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 px-6 py-3.5 rounded-2xl shadow-lg shadow-emerald-500/25 dark:shadow-none hover:-translate-y-0.5 active:scale-95 transition-all duration-300 whitespace-nowrap cursor-pointer"
          >
            <Sliders size={18} /> Configure Custom Set
          </button>
        </div>
      </div>

      {/* Root Folder Grid */}
      {roots.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-3xl border-2 border-dashed border-muted-foreground/20 bg-muted/10">
          <Folder className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-lg font-bold text-muted-foreground/60">No practice modules yet</p>
          <p className="text-sm text-muted-foreground/40 mt-1">Ask your instructor to set up content</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {roots.map((root, idx) => {
            const colors = [
              { bg: 'from-indigo-500 to-violet-600', light: 'bg-indigo-50 dark:bg-indigo-950/20', border: 'border-indigo-100 dark:border-indigo-900/40', icon: 'text-indigo-500', badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300' },
              { bg: 'from-emerald-500 to-teal-600', light: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-100 dark:border-emerald-900/40', icon: 'text-emerald-500', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
              { bg: 'from-orange-500 to-rose-500', light: 'bg-orange-50 dark:bg-orange-950/20', border: 'border-orange-100 dark:border-orange-900/40', icon: 'text-orange-500', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300' },
              { bg: 'from-sky-500 to-blue-600', light: 'bg-sky-50 dark:bg-sky-950/20', border: 'border-sky-100 dark:border-sky-900/40', icon: 'text-sky-500', badge: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300' },
              { bg: 'from-pink-500 to-fuchsia-600', light: 'bg-pink-50 dark:bg-pink-950/20', border: 'border-pink-100 dark:border-pink-900/40', icon: 'text-pink-500', badge: 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300' },
              { bg: 'from-amber-500 to-yellow-500', light: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-100 dark:border-amber-900/40', icon: 'text-amber-500', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
            ];
            const color = colors[idx % colors.length];

            return (
              <button
                key={root.id}
                id={`practice-root-${root.id}`}
                onClick={() => navigate(`/practice/${root.id}`, { state: { breadcrumb: [{ id: root.id, name: root.display_name }] } })}
                className={`group relative flex flex-col text-left rounded-2xl border ${color.border} ${color.light} p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98] cursor-pointer overflow-hidden`}
              >
                {/* Gradient accent top bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color.bg} rounded-t-2xl`} />

                {/* Folder icon */}
                <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${color.bg} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Folder className="h-7 w-7 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-foreground leading-tight mb-2 group-hover:text-foreground/90">
                  {root.display_name}
                </h3>

                <span className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${color.badge} mt-auto`}>
                  <BookOpen className="h-3 w-3" /> Browse
                </span>

                {/* Arrow */}
                <ChevronRight className={`absolute bottom-5 right-5 h-5 w-5 ${color.icon} opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300`} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PracticeHomePage;
