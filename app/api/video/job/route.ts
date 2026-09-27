import { createJob, listJobs } from "@/lib/job-queue";
import { VideoJobPayload } from "@/lib/job-types";
import { startJobWorker } from "@/lib/job-worker";

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
    const payload = await request.json();
    if (!isValidPayload(payload)) {
      return Response.json(
        {
          ok: false,
          message:
            "Geçerli bir topic zorunludur. privacyStatus yalnızca uploadToYouTube=true iken kullanılabilir.",
        },
        { status: 400 },
      );
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
        statusUrl: `/api/video/job/${job.jobId}`,
      },
      { status: 202 },
    );
  } catch (error) {
    console.error("video-job enqueue failed", error);
    return Response.json(
      { ok: false, message: "Video işi kuyruğa alınamadı." },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const validStatuses = ["PENDING", "PROCESSING", "COMPLETED", "FAILED"] as const;
  if (status && !validStatuses.includes(status as (typeof validStatuses)[number])) {
    return Response.json(
      {
        ok: false,
        message: "Invalid status filter. Use PENDING, PROCESSING, COMPLETED, or FAILED.",
      },
      { status: 400 },
    );
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
}
