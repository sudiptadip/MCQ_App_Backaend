import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import type { Table } from "@tanstack/react-table";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  pageSizeOptions?: number[];
  totalRows: number;
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [5, 10, 20, 50, 100],
  totalRows,
}: DataTablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const from = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, totalRows);
  const pageCount = table.getPageCount();

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-t border-border">
      {/* Rows info + page size selector */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>
          {totalRows === 0 ? "No rows" : `${from}–${to} of ${totalRows} rows`}
        </span>

        <div className="flex items-center gap-1.5">
          <label htmlFor="datatable-page-size" className="text-xs">
            Rows per page:
          </label>
          <select
            id="datatable-page-size"
            value={pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
            className="text-sm rounded border border-input bg-background px-2 py-1 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center gap-1">
        <PaginationButton
          id="datatable-first-page"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          title="First page"
        >
          <ChevronsLeft size={15} />
        </PaginationButton>

        <PaginationButton
          id="datatable-prev-page"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          title="Previous page"
        >
          <ChevronLeft size={15} />
        </PaginationButton>

        {/* Page number chips */}
        {getPageNumbers(pageIndex, pageCount).map((page, idx) =>
          page === "..." ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground select-none">
              …
            </span>
          ) : (
            <button
              key={page}
              id={`datatable-page-${page}`}
              onClick={() => table.setPageIndex((page as number) - 1)}
              className={`min-w-[32px] h-8 rounded text-sm font-medium transition-colors ${
                pageIndex === (page as number) - 1
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground border border-input"
              }`}
            >
              {page}
            </button>
          )
        )}

        <PaginationButton
          id="datatable-next-page"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          title="Next page"
        >
          <ChevronRight size={15} />
        </PaginationButton>

        <PaginationButton
          id="datatable-last-page"
          onClick={() => table.setPageIndex(pageCount - 1)}
          disabled={!table.getCanNextPage()}
          title="Last page"
        >
          <ChevronsRight size={15} />
        </PaginationButton>
      </div>
    </div>
  );
}

// ── Helper components ────────────────────────────────────────────────────────

function PaginationButton({
  children,
  disabled,
  onClick,
  title,
  id,
}: {
  children: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
  title: string;
  id: string;
}) {
  return (
    <button
      id={id}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex items-center justify-center w-8 h-8 rounded border border-input text-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  );
}

/** Generates page numbers with ellipsis for large page counts */
function getPageNumbers(currentPage: number, pageCount: number): (number | "...")[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  const pages: (number | "...")[] = [];
  const current = currentPage + 1;

  pages.push(1);
  if (current > 4) pages.push("...");

  for (let i = Math.max(2, current - 1); i <= Math.min(pageCount - 1, current + 1); i++) {
    pages.push(i);
  }

  if (current < pageCount - 3) pages.push("...");
  pages.push(pageCount);

  return pages;
}
