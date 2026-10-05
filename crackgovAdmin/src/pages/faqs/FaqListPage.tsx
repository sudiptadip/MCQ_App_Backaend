import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { HelpCircle, Pencil, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { DataTable, type ColumnDef } from "../../components/ui/DataTable";
import { Button } from "../../components/ui/button";
import { deleteFaq, getFaqs, toggleFaqStatus } from "../../features/faqs/api";
import type { FaqItem } from "../../features/faqs/types";
import { showToast } from "../../utils/toast";

export default function FaqListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [search, setSearch] = React.useState("");

  const query = useQuery({
    queryKey: ["faqs", pageIndex, pageSize, search],
    queryFn: () => getFaqs({ page: pageIndex + 1, pageSize, search }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => toggleFaqStatus(id, isActive),
    onSuccess: () => {
      showToast.success("FAQ status updated");
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
    },
    onError: (error: Error) => showToast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteFaq(id),
    onSuccess: () => {
      showToast.success("FAQ deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
    },
    onError: (error: Error) => showToast.error(error.message),
  });

  const columns: ColumnDef<FaqItem>[] = [
    { accessorKey: "id", header: "#", size: 55, enableSorting: false },
    {
      accessorKey: "question",
      header: "Question & Answer",
      cell: ({ row }) => (
        <div className="max-w-md">
          <div className="font-semibold text-foreground">{row.original.question}</div>
          <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{row.original.answer}</div>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ getValue }) => (
        <span className="inline-flex items-center rounded-md bg-secondary px-2.5 py-1 text-xs font-medium">
          {getValue<string>() || "General"}
        </span>
      ),
    },
    {
      accessorKey: "displayOrder",
      header: "Order",
      cell: ({ getValue }) => <span className="font-mono text-xs">{getValue<number>()}</span>,
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
            title="Edit FAQ"
            onClick={() => navigate(`/faqs/edit/${row.original.id}`)}
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
            title="Delete FAQ"
            onClick={() => {
              if (confirm("Are you sure you want to delete this FAQ?")) {
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
      {query.isError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="font-semibold">Could not load FAQs</p>
          <Button className="mt-4" variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["faqs"] })}>
            Try again
          </Button>
        </div>
      ) : (
        <DataTable
          data={query.data?.items ?? []}
          columns={columns}
          isLoading={query.isLoading || toggleMutation.isPending || deleteMutation.isPending}
          title="Frequently Asked Questions (FAQs)"
          description="Manage FAQs uploaded to the CrackGov portal."
          enableSearch
          searchPlaceholder="Search question, answer, category..."
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
          onRowClick={(row) => navigate(`/faqs/edit/${row.id}`)}
          emptyMessage="No FAQs found. Add your first FAQ."
          toolbarActions={
            <Button onClick={() => navigate("/faqs/create")}>
              <Plus size={15} className="mr-1.5" />
              Add FAQ
            </Button>
          }
        />
      )}
      <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
        <HelpCircle size={14} className="mt-0.5 shrink-0" />
        Active FAQs are displayed publicly on the CrackGov client homepage.
      </div>
    </div>
  );
}
