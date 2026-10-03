"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Folder, ChevronRight, ArrowLeft, Home, Play, Clock, HelpCircle, Hash } from "lucide-react";
import { getDisplayViewTree } from "@/features/practice/api";
import type { DisplayViewNode, AttemptTest } from "@/types/practice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface BreadcrumbItem { id: number; name: string; }

export default function PracticeBrowsePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nodeId = Number(params.nodeId);

  const breadcrumbs: BreadcrumbItem[] = useMemo(() => {
    try { return JSON.parse(decodeURIComponent(searchParams.get("bc") || "[]")); }
    catch { return []; }
  }, [searchParams]);

  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/login"); } else { setAuthed(true); }
  }, [router]);

  const { data: allNodes = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["displayViewTree", nodeId],
    queryFn: () => getDisplayViewTree(nodeId),
    enabled: authed && !!nodeId,
  });

  const { children, currentNode, tests } = useMemo(() => {
    const currentNode = allNodes.find((n: DisplayViewNode) => n.id === nodeId);
    const children = allNodes.filter((n: DisplayViewNode) => n.parent_id === nodeId);
    let tests: AttemptTest[] = [];
    if (currentNode?.assigned_tests) {
      try {
        tests = typeof currentNode.assigned_tests === "string"
          ? JSON.parse(currentNode.assigned_tests)
          : (currentNode.assigned_tests as AttemptTest[]);
      } catch { tests = []; }
    }
    return { children, currentNode, tests };
  }, [allNodes, nodeId]);

  const handleFolderClick = (child: DisplayViewNode) => {
    const newBc = [...breadcrumbs, { id: child.id, name: child.display_name }];
    router.push(`/practice/${child.id}?bc=${encodeURIComponent(JSON.stringify(newBc))}`);
  };

  if (!authed) return null;

  if (isLoading) return (
    <div className="flex flex-1 items-center justify-center h-[500px]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">Opening folder...</p>
      </div>
    </div>
  );

  if (isError) return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="text-center space-y-4">
        <p className="text-destructive font-bold">Could not load this folder.</p>
        <Button onClick={() => refetch()} variant="outline">Retry</Button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-4 space-y-8">
      {/* Breadcrumb & Back */}
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="w-fit flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <nav className="flex items-center gap-2 text-sm font-medium flex-wrap">
          <Link href="/practice" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
            <Home className="h-3.5 w-3.5" /> Home
          </Link>
          {breadcrumbs.map((item, idx) => (
            <span key={item.id} className="flex items-center gap-2">
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
              {idx === breadcrumbs.length - 1 ? (
                <span className="text-foreground font-bold">{item.name}</span>
              ) : (
                <Link
                  href={`/practice/${item.id}?bc=${encodeURIComponent(JSON.stringify(breadcrumbs.slice(0, idx + 1)))}`}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >{item.name}</Link>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20">
          <Folder className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">{currentNode?.display_name || "Browse"}</h1>
          <p className="text-muted-foreground font-medium">Explore chapters and available practice tests</p>
        </div>
      </div>

      {/* Sub-Folders */}
      {children.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <span className="h-px w-8 bg-muted-foreground/20" /> Sub-Folders
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((child: DisplayViewNode) => (
              <button
                key={child.id}
                onClick={() => handleFolderClick(child)}
                className="group flex items-center gap-4 p-5 rounded-xl border bg-card hover:bg-accent hover:border-primary/50 transition-all duration-200 hover:shadow-md text-left"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary transition-transform">
                  <Folder className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{child.display_name}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tests */}
      {tests.length > 0 && (
        <div className="space-y-4 pt-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <span className="h-px w-8 bg-muted-foreground/20" /> Practice Tests
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test: AttemptTest) => (
              <Card key={test.id} className="group relative overflow-hidden transition-all duration-200 hover:border-primary/50 hover:shadow-md">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="text-[10px] font-semibold tracking-widest text-muted-foreground">TEST</Badge>
                  </div>
                  <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">{test.test_name}</CardTitle>
                  <CardDescription className="line-clamp-2">Complete this test to sharpen your skills in {currentNode?.display_name}.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-border">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Hash className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Questions</span>
                      </div>
                      <span className="text-sm font-semibold">{test.total_questions} Qs</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Duration</span>
                      </div>
                      <span className="text-sm font-semibold">{test.duration_minutes} Min</span>
                    </div>
                  </div>
                  <Button
                    className="w-full gap-2 transition-transform active:scale-95"
                    onClick={() => router.push(`/practice/test/${test.test_id}`)}
                  >
                    <Play className="h-4 w-4 fill-current" /> Start Practice
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {children.length === 0 && tests.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 rounded-[3rem] border-2 border-dashed bg-muted/10">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground/30">
            <HelpCircle className="h-10 w-10" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground/70">No content here yet</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">This folder doesn&apos;t have any sub-chapters or tests assigned to it.</p>
          </div>
          <Link href="/practice">
            <Button variant="outline" className="rounded-xl font-bold">Go Back Home</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
