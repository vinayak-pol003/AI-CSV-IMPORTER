"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FileSpreadsheet,
  Trash2,
  RefreshCw,
  Database,
  ChevronLeft,
  ChevronRight,
  Download,
  BookOpen,
  Sparkles,
  ChevronDown,
  UploadCloud,
  Eye,
  Cpu,
  FileDown,
  Zap,
  Brain,
  FileSpreadsheetIcon,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getScans, deleteScan, getScanDownloadUrl } from "@/services/api";
import { ScanResultSummary } from "@/types";

interface SidebarProps {
  onRefresh?: () => void;
}

const HOW_TO_USE_STEPS = [
  { icon: UploadCloud, title: "Upload", desc: "Drag & drop or browse your CSV file" },
  { icon: Eye, title: "Preview", desc: "Review parsed data before sending" },
  { icon: Cpu, title: "Process", desc: "AI maps columns, enriches & cleans data" },
  { icon: FileDown, title: "Download", desc: "Export enriched leads as JSON or CSV" },
];

const WHY_GROWEASY = [
  { icon: Brain, title: "AI-Powered Mapping", desc: "No fixed columns — AI understands any CSV layout automatically" },
  { icon: Zap, title: "Batch Processing", desc: "Handles large files in configurable batches for reliability" },
  { icon: FileSpreadsheetIcon, title: "Universal CSV Support", desc: "Works with Facebook, Google Ads, real estate CRMs, and more" },
  { icon: Shield, title: "Data Quality", desc: "Validates, deduplicates, and flags bad leads" },
];

export default function Sidebar({ onRefresh }: SidebarProps) {
  const [scans, setScans] = useState<ScanResultSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);

  const fetchScans = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getScans();
      setScans(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScans();
  }, [fetchScans]);

  const handleDelete = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteScan(jobId);
      setScans((prev) => prev.filter((s) => s.jobId !== jobId));
    } catch {
      // silently fail
    }
  };

  const handleDownload = (jobId: string) => {
    const url = getScanDownloadUrl(jobId);
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (collapsed) {
    return (
      <aside className="hidden md:flex flex-col items-center w-14 border-r border-border bg-card py-4 shrink-0">
        <button
          onClick={() => setCollapsed(false)}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          title="Expand sidebar"
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
        <Database className="h-5 w-5 text-primary mt-4 mb-1" />
        <span className="text-[10px] font-medium text-muted-foreground mb-2">
          {scans.length}
        </span>
        <div className="mt-auto flex flex-col items-center gap-3">
          <button
            onClick={() => { setCollapsed(false); setGuideOpen(true); }}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            title="How to Use"
          >
            <BookOpen className="h-5 w-5 text-primary" />
          </button>
          <button
            onClick={() => { setCollapsed(false); setWhyOpen(true); }}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            title="Why GrowEasy"
          >
            <Sparkles className="h-5 w-5 text-primary" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="hidden md:flex flex-col w-72 border-r border-border bg-card shrink-0 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Scanned Results</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={fetchScans}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            title="Refresh"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 text-muted-foreground", loading && "animate-spin")} />
          </button>
          <button
            onClick={() => setCollapsed(true)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            title="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading && scans.length === 0 ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))}
          </div>
        ) : scans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <FileSpreadsheet className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No scanned results yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Import a CSV to see results here
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {scans.map((scan) => (
              <div
                key={scan.jobId}
                role="button"
                tabIndex={0}
                onClick={() => handleDownload(scan.jobId)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleDownload(scan.jobId); }}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-xl transition-all group cursor-pointer border border-transparent",
                  "hover:bg-muted"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Download className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <p className="text-sm font-medium truncate">{scan.fileName}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 ml-5">
                      {scan.stats.importedCount} imported / {scan.stats.skippedCount} skipped
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(scan.jobId, e)}
                    className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all"
                    title="Delete result"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground/60 mt-1 ml-5">
                  {new Date(scan.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border">
        <button
          onClick={() => setGuideOpen(!guideOpen)}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold hover:bg-muted transition-colors"
        >
          <BookOpen className="h-4 w-4 text-primary" />
          <span>How to Use</span>
          <ChevronDown className={cn("ml-auto h-3.5 w-3.5 text-muted-foreground transition-transform", guideOpen && "rotate-180")} />
        </button>
        {guideOpen && (
          <div className="px-4 pb-3 space-y-2.5">
            {HOW_TO_USE_STEPS.map((s, i) => (
              <div key={s.title} className="flex gap-2.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                  {i + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium leading-tight">{s.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border">
        <button
          onClick={() => setWhyOpen(!whyOpen)}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold hover:bg-muted transition-colors"
        >
          <Sparkles className="h-4 w-4 text-primary" />
          <span>Why GrowEasy</span>
          <ChevronDown className={cn("ml-auto h-3.5 w-3.5 text-muted-foreground transition-transform", whyOpen && "rotate-180")} />
        </button>
        {whyOpen && (
          <div className="px-4 pb-3 space-y-2.5">
            {WHY_GROWEASY.map((s) => (
              <div key={s.title} className="flex gap-2.5">
                <s.icon className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                <div className="min-w-0">
                  <p className="text-xs font-medium leading-tight">{s.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
