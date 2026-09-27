import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

import { JobRecord, JobResult, JobStatus, VideoJobPayload } from "@/lib/job-types";

const RETENTION_HOURS = 24;
const CLEANUP_INTERVAL_MS = 60 * 1000;
const RETENTION_MS = RETENTION_HOURS * 60 * 60 * 1000;
const STORE_DIR = path.join(process.cwd(), "tmp", "video-jobs-store");

function ensureStoreDir(): void {
  if (!fs.existsSync(STORE_DIR)) {
    fs.mkdirSync(STORE_DIR, { recursive: true });
  }
}

function jobPath(jobId: string): string {
  return path.join(STORE_DIR, `${jobId}.json`);
}

function jobLockPath(jobId: string): string {
  return path.join(STORE_DIR, `${jobId}.lock`);
}

function nextExpiryDate(): Date {
  return new Date(Date.now() + RETENTION_MS);
}

function toStored(job: JobRecord) {
  return {
    ...job,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    expiresAt: job.expiresAt.toISOString(),
  };
}

function fromStored(
  job: Omit<JobRecord, "createdAt" | "updatedAt" | "expiresAt"> & {
    createdAt: string;
    updatedAt: string;
    expiresAt: string;
  },
): JobRecord {
  return {
    ...job,
    createdAt: new Date(job.createdAt),
    updatedAt: new Date(job.updatedAt),
    expiresAt: new Date(job.expiresAt),
  };
}

function writeJob(job: JobRecord): void {
  ensureStoreDir();
  fs.writeFileSync(jobPath(job.jobId), JSON.stringify(toStored(job)));
}

function readJob(jobId: string): JobRecord | undefined {
  ensureStoreDir();
  const filePath = jobPath(jobId);
  if (!fs.existsSync(filePath)) {
    return undefined;
  }

  const raw = fs.readFileSync(filePath, "utf8");
  return fromStored(JSON.parse(raw));
}

function listAllJobs(): JobRecord[] {
  ensureStoreDir();
  return fs
    .readdirSync(STORE_DIR)
    .filter((name) => name.endsWith(".json"))
    .flatMap((name) => {
      try {
        const raw = fs.readFileSync(path.join(STORE_DIR, name), "utf8");
        return [fromStored(JSON.parse(raw))];
      } catch {
        return [];
      }
    });
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
  writeJob(job);
  return job;
}

export function getJob(jobId: string): JobRecord | undefined {
  return readJob(jobId);
}

export function listJobs(status?: JobStatus): JobRecord[] {
  const jobs = listAllJobs().sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

  if (!status) {
    return jobs;
  }

  return jobs.filter((job) => job.status === status);
}

export function claimJob(jobId: string, workerId: string): JobRecord | undefined {
  const lockPath = jobLockPath(jobId);
  let lockFd: number | undefined;

  try {
    lockFd = fs.openSync(lockPath, "wx");
  } catch {
    return undefined;
  }

  try {
    const job = readJob(jobId);
    if (!job || job.status !== "PENDING") {
      return undefined;
    }

    const claimed = refreshTimestamps({
      ...job,
      status: "PROCESSING",
      workerId,
      currentStep: "Worker claimed job",
    });
    writeJob(claimed);
    return claimed;
  } finally {
    if (typeof lockFd === "number") {
      fs.closeSync(lockFd);
    }
    if (fs.existsSync(lockPath)) {
      fs.rmSync(lockPath);
    }
  }
}

export function updateJobProgress(
  jobId: string,
  progress: number,
  currentStep: string,
  status: JobStatus = "PROCESSING",
  error?: string,
): JobRecord | undefined {
  const job = readJob(jobId);
  if (!job) {
    return undefined;
  }

  const updated = refreshTimestamps({
    ...job,
    status,
    progress: Math.max(0, Math.min(100, Math.round(progress))),
    currentStep,
    error: error || job.error,
  });
  writeJob(updated);
  return updated;
}

export function markJobFailed(jobId: string, error: string): JobRecord | undefined {
  const job = readJob(jobId);
  if (!job) {
    return undefined;
  }

  const updated = refreshTimestamps({
    ...job,
    status: "FAILED",
    error,
    currentStep: "Job failed",
  });
  writeJob(updated);
  return updated;
}

export function completeJob(jobId: string, result: JobResult): JobRecord | undefined {
  const job = readJob(jobId);
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
  writeJob(updated);
  return updated;
}

export function incrementJobAttempts(jobId: string): JobRecord | undefined {
  const job = readJob(jobId);
  if (!job) {
    return undefined;
  }

  const updated = refreshTimestamps({
    ...job,
    attempts: job.attempts + 1,
  });
  writeJob(updated);
  return updated;
}

export function cleanupExpiredJobs(): void {
  ensureStoreDir();
  const now = Date.now();
  for (const job of listAllJobs()) {
    if (job.expiresAt.getTime() <= now) {
      const filePath = jobPath(job.jobId);
      if (fs.existsSync(filePath)) {
        fs.rmSync(filePath);
      }
    }
  }
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
