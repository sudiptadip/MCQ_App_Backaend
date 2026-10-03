import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Send,
  X,
  CheckCircle2,
  Hash,
  Timer,
  Bookmark,
  Maximize2
} from 'lucide-react';
import { fetchTestWithQuestions, startAttempt, submitAttempt, toggleBookmark } from '../../features/practice/api/practice.api';
import { practiceSession } from '../../utils/practiceSession';
import Loading from '../../components/common/Loading';
import Error from '../../components/common/Error';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { showToast } from '../../utils/toast';
import type { PracticeQuestion, PracticeSession as SessionType } from '../../types/practice';

// Helper to resolve relative URL using VITE_API_URL
const getAbsoluteUrl = (url?: string | null): string => {
  if (!url) return "";
  const cleanUrl = url.trim().replace(/\\/g, "/");
  if (/^(https?:|data:)/i.test(cleanUrl)) {
    return cleanUrl;
  }
  let apiBase = (import.meta.env.VITE_API_URL || "").trim();
  // Remove trailing /api or /api/
  apiBase = apiBase.replace(/\/api\/?$/, "");
  // Ensure apiBase doesn't have a trailing slash
  apiBase = apiBase.replace(/\/$/, "");
  // Ensure cleanUrl has a leading slash if not present
  const slash = cleanUrl.startsWith("/") ? "" : "/";
  return `${apiBase}${slash}${cleanUrl}`;
};

// ── Memoized Components ──────────────────────────────────────────────────────

interface TestTimerProps {
  initialSeconds: number;
  onTimeUp: () => void;
}

