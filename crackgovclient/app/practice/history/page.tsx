"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Calendar, CheckCircle2, XCircle, ClipboardList, ArrowRight } from "lucide-react";
import { fetchPracticeHistory } from "@/features/practice/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AttemptHistoryItem } from "@/types/practice";
import Link from "next/link";

export default function PracticeHistoryPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/login"); } else { setAuthed(true); }
  }, [router]);

  const { data: res, isLoading, isError } = useQuery({
    queryKey: ["practiceHistory"],
    queryFn: fetchPracticeHistory,
    enabled: authed,
  });

  if (!authed) return null;

  if (isLoading) return (
    <div className="flex flex-1 items-center justify-center h-[500px]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">Loading your history...</p>
      </div>
    </div>
  );

  if (isError || !res?.isSuccess) return (
    <div className="flex flex-1 items-center justify-center p-6 text-center space-y-4">
      <div>
        <p className="text-destructive font-bold">Could not load history.</p>
        <Link href="/practice"><Button className="mt-4" variant="outline">Back to Practice</Button></Link>
      </div>
    </div>
  );

  const history: AttemptHistoryItem[] = res.data || [];

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-8 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 border border-indigo-500/20">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Attempt History</h1>
            <p className="text-muted-foreground font-medium">All your past practice attempts</p>
          </div>
        </div>
        <Link href="/practice"><Button variant="outline" className="rounded-xl font-bold">Practice Hub</Button></Link>
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-3xl border-2 border-dashed border-muted-foreground/20 bg-muted/10 text-center space-y-3">
          <ClipboardList className="h-14 w-14 text-muted-foreground/30" />
          <p className="text-lg font-bold text-muted-foreground/60">No attempts yet</p>
          <p className="text-sm text-muted-foreground/40">Complete a practice test to see your history here.</p>
          <Link href="/practice"><Button className="mt-2 rounded-xl">Start Practicing</Button></Link>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item: AttemptHistoryItem) => {
            const isPass = item.percentage >= 40;
            return (
              <Card key={item.attemptId} className="border border-slate-100 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden">
                <CardContent className="p-5 flex items-center gap-4 flex-wrap">
                  {/* Score icon */}
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${isPass ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600" : "bg-rose-100 dark:bg-rose-950/30 text-rose-600"}`}>
                    {isPass ? <CheckCircle2 size={22} /> : <XCircle size={22} />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-foreground truncate">{item.testName}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar size={11} /> {new Date(item.attemptDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      {item.categoryName && <span className="text-xs text-muted-foreground">• {item.categoryName}</span>}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="text-center">
                      <p className="text-lg font-black text-foreground">{item.percentage}%</p>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Score</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-black text-foreground">{item.correctAnswers}/{item.totalQuestions}</p>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Correct</p>
                    </div>
                    <Badge className={`${isPass ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"} font-bold text-[10px] uppercase tracking-wider`}>
                      {isPass ? "Passed" : "Failed"}
                    </Badge>
                    <Button size="sm" variant="ghost" onClick={() => router.push(`/practice/review/${item.attemptId}`)} className="rounded-xl font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 gap-1">
                      Review <ArrowRight size={14} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
