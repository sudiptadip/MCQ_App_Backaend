import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { CalendarDays, FileText, Pencil, Plus, Radio, Archive } from "lucide-react";
import { DataTable, type ColumnDef } from "../../components/ui/DataTable";
import { Button } from "../../components/ui/button";
import { getBlogs, setBlogStatus } from "../../features/blogs/api";
import type { BlogPost } from "../../features/blogs/types";
import { showToast } from "../../utils/toast";

export default function BlogListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [search, setSearch] = React.useState("");
  const query = useQuery({ queryKey: ["blogs", pageIndex, pageSize, search], queryFn: () => getBlogs({ page: pageIndex + 1, pageSize, search }) });
  const statusMutation = useMutation({ mutationFn: ({ id, status }: { id: number; status: BlogPost["status"] }) => setBlogStatus(id, status), onSuccess: () => { showToast.success("Blog status updated"); queryClient.invalidateQueries({ queryKey: ["blogs"] }); }, onError: (error: Error) => showToast.error(error.message) });
  const columns: ColumnDef<BlogPost>[] = [
    { accessorKey: "id", header: "#", size: 55, enableSorting: false },
    { accessorKey: "title", header: "Article", cell: ({ row }) => <div><div className="font-semibold">{row.original.title}</div><div className="text-xs text-muted-foreground">{row.original.slug}</div></div> },
    { accessorKey: "category", header: "Category", cell: ({ getValue }) => getValue<string | null>() || "—" },
    { accessorKey: "publishedOn", header: "Published", cell: ({ getValue }) => { const date = getValue<string | null>(); return <span className="inline-flex items-center gap-1.5">{date ? <><CalendarDays size={13} />{new Date(date).toLocaleDateString()}</> : "—"}</span>; } },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.original.status === "Published" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : row.original.status === "Archived" ? "bg-muted text-muted-foreground" : "bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>{row.original.status}</span> },
    { id: "actions", header: "Actions", enableSorting: false, cell: ({ row }) => <div className="flex gap-1" onClick={(event) => event.stopPropagation()}><Button variant="ghost" size="icon" title="Edit article" onClick={() => navigate(`/blogs/edit/${row.original.id}`)}><Pencil size={15} /></Button>{row.original.status !== "Published" ? <Button variant="ghost" size="icon" title="Publish article" onClick={() => statusMutation.mutate({ id: row.original.id, status: "Published" })}><Radio size={15} /></Button> : <Button variant="ghost" size="icon" title="Archive article" onClick={() => statusMutation.mutate({ id: row.original.id, status: "Archived" })}><Archive size={15} /></Button>}</div> },
  ];
  return <div className="p-6 animate-in fade-in duration-300">
    {query.isError ? <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center"><p className="font-semibold">Could not load blog posts</p><Button className="mt-4" variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["blogs"] })}>Try again</Button></div> : <DataTable data={query.data?.items ?? []} columns={columns} isLoading={query.isLoading || statusMutation.isPending} title="Blog Posts" description="Write and publish articles for the CrackGov blog." enableSearch searchPlaceholder="Search title, category..." onSearchChange={(value) => { setPageIndex(0); setSearch(value); }} enablePagination manualPagination totalRows={query.data?.totalCount ?? 0} paginationState={{ pageIndex, pageSize }} onPaginationChange={(nextPage,nextSize) => { setPageIndex(nextSize !== pageSize ? 0 : nextPage); setPageSize(nextSize); }} onRowClick={(row) => navigate(`/blogs/edit/${row.id}`)} emptyMessage="No blog posts yet. Create your first article." toolbarActions={<Button onClick={() => navigate("/blogs/create")}><Plus size={15} className="mr-1.5" />Create Blog Post</Button>} />}
    <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground"><FileText size={14} className="mt-0.5 shrink-0" />Draft posts stay private. Published articles appear on the public blog.</div>
  </div>;
}
