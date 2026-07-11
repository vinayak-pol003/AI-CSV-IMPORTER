import { ImportResult, JobProgress, UploadResponseData, ScanResultSummary, ScanResult } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

class ApiError extends Error {
  constructor(message: string, public statusCode?: number, public details?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  let body: any;
  try {
    body = await res.json();
  } catch {
    throw new ApiError("The server returned an unexpected (non-JSON) response.", res.status);
  }

  if (!res.ok || body.success === false) {
    throw new ApiError(body?.error?.message || "Something went wrong.", res.status, body?.error?.details);
  }
  return body.data as T;
}

export async function uploadCsvFile(file: File): Promise<UploadResponseData> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });
  return handleResponse<UploadResponseData>(res);
}

export async function startProcessing(jobId: string): Promise<{ jobId: string; message: string }> {
  const res = await fetch(`${API_BASE_URL}/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId }),
  });
  return handleResponse(res);
}

export async function getJobStatus(jobId: string): Promise<JobProgress> {
  const res = await fetch(`${API_BASE_URL}/status/${jobId}`);
  return handleResponse<JobProgress>(res);
}

export async function getJobResult(jobId: string): Promise<ImportResult> {
  const res = await fetch(`${API_BASE_URL}/process/${jobId}/result`);
  return handleResponse<ImportResult>(res);
}

export function getResultDownloadUrl(jobId: string, format: "json" | "csv"): string {
  return `${API_BASE_URL}/process/${jobId}/result?format=${format}`;
}

export async function getScans(): Promise<ScanResultSummary[]> {
  const res = await fetch(`${API_BASE_URL}/scans`);
  return handleResponse<ScanResultSummary[]>(res);
}

export async function getScanByJobId(jobId: string): Promise<ScanResult> {
  const res = await fetch(`${API_BASE_URL}/scans/${jobId}`);
  return handleResponse<ScanResult>(res);
}

export async function deleteScan(jobId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/scans/${jobId}`, { method: "DELETE" });
  await handleResponse(res);
}

export function getScanDownloadUrl(jobId: string): string {
  return `${API_BASE_URL}/scans/${jobId}/download`;
}

export { ApiError };
