"use client";

import { Loader2, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/Progress";
import { Card, CardContent } from "@/components/ui/Card";
import { JobProgress } from "@/types";
import { formatDuration } from "@/lib/utils";

interface ProcessingViewProps {
  progress: JobProgress | null;
}

export function ProcessingView({ progress }: ProcessingViewProps) {
  const percent = progress && progress.totalBatches > 0 ? (progress.currentBatch / progress.totalBatches) * 100 : 0;

  return (
    <Card className="animate-fade-in">
      <CardContent className="flex flex-col items-center gap-6 p-10 text-center">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="h-8 w-8 animate-pulse" />
          <Loader2 className="absolute h-20 w-20 animate-spin text-primary/20" />
        </div>

        <div>
          <h3 className="text-lg font-semibold">AI is mapping your leads…</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Gemini is reading each row and matching columns to the GrowEasy CRM schema.
          </p>
        </div>

        <div className="w-full max-w-md space-y-2">
          <Progress value={percent} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{Math.round(percent)}% complete</span>
            {progress && progress.estimatedRemainingMs !== undefined && progress.estimatedRemainingMs > 0 && (
              <span>~{formatDuration(progress.estimatedRemainingMs)} remaining</span>
            )}
          </div>
        </div>

        {progress && (
          <div className="grid w-full max-w-md grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl border border-border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Batch</p>
              <p className="font-semibold">
                {progress.currentBatch} / {progress.totalBatches}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Rows processed</p>
              <p className="font-semibold">
                {progress.processedRows} / {progress.totalRows}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Imported so far</p>
              <p className="font-semibold text-success">{progress.importedCount}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
