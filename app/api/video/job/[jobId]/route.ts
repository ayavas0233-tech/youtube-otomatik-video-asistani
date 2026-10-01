import { getJob } from "@/lib/job-queue";
import { apiErrorResponse } from "@/lib/api-error";

const JOB_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const { jobId } = await params;
    if (!JOB_ID_PATTERN.test(jobId)) {
      return apiErrorResponse({
        error: "Invalid job ID",
        errorCode: "INVALID_JOB_ID",
        statusCode: 400,
      });
    }

    const job = getJob(jobId);
    if (!job) {
      return apiErrorResponse({
        error: "Job not found",
        errorCode: "JOB_NOT_FOUND",
        statusCode: 404,
      });
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
  } catch (error) {
    return apiErrorResponse({
      error: "Unable to retrieve job status",
      errorCode: "JOB_STATUS_FAILED",
      statusCode: 500,
      cause: error,
    });
  }
}
