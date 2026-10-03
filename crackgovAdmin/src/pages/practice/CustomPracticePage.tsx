import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Folder,
  Sliders,
  Sparkles,
  Search,
  BookOpen,
  Info,
  Clock,
  FolderTree,
  Check
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import Loading from '../../components/common/Loading';
import Error from '../../components/common/Error';
import { showToast } from '../../utils/toast';
import { getCategoriesWithQuestionCounts, type CategoryWithCounts } from '../../features/category/api/category.api';
import { createCustomPractice, type CustomPracticePayload } from '../../features/practice/api/practice.api';

// Interface for Tree Node Structure
interface CategoryNode extends CategoryWithCounts {
  children: CategoryNode[];
}

const CustomPracticePage: React.FC = () => {
  const navigate = useNavigate();

  // State Variables
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [practiceName, setPracticeName] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [hasNoTimer, setHasNoTimer] = useState(false);
  const [difficulty, setDifficulty] = useState<string>('all');
  const [filterMode, setFilterMode] = useState<'all' | 'unpracticed' | 'bookmarked'>('all');

  // Fetch Categories data
  const { data: rawCategories = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['categories-with-counts'],
    queryFn: getCategoriesWithQuestionCounts
  });

  // Build the hierarchical tree structure
  const { tree } = useMemo(() => {
    const map = new Map<number, CategoryNode>();
    const roots: CategoryNode[] = [];

    // Initialize map with copies of items and empty children arrays
    rawCategories.forEach((cat) => {
      map.set(cat.id, { ...cat, children: [] });
    });

    // Build the tree relationship
    rawCategories.forEach((cat) => {
      const node = map.get(cat.id)!;
      if (cat.parent_id === null) {
        roots.push(node);
      } else {
        const parent = map.get(cat.parent_id);
        if (parent) {
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      }
    });

    return { tree: roots, flatMap: map };
  }, [rawCategories]);

  // Set initial expansion for root categories
  useEffect(() => {
    if (tree.length > 0 && expandedIds.size === 0) {
      const initialExpanded = new Set<number>();
      tree.forEach(root => initialExpanded.add(root.id));
      setExpandedIds(initialExpanded);
    }
  }, [tree]);

  // Calculate direct question counts map
  const directCountsMap = useMemo(() => {
    const map: Record<number, number> = {};
    rawCategories.forEach(cat => {
      map[cat.id] = cat.direct_question_count;
    });
    return map;
  }, [rawCategories]);

  // Calculate total available questions based on selection
  const totalQuestionsPool = useMemo(() => {
    let sum = 0;
    selectedIds.forEach(id => {
      sum += directCountsMap[id] || 0;
    });
    return sum;
  }, [selectedIds, directCountsMap]);

  // Update question count slider range when total pool changes
  useEffect(() => {
    if (totalQuestionsPool > 0) {
      if (questionCount > totalQuestionsPool) {
        setQuestionCount(totalQuestionsPool);
      } else if (questionCount < 5 && totalQuestionsPool >= 5) {
        setQuestionCount(5);
      } else if (questionCount < 1 && totalQuestionsPool > 0) {
        setQuestionCount(totalQuestionsPool < 10 ? totalQuestionsPool : 10);
      }
    } else {
      setQuestionCount(0);
    }
  }, [totalQuestionsPool]);

  // Mutation to call stored procedure to create custom practice
  const createPracticeMutation = useMutation({
    mutationFn: createCustomPractice,
    onSuccess: (response) => {
      if (response.isSuccess && response.data?.test_id) {
        showToast.success('Custom practice set created! Loading questions...');
        navigate(`/practice/test/${response.data.test_id}`);
      } else {
        showToast.error(response.message || 'Failed to create practice session');
      }
    },
    onError: (error: any) => {
      showToast.error(error.message || 'An error occurred while creating custom practice');
    }
  });

  // Recursive helpers for selection
  const getDescendants = (node: CategoryNode, list: number[] = []): number[] => {
    node.children.forEach(child => {
      list.push(child.id);
      getDescendants(child, list);
    });
    return list;
  };

  const handleCheckboxToggle = (node: CategoryNode) => {
    const newSelected = new Set(selectedIds);
    const descendantIds = getDescendants(node, [node.id]);

    const isSelected = newSelected.has(node.id);

    descendantIds.forEach(id => {
      if (isSelected) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
    });

    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    const all = new Set<number>();
    rawCategories.forEach(cat => all.add(cat.id));
    setSelectedIds(all);
  };

  const handleClearAll = () => {
    setSelectedIds(new Set());
  };

  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  // Check if all children of a node are selected
  const getNodeSelectionState = (node: CategoryNode): 'checked' | 'unchecked' | 'partial' => {
    const descendantIds = getDescendants(node, [node.id]);
    const selectedDescendants = descendantIds.filter(id => selectedIds.has(id));

    if (selectedDescendants.length === 0) return 'unchecked';
    if (selectedDescendants.length === descendantIds.length) return 'checked';
    return 'partial';
  };

  // Search filter logic: determines if a node matches or has a descendant matching the search term
  const nodeMatchesSearch = (node: CategoryNode, search: string): boolean => {
    if (!search) return true;
    const cleanSearch = search.toLowerCase();
    
    // Check if current matches
    if (node.name.toLowerCase().includes(cleanSearch)) return true;
    
    // Check recursively if any child matches
    return node.children.some(child => nodeMatchesSearch(child, search));
  };

  // Start Practice action
  const handleStartPractice = () => {
    if (selectedIds.size === 0) {
      showToast.warning('Please select at least one category to practice.');
      return;
    }
    if (questionCount < 1) {
      showToast.warning('Question count must be at least 1.');
      return;
    }

    const payload: CustomPracticePayload = {
      name: practiceName.trim(),
      duration_minutes: hasNoTimer ? 999 : durationMinutes,
      question_count: questionCount,
      difficulty_level: difficulty === 'all' ? null : difficulty,
      filter_mode: filterMode,
      category_ids: Array.from(selectedIds)
    };

    createPracticeMutation.mutate(payload);
  };

  // Tree Render Component
  const renderTree = (nodes: CategoryNode[], depth = 0) => {
    return (
      <ul className="space-y-1.5 pl-4 border-l border-slate-100 dark:border-zinc-800/80 ml-2">
        {nodes
          .filter(node => nodeMatchesSearch(node, searchTerm))
          .map((node) => {
            const hasChildren = node.children.length > 0;
            const isExpanded = expandedIds.has(node.id);
            const selectionState = getNodeSelectionState(node);

            return (
              <li key={node.id} className="space-y-1.5 animate-in fade-in duration-300">
                <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors group">
                  {/* Expand/Collapse Trigger */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(node.id)}
                    className={`h-6 w-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-foreground dark:hover:text-zinc-200 transition-colors ${!hasChildren ? 'opacity-0 cursor-default' : ''}`}
                    disabled={!hasChildren}
                  >
                    {isExpanded ? (
                      <ChevronDown size={14} className="transform transition-transform duration-200" />
                    ) : (
                      <ChevronRight size={14} className="transform transition-transform duration-200" />
                    )}
                  </button>

                  {/* Tristate Checkbox */}
                  <button
                    type="button"
                    onClick={() => handleCheckboxToggle(node)}
                    className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${
                      selectionState === 'checked'
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : selectionState === 'partial'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                        : 'border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900'
                    }`}
                  >
                    {selectionState === 'checked' && <Check size={12} strokeWidth={3} />}
                    {selectionState === 'partial' && (
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                  </button>

                  {/* Folder Icon */}
                  <Folder
                    size={16}
                    className={`shrink-0 transition-colors ${
                      selectionState !== 'unchecked'
                        ? 'text-emerald-500'
                        : 'text-indigo-400 dark:text-zinc-500'
                    }`}
                  />

                  {/* Label */}
                  <span
                    onClick={() => handleCheckboxToggle(node)}
                    className={`text-sm font-medium cursor-pointer transition-colors flex-1 select-none truncate ${
                      selectionState !== 'unchecked'
                        ? 'text-slate-900 dark:text-zinc-100 font-semibold'
                        : 'text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    {node.name}
                  </span>

                  {/* Total Questions Recursive Count Badge */}
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold rounded-full ${
                      node.total_question_count > 0
                        ? 'bg-indigo-50/40 text-indigo-600 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30'
                        : 'bg-slate-50 dark:bg-zinc-800 text-slate-400 border-slate-200 dark:border-zinc-700/50'
                    }`}
                  >
                    {node.total_question_count} Qs
                  </Badge>
                </div>

                {hasChildren && isExpanded && (
                  <div className="animate-in slide-in-from-left-2 duration-300">
                    {renderTree(node.children, depth + 1)}
                  </div>
                )}
              </li>
            );
          })}
      </ul>
    );
  };

  if (isLoading) return <Loading message="Loading practice library..." className="h-[500px]" />;

  if (isError) return (
    <div className="p-6">
      <Error title="Failed to load library" message="Could not fetch practice categories." onRetry={() => refetch()} />
    </div>
  );

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 md:space-y-8 animate-in fade-in duration-500">
      {/* Header and Back navigation */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/practice')}
          className="w-fit flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all rounded-xl hover:-translate-x-1"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Hub
        </Button>

        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm shadow-emerald-500/5">
            <Sliders className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
              Practice Generator
              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-[9px] font-black tracking-widest uppercase">BETA</Badge>
            </h1>
            <p className="text-muted-foreground font-medium text-sm">Choose exactly what you want to practice and customize your settings.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Category Tree Selector (Span 7) */}
        <Card className="lg:col-span-7 border-slate-200/60 dark:border-zinc-800/80 shadow-xl dark:shadow-[0_4px_25px_rgba(0,0,0,0.4)] rounded-[2rem] overflow-hidden flex flex-col h-[650px] bg-card">
          <CardHeader className="border-b border-slate-100 dark:border-zinc-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/30 dark:bg-zinc-900/10 shrink-0">
            <div>
              <CardTitle className="text-lg font-black text-slate-800 dark:text-zinc-100">Category Selection Tree</CardTitle>
              <CardDescription className="text-xs font-medium">Select categories. Subcategories are automatically included.</CardDescription>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="h-8 rounded-xl font-bold text-xs border-slate-200 dark:border-zinc-850 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300"
              >
                Select All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-8 rounded-xl font-bold text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
              >
                Clear
              </Button>
            </div>
          </CardHeader>

          {/* Search bar inside tree */}
          <div className="p-4 border-b border-slate-100 dark:border-zinc-800 shrink-0 bg-slate-50/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={16} />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search categories..."
                className="pl-10 rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 text-foreground dark:focus-visible:ring-indigo-500/50"
              />
            </div>
          </div>

          {/* Recursive Category Tree list container */}
          <div className="flex-1 p-6 overflow-y-auto min-h-0 custom-scrollbar">
            {tree.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <FolderTree className="h-10 w-10 mb-2 opacity-25" />
                <p className="italic text-sm">No categories available to practice.</p>
              </div>
            ) : (
              <div className="-ml-4 pr-2">
                {renderTree(tree)}
              </div>
            )}
          </div>

          {/* Selected Summary Footer in Tree */}
          <div className="p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/20 shrink-0 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-zinc-400">
            <div className="flex items-center gap-1.5">
              <BookOpen size={14} className="text-emerald-500" />
              <span>{selectedIds.size} categories selected</span>
            </div>
            <div className="flex items-center gap-1">
              <Sparkles size={14} className="text-indigo-500 fill-current animate-pulse" />
              <span>Pool Size: <strong className="text-indigo-600 dark:text-indigo-400 font-black">{totalQuestionsPool}</strong> questions</span>
            </div>
          </div>
        </Card>

        {/* Right Side: Practice Configuration Panel (Span 5) */}
        <Card className="lg:col-span-5 border-slate-200/60 dark:border-zinc-800/80 shadow-xl dark:shadow-[0_4px_25px_rgba(0,0,0,0.4)] rounded-[2rem] overflow-hidden bg-card">
          <CardHeader className="border-b border-slate-100 dark:border-zinc-800 p-6 bg-slate-50/30 dark:bg-zinc-900/10">
            <CardTitle className="text-lg font-black text-slate-800 dark:text-zinc-100 flex items-center gap-2">
              <Sliders size={18} className="text-emerald-500" />
              Session Parameters
            </CardTitle>
            <CardDescription className="text-xs font-medium">Fine-tune the behavior of your practice set.</CardDescription>
          </CardHeader>

          <CardContent className="p-6 md:p-8 space-y-6">
            {/* Custom Name */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">Practice Set Name</label>
              <Input
                value={practiceName}
                onChange={(e) => setPracticeName(e.target.value)}
                placeholder={`e.g. Custom Set - ${new Date().toLocaleDateString()}`}
                className="rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 text-foreground dark:focus-visible:ring-indigo-500/50"
              />
            </div>

            {/* Question Count Slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">Number of Questions</label>
                <Badge className="bg-indigo-500 text-white rounded-lg text-xs font-bold px-2 py-0.5">{questionCount} Qs</Badge>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={Math.min(totalQuestionsPool, 1) > 0 ? 1 : 0}
                  max={Math.min(totalQuestionsPool, 100)}
                  disabled={totalQuestionsPool === 0}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="flex-1 accent-indigo-500 bg-slate-100 dark:bg-zinc-800 h-2 rounded-lg cursor-pointer"
                />
                <Input
                  type="number"
                  min={1}
                  max={Math.min(totalQuestionsPool, 100)}
                  disabled={totalQuestionsPool === 0}
                  value={questionCount}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val > Math.min(totalQuestionsPool, 100)) {
                      setQuestionCount(Math.min(totalQuestionsPool, 100));
                    } else if (val < 1) {
                      setQuestionCount(1);
                    } else {
                      setQuestionCount(val);
                    }
                  }}
                  className="w-16 h-8 text-center text-xs font-black rounded-lg border-slate-200 dark:border-zinc-700 p-0"
                />
              </div>
              {totalQuestionsPool > 0 && (
                <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                  <Info size={12} /> Limit is 100 questions. Matching pool size: {totalQuestionsPool}
                </p>
              )}
            </div>

            {/* Timer Option */}
            <div className="space-y-4 pt-2 border-t border-slate-50 dark:border-zinc-800/80">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">Duration Limit</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    id="noTimer"
                    checked={hasNoTimer}
                    onChange={(e) => setHasNoTimer(e.target.checked)}
                    className="accent-emerald-500 h-4 w-4 rounded-sm border-slate-350 bg-white"
                  />
                  <label htmlFor="noTimer" className="text-xs font-bold text-slate-600 dark:text-zinc-300 cursor-pointer select-none">No Timer</label>
                </div>
              </div>
              
              {!hasNoTimer && (
                <div className="flex items-center gap-4 animate-in slide-in-from-top-2 duration-300">
                  <Clock size={16} className="text-indigo-400" />
                  <input
                    type="range"
                    min={5}
                    max={185}
                    step={5}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="flex-1 accent-indigo-500 bg-slate-100 dark:bg-zinc-800 h-2 rounded-lg cursor-pointer"
                  />
                  <Badge variant="outline" className="bg-indigo-50/40 text-indigo-600 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 font-bold shrink-0">{durationMinutes === 185 ? '3+ Hours' : `${durationMinutes} Mins`}</Badge>
                </div>
              )}
            </div>

            {/* Difficulty tabs */}
            <div className="space-y-3 pt-2 border-t border-slate-50 dark:border-zinc-800/80">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">Difficulty Level</label>
              <div className="grid grid-cols-4 gap-2">
                {['all', 'easy', 'medium', 'hard'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    className={`py-2 text-xs font-black rounded-xl border capitalize tracking-tight transition-all duration-300 cursor-pointer ${
                      difficulty === level
                        ? 'bg-indigo-500 border-indigo-500 text-white shadow-md shadow-indigo-500/20'
                        : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Practice Filter Mode */}
            <div className="space-y-3 pt-2 border-t border-slate-50 dark:border-zinc-800/80">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">Question Filter Pool</label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'all', title: 'All Selected Questions', desc: 'Pick randomly from all questions in selected categories.' },
                  { id: 'unpracticed', title: 'Unpracticed Questions Only', desc: 'Exclude questions you have already answered before.' },
                  { id: 'bookmarked', title: 'Bookmarked Questions Only', desc: 'Select only from questions you have bookmarked.' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFilterMode(item.id as any)}
                    className={`flex flex-col text-left p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                      filterMode === item.id
                        ? 'bg-emerald-500/5 border-emerald-500 ring-1 ring-emerald-500/25 dark:bg-emerald-950/15'
                        : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${filterMode === item.id ? 'border-emerald-500 text-emerald-500 bg-white dark:bg-zinc-955' : 'border-slate-350 text-slate-400'}`}>
                        {filterMode === item.id && <div className="h-2 w-2 rounded-full bg-emerald-500" />}
                      </div>
                      <span className={`text-xs font-black ${filterMode === item.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-zinc-200'}`}>{item.title}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground pl-6 font-medium leading-normal">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* CTA action button */}
            <div className="pt-4 border-t border-slate-100 dark:border-zinc-800">
              <Button
                disabled={selectedIds.size === 0 || createPracticeMutation.isPending || totalQuestionsPool === 0}
                onClick={handleStartPractice}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-2xl h-14 text-base shadow-xl shadow-emerald-500/20 dark:shadow-none hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none disabled:-translate-y-0"
              >
                {createPracticeMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating Session...
                  </div>
                ) : (
                  <div className="flex items-center gap-2 justify-center">
                    <Sparkles className="h-5 w-5 fill-current" />
                    Generate & Start Practice
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomPracticePage;
