import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

import { JobRecord, JobResult, JobStatus, VideoJobPayload } from "@/lib/job-types";

const RETENTION_HOURS = 24;
const CLEANUP_INTERVAL_MS = 60 * 1000;
const RETENTION_MS = RETENTION_HOURS * 60 * 60 * 1000;
const STORE_FILE_PATH = path.join(process.cwd(), "tmp", "video-jobs-store.json");

const jobs = new Map<string, JobRecord>();

function ensureStoreFile(): void {
  const storeDir = path.dirname(STORE_FILE_PATH);
  if (!fs.existsSync(storeDir)) {
    fs.mkdirSync(storeDir, { recursive: true });
  }
  if (!fs.existsSync(STORE_FILE_PATH)) {
    fs.writeFileSync(STORE_FILE_PATH, JSON.stringify([]));
  }
}

function hydrateJobsFromStore(): void {
  ensureStoreFile();
  try {
    const raw = fs.readFileSync(STORE_FILE_PATH, "utf8");
    const records = JSON.parse(raw) as Array<
      Omit<JobRecord, "createdAt" | "updatedAt" | "expiresAt"> & {
        createdAt: string;
        updatedAt: string;
        expiresAt: string;
      }
    >;
    jobs.clear();
    for (const record of records) {
      jobs.set(record.jobId, {
        ...record,
        createdAt: new Date(record.createdAt),
        updatedAt: new Date(record.updatedAt),
        expiresAt: new Date(record.expiresAt),
      });
    }
  } catch {
    jobs.clear();
  }
}

function persistJobsToStore(): void {
  ensureStoreFile();
  const payload = Array.from(jobs.values()).map((job) => ({
    ...job,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    expiresAt: job.expiresAt.toISOString(),
  }));
  fs.writeFileSync(STORE_FILE_PATH, JSON.stringify(payload));
}

function nextExpiryDate(): Date {
  return new Date(Date.now() + RETENTION_MS);
}

function refreshTimestamps(job: JobRecord): JobRecord {
  const now = new Date();
  return {
    ...job,
    updatedAt: now,
    expiresAt: nextExpiryDate(),
  };
}

export function createJob(payload: VideoJobPayload): JobRecord {
  hydrateJobsFromStore();
  const now = new Date();
  const job: JobRecord = {
    jobId: randomUUID(),
    status: "PENDING",
    progress: 0,
    currentStep: "Job queued",
    payload,
    attempts: 0,
    maxAttempts: 3,
    createdAt: now,
    updatedAt: now,
    expiresAt: nextExpiryDate(),
  };

  jobs.set(job.jobId, job);
  persistJobsToStore();
  return job;
}

export function getJob(jobId: string): JobRecord | undefined {
  hydrateJobsFromStore();
  return jobs.get(jobId);
}

export function listJobs(status?: JobStatus): JobRecord[] {
  hydrateJobsFromStore();
  const allJobs = Array.from(jobs.values()).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

  if (!status) {
    return allJobs;
  }

  return allJobs.filter((job) => job.status === status);
}

export function updateJobProgress(
  jobId: string,
  progress: number,
  currentStep: string,
  status: JobStatus = "PROCESSING",
): JobRecord | undefined {
  hydrateJobsFromStore();
  const job = jobs.get(jobId);
  if (!job) {
    return undefined;
  }

  const updated = refreshTimestamps({
    ...job,
    status,
    progress: Math.max(0, Math.min(100, Math.round(progress))),
    currentStep,
    error: status === "FAILED" ? job.error : undefined,
  });

  jobs.set(jobId, updated);
  persistJobsToStore();
  return updated;
}

export function markJobFailed(jobId: string, error: string): JobRecord | undefined {
  hydrateJobsFromStore();
  const job = jobs.get(jobId);
  if (!job) {
    return undefined;
  }

  const updated = refreshTimestamps({
    ...job,
    status: "FAILED",
    error,
    currentStep: "Job failed",
  });
  jobs.set(jobId, updated);
  persistJobsToStore();
  return updated;
}

export function completeJob(jobId: string, result: JobResult): JobRecord | undefined {
  hydrateJobsFromStore();
  const job = jobs.get(jobId);
  if (!job) {
    return undefined;
  }

  const updated = refreshTimestamps({
    ...job,
    status: "COMPLETED",
    progress: 100,
    currentStep: "Complete",
    result,
    error: undefined,
  });
  jobs.set(jobId, updated);
  persistJobsToStore();
  return updated;
}

export function incrementJobAttempts(jobId: string): JobRecord | undefined {
  hydrateJobsFromStore();
  const job = jobs.get(jobId);
  if (!job) {
    return undefined;
  }

  const updated = refreshTimestamps({
    ...job,
    attempts: job.attempts + 1,
  });
  jobs.set(jobId, updated);
  persistJobsToStore();
  return updated;
}

export function cleanupExpiredJobs(): void {
  hydrateJobsFromStore();
  const now = Date.now();
  for (const [jobId, job] of jobs.entries()) {
    if (job.expiresAt.getTime() <= now) {
      jobs.delete(jobId);
    }
  }
  persistJobsToStore();
}

const cleanupState = globalThis as typeof globalThis & {
  __videoJobCleanupStarted?: boolean;
};

if (!cleanupState.__videoJobCleanupStarted) {
  setInterval(() => {
    cleanupExpiredJobs();
  }, CLEANUP_INTERVAL_MS).unref();
  cleanupState.__videoJobCleanupStarted = true;
}
