import { getJob } from "@/lib/job-queue";

function toArtifactId(filePath: string): string {
  const segments = filePath.split("/").filter(Boolean);
  return segments.slice(-2).join("/");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  const job = getJob(jobId);

  if (!job) {
    return Response.json(
      { ok: false, message: "Job not found", jobId },
      { status: 404 },
    );
  }

  return Response.json({
    ok: true,
    jobId: job.jobId,
    status: job.status,
    progress: job.progress,
    currentStep: job.currentStep,
    result: job.result
      ? {
          ...job.result,
          videoPath: toArtifactId(job.result.videoPath),
          thumbnailPath: toArtifactId(job.result.thumbnailPath),
          subtitlePath: toArtifactId(job.result.subtitlePath),
        }
      : undefined,
    error: job.error,
  });
}
