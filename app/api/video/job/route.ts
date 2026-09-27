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

  return validTopic && validPrivacy;
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    if (!isValidPayload(payload)) {
      return Response.json(
        { ok: false, message: "Geçerli bir topic ve privacyStatus değeri zorunludur." },
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
  const jobs = listJobs(
    status === "PENDING" ||
      status === "PROCESSING" ||
      status === "COMPLETED" ||
      status === "FAILED"
      ? status
      : undefined,
  );

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
