import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ClipboardCheck, Loader2, Save, ListChecks, BookOpen } from "lucide-react";

import { getParentCategories, getCategoriesByParentId } from "../../features/category/api/category.api";
import {
  getTestById,
  upsertTest,
  getFilteredQuestions,
  type QuestionFilterParams,
  type UpsertTestPayload,
} from "../../features/test/api/test.api";
import { showToast } from "../../utils/toast";
import type Tests from "../../types/database/Tests";
import type { QuestionWithDetails } from "../../features/mcq/api/mcq.api";
import type { Category } from "../../types/database/Category";

import TestInfoCard from "../../features/test/components/TestInfoCard";
import QuestionFilterBar from "../../features/test/components/QuestionFilterBar";
import QuestionPickerTable, { SelectionCountBadge } from "../../features/test/components/QuestionPickerTable";
import TestQuestionsSummary from "../../features/test/components/TestQuestionsSummary";

const DEFAULT_PAGE_SIZE = 20;

const UpsertTestPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const queryClient = useQueryClient();

  // ─── Test meta state ──────────────────────────────────────────────────
  const [testData, setTestData] = useState<Partial<Tests>>({
    name: "",
    total_questions: 0,
    duration_minutes: 0,
    description: "",
    shuffle_questions: false,
    shuffle_options: false,
  });

  const handleFieldChange = (field: keyof Tests, value: any) => {
    setTestData((prev) => ({ ...prev, [field]: value }));
  };

  // ─── Selected questions state ─────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectedQuestionMap, setSelectedQuestionMap] = useState<Map<number, QuestionWithDetails>>(new Map());

  const toggleQuestion = useCallback((id: number, question?: QuestionWithDetails) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setSelectedQuestionMap((m) => { const nm = new Map(m); nm.delete(id); return nm; });
      } else {
        next.add(id);
        if (question) {
          setSelectedQuestionMap((m) => new Map(m).set(id, question));
        }
      }
      return next;
    });
  }, []);

  // ─── Filter state ─────────────────────────────────────────────────────
  const [filters, setFilters] = useState<QuestionFilterParams>({ page: 1, page_size: DEFAULT_PAGE_SIZE });
  const [, setParentCategoryId] = useState<number | undefined>();
