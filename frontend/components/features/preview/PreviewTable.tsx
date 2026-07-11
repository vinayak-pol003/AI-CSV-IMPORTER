"use client";

import { useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface PreviewTableProps {
  headers: string[];
  rows: Record<string, string>[];
  totalRowCount: number;
}

/**
 * Client-side preview table. Uses TanStack Table for filtering/pagination and
 * plain CSS (sticky thead, overflow-auto container) for scroll behavior —
 * sufficient for the preview payload (first ~50 rows) the backend returns.
 */
export function PreviewTable({ headers, rows, totalRowCount }: PreviewTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo<ColumnDef<Record<string, string>>[]>(
    () =>
      headers.map((header) => ({
        id: header,
        accessorKey: header,
        header: () => header,
        cell: (info) => {
          const value = info.getValue() as string;
          return <span className="whitespace-nowrap">{value || <span className="text-muted-foreground">—</span>}</span>;
        },
      })),
    [headers]
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search preview rows..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Showing {rows.length.toLocaleString()} preview row{rows.length === 1 ? "" : "s"} of{" "}
          <span className="font-medium text-foreground">{totalRowCount.toLocaleString()}</span> total
        </p>
      </div>

      <div className="scrollbar-thin max-h-[440px] overflow-auto rounded-xl border border-border">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="min-w-[140px] whitespace-nowrap border-b border-border px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, i) => (
              <tr
                key={row.id}
                className={cn(
                  "border-b border-border/60 transition-colors last:border-0 hover:bg-muted/50",
                  i % 2 === 0 ? "bg-transparent" : "bg-muted/20"
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-2.5">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={headers.length} className="px-4 py-10 text-center text-muted-foreground">
                  No rows match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {Math.max(1, table.getPageCount())}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
