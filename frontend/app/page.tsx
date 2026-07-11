"use client";

import { AlertCircle, ArrowRight, RotateCcw, Sparkles, UploadCloud } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Stepper } from "@/components/ui/Stepper";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import Sidebar from "@/components/features/sidebar/Sidebar";
import { Dropzone } from "@/components/features/upload/Dropzone";
import { PreviewTable } from "@/components/features/preview/PreviewTable";
import { ProcessingView } from "@/components/features/processing/ProcessingView";
import { ResultsTable } from "@/components/features/results/ResultsTable";
import { useCsvImport } from "@/hooks/useCsvImport";

export default function Home() {
  const {
    step,
    file,
    uploadError,
    isUploading,
    localPreview,
    progress,
    result,
    processError,
    handleFileSelected,
    handleRemoveFile,
    handleConfirmImport,
    reset,
  } = useCsvImport();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-none">GrowEasy</p>
                <p className="text-xs text-muted-foreground">AI CSV Lead Importer</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="mb-10">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Import Leads via CSV</h1>
            <p className="mt-1.5 text-muted-foreground">
              Upload any CSV — Facebook Lead Ads, Google Ads, real estate CRMs, or a spreadsheet you made yourself.
              Our AI figures out the columns for you.
            </p>
          </div>

          <div className="mb-10">
            <Stepper current={step} />
          </div>

          {step === "upload" && (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UploadCloud className="h-5 w-5 text-primary" /> Step 1 — Upload CSV
                </CardTitle>
                <CardDescription>Drag and drop a file, or click to browse. We never assume fixed column names.</CardDescription>
              </CardHeader>
              <CardContent>
                <Dropzone
                  selectedFile={file}
                  onFileAccepted={handleFileSelected}
                  onRemove={handleRemoveFile}
                  error={uploadError}
                />
              </CardContent>
            </Card>
          )}

          {step === "preview" && localPreview && (
            <div className="animate-fade-in space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Step 2 — Preview</CardTitle>
                  <CardDescription>
                    This is a local preview only — nothing has been sent to the AI yet. Confirm below to start the import.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PreviewTable
                    headers={localPreview.headers}
                    rows={localPreview.rows.slice(0, 50)}
                    totalRowCount={localPreview.rowCount}
                  />
                </CardContent>
              </Card>

              {uploadError && (
                <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {uploadError}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={handleRemoveFile} disabled={isUploading}>
                  Choose a different file
                </Button>
                <Button onClick={handleConfirmImport} loading={isUploading}>
                  {isUploading ? "Uploading…" : "Confirm Import"} <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === "processing" && (
            <div className="animate-fade-in space-y-6">
              <ProcessingView progress={progress} />
              {processError && (
                <Card>
                  <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                    <div>
                      <p className="font-semibold text-destructive">Processing failed</p>
                      <p className="mt-1 text-sm text-muted-foreground">{processError}</p>
                    </div>
                    <Button variant="outline" onClick={reset}>
                      <RotateCcw className="h-4 w-4" /> Start over
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {step === "results" && result && progress && (
            <div className="animate-fade-in space-y-6">
              <ResultsTable jobId={progress.jobId} result={result} />
              <div className="flex justify-center">
                <Button variant="outline" onClick={reset}>
                  <RotateCcw className="h-4 w-4" /> Import another CSV
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
