"use client";

import React, { useState, useEffect, useCallback, memo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Flag, Send, X, CheckCircle2, Hash, Timer, Bookmark, Maximize2 } from "lucide-react";
import { toast } from "sonner";
import { fetchTestWithQuestions, startAttempt, submitAttempt, toggleBookmark } from "@/features/practice/api";
import { practiceSession } from "@/lib/practiceSession";
import type { PracticeQuestion, PracticeSession as SessionType, AttemptResult } from "@/types/practice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/api\/?$/, "").replace(/\/$/, "");

const getAbsoluteUrl = (url?: string | null): string => {
  if (!url) return "";
  const clean = url.trim().replace(/\\/g, "/");
  if (/^(https?:|data:)/i.test(clean)) return clean;
  return `${API_URL}${clean.startsWith("/") ? "" : "/"}${clean}`;
};

// ── Timer ────────────────────────────────────────────────────────────────────
const TestTimer = memo(({ initialSeconds, onTimeUp }: { initialSeconds: number; onTimeUp: () => void }) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  useEffect(() => {
    if (timeLeft <= 0) { onTimeUp(); return; }
    const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, onTimeUp]);
  const m = Math.floor(timeLeft / 60), s = timeLeft % 60;
  const isLow = timeLeft < 300;
  return (
    <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all duration-500 ${isLow ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 animate-pulse" : "bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300"}`}>
      <Timer size={16} className={isLow ? "animate-bounce" : ""} />
      <span className="text-sm font-bold tabular-nums">{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}</span>
    </div>
  );
});
TestTimer.displayName = "TestTimer";