const TestTimer: React.FC<TestTimerProps> = React.memo(({ initialSeconds, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeLeft < 300;

  return (
    <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all duration-500 ${isLowTime ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 animate-pulse' : 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300'}`}>
      <Timer size={16} className={isLowTime ? 'animate-bounce' : ''} />
      <span className="text-sm font-bold tabular-nums">{formatTime(timeLeft)}</span>
    </div>
  );
});

interface QuestionCardProps {
  question: PracticeQuestion;
  index: number;
  isSelected: (optionId: number) => boolean;
  isFlagged: boolean;
  isBookmarked: boolean;
  onSelectOption: (questionId: number, optionId: number) => void;
  onToggleFlag: (questionId: number) => void;
  onToggleBookmark: (questionId: number) => void;
  onReset: (questionId: number) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = React.memo(({
  question,
  index,
  isSelected,
  isFlagged,
  isBookmarked,
  onSelectOption,
  onToggleFlag,
  onToggleBookmark,
  onReset
}) => {
  console.log("QuestionCard rendering question index:", index, "question text:", question.question_text);
  console.log("Image URL from API:", question.image_url);
  console.log("Resolved Absolute Image URL:", question.image_url ? getAbsoluteUrl(question.image_url) : "none");

  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <Card className="border-0 shadow-xl dark:shadow-none shadow-slate-200/50 rounded-3xl overflow-hidden bg-card backdrop-blur-sm flex flex-col h-full">
      <CardHeader className="p-4 md:p-6 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-900/10 shrink-0">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-indigo-600 text-white px-3 py-0.5 rounded-full text-[10px] font-bold tracking-tight">QUESTION {index + 1}</Badge>
              {question.difficulty_level && (
                <Badge variant="outline" className="text-[10px] font-semibold border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400">{question.difficulty_level}</Badge>
              )}
            </div>
            <CardTitle className="text-lg md:text-xl font-bold text-slate-800 dark:text-zinc-100 leading-tight">
              {question.question_text}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleBookmark(question.id)}
              className={`rounded-full transition-all duration-300 ${isBookmarked ? 'text-amber-500 bg-amber-50/80 dark:bg-amber-950/30 shadow-inner' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}
              title={isBookmarked ? "Remove Bookmark" : "Bookmark Question"}
            >
              <Bookmark size={20} fill={isBookmarked ? "currentColor" : "none"} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleFlag(question.id)}
              className={`rounded-full transition-all duration-300 ${isFlagged ? 'text-amber-500 bg-amber-50/80 dark:bg-amber-950/30 shadow-inner' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}
              title={isFlagged ? "Unflag Question" : "Flag Question"}
            >
              <Flag size={20} fill={isFlagged ? "currentColor" : "none"} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 md:p-8 space-y-6">
        {/* Optional Diagram illustration */}
        {question.image_url && (
          <>
            <div className="flex justify-center mb-6">
              <div 
                onClick={() => setIsZoomed(true)}
                className="relative group overflow-hidden rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white p-3 shadow-sm hover:shadow-lg transition-all duration-300 max-w-full sm:max-w-md cursor-zoom-in"
                title="Click to view larger image"
              >
                <img
                  src={getAbsoluteUrl(question.image_url)}
                  alt="Question diagram"
                  className="max-h-[200px] w-auto object-contain rounded-lg transition-transform duration-300 group-hover:scale-[1.02]"
                  onError={(e) => {
                    console.error("Failed to load question image URL:", getAbsoluteUrl(question.image_url), e);
                    (e.target as HTMLElement).parentElement?.style.setProperty('display', 'none');
                  }}
                />
                <div className="absolute top-2 left-2 bg-slate-900/85 backdrop-blur-xs text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md select-none">
                  Illustration
                </div>
                <div className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-slate-900/75 backdrop-blur-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-md">
                  <Maximize2 size={14} />
                </div>
              </div>
            </div>

            {/* Lightbox Dialog */}
            <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
              <DialogContent className="max-w-4xl p-1 bg-black/95 border-0 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md flex flex-col items-center justify-center">
                <div className="relative w-full max-h-[85vh] flex items-center justify-center p-4">
                  <img
                    src={getAbsoluteUrl(question.image_url)}
                    alt="Enlarged diagram"
                    className="max-w-full max-h-[75vh] object-contain rounded-lg border border-zinc-800/50 bg-white p-4"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsZoomed(false)}
                    className="absolute top-2 right-2 rounded-full h-8 w-8 bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-800"
                  >
                    <X size={18} />
                  </Button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-zinc-950/80 backdrop-blur-md border border-zinc-800 text-zinc-300 text-xs py-1.5 px-4 rounded-full select-none font-medium tracking-tight shadow-md whitespace-nowrap">
                    {question.question_text || "Question Illustration"}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}

        <div className="grid grid-cols-1 gap-3">
          {question.options.map((option, idx) => {
            const selected = isSelected(option.id);
            return (
               <button
                key={option.id}
                onClick={() => onSelectOption(question.id, option.id)}
                className={`flex items-center gap-4 p-3 md:p-4 rounded-xl border transition-all duration-300 group text-left ${selected
                  ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-600/20 dark:ring-indigo-500/30'
                  : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/40 hover:border-indigo-200 dark:hover:border-indigo-500 hover:bg-slate-50/50 dark:hover:bg-zinc-800/80 text-slate-700 dark:text-zinc-200'
                  }`}
              >
                <div className={`h-7 w-7 shrink-0 rounded-lg border flex items-center justify-center font-bold text-xs transition-all duration-300 ${selected
                  ? 'bg-indigo-600 dark:bg-indigo-500 border-indigo-600 dark:border-indigo-500 text-white'
                  : 'border-slate-200 dark:border-zinc-750 text-slate-400 dark:text-zinc-300 group-hover:border-indigo-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 bg-slate-50 dark:bg-zinc-700'
                  }`}>
                  {String.fromCharCode(65 + idx)}
                </div>
                <span className={`flex-1 text-sm md:text-base font-medium transition-colors ${selected ? 'text-indigo-900 dark:text-indigo-200 font-bold' : 'text-slate-600 dark:text-zinc-300'}`}>
                  {option.option_text}
                </span>
                {selected && (
                  <div className="h-5 w-5 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center animate-in zoom-in-50 duration-300">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex justify-end pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReset(question.id)}
            className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold text-[10px] uppercase tracking-widest gap-2 rounded-lg"
          >
            <X size={14} /> Clear Selection
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

interface NavigatorProps {
  questions: PracticeQuestion[];
  currentIdx: number;
  answers: Record<number, number>;
  flagged: number[];
  onNavigate: (idx: number) => void;
}

const QuestionNavigator: React.FC<NavigatorProps> = React.memo(({
  questions,
  currentIdx,
  answers,
  flagged,
  onNavigate
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
          const isAnswered = answers[q.id] !== undefined;
          const isFlagged = flagged.includes(q.id);
          const isCurrent = currentIdx === idx;

          return (
            <button
              key={q.id}
              onClick={() => onNavigate(idx)}
              className={`h-9 rounded-xl font-bold text-xs transition-all duration-300 relative ${isCurrent
                ? 'bg-indigo-600 text-white shadow-md dark:shadow-none shadow-indigo-200 scale-105 z-10'
                : isAnswered
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/40'
                  : 'bg-slate-50 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:border-indigo-200 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
            >
              {idx + 1}
              {isFlagged && (
                <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-amber-500 rounded-full border border-white" />
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-2">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-bold uppercase tracking-tight text-slate-400 dark:text-zinc-500">
          <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-indigo-600" /> Current</div>
          <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-emerald-500" /> Answered</div>
          <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-amber-500" /> Flagged</div>
        </div>
      </div>
    </CardContent>
  </Card>
));

const PracticeTestPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const testIdNum = Number(testId);

  // ── States ──────────────────────────────────────────────────────────────────
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [initialTimeLeft, setInitialTimeLeft] = useState<number | null>(null);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [session, setSession] = useState<SessionType | null>(null);
  const [localAnswers, setLocalAnswers] = useState<Record<number, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<number[]>([]);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<number[]>([]);

  // ── Data Fetching ──────────────────────────────────────────────────────────
  const { data: testData, isLoading, isError } = useQuery({
    queryKey: ['practiceTest', testIdNum],
    queryFn: () => fetchTestWithQuestions(testIdNum),
    enabled: !!testIdNum,
  });

  // ── Bookmark Initialization ────────────────────────────────────────────────
  useEffect(() => {
    if (testData?.questions) {
      const initialBookmarks = testData.questions
        .filter(q => q.is_bookmarked)
        .map(q => q.id);
      setBookmarkedQuestions(initialBookmarks);
    }
  }, [testData]);

  // ── Session Initialization ──────────────────────────────────────────────────
  useEffect(() => {
    if (!testData || session) return;

    let existingSession = practiceSession.get(testIdNum);

    if (existingSession && !existingSession.completed) {
      setSession(existingSession);
      setLocalAnswers(existingSession.answers);
      setFlaggedQuestions(existingSession.flagged);

      // Calculate remaining time
      const startTime = new Date(existingSession.startedAt).getTime();
      const endTime = startTime + (existingSession.durationMinutes * 60 * 1000);
      const remainingSeconds = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setInitialTimeLeft(remainingSeconds);
    } else {
      // Create new session
      const newSession = practiceSession.create(
        testIdNum,
        testData.testName,
        testData.totalQuestions,
        testData.durationMinutes
      );
      setSession(newSession);
      setInitialTimeLeft(testData.durationMinutes * 60);

      // Start backend attempt
      startAttemptMutation.mutate(testIdNum);
    }
  }, [testData, testIdNum, session]);

  // ── Mutations ───────────────────────────────────────────────────────────────
  const startAttemptMutation = useMutation({
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
        showToast.success('Test submitted successfully!');
        navigate(`/practice/result/${testIdNum}`, { 
          state: { 
            result: res.data,
            questions: testData?.questions || [],
            answers: localAnswers
          } 
        });
        practiceSession.clear(testIdNum);
      } else {
        showToast.error(res.message || 'Submission failed');
      }
    },
    onError: (err) => showToast.apiErrorShow(err)
  });

  const toggleBookmarkMutation = useMutation({
    mutationFn: toggleBookmark,
    onMutate: async (qId) => {
      // Optimistic update
      setBookmarkedQuestions(prev => {
        const isBookmarked = prev.includes(qId);
        return isBookmarked ? prev.filter(id => id !== qId) : [...prev, qId];
      });
    },
    onSuccess: (res, qId) => {
      if (res.isSuccess) {
        showToast.success(res.message || 'Bookmark updated');
      } else {
        // Revert optimistic update on backend failure
        setBookmarkedQuestions(prev => {
          const isBookmarked = prev.includes(qId);
          return isBookmarked ? prev.filter(id => id !== qId) : [...prev, qId];
        });
        showToast.error(res.message || 'Failed to toggle bookmark');
      }
    },
    onError: (err, qId) => {
      // Revert optimistic update on request error
      setBookmarkedQuestions(prev => {
        const isBookmarked = prev.includes(qId);
        return isBookmarked ? prev.filter(id => id !== qId) : [...prev, qId];
      });
      showToast.apiErrorShow(err);
    }
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSelectOption = useCallback((questionId: number, optionId: number) => {
    setLocalAnswers(prev => ({ ...prev, [questionId]: optionId }));
    practiceSession.setAnswer(testIdNum, questionId, optionId);
  }, [testIdNum]);

  const handleToggleFlag = useCallback((questionId: number) => {
    setFlaggedQuestions(prev => {
      const isFlagged = prev.includes(questionId);
      const newFlags = isFlagged ? prev.filter(id => id !== questionId) : [...prev, questionId];
      return newFlags;
    });
    practiceSession.toggleFlag(testIdNum, questionId);
  }, [testIdNum]);

  const handleToggleBookmark = useCallback((questionId: number) => {
    toggleBookmarkMutation.mutate(questionId);
  }, [toggleBookmarkMutation]);

  const handleResetAnswer = useCallback((questionId: number) => {
    setLocalAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[questionId];
      return newAnswers;
    });
    // Update local storage too
    const currentSession = practiceSession.get(testIdNum);
    if (currentSession) {
      delete currentSession.answers[questionId];
      practiceSession.save(currentSession);
    }
  }, [testIdNum]);

  const handleAutoSubmit = useCallback(() => {
    showToast.warning("Time's up! Submitting your test automatically.");
    handleSubmit();
  }, [session?.attemptId, localAnswers]); // Needs latest values for submission

  const handleSubmit = () => {
    if (!session?.attemptId) {
      showToast.error("No active attempt found. Please try again.");
      return;
    }

    const answersArray = Object.entries(localAnswers).map(([qId, oId]) => ({
      question_id: Number(qId),
      selected_option_id: oId
    }));

    submitMutation.mutate({
      attempt_id: session.attemptId,
      answers: answersArray
    });
  };

  // ── Computed ───────────────────────────────────────────────────────────────
  const currentQuestion = testData?.questions[currentQuestionIndex];
  const progress = ((Object.keys(localAnswers).length) / (testData?.totalQuestions || 1)) * 100;
  const isLastQuestion = currentQuestionIndex === (testData?.questions.length || 0) - 1;

  if (isLoading) return <Loading message="Preparing your test session..." className="h-[600px]" />;
  if (isError) return <div className="p-12"><Error title="Load Error" message="Could not start the test. Please try again." onRetry={() => navigate(-1)} /></div>;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 animate-in fade-in duration-500 pb-24">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm dark:shadow-none">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full h-10 w-10 hover:bg-slate-50 dark:hover:bg-zinc-800">
            <ChevronLeft size={24} className="text-slate-500 dark:text-zinc-400" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-zinc-50">{testData?.testName}</h1>
            <div className="flex items-center gap-3 mt-0.5">
              <Badge variant="secondary" className="bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 text-[10px] font-bold py-0 h-5">
                QUESTION {currentQuestionIndex + 1} OF {testData?.totalQuestions}
              </Badge>
              {initialTimeLeft !== null && (
                <TestTimer initialSeconds={initialTimeLeft} onTimeUp={handleAutoSubmit} />
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex-1 md:w-48 h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-600 transition-all duration-500 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.3)]" 
              style={{ width: `${progress}%` }} 
            />
          </div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 tabular-nums whitespace-nowrap">{Math.round(progress)}% COMPLETE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Area */}
        <div className="lg:col-span-8 space-y-6">
          {currentQuestion && (
            <QuestionCard
              question={currentQuestion}
              index={currentQuestionIndex}
              isSelected={(optionId) => localAnswers[currentQuestion.id] === optionId}
              isFlagged={flaggedQuestions.includes(currentQuestion.id)}
              isBookmarked={bookmarkedQuestions.includes(currentQuestion.id)}
              onSelectOption={handleSelectOption}
              onToggleFlag={handleToggleFlag}
              onToggleBookmark={handleToggleBookmark}
              onReset={handleResetAnswer}
            />
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          <QuestionNavigator
            questions={testData?.questions || []}
            currentIdx={currentQuestionIndex}
            answers={localAnswers}
            flagged={flaggedQuestions}
            onNavigate={(idx) => setCurrentQuestionIndex(idx)}
          />
        </aside>
      </div>

      {/* Fixed Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-background/80 backdrop-blur-xl border-t border-slate-200 dark:border-zinc-800 p-4 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.4)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Button
            variant="outline"
            disabled={currentQuestionIndex === 0}
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            className="rounded-xl h-12 px-6 font-bold border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all flex-1 md:flex-none"
          >
            <ChevronLeft className="mr-2" size={20} /> Previous
          </Button>

          <div className="hidden md:flex flex-col items-center gap-0.5">
            <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Question</span>
            <span className="text-sm font-bold text-slate-700 dark:text-zinc-300">{currentQuestionIndex + 1} <span className="text-slate-300 dark:text-zinc-700 mx-1">/</span> {testData?.totalQuestions}</span>
          </div>

          <div className="flex items-center gap-3 flex-1 md:flex-none">
            {isLastQuestion ? (
              <Button
                onClick={() => setShowConfirmSubmit(true)}
                className="w-full md:w-auto rounded-xl h-12 px-10 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
              >
                Submit Test <Send className="ml-2" size={18} />
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                className="w-full md:w-auto rounded-xl h-12 px-10 font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
              >
                Next Question <ChevronRight className="ml-2" size={20} />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmSubmit} onOpenChange={setShowConfirmSubmit}>
        <DialogContent className="rounded-[2rem] border-0 shadow-2xl sm:max-w-md">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-black">Ready to Submit?</DialogTitle>
            <DialogDescription className="text-base font-medium">
              You have answered {Object.keys(localAnswers).length} out of {testData?.totalQuestions} questions.
              {flaggedQuestions.length > 0 && ` You also have ${flaggedQuestions.length} flagged items.`}
              Once submitted, you cannot change your answers.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="flex flex-col gap-2 p-4 rounded-2xl bg-muted/50 border">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-muted-foreground">Answered</span>
                <span className="text-emerald-600">{Object.keys(localAnswers).length}</span>
              </div>
              <div className="flex justify-between text-sm font-bold">
                <span className="text-muted-foreground">Unanswered</span>
                <span className="text-destructive">{(testData?.totalQuestions || 0) - Object.keys(localAnswers).length}</span>
              </div>
              <div className="flex justify-between text-sm font-bold">
                <span className="text-muted-foreground">Flagged</span>
                <span className="text-amber-500">{flaggedQuestions.length}</span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="ghost" className="rounded-xl font-bold h-12" onClick={() => setShowConfirmSubmit(false)}>Keep Working</Button>
            <Button
              className="rounded-xl font-black h-12 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? 'Submitting...' : 'Yes, Submit Test'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PracticeTestPage;