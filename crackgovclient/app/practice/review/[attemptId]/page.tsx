"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle, ArrowLeft, Minus } from "lucide-react";
import { fetchAttemptReview } from "@/features/practice/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ReviewQuestion } from "@/types/practice";
import Link from "next/link";

export default function PracticeReviewPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/login"); } else { setAuthed(true); }
  }, [router]);

  const { data: res, isLoading, isError } = useQuery({
    queryKey: ["attemptReview", attemptId],
    queryFn: () => fetchAttemptReview(Number(attemptId)),
    enabled: authed && !!attemptId,
  });

  if (!authed) return null;

  if (isLoading) return (
    <div className="flex flex-1 items-center justify-center h-[500px]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">Loading review...</p>
      </div>
    </div>
  );

  if (isError || !res?.isSuccess) return (
    <div className="flex flex-1 items-center justify-center p-6 text-center space-y-4">
      <div>
        <p className="text-destructive font-bold">Could not load the review.</p>
        <Link href="/practice"><Button className="mt-4" variant="outline">Back to Practice</Button></Link>
      </div>
    </div>
  );

  const review = res.data!;
  const percentage = Math.round((review.correctAnswers / review.totalQuestions) * 100);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="w-fit flex items-center gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">{review.testName}</h1>
            <p className="text-muted-foreground font-medium mt-1">Review your answers below</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100">
              <p className="text-2xl font-black text-emerald-600">{review.correctAnswers}</p>
              <p className="text-[10px] font-bold uppercase text-emerald-600/70">Correct</p>
            </div>
            <div className="text-center p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100">
              <p className="text-2xl font-black text-rose-600">{review.totalQuestions - review.correctAnswers}</p>
              <p className="text-[10px] font-bold uppercase text-rose-600/70">Incorrect</p>
            </div>
            <div className="text-center p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100">
              <p className="text-2xl font-black text-indigo-600">{percentage}%</p>
              <p className="text-[10px] font-bold uppercase text-indigo-600/70">Score</p>
            </div>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {review.questions.map((q: ReviewQuestion, idx: number) => {
          const userAns = q.userSelectedOptionId;
          const isSkipped = userAns === null;
          const isCorrect = !isSkipped && q.options.some(o => o.id === userAns && o.isCorrect);
          const explanation = q.questionExplanation || q.question_explanation;

          return (
            <div key={q.id} className={`rounded-2xl border p-5 md:p-6 space-y-4 ${isCorrect ? "border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/10" : isSkipped ? "border-slate-200 dark:border-zinc-800 bg-muted/10" : "border-rose-200 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/10"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="shrink-0 h-7 w-7 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-black text-slate-500">{idx + 1}</span>
                  <p className="text-base font-semibold text-foreground leading-relaxed">{q.questionText}</p>
                </div>
                {isCorrect ? <CheckCircle2 size={20} className="text-emerald-500 shrink-0 mt-0.5" /> : isSkipped ? <Minus size={20} className="text-slate-400 shrink-0 mt-0.5" /> : <XCircle size={20} className="text-rose-500 shrink-0 mt-0.5" />}
              </div>

              <div className="space-y-2 pl-10">
                {q.options.map((opt, oIdx) => {
                  const isUserAns = opt.id === userAns;
                  const isCorrectOpt = opt.isCorrect;
                  return (
                    <div key={opt.id} className={`flex items-center gap-3 p-3 rounded-xl border text-sm font-medium transition-all ${isCorrectOpt ? "border-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300" : isUserAns && !isCorrectOpt ? "border-rose-400 bg-rose-100/60 dark:bg-rose-950/30 text-rose-900 dark:text-rose-300" : "border-slate-200 dark:border-zinc-800 text-muted-foreground bg-white dark:bg-zinc-900/20"}`}>
                      <span className="h-6 w-6 shrink-0 rounded-md border flex items-center justify-center text-xs font-black bg-white/80 dark:bg-zinc-900/80 border-current/30">
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span className="flex-1">{opt.optionText}</span>
                      {isCorrectOpt && <Badge className="bg-emerald-500 text-white text-[9px] font-black tracking-wider">CORRECT</Badge>}
                      {isUserAns && !isCorrectOpt && <Badge className="bg-rose-500 text-white text-[9px] font-black tracking-wider">YOUR ANSWER</Badge>}
                    </div>
                  );
                })}
              </div>

              {explanation && (
                <div className="pl-10 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30">
                  <p className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">Explanation</p>
                  <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed">{explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-center pb-8">
        <Link href="/practice"><Button className="rounded-xl font-bold h-12 px-8">Back to Practice Hub</Button></Link>
      </div>
    </div>
  );
}
