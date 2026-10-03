import { X, BookOpen } from "lucide-react";
import { cn } from "../../../lib/utils";
import type { QuestionWithDetails } from "../../mcq/api/mcq.api";

interface Props {
  selectedQuestions: QuestionWithDetails[];
  onRemove: (id: number) => void;
  targetCount: number;
}

const TestQuestionsSummary = ({ selectedQuestions, onRemove, targetCount }: Props) => {
  const count = selectedQuestions.length;
  const isMatch = targetCount > 0 && count === targetCount;
  const isOver = targetCount > 0 && count > targetCount;
  const isUnder = targetCount > 0 && count < targetCount;

  return (
    <div className="flex flex-col gap-3">
      {/* Status bar */}
      <div className={cn(
        "rounded-lg px-4 py-2.5 text-sm font-medium flex items-center gap-2",
        isMatch ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
        isOver ? "bg-rose-50 text-rose-700 border border-rose-200" :
        isUnder && count > 0 ? "bg-amber-50 text-amber-700 border border-amber-200" :
        "bg-muted text-muted-foreground border border-border"
      )}>
        <BookOpen size={16} className="flex-shrink-0" />
        {count === 0
          ? "No questions selected yet."
          : isMatch
          ? `✓ All ${count} question${count !== 1 ? "s" : ""} selected.`
          : isOver
          ? `${count} selected — remove ${count - targetCount} (target: ${targetCount})`
          : `${count} of ${targetCount} selected — pick ${targetCount - count} more`}
      </div>

      {/* Question chips */}
      {count > 0 && (
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
          {selectedQuestions.map((q) => {
            const qId = q.question?.id ?? q.id ?? -1;
            const qText = q.question?.question_text ?? q.question_text ?? "Unknown";
            return (
              <div
                key={qId}
                className="group flex items-center gap-1.5 bg-primary/8 text-primary border border-primary/20 rounded-full pl-3 pr-1.5 py-1 text-xs font-medium max-w-[260px] hover:border-primary/40 transition-colors"
              >
                <span className="truncate">{qText}</span>
                <button
                  type="button"
                  title="Remove"
                  onClick={() => onRemove(qId)}
                  className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-primary/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <X size={10} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TestQuestionsSummary;
