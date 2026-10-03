import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Hash,
  ArrowLeft,
  Info
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';


import { useQuery } from '@tanstack/react-query';
import { fetchAttemptReview } from '../../features/practice/api/practice.api';
import Loading from '../../components/common/Loading';

const PracticeReviewPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  
  const attemptIdNum = Number(attemptId);

  const { data: reviewRes, isLoading } = useQuery({
    queryKey: ['attempt-review', attemptIdNum],
    queryFn: () => fetchAttemptReview(attemptIdNum),
    enabled: !!attemptIdNum
  });

  // Prioritize API data
  const reviewData = reviewRes?.isSuccess ? reviewRes.data : null;
  
  // If we have reviewData from API, use its structure. 
  // Otherwise try to reconstruct from location state (for legacy or immediate view)
  const questions = reviewData?.questions;

  if (isLoading) return <Loading />;

  if (!questions) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-300 dark:text-zinc-700 mb-4">
          <Info size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100">Review Data Not Found</h2>
        <p className="text-slate-500 dark:text-zinc-400 mt-2 max-w-xs">We couldn't load the review for this attempt. Please go back to the history.</p>
        <Button onClick={() => navigate('/practice/history')} className="mt-6 rounded-xl font-bold">Go to History</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800/80 px-4 md:px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)} 
              className="rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800/60"
            >
              <ArrowLeft size={20} className="text-slate-500 dark:text-zinc-400" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-zinc-50">Review Answers</h1>
              <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                <Hash size={10} /> {questions.length} Questions Reviewed
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(-1)} 
            className="rounded-xl font-bold border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 bg-white dark:bg-zinc-850 hover:bg-slate-50 dark:hover:bg-zinc-800"
          >
            Back to Result
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-2xl p-4 flex items-start gap-3 text-blue-700 dark:text-blue-300 shadow-sm">
          <Info size={20} className="shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold">Review Mode</p>
            <p className="opacity-80">Check your performance below. Correct answers are highlighted in green, and your mistakes are marked in red.</p>
          </div>
        </div>

        <div className="space-y-6">
          {questions.map((question, qIdx) => {
            const userAnswerId = question.userSelectedOptionId;
            const correctOption = question.options.find(o => o.isCorrect);
            const isCorrect = userAnswerId === correctOption?.id;
            const explanation = question.questionExplanation ?? question.question_explanation;
            const tag = question.tag ?? question.tags;

            return (
              <Card 
                key={question.id} 
                className="border border-slate-100 dark:border-zinc-800/80 shadow-xl dark:shadow-[0_4px_25px_rgba(0,0,0,0.3)] rounded-3xl overflow-hidden bg-card hover:shadow-2xl dark:hover:border-zinc-700/60 transition-all duration-300"
              >
                <CardHeader className="p-6 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/40 dark:bg-zinc-900/20">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className={`${isCorrect ? 'bg-emerald-500 dark:bg-emerald-600' : userAnswerId ? 'bg-rose-500 dark:bg-rose-600' : 'bg-slate-400 dark:bg-zinc-600'} text-white px-3 py-0.5 rounded-full text-[10px] font-bold tracking-tight`}>
                        {isCorrect ? 'CORRECT' : userAnswerId ? 'INCORRECT' : 'UNANSWERED'}
                      </Badge>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Question {qIdx + 1}</span>
                    </div>
                    <CardTitle className="text-lg font-bold text-slate-800 dark:text-zinc-50 leading-tight">
                      {question.questionText}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                     {question.options.map((option, oIdx) => {
                      const isUserChoice = userAnswerId === option.id;
                      const isOptionCorrect = option.isCorrect;
                      
                      let variantClasses = 'border-slate-100 dark:border-zinc-850 bg-white dark:bg-zinc-900/40 text-slate-600 dark:text-zinc-300 hover:border-slate-200 dark:hover:border-zinc-700/80';
                      if (isOptionCorrect) {
                        variantClasses = 'border-emerald-500 dark:border-emerald-500/85 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500/20 dark:ring-emerald-500/30';
                      } else if (isUserChoice && !isOptionCorrect) {
                        variantClasses = 'border-rose-500 dark:border-rose-500/85 bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 ring-1 ring-rose-500/20 dark:ring-rose-500/30';
                      }

                      return (
                        <div
                          key={option.id}
                          className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${variantClasses}`}
                        >
                          <div className={`h-8 w-8 shrink-0 rounded-xl border flex items-center justify-center font-bold text-sm transition-colors ${
                            isOptionCorrect ? 'bg-emerald-500 border-emerald-500 text-white dark:bg-emerald-600 dark:border-emerald-500' : 
                            isUserChoice ? 'bg-rose-500 border-rose-500 text-white dark:bg-rose-600 dark:border-rose-500' : 
                            'border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-800/80'
                          }`}>
                            {String.fromCharCode(65 + oIdx)}
                          </div>
                          <span className="flex-1 text-sm font-medium">
                            {option.optionText}
                          </span>
                          {isOptionCorrect && (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                          )}
                          {isUserChoice && !isOptionCorrect && (
                            <XCircle className="h-5 w-5 text-rose-500 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                   {!userAnswerId && (
                    <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-700/60 flex items-center gap-2 text-slate-500 dark:text-zinc-400 text-xs font-medium">
                      <AlertCircle size={14} className="text-amber-500 shrink-0" />
                      This question was not answered.
                    </div>
                  )}

                  {explanation && (
                    <div className="mt-4 p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/40 text-slate-700 dark:text-zinc-200 space-y-2 shadow-sm">
                      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
                        <Info size={14} /> Explanation
                      </div>
                      <p className="text-sm leading-relaxed text-slate-600 dark:text-zinc-300">{explanation}</p>
                    </div>
                  )}

                  {tag && (
                    <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mr-1">Tags:</span>
                      {tag.split(',').map((t, idx) => (
                        <Badge 
                          key={idx} 
                          variant="secondary" 
                          className="bg-slate-100 dark:bg-zinc-800/60 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 border border-transparent dark:border-zinc-700 rounded-full text-[10px] font-semibold px-2.5 py-0.5"
                        >
                          {t.trim()}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/85 backdrop-blur-md border-t border-slate-200 dark:border-zinc-800/80 p-4 z-40">
         <div className="max-w-4xl mx-auto flex items-center justify-center">
            <Button 
              onClick={() => navigate(-1)} 
              className="rounded-xl h-12 px-10 font-bold bg-slate-900 dark:bg-zinc-50 text-white dark:text-zinc-950 hover:bg-slate-800 dark:hover:bg-zinc-200 dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] shadow-xl transition-all hover:scale-105 active:scale-95"
            >
               Close Review
            </Button>
         </div>
      </div>
    </div>
  );
};

export default PracticeReviewPage;
