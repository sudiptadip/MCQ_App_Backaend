import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from "@tanstack/react-table";
import { ArrowUp, ArrowDown, ArrowUpDown, Inbox } from "lucide-react";
import * as XLSX from "xlsx";

import type { DataTableProps } from "./types";
import { DataTableToolbar } from "./DataTableToolbar";
import { DataTablePagination } from "./DataTablePagination";

const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];
const SKELETON_COUNT = 6;

export function DataTable<TData>({
  data,
  columns,
  isLoading = false,
  enableSorting = true,
  enableSearch = true,
  searchPlaceholder = "Search...",
  enablePagination = true,
  defaultPageSize = 10,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  enableExcelExport = false,
  exportFileName = "export",
  enableColumnVisibility = false,
  title,
  description,
  toolbarActions,
  emptyMessage = "No results found.",
  onRowClick,
  className = "",
  initialSorting = [],
  initialColumnFilters = [],
  initialColumnVisibility = {},
  manualPagination = false,
  totalRows,
  paginationState,
  onPaginationChange,
  onSearchChange,
}: DataTableProps<TData>) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(initialColumnFilters);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(initialColumnVisibility);
  const [globalFilter, setGlobalFilter] = React.useState("");

  // Notify parent on search keyword change
  React.useEffect(() => {
    if (onSearchChange) {
      onSearchChange(globalFilter);
    }
  }, [globalFilter, onSearchChange]);

  const computedPageCount = manualPagination && totalRows !== undefined
    ? Math.ceil(totalRows / (paginationState?.pageSize ?? defaultPageSize))
    : undefined;

  // ── Table instance ─────────────────────────────────────────────────────────
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      ...(manualPagination && paginationState ? { pagination: paginationState } : {}),
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    ...(manualPagination ? {
      onPaginationChange: (updater) => {
        if (onPaginationChange) {
          const nextState = typeof updater === "function"
            ? updater(paginationState ?? { pageIndex: 0, pageSize: defaultPageSize })
            : updater;
          onPaginationChange(nextState.pageIndex, nextState.pageSize);
        }
      },
      manualPagination: true,
      manualFiltering: true,
      pageCount: computedPageCount,
    } : {}),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: (enableSearch || columnFilters.length > 0) && !manualPagination ? getFilteredRowModel() : undefined,
    getPaginationRowModel: enablePagination && !manualPagination ? getPaginationRowModel() : undefined,
    initialState: {
      pagination: { pageSize: defaultPageSize },
    },
  });

  const rows = table.getRowModel().rows;
  const totalFilteredRows = table.getFilteredRowModel().rows.length;


  // ── Excel export ───────────────────────────────────────────────────────────
  function handleExportExcel() {
    const visibleRows = table.getFilteredRowModel().rows;
    const visibleColumns = table.getVisibleLeafColumns().filter((c) => c.id !== "__actions__");

    const headers = visibleColumns.map((col) => {
      const header = col.columnDef.header;
      return typeof header === "string" ? header : col.id;
    });

    const rowData = visibleRows.map((row) =>
      visibleColumns.reduce<Record<string, unknown>>((acc, col) => {
        const cell = row.getAllCells().find((c) => c.column.id === col.id);
        acc[typeof col.columnDef.header === "string" ? col.columnDef.header : col.id] =
          cell ? cell.getValue() : "";
        return acc;
      }, {})
    );

    const ws = XLSX.utils.json_to_sheet(rowData, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${exportFileName}.xlsx`);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={`flex flex-col gap-0 rounded-xl border border-border bg-card shadow-sm overflow-hidden ${className}`}>
      {/* Header (title + toolbar) */}
      <div className="px-4 pt-4 pb-0">
        {(title || description) && (
          <div className="mb-3">
            {title && <h2 className="text-base font-semibold text-foreground">{title}</h2>}
            {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
          </div>
        )}

        <DataTableToolbar
          table={table}
          enableSearch={enableSearch}
          searchPlaceholder={searchPlaceholder}
          enableExcelExport={enableExcelExport}
          enableColumnVisibility={enableColumnVisibility}
          onExportExcel={handleExportExcel}
          toolbarActions={toolbarActions}
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-y border-border bg-muted/50">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();

                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none whitespace-nowrap ${
                        canSort ? "cursor-pointer hover:text-foreground transition-colors" : ""
                      }`}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                    >
                      {header.isPlaceholder ? null : (
                        <span className="inline-flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && (
                            <SortIcon sorted={sorted} />
                          )}
                        </span>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody>
            {isLoading ? (
              // Skeleton rows
              Array.from({ length: SKELETON_COUNT }).map((_, rowIdx) => (
                <tr key={`skeleton-${rowIdx}`} className="border-b border-border animate-pulse">
                  {columns.map((_, colIdx) => (
                    <td key={`skeleton-cell-${colIdx}`} className="px-4 py-3">
                      <div className="h-4 rounded bg-muted w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              // Empty state
              <tr>
                <td
                  colSpan={table.getVisibleLeafColumns().length}
                  className="py-16 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Inbox size={36} strokeWidth={1.2} className="text-muted-foreground/50" />
                    <span className="text-sm">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  className={`border-b border-border transition-colors ${
                    idx % 2 === 0 ? "bg-background" : "bg-muted/20"
                  } ${onRowClick ? "cursor-pointer hover:bg-accent/50" : "hover:bg-muted/40"}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-foreground whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {enablePagination && !isLoading && (
        <div className="px-4">
          <DataTablePagination
            table={table}
            pageSizeOptions={pageSizeOptions}
            totalRows={manualPagination && totalRows !== undefined ? totalRows : totalFilteredRows}
          />
        </div>
      )}
    </div>
  );
}

// ── Sort icon ────────────────────────────────────────────────────────────────
function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") return <ArrowUp size={12} className="text-primary" />;
  if (sorted === "desc") return <ArrowDown size={12} className="text-primary" />;
  return <ArrowUpDown size={12} className="opacity-40" />;
}
