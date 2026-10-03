import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, BookOpen, Award, FileText, Landmark, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { getTestById } from "../../features/test/api/test.api";
import { cn } from "../../lib/utils";

const TestDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch test details using SpTest Mode 4
  const { data, isLoading, isError } = useQuery({
    queryKey: ["testDetails", id],
    queryFn: () => getTestById(Number(id)),
    enabled: !!id,
  });

  const test = data?.test;
  const questions = data?.questions || [];

  // Calculate difficulty breakups
  const easyCount = questions.filter((q: any) => q.difficulty_level?.toLowerCase() === "easy").length;
  const mediumCount = questions.filter((q: any) => q.difficulty_level?.toLowerCase() === "medium").length;
  const hardCount = questions.filter((q: any) => q.difficulty_level?.toLowerCase() === "hard").length;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground gap-3 animate-pulse">
        <Loader2 className="animate-spin text-primary" size={32} />
        <span className="text-sm font-medium">Loading test details...</span>
      </div>
    );
  }

  if (isError || !test) {
    return (
      <div className="max-w-md mx-auto my-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-xl font-bold text-foreground">Failed to Load Test</h2>
        <p className="text-sm text-muted-foreground">There was an error fetching the details of this test or it does not exist.</p>
        <button
          onClick={() => navigate("/test")}
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors"
        >
          Back to Tests
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header breadcrumbs and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/test")}
            className="p-2 hover:bg-accent rounded-full transition-colors shrink-0 border bg-background"
            title="Back to tests"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Test View Mode</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">{test.name}</h1>
          </div>
        </div>
        
        {test.is_assigned_by_franchise && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <ShieldCheck size={14} />
            Assigned & Locked
          </span>
        )}
      </div>

      {/* Main Stats Banner Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card shadow-sm border border-border/70 rounded-xl p-4 flex items-center gap-4 transition-all hover:shadow-md hover:border-primary/10">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Duration</p>
            <p className="text-lg font-bold text-foreground">{test.duration_minutes} <span className="text-sm font-medium text-muted-foreground">Min</span></p>
          </div>
        </div>

        <div className="bg-card shadow-sm border border-border/70 rounded-xl p-4 flex items-center gap-4 transition-all hover:shadow-md hover:border-primary/10">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <BookOpen size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Questions</p>
            <p className="text-lg font-bold text-foreground">{test.total_questions} <span className="text-sm font-medium text-muted-foreground">MCQs</span></p>
          </div>
        </div>

        <div className="bg-card shadow-sm border border-border/70 rounded-xl p-4 flex items-center gap-4 transition-all hover:shadow-md hover:border-primary/10">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Award size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Min. Questions Attempt</p>
            <p className="text-lg font-bold text-foreground">{test.min_no_of_question_attempt ?? 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Two Column Page Details Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Questions Listing */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card rounded-xl border shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 border-b pb-3">
              <FileText size={18} className="text-primary" />
              <h2 className="text-lg font-bold text-foreground">Questions List ({questions.length})</h2>
            </div>

            {questions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground italic border border-dashed rounded-lg bg-muted/10">
                No questions are mapped to this test.
              </div>
            ) : (
              <div className="space-y-5">
                {questions.map((q: any, index: number) => {
                  const difficulty = q.difficulty_level?.toLowerCase() || 'medium';
                  return (
                    <div
                      key={q.id ?? index}
                      className="p-5 bg-muted/10 border border-border/50 rounded-xl flex flex-col gap-3 hover:bg-muted/20 transition-all hover:shadow-md"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-bold text-muted-foreground bg-background border px-2.5 py-0.5 rounded shadow-sm shrink-0">
                          Q{index + 1}
                        </span>
                        <p className="text-sm font-semibold text-foreground leading-relaxed flex-1">
                          {q.question_text}
                        </p>
                      </div>

                      {/* Options rendering */}
                      {q.options && q.options.length > 0 && (
                        <div className="pl-0 sm:pl-8 grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                          {q.options.map((opt: any, optIndex: number) => {
                            const optionLetter = String.fromCharCode(65 + optIndex);
                            const isCorrect = opt.is_correct === true || opt.is_correct === 1 || opt.is_correct === "true";
                            return (
                              <div
                                key={opt.id ?? optIndex}
                                className={cn(
                                  "flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs transition-all",
                                  isCorrect
                                    ? "bg-emerald-50/70 border-emerald-200 text-emerald-800 font-medium shadow-xs"
                                    : "bg-background border-border/60 text-muted-foreground"
                                )}
                              >
                                <span className={cn(
                                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 shadow-xs border",
                                  isCorrect
                                    ? "bg-emerald-600 border-emerald-600 text-white"
                                    : "bg-muted text-muted-foreground border-border/70"
                                )}>
                                  {optionLetter}
                                </span>
                                <span className="flex-1 break-words">{opt.option_text}</span>
                                {isCorrect && (
                                  <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                                    Correct
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Explanation rendering */}
                      {q.question_explanation && (
                        <div className="pl-0 sm:pl-8 mt-1">
                          <div className="bg-amber-50/30 border border-amber-100/70 rounded-lg p-3 text-xs text-amber-800 leading-relaxed flex gap-2">
                            <span className="font-bold text-amber-700 shrink-0">Explanation:</span>
                            <p className="flex-1 italic">{q.question_explanation}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 justify-end items-center border-t border-border/30 pt-2.5 mt-2">
                        <span className={cn(
                          "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-sm",
                          difficulty === 'easy' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          difficulty === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-rose-50 text-rose-700 border-rose-200'
                        )}>
                          {difficulty}
                        </span>
                        {q.category_name && (
                          <span className="text-[9px] font-semibold bg-primary/8 text-primary border border-primary/15 px-2.5 py-0.5 rounded-full shadow-sm">
                            {q.category_name}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Statistics & Guidelines Sidebar */}
        <div className="space-y-5">
          {/* Mapping & Description Panel */}
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="h-1.5 bg-primary w-full" />
            <div className="p-5 space-y-4">
              <h3 className="font-bold text-md text-foreground flex items-center gap-2">
                <Landmark size={16} className="text-primary" />
                Test Information
              </h3>
              
              <div className="space-y-3">
                <div>
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Description</h4>
                  {test.description ? (
                    <p className="text-sm text-foreground leading-relaxed bg-muted/40 p-3 rounded-lg border">
                      {test.description}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No description has been created for this test.</p>
                  )}
                </div>

                <div className="border-t pt-3 mt-3">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Difficulty Splitups</h4>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 block"></span>
                          Easy
                        </span>
                        <span className="font-bold text-foreground">{easyCount} ({questions.length > 0 ? Math.round((easyCount / questions.length) * 100) : 0}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${questions.length > 0 ? (easyCount / questions.length) * 100 : 0}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-amber-700 font-medium flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500 block"></span>
                          Medium
                        </span>
                        <span className="font-bold text-foreground">{mediumCount} ({questions.length > 0 ? Math.round((mediumCount / questions.length) * 100) : 0}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${questions.length > 0 ? (mediumCount / questions.length) * 100 : 0}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-rose-700 font-medium flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500 block"></span>
                          Hard
                        </span>
                        <span className="font-bold text-foreground">{hardCount} ({questions.length > 0 ? Math.round((hardCount / questions.length) * 100) : 0}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${questions.length > 0 ? (hardCount / questions.length) * 100 : 0}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {test.is_assigned_by_franchise && (
                  <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-800 leading-relaxed mt-4">
                    <strong>Notice:</strong> This test is currently active on child franchise centers. Modifications or deletion are locked to preserve integrity.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestDetailsPage;
