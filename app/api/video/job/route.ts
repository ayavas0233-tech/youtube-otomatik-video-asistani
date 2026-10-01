import { createJob, listJobs } from "@/lib/job-queue";
import { VideoJobPayload } from "@/lib/job-types";
import { startJobWorker } from "@/lib/job-worker";
import { apiErrorResponse } from "@/lib/api-error";

function isValidPayload(payload: unknown): payload is VideoJobPayload {
  if (!payload || typeof payload !== "object") {
    return false;
  }
  const maybe = payload as Partial<VideoJobPayload>;
  const validTopic = typeof maybe.topic === "string" && maybe.topic.trim().length > 0;
  const validPrivacy =
    maybe.privacyStatus === undefined ||
    maybe.privacyStatus === "private" ||
    maybe.privacyStatus === "public" ||
    maybe.privacyStatus === "unlisted";
  const privacyUsageValid = maybe.privacyStatus === undefined || maybe.uploadToYouTube === true;

  return validTopic && validPrivacy && privacyUsageValid;
}

export async function POST(request: Request) {
  try {
    let payload: unknown;
    try {
      payload = await request.json();
    } catch (error) {
      return apiErrorResponse({
        error: "Invalid JSON request body",
        errorCode: "INVALID_JSON",
        statusCode: 400,
        cause: error,
      });
    }

    if (!isValidPayload(payload)) {
      return apiErrorResponse({
        error:
          "Geçerli bir topic zorunludur. privacyStatus yalnızca uploadToYouTube=true iken kullanılabilir.",
        errorCode: "INVALID_JOB_PAYLOAD",
        statusCode: 400,
      });
    }

    const job = createJob({
      title: payload.title,
      topic: payload.topic.trim(),
      audience: payload.audience,
      tone: payload.tone,
      duration: payload.duration,
      voice: payload.voice,
      uploadToYouTube: payload.uploadToYouTube,
      privacyStatus: payload.privacyStatus,
    });

    startJobWorker(job.jobId);

    return Response.json(
      {
        ok: true,
        jobId: job.jobId,
        message: "Job queued for processing",
        statusUrl: `/api/jobs/${job.jobId}/status`,
      },
      { status: 202 },
    );
  } catch (error) {
    return apiErrorResponse({
      error: "Video işi kuyruğa alınamadı.",
      errorCode: "JOB_CREATE_FAILED",
      statusCode: 500,
      cause: error,
    });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const validStatuses = ["PENDING", "PROCESSING", "COMPLETED", "FAILED"] as const;
    if (status && !validStatuses.includes(status as (typeof validStatuses)[number])) {
      return apiErrorResponse({
        error: "Invalid status filter",
        errorCode: "INVALID_STATUS_FILTER",
        statusCode: 400,
        message: "Use PENDING, PROCESSING, COMPLETED, or FAILED.",
      });
    }

    const jobs = listJobs(status as (typeof validStatuses)[number] | undefined);

    return Response.json({
      ok: true,
      jobs: jobs.map((job) => ({
        jobId: job.jobId,
        status: job.status,
        progress: job.progress,
        currentStep: job.currentStep,
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    return apiErrorResponse({
      error: "Unable to list jobs",
      errorCode: "JOB_LIST_FAILED",
      statusCode: 500,
      cause: error,
    });
  }
}
