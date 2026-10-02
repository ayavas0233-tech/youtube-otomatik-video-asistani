import { promises as fs } from "fs";
import path from "path";

const OUTPUT_ROOT = path.resolve(process.cwd(), "tmp", "jobs");

function outputPath(jobId: string, filename: string): string {
  if (
    !jobId ||
    !filename ||
    jobId !== path.basename(jobId) ||
    filename !== path.basename(filename)
  ) {
    throw new Error("Invalid job output path");
  }

  const resolvedPath = path.resolve(OUTPUT_ROOT, jobId, filename);
  if (!resolvedPath.startsWith(`${OUTPUT_ROOT}${path.sep}`)) {
    throw new Error("Invalid job output path");
  }

  return resolvedPath;
}

export async function jobOutputExists(
  jobId: string,
  filename: string,
): Promise<boolean> {
  try {
    return (await fs.stat(outputPath(jobId, filename))).isFile();
  } catch {
    return false;
  }
}

export async function getJobOutput(
  jobId: string,
  filename: string,
): Promise<Buffer> {
  return fs.readFile(outputPath(jobId, filename));
}
