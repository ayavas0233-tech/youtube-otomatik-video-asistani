import { getJob } from "@/lib/job-queue";

export async function GET(
  _request: Request,
  { params }: { params: { jobId: string } },
) {
  const { jobId } = params;
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
    result: job.result,
    error: job.error,
  });
}
