"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trophy, CheckCircle2, XCircle, Home, RotateCcw, ArrowRight, TrendingUp, Target, Hash, Calendar, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { AttemptResult } from "@/types/practice";
import Link from "next/link";

export default function PracticeResultPage() {
  const { testId } = useParams<{ testId: string }>();
  const router = useRouter();
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("practiceResult");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setResult(parsed.result as AttemptResult);
      } catch {
        // invalid
      }
    }
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  if (!result) return (
    <div className="flex flex-col items-center justify-center flex-1 h-[600px] space-y-6 text-center">
      <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground/30">
        <Target size={40} />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-black">No Result Found</h2>
        <p className="text-muted-foreground">We couldn&apos;t find the result for this test session.</p>
      </div>
      <Link href="/practice"><Button className="rounded-xl font-bold">Go to Practice Hub</Button></Link>
    </div>
  );

  const percentage = Math.round((result.score / result.total_questions) * 100);
  const isPass = percentage >= 40;

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-8 lg:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card className="border shadow-lg rounded-xl overflow-hidden bg-card">
          <div className="grid grid-cols-1 md:grid-cols-12">
            {/* Score */}
            <div className={`md:col-span-5 p-8 md:p-12 flex flex-col items-center justify-center text-center relative overflow-hidden ${isPass ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
              <div className="relative z-10 space-y-6">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-40 h-40 transform -rotate-90">
                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="opacity-20" />
                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * percentage) / 100} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold">{percentage}%</span>
                    <span className="text-xs font-semibold uppercase tracking-widest opacity-80 mt-1">Score</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold tracking-tight">{isPass ? "Excellent Work!" : "Good Effort!"}</h2>
                  <p className="text-sm leading-relaxed max-w-[200px] mx-auto opacity-80">
                    {isPass ? "You have mastered this test section." : "Keep practicing to improve your score."}
                  </p>
                </div>
                <div className="pt-4">
                  {isPass ? (
                    <Badge variant="secondary" className="px-4 py-1.5 uppercase tracking-wider font-bold gap-2">
                      <Trophy size={14} /> Passed
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="px-4 py-1.5 uppercase tracking-wider font-bold gap-2">
                      <Activity size={14} /> Completed
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="md:col-span-7 p-8 md:p-12 bg-card flex flex-col justify-between">
              <div className="space-y-8">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                    <TrendingUp size={14} className="text-primary" /> Performance Breakdown
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 rounded-lg bg-green-500/10 border border-green-500/20 space-y-1">
                      <div className="flex items-center justify-between">
                        <CheckCircle2 size={18} className="text-green-600 dark:text-green-500" />
                        <span className="text-2xl font-bold text-green-700 dark:text-green-400">{result.correct_answers}</span>
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-green-600/80 dark:text-green-500/80">Correct</p>
                    </div>
                    <div className="p-5 rounded-lg bg-red-500/10 border border-red-500/20 space-y-1">
                      <div className="flex items-center justify-between">
                        <XCircle size={18} className="text-red-600 dark:text-red-500" />
                        <span className="text-2xl font-bold text-red-700 dark:text-red-400">{result.total_questions - result.correct_answers}</span>
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-red-600/80 dark:text-red-500/80">Incorrect</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-md bg-background flex items-center justify-center text-muted-foreground shadow-sm"><Target size={18} /></div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Accuracy</p>
                        <p className="text-sm font-medium text-foreground">{percentage >= 70 ? "High Precision" : percentage >= 40 ? "Average" : "Needs Work"}</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-foreground">{percentage}%</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-md bg-background flex items-center justify-center text-muted-foreground shadow-sm"><Hash size={18} /></div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Score</p>
                        <p className="text-sm font-medium text-foreground">Points Earned</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-foreground">{result.score} pts</span>
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar size={14} />
                  <span className="text-xs font-medium">Attempt #{result.attempt_id}</span>
                </div>
                <Badge variant="outline" className="text-[10px] font-semibold">FINAL RESULT</Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button onClick={() => router.push(`/practice/review/${result.attempt_id}`)} className="w-full sm:w-auto min-w-[200px] h-12 gap-2">
            <CheckCircle2 size={18} /> Review Questions
          </Button>
          <Button variant="secondary" onClick={() => router.push(`/practice/test/${testId}`)} className="w-full sm:w-auto min-w-[200px] h-12 gap-2">
            <RotateCcw size={18} /> Retake Practice
          </Button>
          <Button variant="outline" onClick={() => router.push("/practice")} className="w-full sm:w-auto min-w-[200px] h-12 gap-2">
            <Home size={18} /> Practice Hub
          </Button>
        </div>
      </div>
    </div>
  );
}
