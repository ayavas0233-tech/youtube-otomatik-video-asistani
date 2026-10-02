import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/job-queue";
import { getJobOutput, jobOutputExists } from "@/lib/job-output";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string; filename: string }> },
) {
  try {
    const { jobId, filename } = await params;

    // Validate job exists
    const job = getJob(jobId);
    if (!job) {
      return NextResponse.json(
        { ok: false, message: "Job not found" },
        { status: 404 },
      );
    }

    // Check if file exists
    const exists = await jobOutputExists(jobId, filename);
    if (!exists) {
      return NextResponse.json(
        { ok: false, message: "File not found" },
        { status: 404 },
      );
    }

    // Get file
    const buffer = await getJobOutput(jobId, filename);

    // Determine content type
    let contentType = "application/octet-stream";
    if (filename.endsWith(".mp4")) {
      contentType = "video/mp4";
    } else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) {
      contentType = "image/jpeg";
    } else if (filename.endsWith(".png")) {
      contentType = "image/png";
    } else if (filename.endsWith(".srt")) {
      contentType = "text/plain; charset=utf-8";
    } else if (filename.endsWith(".mp3")) {
      contentType = "audio/mpeg";
    }

    const response = new NextResponse(buffer);
    response.headers.set("Content-Type", contentType);
    response.headers.set("Cache-Control", "public, max-age=86400");

    return response;
  } catch (error) {
    console.error("Job output retrieval error:", error);
    return NextResponse.json(
      { ok: false, message: "Failed to retrieve file" },
      { status: 500 },
    );
  }
}
