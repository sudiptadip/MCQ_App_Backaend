import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { BriefcaseBusiness, CalendarDays, MapPin, Pencil, Plus, Star, XCircle } from "lucide-react";
import { DataTable, type ColumnDef } from "../../components/ui/DataTable";
import { closeJob, getJobs } from "../../features/jobs/api";
import type { JobPost } from "../../features/jobs/types";
import { showToast } from "../../utils/toast";
import { Button } from "../../components/ui/button";

export default function JobListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [search, setSearch] = React.useState("");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["jobs", pageIndex, pageSize, search],
    queryFn: () => getJobs({ page: pageIndex + 1, pageSize, search }),
  });
  const closeMutation = useMutation({
    mutationFn: closeJob,
    onSuccess: () => {
      showToast.success("Job post closed");
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (error) => showToast.error(error.message),
  });

  const columns: ColumnDef<JobPost>[] = [
    { accessorKey: "id", header: "#", size: 60, enableSorting: false },
    { accessorKey: "title", header: "Position", cell: ({ row }) => <div><div className="font-semibold">{row.original.title}</div><div className="text-xs text-muted-foreground">{row.original.department}</div></div> },
    { accessorKey: "categoryName", header: "Category" },
    { accessorKey: "location", header: "Location", cell: ({ getValue }) => <span className="inline-flex items-center gap-1"><MapPin size={13} />{getValue<string>()}</span> },
    { accessorKey: "applicationDeadline", header: "Deadline", cell: ({ getValue }) => { const value = getValue<string | null>(); return <span className="inline-flex items-center gap-1">{value ? <><CalendarDays size={13} />{new Date(`${value}T00:00:00`).toLocaleDateString()}</> : "Not specified"}</span>; } },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.original.status === "Published" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : row.original.status === "Closed" ? "bg-muted text-muted-foreground" : "bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>{row.original.status}{row.original.isFeatured && <Star size={12} className="ml-1 inline fill-current" />}</span> },
    { id: "__actions__", header: "Actions", enableSorting: false, enableHiding: false, cell: ({ row }) => <div className="flex gap-1" onClick={(event) => event.stopPropagation()}><Button variant="ghost" size="icon" title="Edit job" onClick={() => navigate(`/jobs/edit/${row.original.id}`)}><Pencil size={15} /></Button>{row.original.status !== "Closed" && <Button variant="ghost" size="icon" title="Close job" disabled={closeMutation.isPending} onClick={() => closeMutation.mutate(row.original.id)}><XCircle size={15} /></Button>}</div> },
  ];

  return <div className="p-6 animate-in fade-in duration-300">
    {isError ? <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center"><p className="font-semibold">Could not load job posts</p><Button className="mt-4" variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["jobs"] })}>Try again</Button></div> : <DataTable
      data={data?.items ?? []} columns={columns} isLoading={isLoading || closeMutation.isPending}
      title="Job Posts" description="Create and manage job opportunities shown on the CrackGov home page."
      enableSearch searchPlaceholder="Search title, department, location..." onSearchChange={(value) => { setPageIndex(0); setSearch(value); }}
      enablePagination manualPagination totalRows={data?.totalCount ?? 0}
      paginationState={{ pageIndex, pageSize }} onPaginationChange={(nextPage, nextSize) => { setPageIndex(nextSize !== pageSize ? 0 : nextPage); setPageSize(nextSize); }}
      onRowClick={(row) => navigate(`/jobs/edit/${row.id}`)}
      emptyMessage="No job posts yet. Create a post to publish your first opportunity."
      toolbarActions={<Button onClick={() => navigate("/jobs/create")}><Plus size={15} className="mr-1.5" />Create Job Post</Button>}
    />}
    <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground"><BriefcaseBusiness size={14} className="mt-0.5 shrink-0" />Published posts appear in the public job listings until their deadline passes. Drafts remain private.</div>
  </div>;
}
