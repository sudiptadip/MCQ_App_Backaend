import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Folder, ChevronRight, ChevronDown, Eye, Loader2 } from 'lucide-react';
import { DataTable, type ColumnDef } from '../../components/ui/DataTable';
import {
  getParentCategories,
  deleteCategory,
  getAssignedFranchiseCategories,
  getCategoryTree,
} from '../../features/category/api/category.api';
import { showToast } from '../../utils/toast';
import type { Category } from '../../types/database/Category';
import Error from '../../components/common/Error';
import { ActionButton } from '../../features/mcq/components/McqQuestionAnsTable';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';

const CategoryListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = React.useState<number | null>(null);
  const [activeTab, setActiveTab] = React.useState<'my_categories' | 'franchise_categories'>('my_categories');
  const [viewTreeCategory, setViewTreeCategory] = React.useState<{ id: number; name: string } | null>(null);

  // Fetch my categories (top-level root categories)
  const { data: roots = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['parentCategories'],
    queryFn: getParentCategories,
  });

  // Fetch assigned franchise categories
  const { data: franchiseCategories = [], isLoading: isLoadingFranchise, isError: isErrorFranchise, refetch: refetchFranchise } = useQuery({
    queryKey: ['assignedFranchiseCategories'],
    queryFn: getAssignedFranchiseCategories,
    enabled: activeTab === 'franchise_categories',
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: (res) => {
      if (res.isSuccess) {
        showToast.success(res.message || 'Deleted successfully');
        queryClient.invalidateQueries({ queryKey: ['parentCategories'] });
        setDeleteId(null);
      } else {
        showToast.error(res.message || 'Delete failed');
      }
    },
    onError: (err) => showToast.apiErrorShow(err),
  });

  const columns: ColumnDef<Category>[] = [
    { accessorKey: 'id', header: '#', size: 60, enableSorting: false },
    {
      accessorKey: 'name',
      header: 'Category Name',
      cell: ({ getValue }) => (
        <span className="font-semibold text-foreground">{getValue<string>() || '—'}</span>
      ),
    },
    {
      accessorKey: 'category_type',
      header: 'Type',
      size: 150,
      cell: ({ getValue }) => (
        <span className="text-xs uppercase text-muted-foreground tracking-wider font-semibold">
          {getValue<string>() || '—'}
        </span>
      ),
    },
    {
      id: '__actions__',
      header: 'Actions',
      size: 120,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const id = row.original?.id;
        return (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <ActionButton
              title="Edit"
              onClick={(e) => { e.stopPropagation(); if (id) navigate(`/category/edit/${id}`); }}
            >
              <Pencil size={14} />
            </ActionButton>
            <ActionButton
              title="Delete"
              variant="danger"
              onClick={(e) => { e.stopPropagation(); if (id) setDeleteId(id); }}
            >
              <Trash2 size={14} />
            </ActionButton>
          </div>
        );
      },
    },
  ];

  const franchiseColumns: ColumnDef<Category>[] = [
    { accessorKey: 'id', header: '#', size: 60, enableSorting: false },
    {
      accessorKey: 'name',
      header: 'Category Name',
      cell: ({ getValue }) => (
        <span className="font-semibold text-foreground">{getValue<string>() || '—'}</span>
      ),
    },
    {
      id: '__actions__',
      header: 'Actions',
      size: 120,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const id = row.original?.id;
        const name = row.original?.name;
        return (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <ActionButton
              title="View Tree"
              onClick={(e) => {
                e.stopPropagation();
                if (id && name) setViewTreeCategory({ id, name });
              }}
            >
              <Eye size={14} />
            </ActionButton>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6 space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit border border-border">
        <button
          type="button"
          onClick={() => setActiveTab('my_categories')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
            activeTab === 'my_categories'
              ? 'bg-background text-primary shadow-sm border border-border'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          My Categories
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('franchise_categories')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
            activeTab === 'franchise_categories'
              ? 'bg-background text-primary shadow-sm border border-border'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Assigned Franchise Categories
        </button>
      </div>

      {activeTab === 'my_categories' ? (
        isError ? (
          <Error title="Failed to load" message="Error fetching parent category list." onRetry={() => refetch()} />
        ) : (
          <DataTable
            data={roots}
            columns={columns}
            isLoading={isLoading || deleteMutation.isPending}
            title="Question Categories"
            description="Manage top-level root categories. Click Edit to manage subcategories, topics and hierarchy."
            enableSorting
            enableSearch
            searchPlaceholder="Search categories..."
            enablePagination
            defaultPageSize={10}
            onRowClick={(row: any) => {
              const id = row?.original?.id;
              if (id) navigate(`/category/edit/${id}`);
            }}
            toolbarActions={
              <button
                id="btn-create-category"
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                onClick={() => navigate('/category/create')}
              >
                <Plus size={14} /> Create Category
              </button>
            }
          />
        )
      ) : (
        isErrorFranchise ? (
          <Error title="Failed to load" message="Error fetching assigned franchise categories." onRetry={() => refetchFranchise()} />
        ) : (
          <DataTable
            data={franchiseCategories}
            columns={franchiseColumns}
            isLoading={isLoadingFranchise}
            title="Assigned Categories"
            description="Categories assigned to your franchise. Click View to visualize the subcategory tree hierarchy."
            enableSorting
            enableSearch
            searchPlaceholder="Search assigned categories..."
            enablePagination
            defaultPageSize={10}
            onRowClick={(row: any) => {
              const id = row?.original?.id;
              const name = row?.original?.name;
              if (id && name) setViewTreeCategory({ id, name });
            }}
          />
        )
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category?</DialogTitle>
            <DialogDescription>
              This will permanently delete this category and all of its subcategories, subjects and topics. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Category Tree Modal */}
      <CategoryTreeDialog
        categoryId={viewTreeCategory?.id ?? null}
        categoryName={viewTreeCategory?.name ?? null}
        isOpen={viewTreeCategory !== null}
        onClose={() => setViewTreeCategory(null)}
      />
    </div>
  );
};

// ─── Collapsible Tree Viewer Component ───────────────────────────────────

interface CategoryTreeDialogProps {
  categoryId: number | null;
  categoryName: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface TreeItem {
  id: number;
  name: string;
  category_type: string;
  parent_id: number | null;
  children: TreeItem[];
}

const CategoryTreeDialog: React.FC<CategoryTreeDialogProps> = ({
  categoryId,
  categoryName,
  isOpen,
  onClose,
}) => {
  const { data: flatList = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['categoryTree', categoryId],
    queryFn: () => getCategoryTree(categoryId!),
    enabled: isOpen && categoryId !== null,
  });

  const treeData = React.useMemo(() => {
    if (!categoryId || flatList.length === 0) return [];

    const map = new Map<number, TreeItem>();
    flatList.forEach((item) => {
      map.set(item.id, {
        id: item.id,
        name: item.name,
        category_type: item.category_type || '',
        parent_id: item.parent_id,
        children: [],
      });
    });

    const roots: TreeItem[] = [];
    flatList.forEach((item) => {
      const mapped = map.get(item.id)!;
      if (item.id === categoryId) {
        roots.push(mapped);
      } else if (item.parent_id !== null && map.has(item.parent_id)) {
        map.get(item.parent_id)!.children.push(mapped);
      } else {
        if (item.parent_id === null || !map.has(item.parent_id)) {
          roots.push(mapped);
        }
      }
    });

    return roots;
  }, [flatList, categoryId]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-5 pb-3 border-b shrink-0 bg-muted/10">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Folder className="h-5 w-5 text-primary" />
            Category Structure Tree
          </DialogTitle>
          <DialogDescription className="text-xs">
            Viewing hierarchy for: <strong>{categoryName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 min-h-[250px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full gap-2 text-muted-foreground py-12">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm font-medium">Loading category tree...</span>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 py-8 text-center">
              <p className="text-sm text-destructive font-semibold">Failed to load structure.</p>
              <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : treeData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12 italic text-sm">
              No categories found.
            </div>
          ) : (
            <div className="border rounded-lg bg-card p-3 shadow-inner space-y-1">
              {treeData.map((rootNode) => (
                <TreeNodeRenderer key={rootNode.id} node={rootNode} />
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t shrink-0 bg-muted/20 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const TreeNodeRenderer: React.FC<{ node: TreeItem }> = ({ node }) => {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="pl-4 border-l border-muted-foreground/15 my-1 ml-1">
      <div className="flex items-center gap-2 py-1 hover:bg-accent/40 rounded px-2 group transition-colors cursor-pointer" onClick={() => hasChildren && setIsExpanded(!isExpanded)}>
        {hasChildren ? (
          <button
            type="button"
            className="p-1 hover:bg-accent rounded text-muted-foreground transition-colors shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}
        <Folder className="h-3.5 w-3.5 text-primary shrink-0 opacity-80" />
        <span className="text-sm font-semibold text-foreground truncate">{node.name}</span>
        {node.category_type && (
          <span className="text-[9px] font-bold uppercase tracking-wider bg-muted text-muted-foreground px-1.5 py-0.5 rounded border border-border opacity-90">
            {node.category_type}
          </span>
        )}
      </div>
      {hasChildren && isExpanded && (
        <div className="mt-0.5">
          {node.children.map((child) => (
            <TreeNodeRenderer key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryListPage;
