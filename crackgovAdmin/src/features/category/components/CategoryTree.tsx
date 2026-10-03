import React, { useCallback, useRef, useState } from 'react';
import { Tree, type NodeApi } from 'react-arborist';
import { Plus, Layers, Folder, ChevronRight, ChevronDown, Pencil, Trash2, GripVertical, ChevronLeft, ALargeSmall } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import type { Category } from '../../../types/database/Category';
import { cn } from '../../../lib/utils';

interface CategoryTreeProps {
  categories: Category[];
  onAdd: (parent: Category) => void;
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
  onAddNewCategory?: () => void;
  onMove: (dragId: number, parentId: number | null) => void;
  disableAddRoot?: boolean;
}

type TreeNode = {
  id: string;           // react-arborist requires string id
  _id: number;          // original numeric id from DB
  name: string;
  category_type: string;
  parent_id: number | null;
  children: TreeNode[];
};

export const CategoryTree = ({
  categories,
  onAdd,
  onEdit,
  onDelete,
  onAddNewCategory,
  onMove,
  disableAddRoot = false
}: CategoryTreeProps) => {
  const treeRef = useRef<any>(null);
  const treeContainerRef = useRef<HTMLDivElement>(null);
  const [textSize, setTextSize] = useState<'sm' | 'base' | 'lg'>('sm');
  const [treeHeight, setTreeHeight] = useState(550);

  React.useEffect(() => {
    if (!treeContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.height > 0) {
          setTreeHeight(entry.contentRect.height);
        }
      }
    });
    observer.observe(treeContainerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleScrollLeft = () => {
    if (treeContainerRef.current) {
      const scrollEl = treeContainerRef.current.querySelector<HTMLElement>('div[style*="overflow"]') || treeContainerRef.current;
      scrollEl.scrollBy({ left: -180, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (treeContainerRef.current) {
      const scrollEl = treeContainerRef.current.querySelector<HTMLElement>('div[style*="overflow"]') || treeContainerRef.current;
      scrollEl.scrollBy({ left: 180, behavior: 'smooth' });
    }
  };

  const cycleTextSize = () => {
    if (textSize === 'sm') setTextSize('base');
    else if (textSize === 'base') setTextSize('lg');
    else setTextSize('sm');
  };

  const rowHeight = textSize === 'lg' ? 48 : textSize === 'base' ? 44 : 40;
  const fontClass = textSize === 'lg' ? 'text-base font-semibold' : textSize === 'base' ? 'text-sm font-medium' : 'text-xs font-medium';

  // Build hierarchical tree with string ids for react-arborist
  const buildTree = useCallback(
    (items: Category[], parent_id: number | null = null): TreeNode[] => {
      return items
        .filter((item) => (item.parent_id ?? null) === parent_id)
        .map((item) => ({
          id: String(item.id),   // arborist needs string
          _id: item.id,
          name: item.name,
          category_type: item.category_type,
          parent_id: item.parent_id,
          children: buildTree(items, item.id),
        }));
    },
    []
  );

  const treeData = buildTree(categories);

  const handleMove = useCallback(
    ({ dragIds, parentId }: { dragIds: string[]; parentId: string | null }) => {
      const dragId = Number(dragIds[0]);
      const pId = parentId === null ? null : Number(parentId);
      onMove(dragId, pId);
    },
    [onMove]
  );

  // ----- Node Renderer (defined inside so it closes over callbacks & state) -----
  const NodeRenderer = useCallback(
    ({ node, style, dragHandle }: { node: NodeApi<TreeNode>; style: React.CSSProperties; dragHandle?: React.Ref<any> }) => {
      const hasChildren = node.children && node.children.length > 0;

      // Map node back to Category shape expected by parent handlers
      const asCategory: Category = {
        id: node.data._id,
        name: node.data.name,
        category_type: node.data.category_type,
        parent_id: node.data.parent_id,
      };

      return (
        <div style={{ ...style, width: 'max-content', minWidth: '100%' }} className="group relative flex items-center pr-4 min-w-full w-max">
          <div className={cn("flex items-center flex-1 rounded-md transition-all duration-200 hover:bg-accent/50 pr-2", textSize === 'lg' ? "h-11" : textSize === 'base' ? "h-10" : "h-9")}>
            {/* Drag Handle */}
            <div ref={dragHandle} className="px-1.5 text-muted-foreground/30 hover:text-muted-foreground cursor-grab active:cursor-grabbing shrink-0">
              <GripVertical className="h-3.5 w-3.5" />
            </div>

            {/* Expand/Collapse toggle */}
            <button
              type="button"
              className="w-5 h-5 flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground"
              onClick={(e) => { e.stopPropagation(); node.toggle(); }}
            >
              {hasChildren ? (
                node.isOpen
                  ? <ChevronDown className="h-3.5 w-3.5" />
                  : <ChevronRight className="h-3.5 w-3.5" />
              ) : (
                <span className="w-3.5" />
              )}
            </button>

            {/* Icon & Label */}
            <div
              className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer py-1 pr-2"
              onClick={(e) => { e.stopPropagation(); if (hasChildren) node.toggle(); }}
            >
              <Folder className={cn(
                "h-4 w-4 shrink-0",
                node.data.parent_id === null ? "text-primary" : "text-indigo-400"
              )} />
              <span className={cn("whitespace-nowrap select-none", fontClass)}>{node.data.name}</span>
              <span className="text-[10px] uppercase text-muted-foreground/50 tracking-wider shrink-0 ml-1">
                {node.data.category_type}
              </span>
            </div>

            {/* Actions */}
            <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 flex items-center gap-0.5 ml-3 shrink-0 transition-opacity duration-150 pr-1">
              <Button
                variant="ghost"
                size="icon"
                title="Add child"
                className="h-7 w-7 text-primary hover:bg-primary/10"
                onClick={(e) => { e.stopPropagation(); onAdd(asCategory); }}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Edit"
                className="h-7 w-7 hover:bg-accent"
                onClick={(e) => { e.stopPropagation(); onEdit(asCategory); }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Delete"
                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                onClick={(e) => { e.stopPropagation(); onDelete(node.data._id); }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      );
    },
    [onAdd, onEdit, onDelete, fontClass, textSize]
  );

  return (
    <div className="h-full flex flex-col border rounded-xl bg-card shadow-sm overflow-hidden border-primary/10">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b flex flex-wrap items-center justify-between gap-2 bg-muted/20 backdrop-blur-sm shrink-0">
        <div>
          <h3 className="font-bold text-base tracking-tight">Question Library</h3>
          <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wide">
            Drag & Drop to Reorganize
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Scroll & Font controls */}
          <div className="flex items-center border rounded-lg bg-background/80 p-0.5 shadow-sm text-muted-foreground">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md hover:bg-accent hover:text-foreground"
              title="Scroll Left"
              onClick={handleScrollLeft}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-[10px] font-bold px-1 uppercase tracking-wider text-muted-foreground/80 select-none">
              Scroll
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md hover:bg-accent hover:text-foreground"
              title="Scroll Right"
              onClick={handleScrollRight}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs font-semibold gap-1 px-2.5 shadow-sm"
            title="Toggle Text Size"
            onClick={cycleTextSize}
          >
            <ALargeSmall className="h-3.5 w-3.5 text-primary" />
            <span className="capitalize">{textSize}</span>
          </Button>

          {!disableAddRoot && onAddNewCategory && (
            <Button size="sm" onClick={onAddNewCategory} className="h-8 gap-1.5 shadow-sm">
              <Plus className="h-3.5 w-3.5" />
              Add Root
            </Button>
          )}
        </div>
      </div>

      {/* Tree */}
      <div ref={treeContainerRef} className="flex-1 overflow-hidden min-h-0 relative tree-scroll-container">
        {treeData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-accent/5 rounded-lg border-2 border-dashed border-muted m-4">
            <Layers className="h-10 w-10 mb-2 opacity-20" />
            <p className="italic text-sm mb-1">No structure defined yet.</p>
            {!disableAddRoot && onAddNewCategory && (
              <Button variant="link" size="sm" onClick={onAddNewCategory}>
                Create your first category
              </Button>
            )}
          </div>
        ) : (
          <Tree<TreeNode>
            ref={treeRef}
            data={treeData}
            width="100%"
            height={treeHeight}
            indent={20}
            rowHeight={rowHeight}
            overscanCount={5}
            onMove={handleMove}
            openByDefault={true}
          >
            {NodeRenderer}
          </Tree>
        )}
      </div>
    </div>
  );
};

