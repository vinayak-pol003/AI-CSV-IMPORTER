"use client";

import { useCallback, useState } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { FileSpreadsheet, UploadCloud, X, AlertCircle } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface DropzoneProps {
  onFileAccepted: (file: File) => void;
  selectedFile: File | null;
  onRemove: () => void;
  error?: string | null;
}

export function Dropzone({ onFileAccepted, selectedFile, onRemove, error }: DropzoneProps) {
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[], rejections: FileRejection[]) => {
      setRejectionError(null);
      if (rejections.length > 0) {
        const first = rejections[0];
        const message =
          first.errors[0]?.code === "file-too-large"
            ? "File is too large. Maximum size is 10MB."
            : first.errors[0]?.code === "file-invalid-type"
            ? "Only .csv files are accepted."
            : first.errors[0]?.message || "File was rejected.";
        setRejectionError(message);
        return;
      }
      if (accepted.length > 0) {
        onFileAccepted(accepted[0]);
      }
    },
    [onFileAccepted]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: Boolean(selectedFile),
  });

  if (selectedFile) {
    return (
      <div className="animate-slide-up rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">{formatBytes(selectedFile.size)}</p>
            </div>
          </div>
          <button
            onClick={onRemove}
            aria-label="Remove file"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  const displayError = error || rejectionError;

  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          "group cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200",
          isDragActive
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border bg-card hover:border-primary/50 hover:bg-muted/40",
          displayError && "border-destructive/50"
        )}
      >
        <input {...getInputProps()} />
        <div
          className={cn(
            "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-200",
            isDragActive && "scale-110"
          )}
        >
          <UploadCloud className="h-7 w-7" />
        </div>
        <p className="text-base font-semibold">
          {isDragActive ? "Drop your CSV file here" : "Drag & drop your CSV file here"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">or click to browse files from your device</p>
        <p className="mt-4 text-xs text-muted-foreground">Supported file: .csv &middot; max 10MB</p>
        <Button type="button" variant="outline" size="sm" className="mt-5">
          Browse files
        </Button>
      </div>
      {displayError && (
        <div className="mt-3 flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {displayError}
        </div>
      )}
    </div>
  );
}
