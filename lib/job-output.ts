import { access, readFile } from "fs/promises";
import path from "path";

const OUTPUT_ROOT = path.resolve(process.cwd(), "tmp", "jobs");

function resolveOutputPath(jobId: string, filename: string): string {
  if (
    !jobId ||
    !filename ||
    jobId === "." ||
    jobId === ".." ||
    filename === "." ||
    filename === ".." ||
    /[\\/]/.test(jobId) ||
    /[\\/]/.test(filename)
  ) {
    throw new Error("Invalid job output path");
  }

  const outputPath = path.resolve(OUTPUT_ROOT, jobId, filename);
  if (!outputPath.startsWith(`${OUTPUT_ROOT}${path.sep}`)) {
    throw new Error("Invalid job output path");
  }

  return outputPath;
}

export async function jobOutputExists(
  jobId: string,
  filename: string,
): Promise<boolean> {
  try {
    await access(resolveOutputPath(jobId, filename));
    return true;
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error.code === "ENOENT" || error.code === "ENOTDIR")
    ) {
      return false;
    }
    throw error;
  }
}

export async function getJobOutput(
  jobId: string,
  filename: string,
): Promise<Buffer> {
  return readFile(resolveOutputPath(jobId, filename));
}
