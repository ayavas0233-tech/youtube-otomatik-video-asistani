import { POST as createVideoJob } from "@/app/api/video/job/route";

export async function POST(request: Request): Promise<Response> {
  return createVideoJob(request);
}