const [childCategories, setChildCategories] = useState<Category[]>([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);

  // Tab state (edit mode only)
  const [activeTab, setActiveTab] = useState<"bank" | "selected">("bank");

  // Debounce search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const handleFiltersChange = (newFilters: QuestionFilterParams) => {
    const isSearchChange = newFilters.search !== filters.search;
    if (isSearchChange) {
      clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(() => {
        setFilters({ ...newFilters, page: 1 });
      }, 400);
    } else {
      setFilters({ ...newFilters, page: 1 });
    }
  };

  const handleParentCategoryChange = async (pid: number | undefined) => {
    setParentCategoryId(pid);
    setChildCategories([]);
    if (!pid) return;
    setIsLoadingChildren(true);
    try {
      const children = await queryClient.fetchQuery({
        queryKey: ["childCategoriesTree", pid],
        queryFn: () => getCategoriesByParentId(pid),
        staleTime: 1000 * 60 * 5,
      });
      setChildCategories(children || []);
    } catch {
      showToast.error("Failed to load subcategories");
    } finally {
      setIsLoadingChildren(false);
    }
  };

  // ─── Parent categories ────────────────────────────────────────────────
  const { data: parentCategories = [] } = useQuery({
    queryKey: ["parentCategories"],
    queryFn: getParentCategories,
  });

  // ─── Filtered questions ───────────────────────────────────────────────
  const { data: questionResult, isLoading: isLoadingQuestions } = useQuery({
    queryKey: ["filteredQuestions", filters],
    queryFn: () => getFilteredQuestions(filters),
    placeholderData: (prev) => prev,
  });

  const questions: QuestionWithDetails[] = questionResult?.data || [];
  const totalQuestions = questionResult?.total || 0;

  // Keep question map updated when new pages load
  useEffect(() => {
    if (!questions.length) return;
    setSelectedQuestionMap((prev) => {
      const next = new Map(prev);
      questions.forEach((q) => {
        const qId = q.question?.id ?? q.id;
        if (qId !== undefined && !next.has(qId)) {
          next.set(qId, q);
        }
      });
      return next;
    });
  }, [questions]);

  // ─── Toggle all on current page ───────────────────────────────────────
  const handleToggleAll = useCallback(() => {
    const pageIds = questions.map((q) => q.question?.id ?? q.id ?? -1).filter((id) => id !== -1);
    const allSelected = pageIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds((prev) => { const next = new Set(prev); pageIds.forEach((id) => next.delete(id)); return next; });
    } else {
      setSelectedIds((prev) => { const next = new Set(prev); pageIds.forEach((id) => next.add(id)); return next; });
      setSelectedQuestionMap((prev) => {
        const next = new Map(prev);
        questions.forEach((q) => { const qId = q.question?.id ?? q.id; if (qId !== undefined) next.set(qId, q); });
        return next;
      });
    }
  }, [questions, selectedIds]);

  // ─── Prefill edit mode ────────────────────────────────────────────────
  const { data: editData, isLoading: isLoadingEdit } = useQuery({
    queryKey: ["testById", id],
    queryFn: () => getTestById(Number(id)),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (isEditMode && editData) {
      setTestData({
        ...editData.test,
        shuffle_questions: !!editData.test.shuffle_questions,
        shuffle_options: !!editData.test.shuffle_options,
      });
      const ids = new Set<number>((editData.question_ids as number[]) || []);
      setSelectedIds(ids);
      // Pre-populate question map from API-returned question details
      if (editData.questions?.length) {
        const map = new Map<number, QuestionWithDetails>();
        editData.questions.forEach((q) => {
          const qId = q.question?.id ?? q.id;
          if (qId !== undefined) map.set(qId, q);
        });
        setSelectedQuestionMap(map);
      }
    }
  }, [isEditMode, editData]);

  // ─── Mutations ────────────────────────────────────────────────────────
  const upsertTestMutation = useMutation({ mutationFn: upsertTest });

  const isSaving = upsertTestMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!testData.name?.trim()) return showToast.error("Test name is required.");
    if (!testData.total_questions || testData.total_questions < 1) return showToast.error("Total questions must be at least 1.");
    if (!testData.duration_minutes || testData.duration_minutes < 1) return showToast.error("Duration must be at least 1 minute.");
    if (selectedIds.size === 0) return showToast.error("Please select at least one question.");

    try {
      const payload: UpsertTestPayload = {
        name: testData.name || "",
        total_questions: testData.total_questions || 0,
        duration_minutes: testData.duration_minutes || 0,
        description: testData.description,
        shuffle_questions: !!testData.shuffle_questions,
        shuffle_options: !!testData.shuffle_options,
        question_ids: Array.from(selectedIds),
      };
      if (isEditMode) (payload as any).id = Number(id);

      const res = await upsertTestMutation.mutateAsync(payload);
      if (!res.isSuccess) {
        showToast.error(res.message || "Failed to save test.");
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["testList"] });
      showToast.success(isEditMode ? "Test updated successfully!" : "Test created successfully!");
      navigate("/test");
    } catch (err: any) {
      showToast.apiErrorShow(err);
    }
  };

  const selectedQuestionsArray = Array.from(selectedQuestionMap.values()).filter((q) => {
    const qId = q.question?.id ?? q.id;
    return qId !== undefined && selectedIds.has(qId);
  });

  if (isEditMode && isLoadingEdit) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-muted-foreground animate-pulse">
        <Loader2 className="animate-spin mr-2" size={20} /> Loading test details...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-full text-primary">
            <ClipboardCheck size={26} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              {isEditMode ? "Edit Test" : "Create Test"}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {isEditMode ? "Update test details and question selection." : "Set up test details and pick questions from the bank."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("/test")}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} /> Back to Tests
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Test Info */}
        <TestInfoCard data={testData} onChange={handleFieldChange} />

        {/* Question Picker Section */}
        <div className="rounded-xl border border-primary/10 bg-card shadow-md overflow-hidden">
          <div className="h-1 bg-primary w-full" />
          <div className="p-5 space-y-4">
            {/* Section header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  2. Select Questions
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Filter the question bank below and check the questions you want to include.
                </p>
              </div>
              <SelectionCountBadge
                selectedCount={selectedIds.size}
                targetCount={testData.total_questions || 0}
              />
            </div>

            {/* Tabs — edit mode only */}
            {isEditMode && (
              <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit border border-border">
                <button
                  type="button"
                  id="tab-question-bank"
                  onClick={() => setActiveTab("bank")}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    activeTab === "bank"
                      ? "bg-background text-primary shadow-sm border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <BookOpen size={14} />
                  Question Bank
                </button>
                <button
                  type="button"
                  id="tab-selected-questions"
                  onClick={() => setActiveTab("selected")}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    activeTab === "selected"
                      ? "bg-background text-primary shadow-sm border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ListChecks size={14} />
                  Selected
                  {selectedIds.size > 0 && (
                    <span className="ml-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full leading-none">
                      {selectedIds.size}
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* Question Bank Tab */}
            {(!isEditMode || activeTab === "bank") && (
              <>
                <QuestionFilterBar
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  parentCategories={parentCategories}
                  childCategories={childCategories}
                  isLoadingChildren={isLoadingChildren}
                  onParentCategoryChange={handleParentCategoryChange}
                />
                <div style={{ minHeight: 340 }}>
                  <QuestionPickerTable
                    questions={questions}
                    selectedIds={selectedIds}
                    onToggle={(qId) => {
                      const q = questions.find((q) => (q.question?.id ?? q.id) === qId);
                      toggleQuestion(qId, q);
                    }}
                    onToggleAll={handleToggleAll}
                    isLoading={isLoadingQuestions}
                    total={totalQuestions}
                    page={filters.page || 1}
                    pageSize={filters.page_size || DEFAULT_PAGE_SIZE}
                    onPageChange={(p) => setFilters((prev) => ({ ...prev, page: p }))}
                  />
                </div>
              </>
            )}

            {/* Selected Questions Tab — edit mode only */}
            {isEditMode && activeTab === "selected" && (
              <div style={{ minHeight: 340 }}>
                {selectedQuestionsArray.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-2">
                    <ListChecks size={32} className="opacity-30" />
                    <p className="text-sm">No questions selected yet.</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab("bank")}
                      className="text-primary text-sm underline underline-offset-2 hover:no-underline"
                    >
                      Go to Question Bank
                    </button>
                  </div>
                ) : (
                  <div className="overflow-auto rounded-lg border border-border bg-background">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                        <tr className="border-b">
                          <th className="w-10 px-3 py-3 text-center text-muted-foreground font-semibold">#</th>
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Question</th>
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground hidden md:table-cell">Category</th>
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground hidden sm:table-cell">Difficulty</th>
                          <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Remove</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedQuestionsArray.map((q, idx) => {
                          const qId = q.question?.id ?? q.id ?? -1;
                          const qText = q.question?.question_text ?? q.question_text ?? "—";
                          const categoryName = q.question?.category_name ?? q.category_name ?? "—";
                          const difficulty = (q.question?.difficulty_level ?? q.difficulty_level ?? "medium").toLowerCase();
                          const diffStyles: Record<string, string> = {
                            easy: "bg-emerald-100 text-emerald-800",
                            medium: "bg-amber-100 text-amber-800",
                            hard: "bg-rose-100 text-rose-800",
                          };
                          return (
                            <tr key={qId} className="border-b hover:bg-muted/30 transition-colors">
                              <td className="px-3 py-3 text-center text-muted-foreground font-mono text-xs">{idx + 1}</td>
                              <td className="px-4 py-3">
                                <div className="max-w-[300px] line-clamp-2 leading-snug">{qText}</div>
                              </td>
                              <td className="px-4 py-3 hidden md:table-cell">
                                <span className="text-muted-foreground text-xs">{categoryName}</span>
                              </td>
                              <td className="px-4 py-3 hidden sm:table-cell">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${diffStyles[difficulty] || diffStyles.medium}`}>
                                  {difficulty}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => toggleQuestion(qId)}
                                  className="text-rose-500 hover:text-rose-700 text-xs font-medium px-2 py-1 rounded hover:bg-rose-50 transition-colors"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Selected Questions Summary — create mode only */}
        {!isEditMode && selectedIds.size > 0 && (
          <div className="rounded-xl border border-primary/10 bg-card shadow-md overflow-hidden">
            <div className="h-1 bg-primary w-full" />
            <div className="p-5 space-y-3">
              <h2 className="text-xl font-bold">3. Selected Questions</h2>
              <TestQuestionsSummary
                selectedQuestions={selectedQuestionsArray}
                onRemove={(qId) => toggleQuestion(qId)}
                targetCount={testData.total_questions || 0}
              />
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end pb-8">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md shadow-primary/20"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? "Saving..." : isEditMode ? "Update Test" : "Create Test"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpsertTestPage;