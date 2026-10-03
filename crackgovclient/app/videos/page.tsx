"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Folder, PlayCircle, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { getStudentContentRoots } from "@/features/content/api";
import { Button } from "@/components/ui/button";

export default function VideosHubPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
    } else {
      setAuthed(true);
    }
  }, [router]);

  const { data: roots = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["videos-roots"],
    queryFn: () => getStudentContentRoots("videos"),
    enabled: authed,
  });

  if (!authed) return null;

  if (isLoading) return (
    <div className="flex flex-1 items-center justify-center h-[500px]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">Loading Videos library...</p>
      </div>
    </div>
  );

  if (isError) return (
    <div className="flex flex-1 items-center justify-center h-[500px] p-6 text-center space-y-4">
      <div>
        <p className="text-destructive font-bold">Could not fetch Videos library.</p>
        <Button onClick={() => refetch()} className="mt-4" variant="outline">Retry</Button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-card border shadow-sm p-8 md:p-12">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
            <PlayCircle size={14} /> Video Lessons
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
            Video Library
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl leading-relaxed">
            Watch recorded lectures and educational videos to master your subjects.
          </p>
        </div>
      </div>

      {/* Folders Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <span className="h-px w-8 bg-border"></span>
          Categories
        </h2>
        
        {roots.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-xl bg-muted/20">
            <Folder className="h-10 w-10 text-muted-foreground/30 mb-2" />
            <p className="text-muted-foreground font-medium">No Videos available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {roots.map((root) => (
              <button
                key={root.id}
                onClick={() => {
                  const bc = encodeURIComponent(JSON.stringify([{ id: root.id, name: root.display_name }]));
                  router.push(`/videos/${root.id}?bc=${bc}`);
                }}
                className="group flex flex-col items-start p-5 rounded-xl border bg-card hover:border-primary/50 transition-all text-left shadow-sm hover:shadow-md"
              >
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform mb-4">
                  <Folder className="h-6 w-6" />
                </div>
                <div className="w-full flex items-center justify-between">
                  <h3 className="font-bold text-foreground text-lg truncate pr-2">{root.display_name}</h3>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
