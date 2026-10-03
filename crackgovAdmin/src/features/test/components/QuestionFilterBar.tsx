import { useMemo, useState, useCallback, useEffect } from "react";
import { Input } from "../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../../../components/ui/popover";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { Search, ChevronDown, ChevronRight, Check, X, SlidersHorizontal, Filter } from "lucide-react";
import { cn } from "../../../lib/utils";
import type { Category } from "../../../types/database/Category";
import type { QuestionFilterParams } from "../api/test.api";

interface Props {
  filters: QuestionFilterParams;
  onFiltersChange: (filters: QuestionFilterParams) => void;
  parentCategories: Category[];
  childCategories: Category[];
  isLoadingChildren: boolean;
  onParentCategoryChange: (parentId: number | undefined) => void;
}

// ─── Tree Node ────────────────────────────────────────────────────────────────
const TreeNode = ({ node, level, expandedIds, toggleExpand, onSelect, selectedId }: any) => {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;

  return (
    <div className="flex flex-col w-full">
      <div
        className={cn(
          "flex items-center py-1.5 px-2 hover:bg-muted/60 cursor-pointer rounded-sm text-sm group transition-colors",
          isSelected ? "bg-primary/10 text-primary font-medium" : "text-foreground"
        )}
        style={{ paddingLeft: `${level * 16 + 4}px` }}
        onClick={() => onSelect(node.id, node.name)}
      >
        {hasChildren ? (
          <div
            className={cn(
              "mr-1 p-0.5 rounded-sm hover:bg-muted-foreground/20 flex items-center justify-center transition-colors",
              isSelected ? "hover:bg-primary/20 text-primary" : "text-muted-foreground"
            )}
            onClick={(e) => { e.stopPropagation(); toggleExpand(node.id); }}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
        ) : (
          <div className="w-4 h-4 mr-1" />
        )}
        <div className="flex-1 truncate">{node.name}</div>
        {isSelected && <Check className="w-4 h-4 ml-2 flex-shrink-0" />}
      </div>
      {hasChildren && isExpanded && (
        <div className="flex flex-col w-full relative mt-0.5">
          <div className="absolute left-0 top-0 bottom-0 w-px bg-border/50" style={{ marginLeft: `${level * 16 + 11}px` }} />
          {node.children.map((child: any) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const QuestionFilterBar = ({
  filters,
  onFiltersChange,
  parentCategories,
  childCategories,
  isLoadingChildren,
  onParentCategoryChange,
}: Props) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  // ── Draft state — only flushed to parent on "Apply Filters" ──────────────
  const [draft, setDraft] = useState<QuestionFilterParams>({
    ...filters,
    search: filters.search,
    root_category_id: filters.root_category_id,
    category_id: filters.category_id,
    difficulty_level: filters.difficulty_level,
    order_by: filters.order_by,
  });

  // Keep draft in sync when parent resets filters externally (e.g. clear)
  useEffect(() => {
    setDraft((prev) => ({ ...prev, ...filters }));
  }, [filters]);

  // Detect if draft differs from committed filters
  const isDirty =
    draft.search !== filters.search ||
    draft.root_category_id !== filters.root_category_id ||
    draft.category_id !== filters.category_id ||
    draft.difficulty_level !== filters.difficulty_level ||
    draft.order_by !== filters.order_by;

  const hasActiveDraftFilters = !!(
    draft.search ||
    draft.root_category_id ||
    draft.category_id ||
    draft.difficulty_level ||
    draft.order_by
  );

  // ── Tree helpers ──────────────────────────────────────────────────────────
  const { treeRoots, selectedChildName } = useMemo(() => {
    const isFlatList = childCategories.length > 0 && !childCategories.some(c => c.children && c.children.length > 0);
    let roots: Category[] = [];

    if (isFlatList) {
      const map = new Map<number, Category & { children: Category[] }>();
      childCategories.forEach(item => map.set(item.id, { ...item, children: [] }));
      childCategories.forEach(item => {
        if (item.parent_id && map.has(item.parent_id)) {
          map.get(item.parent_id)!.children.push(map.get(item.id)!);
        } else {
          roots.push(map.get(item.id)!);
        }
      });
    } else {
      roots = childCategories;
    }

    let selectedName = "";
    const find = (nodes: Category[]): boolean => {
      for (const n of nodes) {
        if (Number(n.id) === Number(draft.category_id)) { selectedName = n.name; return true; }
        if (n.children && find(n.children)) return true;
      }
      return false;
    };
    find(roots);

    return { treeRoots: roots, selectedChildName: selectedName };
  }, [childCategories, draft.category_id]);

  // Auto-expand root nodes when tree loads
  useEffect(() => {
    if (treeRoots.length > 0) {
      setExpandedIds(prev => {
        const next = new Set(prev);
        treeRoots.forEach(r => next.add(r.id));
        return next;
      });
    }
  }, [treeRoots]);

  const toggleExpand = useCallback((id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // ── Draft handlers ────────────────────────────────────────────────────────
  const handleChildSelect = useCallback((id: number) => {
    setDraft(prev => ({ ...prev, category_id: id }));
    setPopoverOpen(false);
  }, []);

  const handleParentChange = (value: string) => {
    const pid = value === "__all__" || !value ? undefined : Number(value);
    // Fetch children immediately so tree is ready when user opens it
    onParentCategoryChange(pid);
    setDraft(prev => ({ ...prev, root_category_id: pid, category_id: undefined }));
  };

  // ── Apply & Clear ─────────────────────────────────────────────────────────
  const handleApply = () => {
    onFiltersChange({ ...draft, page: 1 });
  };

  const handleClear = () => {
    const reset: QuestionFilterParams = { page: 1, page_size: filters.page_size };
    onParentCategoryChange(undefined);
    setDraft(reset);
    onFiltersChange(reset);
  };

  return (
    <div className="bg-muted/30 border rounded-xl p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-center gap-2">
        <SlidersHorizontal size={16} className="text-primary flex-shrink-0" />
        <span className="text-sm font-semibold">Filter Questions</span>

        <div className="ml-auto flex items-center gap-2">
          {hasActiveDraftFilters && (
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <X size={12} /> Clear
            </button>
          )}

          {/* ── APPLY FILTER BUTTON ── */}
          <button
            type="button"
            onClick={handleApply}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
              isDirty
                ? "bg-primary text-primary-foreground border-primary shadow-sm hover:bg-primary/90 animate-pulse"
                : "bg-background text-muted-foreground border-muted-foreground/30 hover:border-primary/50 hover:text-primary"
            )}
          >
            <Filter size={13} />
            Apply Filters
          </button>
        </div>
      </div>

      {/* Filter inputs — update draft only */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Text Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            id="q-search"
            placeholder="Search questions..."
            value={draft.search || ""}
            onChange={(e) => setDraft(prev => ({ ...prev, search: e.target.value || undefined }))}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
            className="pl-8 h-10 text-sm"
          />
        </div>

        {/* Parent Category */}
        <div>
          <Select
            value={draft.root_category_id?.toString() || "__all__"}
            onValueChange={handleParentChange}
          >
            <SelectTrigger id="q-parent-cat" className="h-10 text-sm">
              <SelectValue placeholder="Parent Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Categories</SelectItem>
              {parentCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sub-category Tree Popover */}
        <div>
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                disabled={!draft.root_category_id || childCategories.length === 0}
                className={cn(
                  "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:border-primary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                  !draft.category_id && "text-muted-foreground"
                )}
              >
                <span className="truncate">
                  {isLoadingChildren
                    ? "Loading..."
                    : !draft.root_category_id
                    ? "Select parent first"
                    : draft.category_id
                    ? selectedChildName || "Subcategory selected"
                    : "All Subcategories"}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-1" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[260px] p-1" align="start">
              <ScrollArea className="h-[260px]">
                <div className="p-1 flex flex-col gap-0.5">
                  {/* All option */}
                  <div
                    className={cn(
                      "flex items-center py-1.5 px-2 hover:bg-muted/60 cursor-pointer rounded-sm text-sm transition-colors",
                      !draft.category_id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
                    )}
                    onClick={() => { setDraft(prev => ({ ...prev, category_id: undefined })); setPopoverOpen(false); }}
                  >
                    <div className="w-4 h-4 mr-1" />
                    <span>All Subcategories</span>
                    {!draft.category_id && <Check className="w-4 h-4 ml-auto" />}
                  </div>
                  {treeRoots.map(root => (
                    <TreeNode
                      key={root.id}
                      node={root}
                      level={0}
                      expandedIds={expandedIds}
                      toggleExpand={toggleExpand}
                      onSelect={handleChildSelect}
                      selectedId={draft.category_id}
                    />
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>

        {/* Difficulty */}
        <div>
          <Select
            value={draft.difficulty_level || "__all__"}
            onValueChange={(v) => setDraft(prev => ({ ...prev, difficulty_level: v === "__all__" ? undefined : v }))}
          >
            <SelectTrigger id="q-difficulty" className="h-10 text-sm">
              <SelectValue placeholder="All Difficulties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Difficulties</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Order By pills — also update draft only */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-muted-foreground font-medium">Sort by:</span>
        {(["latest", "oldest", "difficulty_asc", "difficulty_desc"] as const).map((opt) => {
          const labels: Record<string, string> = {
            latest: "Latest",
            oldest: "Oldest",
            difficulty_asc: "Difficulty ↑",
            difficulty_desc: "Difficulty ↓",
          };
          const isActive = draft.order_by === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => setDraft(prev => ({ ...prev, order_by: isActive ? undefined : opt }))}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-full border transition-all",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-muted-foreground border-muted-foreground/30 hover:border-primary/50 hover:text-foreground"
              )}
            >
              {labels[opt]}
            </button>
          );
        })}

        {/* Inline hint when dirty */}
        {isDirty && (
          <span className="text-xs text-amber-600 font-medium ml-1 animate-pulse">
            • Changes pending — click Apply
          </span>
        )}
      </div>
    </div>
  );
};

export default QuestionFilterBar;
