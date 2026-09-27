import { promises as fs } from "fs";
import path from "path";

const outputRoot = path.join(process.cwd(), process.env.UPLOAD_DIR || "tmp/video-jobs");

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return Response.json(
      {
        ok: false,
        message: "jobId zorunludur.",
      },
      { status: 400 },
    );
  }

  if (!/^[0-9a-fA-F-]{36}$/.test(jobId)) {
    return Response.json(
      {
        ok: false,
        message: "Geçersiz jobId formatı.",
      },
      { status: 400 },
    );
  }

  const statusPath = path.join(outputRoot, jobId, "job-status.json");

  try {
    const raw = await fs.readFile(statusPath, "utf8");
    return Response.json({ ok: true, ...(JSON.parse(raw) as object) });
  } catch {
    return Response.json(
      {
        ok: false,
        jobId,
        message: "Job durumu bulunamadı.",
      },
      { status: 404 },
    );
  }
}
