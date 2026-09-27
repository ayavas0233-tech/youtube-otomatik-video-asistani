import { getJob } from "@/lib/job-queue";

export async function GET(
  _request: Request,
  { params }: { params: { jobId: string } },
) {
  const job = getJob(params.jobId);

  if (!job) {
    return Response.json(
      { ok: false, message: "Job not found", jobId: params.jobId },
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
