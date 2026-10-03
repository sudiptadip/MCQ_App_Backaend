import type { ColumnDef, SortingState, ColumnFiltersState, VisibilityState } from "@tanstack/react-table";

export type { ColumnDef };

export interface DataTableProps<TData> {
  /** The data array to render in the table */
  data: TData[];
  /** Column definitions for the table */
  columns: ColumnDef<TData, unknown>[];
  /** Loading state — shows skeleton rows when true */
  isLoading?: boolean;
  /** Enable/disable column sorting (default: true) */
  enableSorting?: boolean;
  /** Enable/disable global search filter (default: true) */
  enableSearch?: boolean;
  /** Placeholder text for the search input */
  searchPlaceholder?: string;
  /** Enable/disable pagination (default: true) */
  enablePagination?: boolean;
  /** Default number of rows per page (default: 10) */
  defaultPageSize?: number;
  /** Available page size options */
  pageSizeOptions?: number[];
  /** Enable/disable Excel export button (default: false) */
  enableExcelExport?: boolean;
  /** Custom filename for the exported Excel file (without extension) */
  exportFileName?: string;
  /** Enable/disable column visibility toggle (default: false) */
  enableColumnVisibility?: boolean;
  /** Optional title displayed above the table toolbar */
  title?: string;
  /** Optional description displayed below the title */
  description?: string;
  /** Extra action buttons/elements rendered in the toolbar (right side) */
  toolbarActions?: React.ReactNode;
  /** Message to show when the table has no data */
  emptyMessage?: string;
  /** Callback fired when row is clicked */
  onRowClick?: (row: TData) => void;
  /** Additional class names for the table wrapper */
  className?: string;
  /** Initial sorting state */
  initialSorting?: SortingState;
  /** Initial column filter state */
  initialColumnFilters?: ColumnFiltersState;
  /** Initial column visibility state */
  initialColumnVisibility?: VisibilityState;
  /** Whether pagination and filtering are handled server-side */
  manualPagination?: boolean;
  /** Total row count on the server (required if manualPagination is true) */
  totalRows?: number;
  /** Current controlled pagination state: { pageIndex, pageSize } */
  paginationState?: { pageIndex: number; pageSize: number };
  /** Callback fired when page index or page size changes */
  onPaginationChange?: (pageIndex: number, pageSize: number) => void;
  /** Callback fired when search term changes */
  onSearchChange?: (searchValue: string) => void;
}

