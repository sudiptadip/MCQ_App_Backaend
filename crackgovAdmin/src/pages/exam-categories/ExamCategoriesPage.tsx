import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Layers, ExternalLink } from "lucide-react";
import { DataTable, type ColumnDef } from "../../components/ui/DataTable";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import {
  deleteExamCategory,
  getExamCategories,
  saveExamCategory,
  toggleExamCategoryStatus,
} from "../../features/exam-categories/api";
import type { ExamCategoryItem } from "../../features/exam-categories/types";
import { showToast } from "../../utils/toast";

export default function ExamCategoriesPage() {
  const queryClient = useQueryClient();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<ExamCategoryItem> | null>(null);

  const query = useQuery({
    queryKey: ["exam-categories-admin", pageIndex, pageSize, search],
    queryFn: () => getExamCategories({ page: pageIndex + 1, pageSize, search }),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: Partial<ExamCategoryItem>) => saveExamCategory(payload),
    onSuccess: () => {
      showToast.success("Exam Category saved successfully");
      setModalOpen(false);
      setEditingCategory(null);
      queryClient.invalidateQueries({ queryKey: ["exam-categories-admin"] });
    },
    onError: (error: Error) => showToast.error(error.message),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => toggleExamCategoryStatus(id, isActive),
    onSuccess: () => {
      showToast.success("Category status updated");
      queryClient.invalidateQueries({ queryKey: ["exam-categories-admin"] });
    },
    onError: (error: Error) => showToast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteExamCategory(id),
    onSuccess: () => {
      showToast.success("Exam Category deleted");
      queryClient.invalidateQueries({ queryKey: ["exam-categories-admin"] });
    },
    onError: (error: Error) => showToast.error(error.message),
  });

  const handleOpenAdd = () => {
    setEditingCategory({
      title: "",
      description: "",
      href: "/practice",
      imageUrl: "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?q=80&w=600&auto=format&fit=crop",
      iconName: "Landmark",
      accentColor: "from-blue-600/90 to-indigo-900/90",
      displayOrder: (query.data?.items.length || 0) + 1,
      isActive: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item: ExamCategoryItem) => {
    setEditingCategory(item);
    setModalOpen(true);
  };

  const columns: ColumnDef<ExamCategoryItem>[] = [
    { accessorKey: "id", header: "#", size: 55, enableSorting: false },
    {
      accessorKey: "title",
      header: "Category & Visual",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.imageUrl ? (
            <img
              src={row.original.imageUrl}
              alt={row.original.title}
              className="w-10 h-10 rounded-lg object-cover border"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
              {row.original.iconName || "CAT"}
            </div>
          )}
          <div>
            <div className="font-bold text-foreground">{row.original.title}</div>
            <div className="text-xs text-muted-foreground line-clamp-1">{row.original.description || "No description"}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "href",
      header: "Link & Icon",
      cell: ({ row }) => (
        <div className="text-xs space-y-0.5">
          <div className="flex items-center gap-1 font-mono text-primary">
            <span>{row.original.href}</span>
            <ExternalLink size={11} />
          </div>
          <div className="text-muted-foreground">Icon: {row.original.iconName}</div>
        </div>
      ),
    },
    {
      accessorKey: "displayOrder",
      header: "Order",
      cell: ({ getValue }) => <span className="font-mono text-xs font-bold">{getValue<number>()}</span>,
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            row.original.isActive
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
          }`}
        >
          {row.original.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            title="Edit Category"
            onClick={() => handleOpenEdit(row.original)}
          >
            <Pencil size={15} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title={row.original.isActive ? "Deactivate" : "Activate"}
            onClick={() => toggleMutation.mutate({ id: row.original.id, isActive: !row.original.isActive })}
          >
            {row.original.isActive ? <ToggleRight size={18} className="text-emerald-600" /> : <ToggleLeft size={18} className="text-muted-foreground" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Delete Category"
            onClick={() => {
              if (confirm("Are you sure you want to delete this exam category?")) {
                deleteMutation.mutate(row.original.id);
              }
            }}
          >
            <Trash2 size={15} className="text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 animate-in fade-in duration-300">
      <DataTable
        data={query.data?.items ?? []}
        columns={columns}
        isLoading={query.isLoading || toggleMutation.isPending || deleteMutation.isPending}
        title="Target Exam Categories Navigator"
        description="Manage the exam categories bar displayed on the CrackGov portal homepage."
        enableSearch
        searchPlaceholder="Search categories..."
        onSearchChange={(value) => {
          setPageIndex(0);
          setSearch(value);
        }}
        enablePagination
        manualPagination
        totalRows={query.data?.totalCount ?? 0}
        paginationState={{ pageIndex, pageSize }}
        onPaginationChange={(nextPage, nextSize) => {
          setPageIndex(nextSize !== pageSize ? 0 : nextPage);
          setPageSize(nextSize);
        }}
        onRowClick={(row) => handleOpenEdit(row)}
        emptyMessage="No exam categories found. Add your first exam category."
        toolbarActions={
          <Button onClick={handleOpenAdd}>
            <Plus size={15} className="mr-1.5" />
            Add Exam Category
          </Button>
        }
      />

      <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
        <Layers size={14} className="mt-0.5 shrink-0" />
        Active exam categories appear directly on the client homepage under "Targeted Exam Focus".
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCategory?.id ? "Edit Exam Category" : "Create Exam Category"}
            </DialogTitle>
          </DialogHeader>

          {editingCategory && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="cat-title">Category Title *</Label>
                <Input
                  id="cat-title"
                  value={editingCategory.title || ""}
                  onChange={(e) => setEditingCategory({ ...editingCategory, title: e.target.value })}
                  placeholder="e.g. SSC Exams"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cat-desc">Subtitle / Exams Covered</Label>
                <Textarea
                  id="cat-desc"
                  rows={2}
                  value={editingCategory.description || ""}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  placeholder="e.g. CGL, CHSL, MTS, CPO"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cat-href">Target Route (URL)</Label>
                  <Input
                    id="cat-href"
                    value={editingCategory.href || "/practice"}
                    onChange={(e) => setEditingCategory({ ...editingCategory, href: e.target.value })}
                    placeholder="/practice"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cat-icon">Lucide Icon Name</Label>
                  <Input
                    id="cat-icon"
                    value={editingCategory.iconName || "Landmark"}
                    onChange={(e) => setEditingCategory({ ...editingCategory, iconName: e.target.value })}
                    placeholder="Landmark, Train, Building2, Shield, Award"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cat-img">Background Image URL (Unsplash)</Label>
                <Input
                  id="cat-img"
                  value={editingCategory.imageUrl || ""}
                  onChange={(e) => setEditingCategory({ ...editingCategory, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cat-accent">Gradient Accent Class</Label>
                  <Input
                    id="cat-accent"
                    value={editingCategory.accentColor || ""}
                    onChange={(e) => setEditingCategory({ ...editingCategory, accentColor: e.target.value })}
                    placeholder="from-blue-600/90 to-indigo-900/90"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cat-order">Display Order</Label>
                  <Input
                    id="cat-order"
                    type="number"
                    value={editingCategory.displayOrder ?? 0}
                    onChange={(e) => setEditingCategory({ ...editingCategory, displayOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={saveMutation.isPending || !editingCategory?.title?.trim()}
              onClick={() => saveMutation.mutate(editingCategory!)}
            >
              {saveMutation.isPending ? "Saving..." : "Save Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
