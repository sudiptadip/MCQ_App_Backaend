import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Pencil,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Eye,
  Building2,
  Globe,
  Sparkles,
  Code2
} from "lucide-react";
import { DataTable, type ColumnDef } from "../../components/ui/DataTable";
import { Button } from "../../components/ui/button";
import {
  deleteEmailTemplate,
  getEmailTemplates,
  toggleEmailTemplateStatus,
  renderEmailTemplate
} from "../../features/email-templates/api";
import type { EmailTemplateItem } from "../../features/email-templates/types";
import { showToast } from "../../utils/toast";
import { storage } from "../../utils/storage";
import { ROLES, STORAGE_KEYS } from "../../constants";
import type { User } from "../../features/auth/types";
import { getFranchiseDropDownList, type FranchiseDropDownItem } from "../../features/test/api/test.api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";

export default function EmailTemplateListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = storage.get<User>(STORAGE_KEYS.USER);
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<number | undefined>(undefined);

  // Preview Modal state
  const [previewItem, setPreviewItem] = useState<EmailTemplateItem | null>(null);
  const [testValues, setTestValues] = useState<Record<string, string>>({});
  const [renderedResult, setRenderedResult] = useState<{ subject: string; bodyHtml: string } | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  // Fetch Franchises for Super Admin Filter Dropdown
  const { data: franchises = [] } = useQuery({
    queryKey: ["franchiseDropDownList"],
    queryFn: getFranchiseDropDownList,
    enabled: isSuperAdmin,
  });

  // Fetch Email Templates
  const query = useQuery({
    queryKey: ["emailTemplates", pageIndex, pageSize, search, selectedFranchiseId],
    queryFn: () =>
      getEmailTemplates({
        page: pageIndex + 1,
        pageSize,
        search,
        franchiseId: selectedFranchiseId,
      }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      toggleEmailTemplateStatus(id, isActive),
    onSuccess: () => {
      showToast.success("Email template status updated");
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
    },
    onError: (error: Error) => showToast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteEmailTemplate(id),
    onSuccess: () => {
      showToast.success("Email template deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
    },
    onError: (error: Error) => showToast.error(error.message),
  });

  // Open Preview Modal and parse dynamic variables into test values
  const handleOpenPreview = (template: EmailTemplateItem) => {
    setPreviewItem(template);
    setRenderedResult(null);

    // Extract dynamic variables from comma-separated string or template placeholders
    const vars: string[] = [];
    if (template.dynamicVariables) {
      template.dynamicVariables.split(",").forEach((v) => {
        const trimmed = v.trim();
        if (trimmed && !vars.includes(trimmed)) vars.push(trimmed);
      });
    }

    // Extract any regex {{...}} placeholders in subject or body
    const matches = (template.subject + template.bodyHtml).match(/\{\{[a-zA-Z0-9_]+\}\}/g);
    if (matches) {
      matches.forEach((m) => {
        if (!vars.includes(m)) vars.push(m);
      });
    }

    // Default sample values for common placeholders
    const defaultTest: Record<string, string> = {};
    vars.forEach((v) => {
      if (v === "{{otp}}") defaultTest[v] = "849201";
      else if (v === "{{student_name}}") defaultTest[v] = "Rahul Sharma";
      else if (v === "{{franchise_name}}") defaultTest[v] = template.franchiseName || "CrackGov Academy";
      else if (v === "{{amount_paid}}") defaultTest[v] = "1,500";
      else if (v === "{{invoice_no}}") defaultTest[v] = "INV-2026-0042";
      else if (v === "{{payment_date}}") defaultTest[v] = "06 Oct 2026";
      else defaultTest[v] = `Sample ${v.replace(/[\{\}]/g, "")}`;
    });

    setTestValues(defaultTest);
  };

  // Perform SQL Server dynamic render test
  const handleTestRender = async () => {
    if (!previewItem) return;
    setIsRendering(true);
    try {
      const res = await renderEmailTemplate({
        templateKey: previewItem.templateKey,
        franchiseId: previewItem.franchiseId || undefined,
        replaceValues: testValues,
      });
      setRenderedResult({
        subject: res.renderedSubject,
        bodyHtml: res.renderedBodyHtml,
      });
      showToast.success("Template rendered via SQL dynamic engine!");
    } catch (err: any) {
      showToast.error(err.message || "Failed to render template");
    } finally {
      setIsRendering(false);
    }
  };

  const columns: ColumnDef<EmailTemplateItem>[] = [
    { accessorKey: "id", header: "#", size: 55, enableSorting: false },
    {
      accessorKey: "name",
      header: "Template Details",
      cell: ({ row }) => (
        <div className="max-w-md">
          <div className="font-semibold text-foreground flex items-center gap-2">
            {row.original.name}
          </div>
          <div className="text-xs font-mono text-primary/80 mt-0.5 flex items-center gap-1">
            <Code2 size={12} />
            {row.original.templateKey}
          </div>
          <div className="text-xs text-muted-foreground line-clamp-1 mt-1 italic">
            Subject: "{row.original.subject}"
          </div>
        </div>
      ),
    },
    {
      accessorKey: "franchiseId",
      header: "Scope / Franchise",
      cell: ({ row }) => {
        const isGlobal = !row.original.franchiseId;
        return (
          <div className="flex items-center gap-1.5">
            {isGlobal ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                <Globe size={13} />
                Global Default
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2.5 py-1 text-xs font-medium text-purple-700 dark:text-purple-300">
                <Building2 size={13} />
                {row.original.franchiseName || `Franchise #${row.original.franchiseId}`}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "dynamicVariables",
      header: "Dynamic Placeholders",
      cell: ({ row }) => {
        const vars = row.original.dynamicVariables?.split(",").map((v) => v.trim()).filter(Boolean) || [];
        return (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {vars.length > 0 ? (
              vars.slice(0, 4).map((v, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded bg-secondary px-1.5 py-0.5 text-[10px] font-mono text-secondary-foreground"
                >
                  {v}
                </span>
              ))
            ) : (
              <span className="text-xs text-muted-foreground italic">None</span>
            )}
            {vars.length > 4 && (
              <span className="text-[10px] text-muted-foreground font-mono">+ {vars.length - 4} more</span>
            )}
          </div>
        );
      },
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
            title="Preview / Test Render SQL Template"
            onClick={() => handleOpenPreview(row.original)}
          >
            <Eye size={15} className="text-primary" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Edit Email Template"
            onClick={() => navigate(`/email-templates/edit/${row.original.id}`)}
          >
            <Pencil size={15} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title={row.original.isActive ? "Deactivate" : "Activate"}
            onClick={() =>
              toggleMutation.mutate({ id: row.original.id, isActive: !row.original.isActive })
            }
          >
            {row.original.isActive ? (
              <ToggleRight size={18} className="text-emerald-600" />
            ) : (
              <ToggleLeft size={18} className="text-muted-foreground" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Delete Email Template"
            onClick={() => {
              if (confirm("Are you sure you want to delete this email template?")) {
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
      {/* Filters bar for Super Admin */}
      {isSuperAdmin && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 bg-card p-3.5 rounded-xl border">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-muted-foreground" />
            <span className="text-sm font-medium">Filter by Franchise Scope:</span>
          </div>
          <select
            className="h-9 px-3 py-1 rounded-md border text-sm bg-background"
            value={selectedFranchiseId ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedFranchiseId(val ? Number(val) : undefined);
              setPageIndex(0);
            }}
          >
            <option value="">All Templates (Global & Franchises)</option>
            <option value="0">Global Default Templates Only</option>
            {franchises.map((f: FranchiseDropDownItem) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {query.isError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="font-semibold text-destructive">Could not load email templates</p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["emailTemplates"] })}
          >
            Try again
          </Button>
        </div>
      ) : (
        <DataTable
          data={query.data?.items ?? []}
          columns={columns}
          isLoading={query.isLoading || toggleMutation.isPending || deleteMutation.isPending}
          title="Email Templates Management"
          description="Create & customize email templates with dynamic SQL variables for OTPs, Invoices, and System Notifications."
          enableSearch
          searchPlaceholder="Search template key, name, or subject..."
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
          onRowClick={(row) => navigate(`/email-templates/edit/${row.id}`)}
          emptyMessage="No email templates found. Create your first template."
          toolbarActions={
            <Button onClick={() => navigate("/email-templates/create")}>
              <Plus size={15} className="mr-1.5" />
              Add Email Template
            </Button>
          }
        />
      )}

      {/* SQL Dynamic Preview & Test Modal */}
      <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail size={20} className="text-primary" />
              Template Preview & SQL Render Test
            </DialogTitle>
            <DialogDescription>
              Test how dynamic values like <code className="text-primary font-mono">{`{{otp}}`}</code> or <code className="text-primary font-mono">{`{{amount_paid}}`}</code> are processed by SQL.
            </DialogDescription>
          </DialogHeader>

          {previewItem && (
            <div className="space-y-6 pt-2">
              <div className="grid grid-cols-2 gap-4 bg-muted/40 p-3 rounded-lg text-xs">
                <div>
                  <span className="text-muted-foreground">Template Key:</span>{" "}
                  <code className="font-semibold text-foreground font-mono">{previewItem.templateKey}</code>
                </div>
                <div>
                  <span className="text-muted-foreground">Franchise Scope:</span>{" "}
                  <span className="font-semibold text-foreground">
                    {previewItem.franchiseName || "Global Default"}
                  </span>
                </div>
              </div>

              {/* Dynamic inputs */}
              <div className="space-y-2 border rounded-xl p-4 bg-card">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" />
                  Configure Test Values for SQL Substitution
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {Object.keys(testValues).map((varKey) => (
                    <div key={varKey}>
                      <label className="text-xs font-mono font-medium text-foreground block mb-1">
                        {varKey}
                      </label>
                      <input
                        type="text"
                        className="w-full h-8 px-2.5 text-xs rounded border bg-background"
                        value={testValues[varKey]}
                        onChange={(e) =>
                          setTestValues((prev) => ({ ...prev, [varKey]: e.target.value }))
                        }
                      />
                    </div>
                  ))}
                </div>
                <div className="pt-2 flex justify-end">
                  <Button size="sm" onClick={handleTestRender} disabled={isRendering}>
                    {isRendering ? "Rendering via SQL..." : "Execute SQL Template Render"}
                  </Button>
                </div>
              </div>

              {/* Rendered Result Output */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Email Preview
                </h4>
                <div className="border rounded-xl p-4 bg-background space-y-3 shadow-sm">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      Subject Line:
                    </span>
                    <div className="text-sm font-semibold text-foreground mt-0.5">
                      {renderedResult ? renderedResult.subject : previewItem.subject}
                    </div>
                  </div>
                  <hr />
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                      Email Body HTML:
                    </span>
                    <div
                      className="border rounded-lg p-4 bg-white text-black min-h-[160px] overflow-x-auto text-sm"
                      dangerouslySetInnerHTML={{
                        __html: renderedResult ? renderedResult.bodyHtml : previewItem.bodyHtml,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
