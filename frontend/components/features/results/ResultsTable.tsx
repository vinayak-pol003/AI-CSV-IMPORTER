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
import { CheckCircle2, Download, FileJson, FileText, Search, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CrmRecord, ImportResult, SkippedRecord } from "@/types";
import { getResultDownloadUrl } from "@/services/api";

interface ResultsTableProps {
  jobId: string;
  result: ImportResult;
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: "default" | "success" | "destructive" }) {
  const toneClasses = {
    default: "text-foreground",
    success: "text-success",
    destructive: "text-destructive",
  } as const;
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`mt-1 text-3xl font-bold ${toneClasses[tone]}`}>{value.toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}

const IMPORTED_COLUMNS: { key: keyof CrmRecord; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "mobile_without_country_code", label: "Mobile" },
  { key: "company", label: "Company" },
  { key: "city", label: "City" },
  { key: "crm_status", label: "Status" },
  { key: "data_source", label: "Source" },
  { key: "crm_note", label: "Note" },
];

function crmStatusVariant(status: string) {
  switch (status) {
    case "GOOD_LEAD_FOLLOW_UP":
      return "success" as const;
    case "SALE_DONE":
      return "success" as const;
    case "BAD_LEAD":
      return "destructive" as const;
    case "DID_NOT_CONNECT":
      return "warning" as const;
    default:
      return "outline" as const;
  }
}

export function ResultsTable({ jobId, result }: ResultsTableProps) {
  const [tab, setTab] = useState<"imported" | "skipped">("imported");
  const [globalFilter, setGlobalFilter] = useState("");

  const importedColumns = useMemo<ColumnDef<CrmRecord>[]>(
    () =>
      IMPORTED_COLUMNS.map(({ key, label }) => ({
        id: key,
        accessorKey: key,
        header: () => label,
        cell: (info) => {
          if (key === "crm_status") {
            const value = info.getValue() as string;
            return value ? <Badge variant={crmStatusVariant(value)}>{value}</Badge> : <span className="text-muted-foreground">—</span>;
          }
          const value = info.getValue() as string;
          return <span className="whitespace-nowrap">{value || <span className="text-muted-foreground">—</span>}</span>;
        },
      })),
    []
  );

  const skippedColumns = useMemo<ColumnDef<SkippedRecord>[]>(
    () => [
      {
        id: "rowIndex",
        accessorKey: "rowIndex",
        header: () => "Row #",
        cell: (info) => <span className="font-mono text-xs">{(info.getValue() as number) + 1}</span>,
      },
      {
        id: "preview",
        header: () => "Row preview",
        cell: (info) => {
          const row = info.row.original.row;
          const preview = Object.values(row).filter(Boolean).slice(0, 3).join(", ");
          return <span className="text-muted-foreground">{preview || "(empty row)"}</span>;
        },
      },
      {
        id: "reason",
        accessorKey: "reason",
        header: () => "Skip reason",
        cell: (info) => <span className="text-destructive">{info.getValue() as string}</span>,
      },
    ],
    []
  );

  const importedTable = useReactTable({
    data: result.imported,
    columns: importedColumns,
    state: { globalFilter: tab === "imported" ? globalFilter : "" },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const skippedTable = useReactTable({
    data: result.skipped,
    columns: skippedColumns,
    state: { globalFilter: tab === "skipped" ? globalFilter : "" },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  function downloadJson() {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `crm_import_${jobId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total rows" value={result.stats.totalRows} tone="default" />
        <StatCard label="Imported" value={result.stats.importedCount} tone="success" />
        <StatCard label="Skipped" value={result.stats.skippedCount} tone="destructive" />
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex gap-1 rounded-lg bg-muted p-1">
              <button
                onClick={() => setTab("imported")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === "imported" ? "bg-card shadow-soft" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <CheckCircle2 className="h-4 w-4 text-success" /> Imported ({result.imported.length})
              </button>
              <button
                onClick={() => setTab("skipped")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === "skipped" ? "bg-card shadow-soft" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <XCircle className="h-4 w-4 text-destructive" /> Skipped ({result.skipped.length})
              </button>
            </div>

            <div className="flex w-full gap-2 sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search results..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {tab === "imported" ? (
            <>
              <div className="scrollbar-thin max-h-[480px] overflow-auto rounded-xl border border-border">
                <table className="w-full border-collapse text-sm">
                  <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur">
                    {importedTable.getHeaderGroups().map((hg) => (
                      <tr key={hg.id}>
                        {hg.headers.map((header) => (
                          <th
                            key={header.id}
                            className="min-w-[130px] whitespace-nowrap border-b border-border px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {importedTable.getRowModel().rows.map((row, i) => (
                      <tr
                        key={row.id}
                        className={`border-b border-border/60 transition-colors last:border-0 hover:bg-muted/50 ${
                          i % 2 === 0 ? "" : "bg-muted/20"
                        }`}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-4 py-2.5">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {importedTable.getRowModel().rows.length === 0 && (
                      <tr>
                        <td colSpan={importedColumns.length} className="px-4 py-10 text-center text-muted-foreground">
                          No imported records{globalFilter ? " match your search" : ""}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Page {importedTable.getState().pagination.pageIndex + 1} of {Math.max(1, importedTable.getPageCount())}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => importedTable.previousPage()} disabled={!importedTable.getCanPreviousPage()}>
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => importedTable.nextPage()} disabled={!importedTable.getCanNextPage()}>
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="scrollbar-thin max-h-[480px] overflow-auto rounded-xl border border-border">
                <table className="w-full border-collapse text-sm">
                  <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur">
                    {skippedTable.getHeaderGroups().map((hg) => (
                      <tr key={hg.id}>
                        {hg.headers.map((header) => (
                          <th
                            key={header.id}
                            className="min-w-[130px] whitespace-nowrap border-b border-border px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {skippedTable.getRowModel().rows.map((row, i) => (
                      <tr
                        key={row.id}
                        className={`border-b border-border/60 transition-colors last:border-0 hover:bg-muted/50 ${
                          i % 2 === 0 ? "" : "bg-muted/20"
                        }`}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-4 py-2.5">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {skippedTable.getRowModel().rows.length === 0 && (
                      <tr>
                        <td colSpan={skippedColumns.length} className="px-4 py-10 text-center text-muted-foreground">
                          No skipped records{globalFilter ? " match your search" : ""}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Page {skippedTable.getState().pagination.pageIndex + 1} of {Math.max(1, skippedTable.getPageCount())}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => skippedTable.previousPage()} disabled={!skippedTable.getCanPreviousPage()}>
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => skippedTable.nextPage()} disabled={!skippedTable.getCanNextPage()}>
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="outline" onClick={downloadJson}>
          <FileJson className="h-4 w-4" /> Download JSON
        </Button>
        <a href={getResultDownloadUrl(jobId, "csv")} download>
          <Button variant="outline" className="w-full">
            <FileText className="h-4 w-4" /> Download CSV
          </Button>
        </a>
        <a href={getResultDownloadUrl(jobId, "json")} target="_blank" rel="noreferrer">
          <Button variant="ghost" className="w-full">
            <Download className="h-4 w-4" /> View raw response
          </Button>
        </a>
      </div>
    </div>
  );
}
