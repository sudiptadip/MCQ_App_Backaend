import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Phone, MailOpen, Trash2, Calendar, Eye, X } from "lucide-react";
import { DataTable, type ColumnDef } from "../../components/ui/DataTable";
import { Button } from "../../components/ui/button";
import { deleteContactSubmission, getContactSubmissions, toggleContactReadStatus } from "../../features/contact/api";
import type { ContactSubmission } from "../../features/contact/types";
import { showToast } from "../../utils/toast";

export default function ContactListPage() {
  const queryClient = useQueryClient();
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [search, setSearch] = React.useState("");
  const [selectedSubmission, setSelectedSubmission] = React.useState<ContactSubmission | null>(null);

  const query = useQuery({
    queryKey: ["contact-submissions", pageIndex, pageSize, search],
    queryFn: () => getContactSubmissions({ page: pageIndex + 1, pageSize, search }),
  });

  const toggleReadMutation = useMutation({
    mutationFn: ({ id, isRead }: { id: number; isRead: boolean }) => toggleContactReadStatus(id, isRead),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-submissions"] });
    },
    onError: (error: Error) => showToast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteContactSubmission(id),
    onSuccess: () => {
      showToast.success("Inquiry deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["contact-submissions"] });
      if (selectedSubmission) setSelectedSubmission(null);
    },
    onError: (error: Error) => showToast.error(error.message),
  });

  const handleOpenDetail = (submission: ContactSubmission) => {
    setSelectedSubmission(submission);
    if (!submission.isRead) {
      toggleReadMutation.mutate({ id: submission.id, isRead: true });
    }
  };

  const columns: ColumnDef<ContactSubmission>[] = [
    { accessorKey: "id", header: "#", size: 55, enableSorting: false },
    {
      accessorKey: "name",
      header: "Name & Contact Info",
      cell: ({ row }) => {
        const info = row.original.contactInfo || "";
        const isPhone = /^[+\d\s-]{7,15}$/.test(info.trim());
        return (
          <div>
            <div className="font-semibold text-foreground">{row.original.name}</div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              {isPhone ? <Phone size={12} className="text-primary" /> : <Mail size={12} className="text-primary" />}
              <span className="font-medium">{info}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "title",
      header: "Subject / Title",
      cell: ({ row }) => (
        <div className="max-w-xs">
          <div className="font-medium text-foreground text-xs">{row.original.title}</div>
          <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{row.original.description}</div>
        </div>
      ),
    },
    {
      accessorKey: "createdOn",
      header: "Date",
      cell: ({ getValue }) => (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar size={13} />
          {new Date(getValue<string>()).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      accessorKey: "isRead",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            row.original.isRead
              ? "bg-muted text-muted-foreground"
              : "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20"
          }`}
        >
          {row.original.isRead ? "Read" : "New / Unread"}
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
            title="View Details"
            onClick={() => handleOpenDetail(row.original)}
          >
            <Eye size={15} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title={row.original.isRead ? "Mark as Unread" : "Mark as Read"}
            onClick={() => toggleReadMutation.mutate({ id: row.original.id, isRead: !row.original.isRead })}
          >
            <MailOpen size={15} className={row.original.isRead ? "text-muted-foreground" : "text-blue-600"} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Delete Inquiry"
            onClick={() => {
              if (confirm("Are you sure you want to delete this contact submission?")) {
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
          <p className="font-semibold">Could not load contact inquiries</p>
          <Button className="mt-4" variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["contact-submissions"] })}>
            Try again
          </Button>
        </div>
      ) : (
        <DataTable
          data={query.data?.items ?? []}
          columns={columns}
          isLoading={query.isLoading || deleteMutation.isPending || toggleReadMutation.isPending}
          title="Contact Us Inquiries"
          description="View messages and inquiries submitted by visitors from the CrackGov homepage."
          enableSearch
          searchPlaceholder="Search name, phone/email, title, message..."
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
          onRowClick={(row) => handleOpenDetail(row)}
          emptyMessage="No contact inquiries received yet."
        />
      )}

      {/* Modal Dialog for Message Details */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-lg rounded-2xl border p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-foreground">Inquiry Details</h3>
                <p className="text-xs text-muted-foreground">
                  Submitted on{" "}
                  {new Date(selectedSubmission.createdOn).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedSubmission(null)}>
                <X size={18} />
              </Button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Name</span>
                <div className="font-semibold text-foreground text-base">{selectedSubmission.name}</div>
              </div>

              <div>
                <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Phone / Email</span>
                <div className="font-mono text-primary font-semibold">{selectedSubmission.contactInfo}</div>
              </div>

              <div>
                <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Subject / Title</span>
                <div className="font-semibold text-foreground">{selectedSubmission.title}</div>
              </div>

              <div className="pt-2 border-t">
                <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Message Description</span>
                <div className="mt-1 p-3 rounded-lg bg-muted/50 text-foreground leading-relaxed whitespace-pre-wrap">
                  {selectedSubmission.description}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (confirm("Delete this submission?")) {
                    deleteMutation.mutate(selectedSubmission.id);
                  }
                }}
              >
                <Trash2 size={14} className="mr-1" /> Delete
              </Button>

              <Button variant="outline" size="sm" onClick={() => setSelectedSubmission(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
