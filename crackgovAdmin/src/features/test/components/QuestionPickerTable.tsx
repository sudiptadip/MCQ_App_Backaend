import { cn } from "../../../lib/utils";
import { CheckSquare2, Square, Loader2, BookOpen, AlertCircle } from "lucide-react";
import type { QuestionWithDetails } from "../../mcq/api/mcq.api";

interface Props {
  questions: QuestionWithDetails[];
  selectedIds: Set<number>;
  onToggle: (id: number) => void;
  onToggleAll: () => void;
  isLoading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const difficultyStyles: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  hard: "bg-rose-100 text-rose-800",
};

const QuestionPickerTable = ({
  questions,
  selectedIds,
  onToggle,
  onToggleAll,
  isLoading,
  total,
  page,
  pageSize,
  onPageChange,
}: Props) => {
  const allOnPageSelected =
    questions.length > 0 && questions.every((q) => selectedIds.has(q.question?.id ?? q.id ?? -1));
  const someOnPageSelected = questions.some((q) => selectedIds.has(q.question?.id ?? q.id ?? -1));
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Table */}
      <div className="overflow-auto flex-1 rounded-lg border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
            <tr className="border-b">
              <th className="w-10 px-3 py-3 text-center">
                <button
                  type="button"
                  title={allOnPageSelected ? "Deselect all on page" : "Select all on page"}
                  onClick={onToggleAll}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {allOnPageSelected ? (
                    <CheckSquare2 size={18} className="text-primary" />
                  ) : someOnPageSelected ? (
                    <CheckSquare2 size={18} className="text-primary/50" />
                  ) : (
                    <Square size={18} />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">#</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Question</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground hidden md:table-cell">Category</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground hidden sm:table-cell">Difficulty</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground hidden lg:table-cell">Correct Answer</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 size={28} className="animate-spin text-primary" />
                    <span className="text-sm">Loading questions...</span>
                  </div>
                </td>
              </tr>
            ) : questions.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <BookOpen size={28} className="opacity-30" />
                    <span className="text-sm">No questions match the current filters.</span>
                  </div>
                </td>
              </tr>
            ) : (
              questions.map((q, idx) => {
                const qId = q.question?.id ?? q.id ?? -1;
                const isSelected = selectedIds.has(qId);
                const qText = q.question?.question_text ?? q.question_text ?? "—";
                const categoryName = q.question?.category_name ?? q.category_name ?? "—";
                const difficulty = (q.question?.difficulty_level ?? q.difficulty_level ?? "medium").toLowerCase();
                const correctOption = (q.options || []).find((o) => o.is_correct);

                return (
                  <tr
                    key={qId}
                    onClick={() => onToggle(qId)}
                    className={cn(
                      "border-b cursor-pointer transition-colors",
                      isSelected
                        ? "bg-primary/5 hover:bg-primary/10 border-primary/10"
                        : "hover:bg-muted/40"
                    )}
                  >
                    <td className="px-3 py-3 text-center">
                      {isSelected ? (
                        <CheckSquare2 size={18} className="text-primary mx-auto" />
                      ) : (
                        <Square size={18} className="text-muted-foreground/50 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                      {(page - 1) * pageSize + idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-[300px] line-clamp-2 leading-snug">{qText}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-muted-foreground text-xs">{categoryName}</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                          difficultyStyles[difficulty] || difficultyStyles.medium
                        )}
                      >
                        {difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-emerald-600 font-medium text-xs line-clamp-1">
                        {correctOption?.option_text ?? "Not set"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 text-xs text-muted-foreground">
          <span>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="px-3 py-1.5 rounded-md border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = Math.max(1, page - 2) + i;
              if (p > totalPages) return null;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={cn(
                    "px-3 py-1.5 rounded-md border transition-colors",
                    p === page
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted"
                  )}
                >
                  {p}
                </button>
              );
            })}
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="px-3 py-1.5 rounded-md border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Warning: selected count mismatch */}
    </div>
  );
};

// Badge shown near the header with count warning
export const SelectionCountBadge = ({
  selectedCount,
  targetCount,
}: {
  selectedCount: number;
  targetCount: number;
}) => {
  if (!targetCount) return null;
  const ok = selectedCount === targetCount;
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border transition-all",
        ok
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-amber-50 text-amber-700 border-amber-200"
      )}
    >
      {!ok && <AlertCircle size={14} />}
      <span>
        {selectedCount} / {targetCount} selected
      </span>
    </div>
  );
};

export default QuestionPickerTable;
