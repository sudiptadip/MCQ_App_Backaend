import React from "react";
import type { Table } from "@tanstack/react-table";
import { Download, Search, SlidersHorizontal, X } from "lucide-react";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  enableSearch?: boolean;
  searchPlaceholder?: string;
  enableExcelExport?: boolean;
  enableColumnVisibility?: boolean;
  onExportExcel?: () => void;
  toolbarActions?: React.ReactNode;
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
}

export function DataTableToolbar<TData>({
  table,
  enableSearch = true,
  searchPlaceholder = "Search...",
  enableExcelExport = false,
  enableColumnVisibility = false,
  onExportExcel,
  toolbarActions,
  globalFilter,
  setGlobalFilter,
}: DataTableToolbarProps<TData>) {
  const [showColumnMenu, setShowColumnMenu] = React.useState(false);
  const columnMenuRef = React.useRef<HTMLDivElement>(null);

  // Close column menu when clicking outside
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target as Node)) {
        setShowColumnMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasToolbarItems = enableSearch || enableExcelExport || enableColumnVisibility || toolbarActions;
  if (!hasToolbarItems) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
      {/* Search */}
      {enableSearch && (
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            size={15}
          />
          <input
            id="datatable-search"
            type="text"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-8 py-2 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
          />
          {globalFilter && (
            <button
              onClick={() => setGlobalFilter("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* Right-side actions */}
      <div className="flex items-center gap-2 ml-auto">
        {toolbarActions}

        {/* Column Visibility Toggle */}
        {enableColumnVisibility && (
          <div className="relative" ref={columnMenuRef}>
            <button
              id="datatable-column-visibility"
              onClick={() => setShowColumnMenu((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <SlidersHorizontal size={14} />
              Columns
            </button>

            {showColumnMenu && (
              <div className="absolute right-0 top-full mt-2 z-50 w-48 rounded-md border border-border bg-popover shadow-lg p-2 animate-in fade-in-0 zoom-in-95">
                <p className="text-xs font-semibold text-muted-foreground px-2 py-1 mb-1">Toggle Columns</p>
                {table
                  .getAllColumns()
                  .filter((col) => col.getCanHide())
                  .map((column) => (
                    <label
                      key={column.id}
                      className="flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={column.getIsVisible()}
                        onChange={(e) => column.toggleVisibility(e.target.checked)}
                        className="accent-primary"
                      />
                      <span className="capitalize">{column.id}</span>
                    </label>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Excel Export */}
        {enableExcelExport && (
          <button
            id="datatable-export-excel"
            onClick={onExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Download size={14} />
            Export Excel
          </button>
        )}
      </div>
    </div>
  );
}
