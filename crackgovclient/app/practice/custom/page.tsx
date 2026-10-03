"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, ChevronDown, Folder, Sliders, Sparkles, Search, BookOpen, Info, Clock, FolderTree, Check, Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getCategoriesWithQuestionCounts, createCustomPractice } from "@/features/practice/api";
import type { CategoryWithCounts, CustomPracticePayload } from "@/types/practice";
import Link from "next/link";

interface CategoryNode extends CategoryWithCounts { children: CategoryNode[]; }

export default function CustomPracticePage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [practiceName, setPracticeName] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [hasNoTimer, setHasNoTimer] = useState(false);
  const [difficulty, setDifficulty] = useState("all");
  const [filterMode, setFilterMode] = useState<"all" | "unpracticed" | "bookmarked">("all");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/login"); } else { setAuthed(true); }
  }, [router]);

  const { data: rawCategories = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["categories-with-counts"],
    queryFn: getCategoriesWithQuestionCounts,
    enabled: authed,
  });

  const { tree } = useMemo(() => {
    const map = new Map<number, CategoryNode>();
    const roots: CategoryNode[] = [];
    rawCategories.forEach((cat: CategoryWithCounts) => map.set(cat.id, { ...cat, children: [] }));
    rawCategories.forEach((cat: CategoryWithCounts) => {
      const node = map.get(cat.id)!;
      if (cat.parent_id === null) { roots.push(node); }
      else { const p = map.get(cat.parent_id); if (p) p.children.push(node); else roots.push(node); }
    });
    return { tree: roots };
  }, [rawCategories]);

  useEffect(() => {
    if (tree.length > 0 && expandedIds.size === 0) {
      setExpandedIds(new Set(tree.map(r => r.id)));
    }
  }, [tree, expandedIds.size]);

  const directCountsMap = useMemo(() => {
    const m: Record<number, number> = {};
    rawCategories.forEach((c: CategoryWithCounts) => { m[c.id] = c.direct_question_count; });
    return m;
  }, [rawCategories]);

  const totalPool = useMemo(() => {
    let s = 0; selectedIds.forEach(id => { s += directCountsMap[id] || 0; }); return s;
  }, [selectedIds, directCountsMap]);

  useEffect(() => {
    if (totalPool > 0) {
      if (questionCount > totalPool) setQuestionCount(totalPool);
      else if (questionCount < 1 && totalPool > 0) setQuestionCount(Math.min(10, totalPool));
    } else setQuestionCount(0);
  }, [totalPool, questionCount]);

  const createMutation = useMutation({
    mutationFn: createCustomPractice,
    onSuccess: (res) => {
      if (res.isSuccess && res.data?.test_id) {
        toast.success("Custom practice set created! Loading questions...");
        router.push(`/practice/test/${res.data.test_id}`);
      } else { toast.error(res.message || "Failed to create practice session"); }
    },
    onError: (err: Error) => toast.error(err.message || "An error occurred"),
  });

  const getDescendants = (node: CategoryNode, list: number[] = []): number[] => {
    node.children.forEach(c => { list.push(c.id); getDescendants(c, list); }); return list;
  };

  const handleToggle = (node: CategoryNode) => {
    const newSel = new Set(selectedIds);
    const ids = getDescendants(node, [node.id]);
    const sel = newSel.has(node.id);
    ids.forEach(id => sel ? newSel.delete(id) : newSel.add(id));
    setSelectedIds(newSel);
  };

  const toggleExpand = (id: number) => {
    const e = new Set(expandedIds);
    e.has(id) ? e.delete(id) : e.add(id);
    setExpandedIds(e);
  };

  const getState = (node: CategoryNode): "checked" | "unchecked" | "partial" => {
    const ids = getDescendants(node, [node.id]);
    const sel = ids.filter(id => selectedIds.has(id));
    if (sel.length === 0) return "unchecked";
    if (sel.length === ids.length) return "checked";
    return "partial";
  };

  const nodeMatches = (node: CategoryNode, s: string): boolean => {
    if (!s) return true;
    if (node.name.toLowerCase().includes(s.toLowerCase())) return true;
    return node.children.some(c => nodeMatches(c, s));
  };

  const handleStart = () => {
    if (selectedIds.size === 0) { toast.warning("Please select at least one category."); return; }
    if (questionCount < 1) { toast.warning("Question count must be at least 1."); return; }
    const payload: CustomPracticePayload = {
      name: practiceName.trim(),
      duration_minutes: hasNoTimer ? 999 : durationMinutes,
      question_count: questionCount,
      difficulty_level: difficulty === "all" ? null : difficulty,
      filter_mode: filterMode,
      category_ids: Array.from(selectedIds),
    };
    createMutation.mutate(payload);
  };

  const renderTree = (nodes: CategoryNode[], depth = 0): React.ReactNode => (
    <ul className="space-y-1.5 pl-4 border-l border-slate-100 dark:border-zinc-800/80 ml-2">
      {nodes.filter(n => nodeMatches(n, searchTerm)).map(node => {
        const hasC = node.children.length > 0, isExp = expandedIds.has(node.id), state = getState(node);
        return (
          <li key={node.id} className="space-y-1.5">
            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors group">
              <button type="button" onClick={() => toggleExpand(node.id)}
                className={`h-6 w-6 flex items-center justify-center rounded-lg text-slate-400 transition-colors ${!hasC ? "opacity-0 cursor-default" : ""}`}
                disabled={!hasC}>
                {isExp ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              <button type="button" onClick={() => handleToggle(node)}
                className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${state === "checked" ? "bg-emerald-500 border-emerald-500 text-white" : state === "partial" ? "bg-emerald-500/20 border-emerald-500 text-emerald-600" : "border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"}`}>
                {state === "checked" && <Check size={12} strokeWidth={3} />}
                {state === "partial" && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
              </button>
              <Folder size={16} className={`shrink-0 ${state !== "unchecked" ? "text-emerald-500" : "text-indigo-400 dark:text-zinc-500"}`} />
              <span onClick={() => handleToggle(node)} className={`text-sm font-medium cursor-pointer flex-1 select-none truncate ${state !== "unchecked" ? "text-slate-900 dark:text-zinc-100 font-semibold" : "text-slate-600 dark:text-zinc-400"}`}>
                {node.name}
              </span>
              <Badge variant="outline" className={`text-[10px] font-bold rounded-full ${node.total_question_count > 0 ? "bg-indigo-50/40 text-indigo-600 border-indigo-100" : "bg-slate-50 text-slate-400"}`}>
                {node.total_question_count} Qs
              </Badge>
            </div>
            {hasC && isExp && <div>{renderTree(node.children, depth + 1)}</div>}
          </li>
        );
      })}
    </ul>
  );

  if (!authed) return null;

  if (isLoading) return (
    <div className="flex flex-1 items-center justify-center h-[500px]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">Loading practice library...</p>
      </div>
    </div>
  );

  if (isError) return (
    <div className="flex flex-1 items-center justify-center p-6 text-center space-y-4">
      <div>
        <p className="text-destructive font-bold">Could not fetch practice categories.</p>
        <Button onClick={() => refetch()} className="mt-4" variant="outline">Retry</Button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link href="/practice">
          <Button variant="ghost" size="sm" className="w-fit flex items-center gap-2 text-muted-foreground hover:text-foreground hover:-translate-x-1 transition-all rounded-xl">
            <ArrowLeft className="h-4 w-4" /> Back to Modules
          </Button>
        </Link>
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Sliders className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              Custom Practice Generator
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Configure exactly what you want to practice.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Category Tree */}
        <Card className="lg:col-span-7 flex flex-col h-[650px] overflow-hidden">
          <CardHeader className="border-b p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/30 shrink-0">
            <div>
              <CardTitle className="text-lg">Category Selection Tree</CardTitle>
              <CardDescription className="text-xs mt-1">Select categories to pull questions from.</CardDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set(rawCategories.map((c: CategoryWithCounts) => c.id)))} className="h-8 text-xs">Select All</Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive">Clear</Button>
            </div>
          </CardHeader>
          <div className="p-4 border-b shrink-0 bg-background">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search categories..." className="pl-10" />
            </div>
          </div>
          <div className="flex-1 p-6 overflow-y-auto min-h-0 bg-background">
            {tree.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <FolderTree className="h-10 w-10 mb-2 opacity-25" />
                <p className="text-sm">No categories available.</p>
              </div>
            ) : <div className="-ml-4 pr-2">{renderTree(tree)}</div>}
          </div>
          <div className="p-4 border-t bg-muted/30 shrink-0 flex items-center justify-between text-sm font-medium text-muted-foreground">
            <div className="flex items-center gap-2"><BookOpen size={16} /><span>{selectedIds.size} categories selected</span></div>
            <div className="flex items-center gap-2"><span>Pool: <strong className="text-foreground">{totalPool}</strong> questions</span></div>
          </div>
        </Card>

        {/* Config Panel */}
        <Card className="lg:col-span-5 flex flex-col h-full overflow-hidden">
          <CardHeader className="border-b p-6 bg-muted/30 shrink-0">
            <CardTitle className="text-lg flex items-center gap-2">Session Parameters</CardTitle>
            <CardDescription className="text-xs mt-1">Fine-tune the behavior of your practice set.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-8 bg-background">
            {/* Name */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Practice Set Name</label>
              <Input value={practiceName} onChange={e => setPracticeName(e.target.value)} placeholder={`Custom Set - ${new Date().toLocaleDateString()}`} />
            </div>

            {/* Question count */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Number of Questions</label>
                <Badge variant="secondary" className="font-semibold">{questionCount} Qs</Badge>
              </div>
              <div className="flex items-center gap-4">
                <input type="range" min={totalPool > 0 ? 1 : 0} max={Math.min(totalPool, 100)} disabled={totalPool === 0} value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))} className="flex-1 accent-primary h-2 cursor-pointer" />
                <Input type="number" min={1} max={Math.min(totalPool, 100)} disabled={totalPool === 0} value={questionCount} onChange={e => setQuestionCount(Math.min(Math.max(1, Number(e.target.value)), Math.min(totalPool, 100)))} className="w-16 h-9 text-center font-semibold p-0" />
              </div>
              {totalPool > 0 && <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Info size={12} /> Limit is 100. Pool size: {totalPool}</p>}
            </div>

            {/* Timer */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Duration Limit</label>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="noTimer" checked={hasNoTimer} onChange={e => setHasNoTimer(e.target.checked)} className="accent-primary h-4 w-4" />
                  <label htmlFor="noTimer" className="text-sm font-medium cursor-pointer select-none">No Timer</label>
                </div>
              </div>
              {!hasNoTimer && (
                <div className="flex items-center gap-4">
                  <Clock size={16} className="text-muted-foreground" />
                  <input type="range" min={5} max={185} step={5} value={durationMinutes} onChange={e => setDurationMinutes(Number(e.target.value))} className="flex-1 accent-primary h-2 cursor-pointer" />
                  <Badge variant="outline" className="font-semibold w-16 justify-center">{durationMinutes === 185 ? "3+ Hrs" : `${durationMinutes}m`}</Badge>
                </div>
              )}
            </div>

            {/* Difficulty */}
            <div className="space-y-3 pt-4 border-t">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Difficulty Level</label>
              <div className="grid grid-cols-4 gap-2">
                {["all", "easy", "medium", "hard"].map(level => (
                  <button key={level} type="button" onClick={() => setDifficulty(level)} className={`py-2 text-xs font-semibold rounded-md border capitalize transition-all ${difficulty === level ? "bg-primary text-primary-foreground border-primary" : "border-input bg-background hover:bg-accent text-foreground"}`}>
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter mode */}
            <div className="space-y-3 pt-4 border-t">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Question Filter Pool</label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: "all", title: "All Selected Questions", desc: "Pick randomly from all questions in selected categories." },
                  { id: "unpracticed", title: "Unpracticed Questions Only", desc: "Exclude questions you have already answered before." },
                  { id: "bookmarked", title: "Bookmarked Questions Only", desc: "Select only from questions you have bookmarked." },
                ].map(item => (
                  <button key={item.id} type="button" onClick={() => setFilterMode(item.id as "all" | "unpracticed" | "bookmarked")}
                    className={`flex flex-col text-left p-3 rounded-lg border transition-all ${filterMode === item.id ? "bg-primary/5 border-primary ring-1 ring-primary" : "border-border hover:border-primary/50 bg-background"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${filterMode === item.id ? "border-primary text-primary" : "border-muted-foreground"}`}>
                        {filterMode === item.id && <div className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      <span className={`text-sm font-semibold ${filterMode === item.id ? "text-primary" : "text-foreground"}`}>{item.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground pl-6">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="pt-6 border-t mt-auto">
              <Button
                disabled={selectedIds.size === 0 || createMutation.isPending || totalPool === 0}
                onClick={handleStart}
                className="w-full h-12 text-base font-semibold"
              >
                {createMutation.isPending ? (
                  <div className="flex items-center gap-2"><div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Generating...</div>
                ) : (
                  <div className="flex items-center gap-2 justify-center"><Play className="h-4 w-4 fill-current" /> Generate Practice Session</div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