// ── Question Card ─────────────────────────────────────────────────────────────
const QuestionCard = memo(({ question, index, isSelected, isFlagged, isBookmarked, onSelectOption, onToggleFlag, onToggleBookmark, onReset }: {
  question: PracticeQuestion; index: number;
  isSelected: (id: number) => boolean; isFlagged: boolean; isBookmarked: boolean;
  onSelectOption: (qId: number, oId: number) => void;
  onToggleFlag: (qId: number) => void; onToggleBookmark: (qId: number) => void; onReset: (qId: number) => void;
}) => {
  const [zoomed, setZoomed] = useState(false);
  return (
    <Card className="border-0 shadow-xl dark:shadow-none shadow-slate-200/50 rounded-3xl overflow-hidden bg-card flex flex-col h-full">
      <CardHeader className="p-4 md:p-6 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-900/10 shrink-0">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-indigo-600 text-white px-3 py-0.5 rounded-full text-[10px] font-bold">QUESTION {index + 1}</Badge>
              {question.difficulty_level && <Badge variant="outline" className="text-[10px] font-semibold border-slate-200 dark:border-zinc-800 text-slate-500">{question.difficulty_level}</Badge>}
            </div>
            <CardTitle className="text-lg md:text-xl font-bold text-slate-800 dark:text-zinc-100 leading-tight">{question.question_text}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => onToggleBookmark(question.id)} className={`rounded-full ${isBookmarked ? "text-amber-500 bg-amber-50/80 dark:bg-amber-950/30" : "text-slate-400"}`}>
              <Bookmark size={20} fill={isBookmarked ? "currentColor" : "none"} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onToggleFlag(question.id)} className={`rounded-full ${isFlagged ? "text-amber-500 bg-amber-50/80 dark:bg-amber-950/30" : "text-slate-400"}`}>
              <Flag size={20} fill={isFlagged ? "currentColor" : "none"} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 md:p-8 space-y-6">
        {question.image_url && (
          <>
            <div className="flex justify-center mb-6">
              <div onClick={() => setZoomed(true)} className="relative group overflow-hidden rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white p-3 shadow-sm hover:shadow-lg transition-all duration-300 max-w-full sm:max-w-md cursor-zoom-in">
                <img src={getAbsoluteUrl(question.image_url)} alt="Question diagram" className="max-h-[200px] w-auto object-contain rounded-lg" onError={(e) => { (e.target as HTMLElement).parentElement?.style.setProperty("display", "none"); }} />
                <div className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-slate-900/75 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 size={14} />
                </div>
              </div>
            </div>
            <Dialog open={zoomed} onOpenChange={setZoomed}>
              <DialogContent className="max-w-4xl p-1 bg-black/95 border-0 rounded-2xl overflow-hidden flex flex-col items-center justify-center">
                <div className="relative w-full max-h-[85vh] flex items-center justify-center p-4">
                  <img src={getAbsoluteUrl(question.image_url)} alt="Enlarged diagram" className="max-w-full max-h-[75vh] object-contain rounded-lg border border-zinc-800/50 bg-white p-4" />
                  <Button variant="ghost" size="icon" onClick={() => setZoomed(false)} className="absolute top-2 right-2 rounded-full h-8 w-8 bg-zinc-900/60 text-zinc-400 hover:text-white"><X size={18} /></Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
        <div className="grid grid-cols-1 gap-3">
          {question.options.map((option, idx) => {
            const selected = isSelected(option.id);
            return (
              <button key={option.id} onClick={() => onSelectOption(question.id, option.id)}
                className={`flex items-center gap-4 p-3 md:p-4 rounded-xl border transition-all duration-300 group text-left ${selected ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-600/20" : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/40 hover:border-indigo-200 dark:hover:border-indigo-500 hover:bg-slate-50/50"}`}>
                <div className={`h-7 w-7 shrink-0 rounded-lg border flex items-center justify-center font-bold text-xs transition-all ${selected ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-200 dark:border-zinc-750 text-slate-400 bg-slate-50 dark:bg-zinc-700"}`}>
                  {String.fromCharCode(65 + idx)}
                </div>
                <span className={`flex-1 text-sm md:text-base font-medium ${selected ? "text-indigo-900 dark:text-indigo-200 font-bold" : "text-slate-600 dark:text-zinc-300"}`}>{option.option_text}</span>
                {selected && <div className="h-5 w-5 rounded-full bg-indigo-600 flex items-center justify-center"><CheckCircle2 className="h-3 w-3 text-white" /></div>}
              </button>
            );
          })}
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="ghost" size="sm" onClick={() => onReset(question.id)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold text-[10px] uppercase tracking-widest gap-2 rounded-lg">
            <X size={14} /> Clear Selection
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
QuestionCard.displayName = "QuestionCard";

// ── Navigator ─────────────────────────────────────────────────────────────────
const QuestionNavigator = memo(({ questions, currentIdx, answers, flagged, onNavigate }: {
  questions: PracticeQuestion[]; currentIdx: number; answers: Record<number, number>; flagged: number[]; onNavigate: (i: number) => void;
}) => (
  <Card className="border-0 shadow-lg dark:shadow-none shadow-slate-200/40 rounded-3xl bg-card overflow-hidden">
    <CardHeader className="p-5 border-b border-slate-50 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/10">
      <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-2">
        <Hash size={14} className="text-indigo-500" /> QUESTION NAVIGATOR
      </CardTitle>
    </CardHeader>
    <CardContent className="p-5">
      <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2">
        {questions.map((q, idx) => {
          const answered = answers[q.id] !== undefined, fl = flagged.includes(q.id), curr = currentIdx === idx;
          return (
            <button key={q.id} onClick={() => onNavigate(idx)}
              className={`h-9 rounded-xl font-bold text-xs transition-all duration-300 relative ${curr ? "bg-indigo-600 text-white shadow-md scale-105 z-10" : answered ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-100 hover:bg-emerald-100" : "bg-slate-50 dark:bg-zinc-800/60 text-slate-500 border border-slate-200 dark:border-zinc-700 hover:border-indigo-200"}`}>
              {idx + 1}
              {fl && <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-amber-500 rounded-full border border-white" />}
            </button>
          );
        })}
      </div>
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800 flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-bold uppercase tracking-tight text-slate-400">
        <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-indigo-600" /> Current</div>
        <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-emerald-500" /> Answered</div>
        <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-amber-500" /> Flagged</div>
      </div>
    </CardContent>
  </Card>
));
QuestionNavigator.displayName = "QuestionNavigator";

// ── Main Test Page ────────────────────────────────────────────────────────────
export default function PracticeTestPage() {
  const { testId } = useParams<{ testId: string }>();
  const router = useRouter();
  const testIdNum = Number(testId);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [initialTime, setInitialTime] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [session, setSession] = useState<SessionType | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<number[]>([]);
  const [bookmarked, setBookmarked] = useState<number[]>([]);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/login"); } else { setAuthed(true); }
  }, [router]);

  const { data: testData, isLoading, isError } = useQuery({
    queryKey: ["practiceTest", testIdNum],
    queryFn: () => fetchTestWithQuestions(testIdNum),
    enabled: authed && !!testIdNum,
  });

  useEffect(() => {
    if (testData?.questions) {
      setBookmarked(testData.questions.filter(q => q.is_bookmarked).map(q => q.id));
    }
  }, [testData]);

  const startMutation = useMutation({
    mutationFn: startAttempt,
    onSuccess: (res) => {
      if (res.isSuccess && res.data) {
        practiceSession.setAttemptId(testIdNum, res.data.id);
        setSession(prev => prev ? { ...prev, attemptId: res.data!.id } : null);
      }
    }
  });

  const submitMutation = useMutation({
    mutationFn: submitAttempt,
    onSuccess: (res) => {
      if (res.isSuccess) {
        practiceSession.complete(testIdNum);
        toast.success("Test submitted successfully!");
        sessionStorage.setItem("practiceResult", JSON.stringify({ result: res.data, testId: testIdNum }));
        router.push(`/practice/result/${testIdNum}`);
        practiceSession.clear(testIdNum);
      } else {
        toast.error(res.message || "Submission failed");
      }
    },
    onError: () => toast.error("Submission failed")
  });

  const bmMutation = useMutation({
    mutationFn: toggleBookmark,
    onMutate: (qId) => setBookmarked(prev => prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]),
    onSuccess: (res) => { if (res.isSuccess) toast.success(res.message || "Bookmark updated"); },
    onError: (_, qId) => setBookmarked(prev => prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]),
  });

  useEffect(() => {
    if (!testData || session) return;
    const existing = practiceSession.get(testIdNum);
    if (existing && !existing.completed) {
      setSession(existing); setAnswers(existing.answers); setFlagged(existing.flagged);
      const end = new Date(existing.startedAt).getTime() + existing.durationMinutes * 60000;
      setInitialTime(Math.max(0, Math.floor((end - Date.now()) / 1000)));
    } else {
      const s = practiceSession.create(testIdNum, testData.testName, testData.totalQuestions, testData.durationMinutes);
      setSession(s); setInitialTime(testData.durationMinutes * 60);
      startMutation.mutate(testIdNum);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testData, testIdNum, session]);

  const handleSelect = useCallback((qId: number, oId: number) => {
    setAnswers(prev => ({ ...prev, [qId]: oId }));
    practiceSession.setAnswer(testIdNum, qId, oId);
  }, [testIdNum]);

  const handleFlag = useCallback((qId: number) => {
    setFlagged(prev => { const f = prev.includes(qId); return f ? prev.filter(id => id !== qId) : [...prev, qId]; });
    practiceSession.toggleFlag(testIdNum, qId);
  }, [testIdNum]);

  const handleReset = useCallback((qId: number) => {
    setAnswers(prev => { const n = { ...prev }; delete n[qId]; return n; });
    const s = practiceSession.get(testIdNum);
    if (s) { delete s.answers[qId]; practiceSession.save(s); }
  }, [testIdNum]);

  const handleSubmit = useCallback(() => {
    if (!session?.attemptId) { toast.error("No active attempt. Please try again."); return; }
    submitMutation.mutate({
      attempt_id: session.attemptId,
      answers: Object.entries(answers).map(([qId, oId]) => ({ question_id: Number(qId), selected_option_id: oId }))
    });
  }, [session, answers, submitMutation]);

  const handleAutoSubmit = useCallback(() => {
    toast.warning("Time's up! Submitting automatically.");
    handleSubmit();
  }, [handleSubmit]);

  if (!authed) return null;
  if (isLoading) return (
    <div className="flex flex-1 items-center justify-center h-[600px]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">Preparing your test session...</p>
      </div>
    </div>
  );
  if (isError) return (
    <div className="flex flex-1 items-center justify-center p-12">
      <div className="text-center space-y-4">
        <p className="text-destructive font-bold text-xl">Could not load the test.</p>
        <Button onClick={() => router.back()} variant="outline">Go Back</Button>
      </div>
    </div>
  );

  const currentQ = testData?.questions[currentIdx];
  const progress = (Object.keys(answers).length / (testData?.totalQuestions || 1)) * 100;
  const isLast = currentIdx === (testData?.questions.length || 0) - 1;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 pb-28">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-10 w-10"><ChevronLeft size={24} className="text-slate-500" /></Button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-zinc-50">{testData?.testName}</h1>
            <div className="flex items-center gap-3 mt-0.5">
              <Badge variant="secondary" className="bg-slate-100 dark:bg-zinc-800 text-slate-500 text-[10px] font-bold py-0 h-5">
                QUESTION {currentIdx + 1} OF {testData?.totalQuestions}
              </Badge>
              {initialTime !== null && <TestTimer initialSeconds={initialTime} onTimeUp={handleAutoSubmit} />}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1 md:w-48 h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-[10px] font-bold text-slate-400 tabular-nums whitespace-nowrap">{Math.round(progress)}% DONE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          {currentQ && (
            <QuestionCard
              question={currentQ} index={currentIdx}
              isSelected={(oId) => answers[currentQ.id] === oId}
              isFlagged={flagged.includes(currentQ.id)}
              isBookmarked={bookmarked.includes(currentQ.id)}
              onSelectOption={handleSelect} onToggleFlag={handleFlag}
              onToggleBookmark={(qId) => bmMutation.mutate(qId)} onReset={handleReset}
            />
          )}
        </div>
        <aside className="lg:col-span-4">
          <QuestionNavigator questions={testData?.questions || []} currentIdx={currentIdx} answers={answers} flagged={flagged} onNavigate={setCurrentIdx} />
        </aside>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-slate-200 dark:border-zinc-800 p-4 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Button variant="outline" disabled={currentIdx === 0} onClick={() => setCurrentIdx(p => p - 1)} className="rounded-xl h-12 px-6 font-bold flex-1 md:flex-none">
            <ChevronLeft className="mr-2" size={20} /> Previous
          </Button>
          <div className="hidden md:flex flex-col items-center gap-0.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question</span>
            <span className="text-sm font-bold text-slate-700 dark:text-zinc-300">{currentIdx + 1} <span className="text-slate-300 dark:text-zinc-700 mx-1">/</span> {testData?.totalQuestions}</span>
          </div>
          <div className="flex items-center gap-3 flex-1 md:flex-none">
            {isLast ? (
              <Button onClick={() => setShowConfirm(true)} className="w-full md:w-auto rounded-xl h-12 px-10 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg">
                Submit Test <Send className="ml-2" size={18} />
              </Button>
            ) : (
              <Button onClick={() => setCurrentIdx(p => p + 1)} className="w-full md:w-auto rounded-xl h-12 px-10 font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg">
                Next <ChevronRight className="ml-2" size={20} />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="rounded-[2rem] border-0 shadow-2xl sm:max-w-md">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-black">Ready to Submit?</DialogTitle>
            <DialogDescription className="text-base font-medium">
              You&apos;ve answered {Object.keys(answers).length} of {testData?.totalQuestions} questions.
              {flagged.length > 0 && ` You have ${flagged.length} flagged item${flagged.length > 1 ? "s" : ""}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="flex flex-col gap-2 p-4 rounded-2xl bg-muted/50 border">
              <div className="flex justify-between text-sm font-bold"><span className="text-muted-foreground">Answered</span><span className="text-emerald-600">{Object.keys(answers).length}</span></div>
              <div className="flex justify-between text-sm font-bold"><span className="text-muted-foreground">Unanswered</span><span className="text-destructive">{(testData?.totalQuestions || 0) - Object.keys(answers).length}</span></div>
              <div className="flex justify-between text-sm font-bold"><span className="text-muted-foreground">Flagged</span><span className="text-amber-500">{flagged.length}</span></div>
            </div>
          </div>
          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="ghost" className="rounded-xl font-bold h-12" onClick={() => setShowConfirm(false)}>Keep Working</Button>
            <Button className="rounded-xl font-black h-12 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSubmit} disabled={submitMutation.isPending}>
              {submitMutation.isPending ? "Submitting..." : "Yes, Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
