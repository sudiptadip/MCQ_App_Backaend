import React, { useCallback, useRef, useState } from 'react';
import { Tree, type NodeApi } from 'react-arborist';
import {
  Plus, Monitor, Folder, ChevronRight, ChevronDown,
  Pencil, Trash2, GripVertical, Layers, ClipboardList, X,
  ChevronLeft, ALargeSmall,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import type DisplayView from '../../../types/database/DisplayView';
import { cn } from '../../../lib/utils';

type TreeNode = {
  id: string;
  _id: number;
  name: string;
  type: 'node' | 'test' | 'study-material';
  parent_id: number | null;
  children: TreeNode[];
  test_info?: {
    test_id: number;
    assignment_id: number;
  };
  sm_info?: {
    studyMaterial_id: number;
    assignment_id: number;
    type: string;
  }
};

interface DisplayViewTreeProps {
  items: DisplayView[];
  assignments?: Record<number, { id: number; test_id: number; test_name: string }[]>;
  assignmentsSM?: Record<number, { id: number; studyMaterial_id: number; studyMaterial_name: string; type: string }[]>;
  onAdd: (parent: DisplayView) => void;
  onEdit: (item: DisplayView) => void;
  onDelete: (id: number) => void;
  onAssign: (item: DisplayView) => void;   // open assign modal
  onUnassign?: (assignmentId: number, type: 'test'|'study-material') => void;
  onAddRoot: () => void;
  disableAddRoot?: boolean;
  onMove: (dragId: number, parentId: number | null) => void;
}

const DisplayViewTree: React.FC<DisplayViewTreeProps> = ({
  items,
  assignments = {},
  assignmentsSM = {},
  onAdd,
  onEdit,
  onDelete,
  onAssign,
  onUnassign,
  onAddRoot,
  disableAddRoot = false,
  onMove,
}) => {
  const treeRef = useRef<any>(null);
  const treeContainerRef = useRef<HTMLDivElement>(null);
  const [textSize, setTextSize] = useState<'sm' | 'base' | 'lg'>('sm');
  const [treeHeight, setTreeHeight] = useState(550);

  React.useEffect(() => {
    if (!treeContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.height > 0) {
          // Account for padding p-2 (16px)
          setTreeHeight(Math.max(100, entry.contentRect.height - 16));
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

  // Recursive buildTree with visited-Set cycle guard
  const buildTree = useCallback(
    (flat: DisplayView[], parentId: number | null = null, visited = new Set<number>()): TreeNode[] =>
      flat
        .filter((v) => (v.parent_id ?? null) === parentId && !visited.has(v.id))
        .map((v) => {
          const children = buildTree(flat, v.id, new Set([...visited, v.id]));
          
          // Add tests assigned to THIS node
          const nodeTests = assignments[v.id] || [];
          const testNodes: TreeNode[] = nodeTests.map((t) => ({
            id: `test-${v.id}-${t.test_id}`,
            _id: t.test_id,
            name: t.test_name,
            type: 'test',
            parent_id: v.id,
            children: [],
            test_info: {
              test_id: t.test_id,
              assignment_id: t.id,
            },
          }));

          // Add study materials assigned to THIS node
          const nodeSM = assignmentsSM[v.id] || [];
          const smNodes: TreeNode[] = nodeSM.map((sm) => ({
            id: `sm-${v.id}-${sm.studyMaterial_id}`,
            _id: sm.studyMaterial_id,
            name: sm.studyMaterial_name,
            type: 'study-material',
            parent_id: v.id,
            children: [],
            sm_info: {
              studyMaterial_id: sm.studyMaterial_id,
              assignment_id: sm.id,
              type: sm.type,
            },
          }));

          return {
            id: String(v.id),
            _id: v.id,
            name: v.display_name,
            type: 'node',
            parent_id: v.parent_id ?? null,
            children: [...children, ...testNodes, ...smNodes],
          };
        }),
    [assignments, assignmentsSM]
  );

  const treeData = buildTree(items);

  const handleMove = useCallback(
    ({ dragIds, parentId }: { dragIds: string[]; parentId: string | null; index: number }) => {
      const dragIdStr = dragIds[0];
      // Don't allow moving tests or sm, or dropping into tests/sm
      if (dragIdStr.startsWith('test-') || dragIdStr.startsWith('sm-')) return;
      if (parentId?.startsWith('test-') || parentId?.startsWith('sm-')) return;

      const dragId = Number(dragIdStr);
      const pId = parentId === null ? null : Number(parentId);
      onMove(dragId, pId);
    },
    [onMove]
  );

  const NodeRenderer = useCallback(
    ({
      node,
      style,
      dragHandle,
    }: {
      node: NodeApi<TreeNode>;
      style: React.CSSProperties;
      dragHandle?: React.Ref<any>;
    }) => {
      const hasChildren = node.children && node.children.length > 0;
      const isRoot = node.data.parent_id === null;
      const isTest = node.data.type === 'test';
      const isSM = node.data.type === 'study-material';
      const isLeafContent = isTest || isSM;

      const asDisplayView: DisplayView = {
        id: node.data._id,
        display_name: node.data.name,
        parent_id: node.data.parent_id,
      };

      return (
        <div style={{ ...style, width: 'max-content', minWidth: '100%' }} className="group relative flex items-center pr-4 min-w-full w-max">
          <div className={cn(
            "flex items-center flex-1 rounded-md transition-all duration-200 pr-2",
            textSize === 'lg' ? "h-11" : textSize === 'base' ? "h-10" : "h-9",
            isTest ? "bg-indigo-500/5 hover:bg-indigo-500/10 border-l-2 border-indigo-400/50" :
            isSM ? "bg-emerald-500/5 hover:bg-emerald-500/10 border-l-2 border-emerald-400/50" : "hover:bg-accent/50"
          )}>
            {/* Drag handle - only for nodes */}
            {!isLeafContent ? (
              <div
                ref={dragHandle}
                className="px-1.5 text-muted-foreground/30 hover:text-muted-foreground cursor-grab active:cursor-grabbing shrink-0"
              >
                <GripVertical className="h-3.5 w-3.5" />
              </div>
            ) : (
              <div className="w-6.5" /> 
            )}

            {/* Expand / collapse */}
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

            {/* Icon + label */}
            <div
              className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer py-1 pr-2"
              onClick={(e) => { e.stopPropagation(); if (hasChildren) node.toggle(); }}
            >
              {isTest ? (
                <div className="h-4 w-4 shrink-0 flex items-center justify-center bg-indigo-500/10 rounded-md">
                  <ClipboardList className="h-3 w-3 text-indigo-500" />
                </div>
              ) : isSM ? (
                <div className="h-4 w-4 shrink-0 flex items-center justify-center bg-emerald-500/10 rounded-md">
                  <Layers className="h-3 w-3 text-emerald-500" />
                </div>
              ) : isRoot ? (
                <div className="h-5 w-5 shrink-0 flex items-center justify-center bg-primary/10 rounded-lg">
                  <Monitor className="h-3.5 w-3.5 text-primary" />
                </div>
              ) : (
                <div className={cn(
                  "h-4 w-4 shrink-0 flex items-center justify-center rounded-md",
                  node.level === 1 ? 'bg-indigo-500/10' : 'bg-amber-500/10'
                )}>
                  <Folder className={cn('h-3 w-3', node.level === 1 ? 'text-indigo-500' : 'text-amber-500')} />
                </div>
              )}
              <span className={cn(
                "whitespace-nowrap select-none transition-colors",
                fontClass,
                isTest ? "text-indigo-700/80 italic" : 
                isSM ? "text-emerald-700/80 italic" : "text-foreground/80 group-hover:text-foreground"
              )}>
                {node.data.name}
              </span>
              {isRoot && (
                <span className="text-[9px] font-bold uppercase bg-primary/5 text-primary/60 px-1.5 py-0.5 rounded-full border border-primary/10 tracking-tight shrink-0 ml-1">
                  Root
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 flex items-center gap-1 ml-3 shrink-0 transition-opacity duration-200 pr-1">
              {!isLeafContent && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Add child"
                    className="h-7 w-7 rounded-full text-primary hover:bg-primary/10 hover:scale-110 transition-all"
                    onClick={(e) => { e.stopPropagation(); onAdd(asDisplayView); }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Assign Content"
                    className="h-7 w-7 rounded-full text-indigo-500 hover:bg-indigo-500/10 hover:scale-110 transition-all"
                    onClick={(e) => { e.stopPropagation(); onAssign(asDisplayView); }}
                  >
                    <ClipboardList className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Edit"
                    className="h-7 w-7 rounded-full text-foreground/60 hover:text-foreground hover:bg-accent hover:scale-110 transition-all"
                    onClick={(e) => { e.stopPropagation(); onEdit(asDisplayView); }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Delete"
                    className="h-7 w-7 rounded-full text-destructive hover:bg-destructive/10 hover:scale-110 transition-all"
                    onClick={(e) => { e.stopPropagation(); onDelete(node.data._id); }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
              {isLeafContent && onUnassign && (
                <Button
                  variant="ghost"
                  size="icon"
                  title="Unassign Content"
                  className="h-7 w-7 rounded-full text-destructive hover:bg-destructive/10 hover:scale-110 transition-all"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (isTest && node.data.test_info) onUnassign(node.data.test_info.assignment_id, 'test'); 
                    else if (isSM && node.data.sm_info) onUnassign(node.data.sm_info.assignment_id, 'study-material'); 
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    },
    [onAdd, onEdit, onDelete, onAssign, onUnassign, fontClass, textSize]
  );

  return (
    <div className="h-full flex flex-col border-0 lg:border border-primary/5 lg:rounded-3xl bg-card/30 backdrop-blur-md shadow-2xl shadow-primary/5 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-primary/5 flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-muted/30 to-transparent shrink-0">
        <div>
          <h3 className="font-extrabold text-lg tracking-tight text-foreground/90 flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Structure
          </h3>
          <p className="text-[10px] text-muted-foreground/60 uppercase font-bold tracking-widest mt-0.5">
            Interactive Node Tree
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Scroll & Font controls */}
          <div className="flex items-center border border-primary/10 rounded-lg bg-background/80 p-0.5 shadow-sm text-muted-foreground">
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
            className="h-8 text-xs font-semibold gap-1 px-2.5 shadow-sm border-primary/10"
            title="Toggle Text Size"
            onClick={cycleTextSize}
          >
            <ALargeSmall className="h-3.5 w-3.5 text-primary" />
            <span className="capitalize">{textSize}</span>
          </Button>

          {!disableAddRoot && (
            <Button size="sm" onClick={onAddRoot} className="h-9 px-4 gap-2 shadow-lg shadow-primary/20 rounded-xl transition-transform active:scale-95">
              <Plus className="h-4 w-4" />
              Add Root
            </Button>
          )}
        </div>
      </div>

      {/* Tree Content */}
      <div ref={treeContainerRef} className="flex-1 overflow-hidden min-h-0 relative tree-scroll-container p-2">
        {treeData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground m-4 rounded-2xl border border-dashed border-primary/10 bg-primary/5">
            <div className="bg-primary/5 p-4 rounded-full mb-3 shadow-inner">
              <Layers className="h-10 w-10 opacity-30" />
            </div>
            <p className="font-semibold text-sm mb-1 text-foreground/60">No structure defined</p>
            <p className="text-xs opacity-50 mb-4 text-center px-6">Start by creating your first root node to organize your content.</p>
            {!disableAddRoot && (
              <Button variant="outline" size="sm" onClick={onAddRoot} className="rounded-lg h-8 border-primary/20 hover:bg-primary/5 text-primary">
                Create First Root
              </Button>
            )}
          </div>
        ) : (
          <div className="h-full">
            <Tree<TreeNode>
              ref={treeRef}
              data={treeData}
              width="100%"
              height={treeHeight}
              indent={24}
              rowHeight={rowHeight}
              overscanCount={8}
              onMove={handleMove}
              openByDefault={true}
            >
              {NodeRenderer}
            </Tree>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-5 py-3 border-t border-primary/5 bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
            Drag items to reorganize • Left/Right scroll enabled
          </span>
        </div>
      </div>
    </div>
  );
};

export default DisplayViewTree;

