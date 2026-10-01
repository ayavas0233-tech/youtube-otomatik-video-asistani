import { GET as getVideoJobStatus } from "@/app/api/video/job/[jobId]/route";

export async function GET(
  request: Request,
  context: { params: Promise<{ jobId: string }> },
): Promise<Response> {
  return getVideoJobStatus(request, context);
}
