import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Pencil, Plus, Radio, Archive } from "lucide-react";
import { DataTable, type ColumnDef } from "../../components/ui/DataTable";
import { Button } from "../../components/ui/button";
import { getDailyCurrentAffairs, setDailyCurrentAffairStatus } from "../../features/current-affairs/api";
import type { DailyCurrentAffair } from "../../features/current-affairs/types";
import { showToast } from "../../utils/toast";

export default function DailyCurrentAffairsListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [search, setSearch] = React.useState("");
  const query = useQuery({ queryKey: ["dailyCurrentAffairs", pageIndex, pageSize, search], queryFn: () => getDailyCurrentAffairs({ page: pageIndex + 1, pageSize, search }) });
  const statusMutation = useMutation({ mutationFn: ({ id, status }: { id: number; status: DailyCurrentAffair["status"] }) => setDailyCurrentAffairStatus(id, status), onSuccess: () => { showToast.success("Current affairs status updated"); queryClient.invalidateQueries({ queryKey: ["dailyCurrentAffairs"] }); }, onError: (error: Error) => showToast.error(error.message) });
  const columns: ColumnDef<DailyCurrentAffair>[] = [
    { accessorKey: "id", header: "#", size: 55, enableSorting: false },
    { accessorKey: "title", header: "Current affair", cell: ({ row }) => <div><div className="font-semibold">{row.original.title}</div><div className="text-xs text-muted-foreground">{row.original.slug}</div></div> },
    { accessorKey: "affairDate", header: "Affair date", cell: ({ getValue }) => { const date = getValue<string>(); return <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} />{new Date(`${date.slice(0, 10)}T00:00:00`).toLocaleDateString()}</span>; } },
    { accessorKey: "category", header: "Category", cell: ({ getValue }) => getValue<string | null>() || "—" },
    { accessorKey: "examRelevance", header: "Exam relevance", cell: ({ getValue }) => { const value = getValue<string>(); return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${value === "High" ? "bg-rose-500/10 text-rose-700 dark:text-rose-300" : value === "Medium" ? "bg-amber-500/10 text-amber-700 dark:text-amber-300" : "bg-muted text-muted-foreground"}`}>{value}</span>; } },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.original.status === "Published" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : row.original.status === "Archived" ? "bg-muted text-muted-foreground" : "bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>{row.original.status}</span> },
    { id: "actions", header: "Actions", enableSorting: false, cell: ({ row }) => <div className="flex gap-1" onClick={(event) => event.stopPropagation()}><Button variant="ghost" size="icon" title="Edit current affair" onClick={() => navigate(`/current-affairs/edit/${row.original.id}`)}><Pencil size={15} /></Button>{row.original.status !== "Published" ? <Button variant="ghost" size="icon" title="Publish" onClick={() => statusMutation.mutate({ id: row.original.id, status: "Published" })}><Radio size={15} /></Button> : <Button variant="ghost" size="icon" title="Archive" onClick={() => statusMutation.mutate({ id: row.original.id, status: "Archived" })}><Archive size={15} /></Button>}</div> },
  ];
  return <div className="p-6 animate-in fade-in duration-300">
    {query.isError ? <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center"><p className="font-semibold">Could not load current affairs</p><Button className="mt-4" variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["dailyCurrentAffairs"] })}>Try again</Button></div> : <DataTable data={query.data?.items ?? []} columns={columns} isLoading={query.isLoading || statusMutation.isPending} title="Daily Current Affairs" description="Create dated current affairs updates for candidates and exam revision." enableSearch searchPlaceholder="Search title, category..." onSearchChange={(value) => { setPageIndex(0); setSearch(value); }} enablePagination manualPagination totalRows={query.data?.totalCount ?? 0} paginationState={{ pageIndex, pageSize }} onPaginationChange={(nextPage,nextSize) => { setPageIndex(nextSize !== pageSize ? 0 : nextPage); setPageSize(nextSize); }} onRowClick={(row) => navigate(`/current-affairs/edit/${row.id}`)} emptyMessage="No current affairs entries yet. Add today's first update." toolbarActions={<Button onClick={() => navigate("/current-affairs/create")}><Plus size={15} className="mr-1.5" />Add Current Affair</Button>} />}
  </div>;
}
