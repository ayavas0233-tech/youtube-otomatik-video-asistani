import { createJob } from "@/lib/job-queue";
import { startJobWorker } from "@/lib/job-worker";

import { POST } from "./route";

jest.mock("@/lib/job-queue", () => ({
  createJob: jest.fn(),
  listJobs: jest.fn(),
}));
jest.mock("@/lib/job-worker", () => ({
  startJobWorker: jest.fn(),
}));

const mockCreateJob = jest.mocked(createJob);
const mockStartJobWorker = jest.mocked(startJobWorker);

describe("POST /api/video/job", () => {
  beforeEach(() => {
    mockCreateJob.mockReturnValue({ jobId: "job-123" } as never);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("rejects an invalid payload with 400", async () => {
    const response = await POST(
      new Request("http://localhost/api/video/job", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic: " " }),
      }),
    );

    expect(response.status).toBe(400);
    expect(mockCreateJob).not.toHaveBeenCalled();
  });

  it("queues a valid job", async () => {
    const response = await POST(
      new Request("http://localhost/api/video/job", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic: "Test topic" }),
      }),
    );

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      jobId: "job-123",
      statusUrl: "/api/video/job/job-123",
    });
    expect(mockStartJobWorker).toHaveBeenCalledWith("job-123");
  });

  it("returns 500 when enqueueing fails", async () => {
    mockCreateJob.mockImplementation(() => {
      throw new Error("queue failed");
    });
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await POST(
      new Request("http://localhost/api/video/job", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic: "Test topic" }),
      }),
    );

    expect(response.status).toBe(500);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
