import { google } from "googleapis";

import { GET } from "./route";

jest.mock("googleapis", () => ({
  google: { auth: { OAuth2: jest.fn() } },
}));

const oauth2Constructor = google.auth.OAuth2 as unknown as jest.Mock;
const originalClientId = process.env.GOOGLE_CLIENT_ID;
const originalClientSecret = process.env.GOOGLE_CLIENT_SECRET;

describe("GET /api/youtube/auth-url", () => {
  const generateAuthUrl = jest.fn();

  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = "client-id";
    process.env.GOOGLE_CLIENT_SECRET = "client-secret";
    generateAuthUrl.mockReturnValue("https://example.com/oauth");
    oauth2Constructor.mockImplementation(() => ({ generateAuthUrl }));
  });

  afterEach(() => {
    if (originalClientId === undefined) delete process.env.GOOGLE_CLIENT_ID;
    else process.env.GOOGLE_CLIENT_ID = originalClientId;
    if (originalClientSecret === undefined) delete process.env.GOOGLE_CLIENT_SECRET;
    else process.env.GOOGLE_CLIENT_SECRET = originalClientSecret;
    jest.clearAllMocks();
  });

  it("returns an authorization URL when OAuth is configured", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      authUrl: "https://example.com/oauth",
    });
    expect(generateAuthUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        access_type: "offline",
        prompt: "consent",
        scope: expect.arrayContaining(["https://www.googleapis.com/auth/youtube.upload"]),
      }),
    );
  });

  it("returns 400 when OAuth credentials are missing", async () => {
    delete process.env.GOOGLE_CLIENT_ID;

    const response = await GET();

    expect(response.status).toBe(400);
    expect(oauth2Constructor).not.toHaveBeenCalled();
  });
});
