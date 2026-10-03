import { useMemo, useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { ChevronRight, ChevronDown, Check, ChevronDownIcon } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { Category } from '../../../types/database/Category';

interface Props {
    parentCategories: Category[];
    selectedParentId: number | null;
    onParentSelect: (id: string) => void;

    treeData: Category[];
    selectedChildId: number | null;
    onChildSelect: (id: string) => void;

    isLoadingCategories: boolean;
}

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
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(node.id);
                        }}
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

export const CategorySelectionCard = ({
    parentCategories,
    selectedParentId,
    onParentSelect,
    treeData,
    selectedChildId,
    onChildSelect,
    isLoadingCategories
}: Props) => {

    const [popoverOpen, setPopoverOpen] = useState(false);
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

    const { roots, selectedChildName } = useMemo(() => {
        let treeRoots: Category[] = [];
        const safeTreeData = treeData || [];

        const isFlatList = safeTreeData.length > 0 && !safeTreeData.some(cat => cat.children && cat.children.length > 0);

        if (isFlatList) {
            const map = new Map<number, Category & { children: Category[] }>();
            safeTreeData.forEach(item => {
                map.set(item.id, { ...item, children: [] });
            });

            safeTreeData.forEach(item => {
                if (item.parent_id && map.has(item.parent_id)) {
                    map.get(item.parent_id)!.children.push(map.get(item.id)!);
                } else {
                    treeRoots.push(map.get(item.id)!);
                }
            });
        } else {
            treeRoots = safeTreeData;
        }

        let selectedName = "";
        const findSelectedName = (nodes: Category[]) => {
            for (const node of nodes) {
                if (Number(node.id) === Number(selectedChildId)) {
                    selectedName = node.name;
                    return true;
                }
                if (node.children && findSelectedName(node.children)) return true;
            }
            return false;
        };
        findSelectedName(treeRoots);

        return { roots: treeRoots, selectedChildName: selectedName };
    }, [treeData, selectedChildId]);

    // Expand all roots by default when treeData changes
    useEffect(() => {
        if (roots.length > 0) {
            const newExpanded = new Set(expandedIds);
            roots.forEach(root => newExpanded.add(root.id));
            setExpandedIds(newExpanded);
        }
    }, [roots]);

    const toggleExpand = useCallback((id: number) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const handleNodeSelect = useCallback((id: number) => {
        onChildSelect(id.toString());
        setPopoverOpen(false);
    }, [onChildSelect]);

    return (
        <Card className="shadow-md border-primary/10 overflow-hidden">
            <div className="h-1 bg-primary w-full" />
            <CardHeader className="bg-muted/30 pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                    1. Category Selection
                </CardTitle>
                <CardDescription>Select the parent category and its specific subcategory.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[200px] max-w-[300px]">
                        <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Parent Category</label>
                        <Select
                            value={selectedParentId?.toString() || ""}
                            onValueChange={onParentSelect}
                        >
                            <SelectTrigger className="w-full bg-background border-muted-foreground/20 hover:border-primary/50 transition-colors h-11">
                                <SelectValue placeholder="Select Parent Category" />
                            </SelectTrigger>
                            <SelectContent>
                                {parentCategories?.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id.toString()}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <ChevronRight className="text-muted-foreground/50 w-5 h-5 flex-shrink-0 mt-6 hidden sm:block" />

                    <div className="flex-1 min-w-[200px] max-w-[300px]">
                        <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Subcategory Tree</label>
                        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                            <PopoverTrigger asChild>
                                <button
                                    type="button"
                                    disabled={!selectedParentId || treeData?.length === 0}
                                    className={cn(
                                        "flex h-11 w-full items-center justify-between rounded-md border border-muted-foreground/20 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground hover:border-primary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                                        !selectedChildId && "text-muted-foreground"
                                    )}
                                >
                                    <span className="truncate">
                                        {treeData?.length === 0 && selectedParentId !== null
                                            ? "No subcategories"
                                            : selectedChildId ? selectedChildName : "Select Subcategory Node"}
                                    </span>
                                    <ChevronDownIcon className="h-4 w-4 opacity-50" />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-1" align="start">
                                <ScrollArea className="h-[300px]">
                                    <div className="p-1 flex flex-col gap-0.5">
                                        {roots.length === 0 ? (
                                            <div className="p-4 text-center text-sm text-muted-foreground">
                                                No data available
                                            </div>
                                        ) : (
                                            roots.map(root => (
                                                <TreeNode
                                                    key={root.id}
                                                    node={root}
                                                    level={0}
                                                    expandedIds={expandedIds}
                                                    toggleExpand={toggleExpand}
                                                    onSelect={handleNodeSelect}
                                                    selectedId={selectedChildId}
                                                />
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {isLoadingCategories && (
                        <div className="text-sm text-muted-foreground animate-pulse ml-2 mt-6">Loading...</div>
                    )}
                </div>
                {!!(!selectedChildId && selectedParentId && treeData?.length > 0) && (
                    <p className="text-xs text-muted-foreground mt-4 italic">
                        * Please select a subcategory to make the assignment more specific.
                    </p>
                )}
            </CardContent>
        </Card>
    );
};
