"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppStep, ImportResult, JobProgress, UploadResponseData } from "@/types";
import { ApiError, getJobResult, getJobStatus, startProcessing, uploadCsvFile } from "@/services/api";
import { parseCsvClientSide } from "@/lib/csvClientParser";

const POLL_INTERVAL_MS = 1200;

export function useCsvImport() {
  const [step, setStep] = useState<AppStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [localPreview, setLocalPreview] = useState<{ headers: string[]; rows: Record<string, string>[]; rowCount: number } | null>(null);
  const [uploadData, setUploadData] = useState<UploadResponseData | null>(null);

  const [progress, setProgress] = useState<JobProgress | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [processError, setProcessError] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => clearPoll, [clearPoll]);

  /** Step 1 -> 2: file dropped, parse locally (no AI), no backend call yet. */
  const handleFileSelected = useCallback(async (selected: File) => {
    setUploadError(null);
    setFile(selected);
    try {
      const parsed = await parseCsvClientSide(selected);
      if (parsed.rowCount === 0) {
        setUploadError("This CSV has no data rows.");
        setFile(null);
        return;
      }
      setLocalPreview(parsed);
      setStep("preview");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to read the CSV file.");
      setFile(null);
    }
  }, []);

  const handleRemoveFile = useCallback(() => {
    setFile(null);
    setLocalPreview(null);
    setUploadError(null);
    setStep("upload");
  }, []);

  /** Step 3: user confirms import -> upload to backend for authoritative parse + job creation. */
  const handleConfirmImport = useCallback(async () => {
    if (!file) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const data = await uploadCsvFile(file);
      setUploadData(data);

      setStep("processing");
      setProcessError(null);
      setProgress({
        jobId: data.jobId,
        status: "uploaded",
        totalRows: data.rowCount,
        processedRows: 0,
        totalBatches: 0,
        currentBatch: 0,
        importedCount: 0,
        skippedCount: 0,
        updatedAt: new Date().toISOString(),
      });

      await startProcessing(data.jobId);

      pollRef.current = setInterval(async () => {
        try {
          const status = await getJobStatus(data.jobId);
          setProgress(status);

          if (status.status === "completed") {
            clearPoll();
            const finalResult = await getJobResult(data.jobId);
            setResult(finalResult);
            setStep("results");
          } else if (status.status === "failed") {
            clearPoll();
            setProcessError(status.error || "Processing failed.");
          }
        } catch (err) {
          clearPoll();
          setProcessError(err instanceof ApiError ? err.message : "Lost connection while checking progress.");
        }
      }, POLL_INTERVAL_MS);
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : "Failed to upload the file. Is the backend running?");
      setStep("preview");
    } finally {
      setIsUploading(false);
    }
  }, [file, clearPoll]);

  const reset = useCallback(() => {
    clearPoll();
    setStep("upload");
    setFile(null);
    setUploadError(null);
    setLocalPreview(null);
    setUploadData(null);
    setProgress(null);
    setResult(null);
    setProcessError(null);
  }, [clearPoll]);

  return {
    step,
    file,
    uploadError,
    isUploading,
    localPreview,
    uploadData,
    progress,
    result,
    processError,
    handleFileSelected,
    handleRemoveFile,
    handleConfirmImport,
    reset,
  };
}
