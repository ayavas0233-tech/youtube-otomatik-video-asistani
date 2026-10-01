import { getJob } from "@/lib/job-queue";

import { GET } from "./route";

jest.mock("@/lib/job-queue", () => ({
  getJob: jest.fn(),
}));

const mockGetJob = jest.mocked(getJob);

describe("GET /api/video/job/:jobId", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns 404 when the job does not exist", async () => {
    mockGetJob.mockReturnValue(undefined);

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ jobId: "missing-job" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      jobId: "missing-job",
    });
  });

  it("returns the job status when the job exists", async () => {
    mockGetJob.mockReturnValue({
      jobId: "job-123",
      status: "PROCESSING",
      progress: 40,
      currentStep: "Rendering",
    } as never);

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ jobId: "job-123" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      jobId: "job-123",
      status: "PROCESSING",
      progress: 40,
    });
  });
});
