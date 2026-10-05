import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { MessageSquareQuote, Pencil, Plus, Trash2, ToggleLeft, ToggleRight, Star } from "lucide-react";
import { DataTable, type ColumnDef } from "../../components/ui/DataTable";
import { Button } from "../../components/ui/button";
import { deleteTestimonial, getTestimonials, toggleTestimonialStatus } from "../../features/testimonials/api";
import type { TestimonialItem } from "../../features/testimonials/types";
import { showToast } from "../../utils/toast";

export default function TestimonialListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [search, setSearch] = React.useState("");

  const query = useQuery({
    queryKey: ["testimonials", pageIndex, pageSize, search],
    queryFn: () => getTestimonials({ page: pageIndex + 1, pageSize, search }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => toggleTestimonialStatus(id, isActive),
    onSuccess: () => {
      showToast.success("Testimonial status updated");
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
    },
    onError: (error: Error) => showToast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTestimonial(id),
    onSuccess: () => {
      showToast.success("Testimonial deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
    },
    onError: (error: Error) => showToast.error(error.message),
  });

  const columns: ColumnDef<TestimonialItem>[] = [
    { accessorKey: "id", header: "#", size: 55, enableSorting: false },
    {
      accessorKey: "studentName",
      header: "Student & Exam",
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-foreground">{row.original.studentName}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.examName || "Aspirant"} {row.original.rankOrScore ? `• ${row.original.rankOrScore}` : ""}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "content",
      header: "Testimonial Quote",
      cell: ({ getValue }) => (
        <div className="max-w-md text-xs text-muted-foreground line-clamp-2 italic">
          "{getValue<string>()}"
        </div>
      ),
    },
    {
      accessorKey: "rating",
      header: "Rating",
      cell: ({ getValue }) => (
        <div className="flex items-center text-amber-500 text-xs font-bold gap-1">
          <Star size={13} fill="currentColor" />
          <span>{getValue<number>()}/5</span>
        </div>
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
            title="Edit Testimonial"
            onClick={() => navigate(`/testimonials/edit/${row.original.id}`)}
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
            title="Delete Testimonial"
            onClick={() => {
              if (confirm("Are you sure you want to delete this testimonial?")) {
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
          <p className="font-semibold">Could not load testimonials</p>
          <Button className="mt-4" variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["testimonials"] })}>
            Try again
          </Button>
        </div>
      ) : (
        <DataTable
          data={query.data?.items ?? []}
          columns={columns}
          isLoading={query.isLoading || toggleMutation.isPending || deleteMutation.isPending}
          title="Student Testimonials & Success Stories"
          description="Manage student testimonials shown on the CrackGov portal."
          enableSearch
          searchPlaceholder="Search student name, exam, quote..."
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
          onRowClick={(row) => navigate(`/testimonials/edit/${row.id}`)}
          emptyMessage="No testimonials found. Add your first testimonial."
          toolbarActions={
            <Button onClick={() => navigate("/testimonials/create")}>
              <Plus size={15} className="mr-1.5" />
              Add Testimonial
            </Button>
          }
        />
      )}
      <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
        <MessageSquareQuote size={14} className="mt-0.5 shrink-0" />
        Active testimonials appear publicly on the CrackGov client homepage.
      </div>
    </div>
  );
}
