import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Copy,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  CheckSquare,
  Square,
  FileSpreadsheet,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Building2,
  GraduationCap,
  UserCheck,
  FileText
} from 'lucide-react';
import {
  getLotsSummary,
  deleteQuestionLot,
  getDuplicateQuestions,
  advancedDeleteQuestions,
  checkLotAssociations,
  checkQuestionsAssociations,
  type LotSummaryItem,
  type DuplicateGroupItem,
  type DuplicateQuestionItem,
  type DeleteConflictResponse,
  type AssociatedTestItem,
  type AssociatedStudentItem
} from '../../features/mcq/api/mcq.api';
import { getCategories } from '../../features/category/api/category.api';
import { showToast } from '../../utils/toast';

const AdvancedDeleteQuestionsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Active Tab: 'duplicates' | 'lots'
  const [activeTab, setActiveTab] = useState<'duplicates' | 'lots'>('duplicates');

  // ----------------------------------------------------
  // DUPLICATE QUESTIONS STATE & QUERY
  // ----------------------------------------------------
  const [dupCategory, setDupCategory] = useState<number | ''>('');
  const [dupLot, setDupLot] = useState<string>('');
  const [dupSearch, setDupSearch] = useState<string>('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<number>>(new Set());

  // Categories for filter dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['categories-list'],
    queryFn: getCategories,
    staleTime: 5 * 60 * 1000,
  });

  // Query duplicates
  const {
    data: dupData,
    isLoading: isDupLoading,
    isFetching: isDupFetching,
    refetch: refetchDuplicates,
  } = useQuery({
    queryKey: ['duplicate-questions', dupCategory, dupLot, dupSearch],
    queryFn: () =>
      getDuplicateQuestions({
        category_id: dupCategory ? Number(dupCategory) : undefined,
        lot_number: dupLot ? Number(dupLot) : undefined,
        searchKeyword: dupSearch.trim() || undefined,
        pageNumber: 1,
        pageSize: 50,
      }),
  });

  const duplicateGroups = dupData?.groups || [];

  // ----------------------------------------------------
  // LOTS SUMMARY STATE & QUERY
  // ----------------------------------------------------
  const [lotSearch, setLotSearch] = useState<string>('');

  const {
    data: lots = [],
    isLoading: isLotsLoading,
    isFetching: isLotsFetching,
    refetch: refetchLots,
  } = useQuery({
    queryKey: ['lots-summary', lotSearch],
    queryFn: () => getLotsSummary({ searchKeyword: lotSearch.trim() || undefined }),
  });

  // ----------------------------------------------------
  // MODAL STATE FOR CONFIRMATION & FORCE DELETE
  // ----------------------------------------------------
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'lot' | 'duplicates';
    lot?: LotSummaryItem;
    questionIds?: number[];
    questionsList?: DuplicateQuestionItem[];
    // Association counts:
    questionCount: number;
    testCount: number;
    attemptCount: number;
    bookmarkCount: number;
    forceRequired: boolean;
    associatedTests?: AssociatedTestItem[];
    associatedStudents?: AssociatedStudentItem[];
    isLoadingDetails?: boolean;
  }>({
    isOpen: false,
    type: 'duplicates',
    questionCount: 0,
    testCount: 0,
    attemptCount: 0,
    bookmarkCount: 0,
    forceRequired: false,
    associatedTests: [],
    associatedStudents: [],
    isLoadingDetails: false,
  });

  const [forceDeleteChecked, setForceDeleteChecked] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ----------------------------------------------------
  // DUPLICATE GROUP EXPANSION & SELECTION HANDLERS
  // ----------------------------------------------------
  const toggleGroupExpand = (groupKey: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const toggleSelectQuestion = (id: number) => {
    setSelectedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectGroupDuplicatesOnly = (group: DuplicateGroupItem) => {
    // Keep index 0 (primary: highest associations or oldest) and select all other duplicates (index 1..n)
    setSelectedQuestionIds((prev) => {
      const next = new Set(prev);
      group.questions.forEach((q, idx) => {
        if (idx === 0) {
          next.delete(q.id); // keep primary
        } else {
          next.add(q.id); // select duplicate
        }
      });
      return next;
    });
    // Auto-expand group to show selection
    setExpandedGroups((prev) => ({ ...prev, [group.question_text_sample]: true }));
  };

  const handleSelectAllInGroup = (group: DuplicateGroupItem) => {
    setSelectedQuestionIds((prev) => {
      const next = new Set(prev);
      const allSelected = group.questions.every((q) => next.has(q.id));
      group.questions.forEach((q) => {
        if (allSelected) {
          next.delete(q.id);
        } else {
          next.add(q.id);
        }
      });
      return next;
    });
  };

  const handleSelectAllDupeCandidates = () => {
    // For every group, select items at index 1..n (keeping index 0 as primary)
    setSelectedQuestionIds((prev) => {
      const next = new Set(prev);
      duplicateGroups.forEach((group) => {
        group.questions.forEach((q, idx) => {
          if (idx > 0) next.add(q.id);
          else next.delete(q.id);
        });
      });
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedQuestionIds(new Set());
  };

  // Map of all questions currently in duplicateGroups for quick lookup
  const questionsById = useMemo(() => {
    const map = new Map<number, DuplicateQuestionItem>();
    duplicateGroups.forEach((g) => {
      g.questions.forEach((q) => map.set(q.id, q));
    });
    return map;
  }, [duplicateGroups]);

  // ----------------------------------------------------
  // OPEN DELETE CONFIRMATION MODAL
  // ----------------------------------------------------
  const handleOpenDeleteDuplicatesModal = () => {
    if (selectedQuestionIds.size === 0) return;

    const ids = Array.from(selectedQuestionIds);
    let totalTests = 0;
    let totalAttempts = 0;
    let totalBookmarks = 0;
    const selectedQuestions: DuplicateQuestionItem[] = [];

    ids.forEach((id) => {
      const q = questionsById.get(id);
      if (q) {
        selectedQuestions.push(q);
        totalTests += q.linked_tests_count || 0;
        totalAttempts += q.linked_attempts_count || 0;
        totalBookmarks += q.linked_bookmarks_count || 0;
      }
    });

    const hasAssociations = totalTests > 0 || totalAttempts > 0;

    setDeleteModal({
      isOpen: true,
      type: 'duplicates',
      questionIds: ids,
      questionsList: selectedQuestions,
      questionCount: ids.length,
      testCount: totalTests,
      attemptCount: totalAttempts,
      bookmarkCount: totalBookmarks,
      forceRequired: hasAssociations,
      associatedTests: [],
      associatedStudents: [],
      isLoadingDetails: hasAssociations,
    });
    setForceDeleteChecked(false);

    if (hasAssociations) {
      checkQuestionsAssociations(ids)
        .then((data) => {
          setDeleteModal((prev) => ({
            ...prev,
            associatedTests: data.associated_tests || [],
            associatedStudents: data.associated_students || [],
            isLoadingDetails: false,
          }));
        })
        .catch(() => {
          setDeleteModal((prev) => ({ ...prev, isLoadingDetails: false }));
        });
    }
  };

  const handleOpenDeleteLotModal = (lot: LotSummaryItem) => {
    const hasAssociations = lot.linked_tests_count > 0 || lot.linked_attempts_count > 0;

    setDeleteModal({
      isOpen: true,
      type: 'lot',
      lot,
      questionCount: lot.total_questions,
      testCount: lot.linked_tests_count,
      attemptCount: lot.linked_attempts_count,
      bookmarkCount: lot.linked_bookmarks_count,
      forceRequired: hasAssociations,
      associatedTests: [],
      associatedStudents: [],
      isLoadingDetails: hasAssociations,
    });
    setForceDeleteChecked(false);

    if (hasAssociations) {
      checkLotAssociations(lot.lot_number)
        .then((data) => {
          setDeleteModal((prev) => ({
            ...prev,
            associatedTests: data.associated_tests || [],
            associatedStudents: data.associated_students || [],
            isLoadingDetails: false,
          }));
        })
        .catch(() => {
          setDeleteModal((prev) => ({ ...prev, isLoadingDetails: false }));
        });
    }
  };

  // ----------------------------------------------------
  // EXECUTE DELETE ACTION
  // ----------------------------------------------------
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (deleteModal.type === 'lot' && deleteModal.lot) {
        await deleteQuestionLot({
          lot_number: deleteModal.lot.lot_number,
          force_delete: forceDeleteChecked,
        });

        showToast.success(
          `Lot #${deleteModal.lot.lot_number} (${deleteModal.questionCount} questions) deleted successfully`
        );
        setDeleteModal((prev) => ({ ...prev, isOpen: false }));
        queryClient.invalidateQueries({ queryKey: ['lots-summary'] });
        queryClient.invalidateQueries({ queryKey: ['duplicate-questions'] });
        queryClient.invalidateQueries({ queryKey: ['questions'] });
      } else if (deleteModal.type === 'duplicates' && deleteModal.questionIds) {
        await advancedDeleteQuestions({
          question_ids: deleteModal.questionIds,
          force_delete: forceDeleteChecked,
        });

        showToast.success(
          `${deleteModal.questionCount} duplicate questions deleted successfully`
        );
        setSelectedQuestionIds(new Set());
        setDeleteModal((prev) => ({ ...prev, isOpen: false }));
        queryClient.invalidateQueries({ queryKey: ['duplicate-questions'] });
        queryClient.invalidateQueries({ queryKey: ['lots-summary'] });
        queryClient.invalidateQueries({ queryKey: ['questions'] });
      }
    } catch (err: any) {
      if (err?.response?.status === 409 || err?.response?.data?.statusCode === 409) {
        const conflict = err?.response?.data?.data as DeleteConflictResponse;
        setDeleteModal((prev) => ({
          ...prev,
          forceRequired: true,
          testCount: conflict?.test_count ?? prev.testCount,
          attemptCount: conflict?.attempt_count ?? prev.attemptCount,
          bookmarkCount: conflict?.bookmark_count ?? prev.bookmarkCount,
          associatedTests: conflict?.associated_tests ?? prev.associatedTests,
          associatedStudents: conflict?.associated_students ?? prev.associatedStudents,
          isLoadingDetails: false,
        }));
        showToast.error(
          err?.response?.data?.message || 'Associations detected. Please check Force Delete to proceed.'
        );
      } else {
        showToast.error(
          err?.response?.data?.message || err?.message || 'Failed to complete deletion.'
        );
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <button
            onClick={() => navigate('/question-ans')}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            Back to Questions
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Advanced Question Cleanup</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
              <ShieldAlert size={12} className="mr-1" />
              Super Admin Only
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Detect and remove duplicate questions across categories or revert bulk uploaded Excel sheets by Lot Number.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-muted/60 p-1 rounded-lg border border-border w-fit">
          <button
            onClick={() => setActiveTab('duplicates')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer ${
              activeTab === 'duplicates'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Copy size={15} />
            Duplicate Questions
            {duplicateGroups.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[11px] font-semibold bg-primary/10 text-primary">
                {duplicateGroups.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('lots')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer ${
              activeTab === 'lots'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileSpreadsheet size={15} />
            Delete by Lot Number
            {lots.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[11px] font-semibold bg-primary/10 text-primary">
                {lots.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DUPLICATE QUESTIONS */}
      {/* ========================================================================= */}
      {activeTab === 'duplicates' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Filter size={16} className="text-primary" />
                <span>Filter Duplicate Clusters</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => refetchDuplicates()}
                  disabled={isDupLoading || isDupFetching}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-input bg-background hover:bg-accent transition-colors cursor-pointer"
                >
                  <RefreshCw size={13} className={isDupFetching ? 'animate-spin' : ''} />
                  Refresh
                </button>
                {duplicateGroups.length > 0 && (
                  <button
                    onClick={handleSelectAllDupeCandidates}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
                    title="Automatically keep the primary question of each group and select all redundant copies for deletion"
                  >
                    <CheckSquare size={13} />
                    Auto-Select Redundant Copies
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Category Filter */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Filter by Category
                </label>
                <select
                  value={dupCategory}
                  onChange={(e) => setDupCategory(e.target.value ? Number(e.target.value) : '')}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">All Categories (Global Duplicates)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lot Number Filter */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Filter by Lot Number
                </label>
                <input
                  type="number"
                  placeholder="e.g. 111, 418..."
                  value={dupLot}
                  onChange={(e) => setDupLot(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Search Keyword */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Search Question Text
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search keywords..."
                    value={dupSearch}
                    onChange={(e) => setDupSearch(e.target.value)}
                    className="w-full h-9 pl-8 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <Search size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" />
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1 border-t border-border/50">
              <span className="font-medium text-foreground">💡 Tip:</span>
              Filtering by Category or Lot Number narrows down the search instantly. The first item in each group is marked as Primary (it preserves the oldest copy or the one with existing test attempts).
            </div>
          </div>

          {/* Duplicates List */}
          {isDupLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-xl border border-border">
              <RefreshCw size={24} className="animate-spin text-primary mb-3" />
              <p className="text-sm font-medium">Scanning for duplicate questions...</p>
              <p className="text-xs text-muted-foreground mt-1">This may take a few seconds across 320k records.</p>
            </div>
          ) : duplicateGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-xl border border-border">
              <CheckCircle2 size={36} className="text-emerald-500 mb-3" />
              <p className="text-base font-semibold">No duplicate questions found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {dupCategory || dupLot || dupSearch
                  ? 'No duplicate questions match your active filters.'
                  : 'No duplicate questions detected in the database.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Showing <strong className="text-foreground">{duplicateGroups.length}</strong> duplicate clusters
                  {dupData?.total_groups ? ` (${dupData.total_groups} total)` : ''}
                </span>
                {selectedQuestionIds.size > 0 && (
                  <span className="text-rose-600 dark:text-rose-400 font-medium">
                    {selectedQuestionIds.size} questions selected for deletion
                  </span>
                )}
              </div>

              {duplicateGroups.map((group, groupIdx) => {
                const groupKey = group.question_text_sample;
                const isExpanded = expandedGroups[groupKey] ?? true;
                const allSelected = group.questions.every((q) => selectedQuestionIds.has(q.id));
                const someSelected = group.questions.some((q) => selectedQuestionIds.has(q.id));
                const redundantSelected = group.questions.slice(1).every((q) => selectedQuestionIds.has(q.id)) && !selectedQuestionIds.has(group.questions[0]?.id);

                return (
                  <div
                    key={groupIdx}
                    className="bg-card border border-border rounded-xl overflow-hidden shadow-sm transition-all"
                  >
                    {/* Group Header */}
                    <div className="p-4 bg-muted/30 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <button
                          onClick={() => toggleGroupExpand(groupKey)}
                          className="mt-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                              {group.dup_count} Identical Copies
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Cluster #{groupIdx + 1}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-foreground mt-1 line-clamp-2">
                            {group.question_text_sample}
                          </p>
                        </div>
                      </div>

                      {/* Group Quick Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => handleSelectGroupDuplicatesOnly(group)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                            redundantSelected
                              ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
                              : 'bg-background hover:bg-accent border-input text-foreground'
                          }`}
                          title="Keep the first question and select all redundant copies"
                        >
                          Keep Primary & Delete Others ({group.questions.length - 1})
                        </button>
                        <button
                          onClick={() => handleSelectAllInGroup(group)}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          title={allSelected ? 'Deselect all' : 'Select all'}
                        >
                          {allSelected ? (
                            <CheckSquare size={16} className="text-primary" />
                          ) : someSelected ? (
                            <div className="w-4 h-4 rounded border border-primary bg-primary/20 flex items-center justify-center">
                              <div className="w-2 h-2 bg-primary rounded-xs" />
                            </div>
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Group Items Table */}
                    {isExpanded && (
                      <div className="divide-y divide-border/60">
                        {group.questions.map((q, qIdx) => {
                          const isSelected = selectedQuestionIds.has(q.id);
                          const isPrimary = qIdx === 0;
                          const hasTests = (q.linked_tests_count || 0) > 0;
                          const hasAttempts = (q.linked_attempts_count || 0) > 0;
                          const hasBookmarks = (q.linked_bookmarks_count || 0) > 0;

                          return (
                            <div
                              key={q.id}
                              className={`p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                                isSelected
                                  ? 'bg-rose-50/60 dark:bg-rose-950/20'
                                  : isPrimary
                                  ? 'bg-emerald-50/30 dark:bg-emerald-950/10'
                                  : 'hover:bg-muted/20'
                              }`}
                            >
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectQuestion(q.id)}
                                  className="mt-1 h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                                />

                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap text-xs">
                                    <span className="font-mono text-muted-foreground font-semibold">
                                      ID: #{q.id}
                                    </span>

                                    {isPrimary ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                        ★ Primary Copy (Keep)
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground">
                                        Duplicate #{qIdx}
                                      </span>
                                    )}

                                    {q.category_name && (
                                      <span className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground text-[11px]">
                                        {q.category_name}
                                      </span>
                                    )}

                                    {q.upload_lot_number && (
                                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-medium text-[11px]">
                                        Lot #{q.upload_lot_number}
                                      </span>
                                    )}

                                    {q.sheet_name && (
                                      <span className="text-muted-foreground truncate max-w-[180px] text-[11px]" title={q.sheet_name}>
                                        📄 {q.sheet_name}
                                      </span>
                                    )}

                                    <span className="text-muted-foreground text-[11px]">
                                      {new Date(q.created_at).toLocaleDateString()}
                                    </span>
                                  </div>

                                  {/* Associations Badges */}
                                  <div className="flex items-center gap-2 flex-wrap pt-0.5">
                                    {hasTests && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                        <AlertTriangle size={11} className="mr-1 text-amber-600" />
                                        Linked to {q.linked_tests_count} Active Tests
                                      </span>
                                    )}
                                    {hasAttempts && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                        <AlertTriangle size={11} className="mr-1 text-rose-600" />
                                        {q.linked_attempts_count} Student Attempts
                                      </span>
                                    )}
                                    {hasBookmarks && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300">
                                        <BookOpen size={11} className="mr-1 text-blue-600" />
                                        {q.linked_bookmarks_count} Bookmarks
                                      </span>
                                    )}
                                    {!hasTests && !hasAttempts && !hasBookmarks && (
                                      <span className="text-[11px] text-muted-foreground">
                                        ✓ Safe to delete (No active tests/attempts)
                                      </span>
                                    )}
                                  </div>

                                  {/* Options preview */}
                                  {q.options && q.options.length > 0 && (
                                    <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] text-muted-foreground">
                                      <span className="font-medium">Options:</span>
                                      {q.options.map((opt) => (
                                        <span
                                          key={opt.id}
                                          className={`px-1.5 py-0.5 rounded ${
                                            opt.is_correct
                                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-medium'
                                              : 'bg-muted/60 text-muted-foreground'
                                          }`}
                                        >
                                          {opt.option_text}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Single Delete Action */}
                              <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                                <button
                                  onClick={() => {
                                    setSelectedQuestionIds(new Set([q.id]));
                                    handleOpenDeleteDuplicatesModal();
                                  }}
                                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                                  title="Delete this question"
                                >
                                  <Trash2 size={13} />
                                  Delete
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Sticky Selection Bar at Bottom */}
          {selectedQuestionIds.size > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-card border-2 border-primary/40 shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-6 max-w-xl w-[90%] animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-sm">
                  {selectedQuestionIds.size}
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {selectedQuestionIds.size} {selectedQuestionIds.size === 1 ? 'question' : 'questions'} selected
                  </p>
                  <p className="text-xs text-muted-foreground">Ready for advanced removal</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearSelection}
                  className="px-3 py-1.5 text-xs font-medium rounded-md hover:bg-muted transition-colors cursor-pointer"
                >
                  Clear Selection
                </button>
                <button
                  onClick={handleOpenDeleteDuplicatesModal}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow transition-all cursor-pointer"
                >
                  <Trash2 size={14} />
                  Delete Selected ({selectedQuestionIds.size})
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DELETE BY LOT NUMBER */}
      {/* ========================================================================= */}
      {activeTab === 'lots' && (
        <div className="space-y-6">
          {/* Search bar & info banner */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h3 className="text-sm font-semibold">Excel Upload Sheets & Lots</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Rollback mistakenly uploaded sheets by their Lot Number. Any questions in that upload lot will be removed.
                </p>
              </div>
              <button
                onClick={() => refetchLots()}
                disabled={isLotsLoading || isLotsFetching}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-input bg-background hover:bg-accent transition-colors cursor-pointer"
              >
                <RefreshCw size={13} className={isLotsFetching ? 'animate-spin' : ''} />
                Refresh Lots
              </button>
            </div>

            <div className="relative max-w-md">
              <input
                type="text"
                placeholder="Search by Lot # or Sheet Name..."
                value={lotSearch}
                onChange={(e) => setLotSearch(e.target.value)}
                className="w-full h-9 pl-8 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Search size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" />
            </div>
          </div>

          {/* Lots Table */}
          {isLotsLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-xl border border-border">
              <RefreshCw size={24} className="animate-spin text-primary mb-3" />
              <p className="text-sm font-medium">Loading uploaded lots...</p>
            </div>
          ) : lots.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-xl border border-border">
              <FileSpreadsheet size={36} className="text-muted-foreground mb-3" />
              <p className="text-base font-semibold">No upload lots found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {lotSearch ? 'No lots match your search query.' : 'No bulk uploaded questions found.'}
              </p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/40 border-b border-border text-xs uppercase font-medium text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Lot Number</th>
                      <th className="px-4 py-3">Sheet Name</th>
                      <th className="px-4 py-3 text-center">Questions</th>
                      <th className="px-4 py-3">Upload Date</th>
                      <th className="px-4 py-3">Linked Associations</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {lots.map((lot) => {
                      const hasTests = lot.linked_tests_count > 0;
                      const hasAttempts = lot.linked_attempts_count > 0;
                      const hasBookmarks = lot.linked_bookmarks_count > 0;

                      return (
                        <tr key={lot.lot_number} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3.5 font-semibold">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                              Lot #{lot.lot_number}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            {lot.sheet_name ? (
                              <div className="flex items-center gap-1.5 font-medium text-foreground">
                                <FileSpreadsheet size={15} className="text-emerald-600 shrink-0" />
                                <span className="truncate max-w-[220px]" title={lot.sheet_name}>
                                  {lot.sheet_name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Legacy Batch / No Name</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center font-semibold">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted text-foreground">
                              {lot.total_questions.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-muted-foreground">
                            {new Date(lot.first_uploaded_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {hasTests ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                  {lot.linked_tests_count} Tests
                                </span>
                              ) : null}
                              {hasAttempts ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                  {lot.linked_attempts_count} Attempts
                                </span>
                              ) : null}
                              {hasBookmarks ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300">
                                  {lot.linked_bookmarks_count} Bookmarks
                                </span>
                              ) : null}
                              {!hasTests && !hasAttempts && !hasBookmarks ? (
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                  ✓ Clean / Unlinked
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              onClick={() => handleOpenDeleteLotModal(lot)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                              title={`Delete all questions in Lot #${lot.lot_number}`}
                            >
                              <Trash2 size={13} />
                              Delete Lot
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRMATION & FORCE DELETE MODAL */}
      {/* ========================================================================= */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  deleteModal.forceRequired
                    ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                    : 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                }`}
              >
                <AlertTriangle size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground">
                  {deleteModal.type === 'lot'
                    ? `Delete Upload Lot #${deleteModal.lot?.lot_number}`
                    : `Delete ${deleteModal.questionCount} Duplicate Questions`}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {deleteModal.type === 'lot'
                    ? `Sheet: ${deleteModal.lot?.sheet_name || 'Legacy Lot'} • Total Questions: ${deleteModal.questionCount}`
                    : 'Selected duplicate items from cluster'}
                </p>
              </div>
            </div>

            {/* Warning regarding associations */}
            {deleteModal.forceRequired ? (
              <div className="p-4 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 space-y-3.5 text-sm">
                <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-400">
                  <ShieldAlert size={16} />
                  <span>Associated Student Data Detected!</span>
                </div>
                <p className="text-xs leading-relaxed">
                  These questions are currently linked to active records:
                </p>
                <ul className="text-xs list-disc list-inside space-y-0.5 font-semibold">
                  {deleteModal.testCount > 0 && (
                    <li>{deleteModal.testCount} Configured Tests / Test Questions</li>
                  )}
                  {deleteModal.attemptCount > 0 && (
                    <li>{deleteModal.attemptCount} Student Exam Attempts & Answers</li>
                  )}
                  {deleteModal.bookmarkCount > 0 && (
                    <li>{deleteModal.bookmarkCount} Student Bookmarks</li>
                  )}
                </ul>

                {/* Loading indicator for detailed associations */}
                {deleteModal.isLoadingDetails && (
                  <div className="flex items-center justify-center p-3 text-xs text-muted-foreground gap-2 bg-background/50 rounded-lg border border-border">
                    <RefreshCw size={13} className="animate-spin text-rose-600" />
                    <span>Fetching linked test names, student names, and franchise details...</span>
                  </div>
                )}

                {/* 1. Associated Tests List */}
                {deleteModal.associatedTests && deleteModal.associatedTests.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-xs font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                      <FileText size={13} className="text-rose-600" />
                      Associated Tests ({deleteModal.associatedTests.length}):
                    </span>
                    <div className="max-h-40 overflow-y-auto rounded-lg border border-rose-200 dark:border-rose-900/60 bg-background/80 p-2 space-y-1.5 text-xs">
                      {deleteModal.associatedTests.map((t) => (
                        <div key={t.test_id} className="flex items-center justify-between gap-2 p-2 rounded bg-muted/40 hover:bg-muted/60 transition-colors">
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate" title={t.test_name}>
                              {t.test_name}
                            </p>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Building2 size={11} className="text-primary shrink-0" />
                              Franchise: <strong className="text-foreground">{t.franchise_name}</strong>
                            </p>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/50 shrink-0">
                            {t.question_count} {t.question_count === 1 ? 'Question' : 'Questions'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Associated Students List */}
                {deleteModal.associatedStudents && deleteModal.associatedStudents.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-xs font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                      <GraduationCap size={14} className="text-rose-600" />
                      Students Who Practiced / Attempted ({deleteModal.associatedStudents.length}):
                    </span>
                    <div className="max-h-44 overflow-y-auto rounded-lg border border-rose-200 dark:border-rose-900/60 bg-background/80 p-2 space-y-1.5 text-xs">
                      {deleteModal.associatedStudents.map((stu, sIdx) => (
                        <div key={sIdx} className="p-2.5 rounded bg-muted/40 hover:bg-muted/60 transition-colors space-y-1 border border-border/40">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-foreground flex items-center gap-1.5">
                              <UserCheck size={13} className="text-emerald-600 shrink-0" />
                              {stu.student_name}
                            </span>
                            {stu.enrollment_no && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                {stu.enrollment_no}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <Building2 size={11} className="text-primary shrink-0" />
                            <span>Franchise Practiced:</span>
                            <span className="px-1.5 py-0.2 rounded bg-primary/10 text-primary font-semibold">
                              {stu.franchise_name}
                            </span>
                          </div>
                          {stu.test_name && (
                            <div className="text-[11px] text-muted-foreground truncate" title={stu.test_name}>
                              <span>Test Practiced:</span> <strong className="text-foreground">{stu.test_name}</strong>
                            </div>
                          )}
                          <div className="text-[10px] text-muted-foreground flex items-center justify-between pt-0.5">
                            <span>Attempts count: {stu.attempt_count}</span>
                            <span>Last practiced: {new Date(stu.last_attempted_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-rose-800 dark:text-rose-300 font-medium pt-1 border-t border-rose-200 dark:border-rose-900/60">
                  Normal deletion is blocked to protect student history. To proceed, check <strong>Force Delete</strong> below to cascade-remove these associations.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl border border-border bg-muted/40 text-sm space-y-1">
                <p className="text-xs text-muted-foreground">
                  No active tests or student attempts are linked to these questions. They can be safely deleted.
                </p>
                <p className="text-xs font-semibold text-foreground">
                  Are you sure you want to delete these {deleteModal.questionCount} questions? This action cannot be undone.
                </p>
              </div>
            )}

            {/* Force Delete Checkbox */}
            {deleteModal.forceRequired && (
              <label className="flex items-start gap-3 p-3 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={forceDeleteChecked}
                  onChange={(e) => setForceDeleteChecked(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <span className="text-xs font-semibold text-rose-900 dark:text-rose-200">
                  Force Delete: Permanently remove questions and cascade-delete all active test mappings and student attempt history.
                </span>
              </label>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal((prev) => ({ ...prev, isOpen: false }))}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-input bg-background hover:bg-accent transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting || (deleteModal.forceRequired && !forceDeleteChecked)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg text-white shadow transition-all cursor-pointer ${
                  deleteModal.forceRequired && !forceDeleteChecked
                    ? 'bg-rose-400 cursor-not-allowed opacity-60'
                    : 'bg-rose-600 hover:bg-rose-700 active:scale-95'
                }`}
              >
                {isDeleting ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                {deleteModal.forceRequired ? 'Confirm Force Delete' : 'Delete Questions'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedDeleteQuestionsPage;
