"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Folder, ChevronRight, History, Layers } from "lucide-react";
import { getDisplayViewsForStudent } from "@/features/practice/api";
import type { DisplayViewNode } from "@/types/practice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function PracticeHomePage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/login"); } else { setAuthed(true); }
  }, [router]);

  const { data: roots = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["practiceRoots"],
    queryFn: getDisplayViewsForStudent,
    enabled: authed,
  });

  if (!authed) return null;

  if (isLoading) return (
    <div className="flex flex-1 items-center justify-center h-[500px]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">Loading practice modules...</p>
      </div>
    </div>
  );

  if (isError) return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="text-center space-y-4">
        <p className="text-destructive font-semibold">Could not load practice modules.</p>
        <Button onClick={() => refetch()} variant="outline">Retry</Button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">Practice Modules</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Select a subject below to browse available practice tests and study materials.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/practice/history">
            <Button variant="outline" className="gap-2">
              <History size={16} /> View History
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <Layers className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          {roots.length} module{roots.length !== 1 ? "s" : ""} available
        </span>
      </div>

      {/* Root Folder Grid */}
      {roots.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-24 bg-muted/20 border-dashed">
          <Folder className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-foreground/80">No practice modules yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Content will appear here once assigned.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {roots.map((root: DisplayViewNode) => (
            <Card
              key={root.id}
              onClick={() => router.push(`/practice/${root.id}`)}
              className="group cursor-pointer hover:border-primary/50 hover:shadow-md transition-all duration-200"
            >
              <CardHeader className="p-5 pb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Folder className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                  {root.display_name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0 flex justify-between items-center">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Browse</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
