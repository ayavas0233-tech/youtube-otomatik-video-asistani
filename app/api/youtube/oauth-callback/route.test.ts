import { google } from "googleapis";

import { GET } from "./route";

jest.mock("googleapis", () => ({
  google: { auth: { OAuth2: jest.fn() } },
}));

const oauth2Constructor = google.auth.OAuth2 as unknown as jest.Mock;
const originalClientId = process.env.GOOGLE_CLIENT_ID;
const originalClientSecret = process.env.GOOGLE_CLIENT_SECRET;
let getToken: jest.Mock;

describe("GET /api/youtube/oauth-callback", () => {
  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = "client-id";
    process.env.GOOGLE_CLIENT_SECRET = "client-secret";
    getToken = jest.fn().mockResolvedValue({
      tokens: { access_token: "access-token", refresh_token: "refresh-token" },
    });
    oauth2Constructor.mockImplementation(() => ({ getToken }));
  });

  afterEach(() => {
    if (originalClientId === undefined) delete process.env.GOOGLE_CLIENT_ID;
    else process.env.GOOGLE_CLIENT_ID = originalClientId;
    if (originalClientSecret === undefined) delete process.env.GOOGLE_CLIENT_SECRET;
    else process.env.GOOGLE_CLIENT_SECRET = originalClientSecret;
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("returns 400 when the authorization code is missing", async () => {
    const response = await GET(new Request("http://localhost/api/youtube/oauth-callback"));

    expect(response.status).toBe(400);
  });

  it("returns 500 when OAuth credentials are missing", async () => {
    delete process.env.GOOGLE_CLIENT_SECRET;

    const response = await GET(
      new Request("http://localhost/api/youtube/oauth-callback?code=authorization-code"),
    );

    expect(response.status).toBe(500);
  });

  it("exchanges a code for tokens", async () => {
    const response = await GET(
      new Request("http://localhost/api/youtube/oauth-callback?code=authorization-code"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      tokens: { access_token: "access-token", refresh_token: "refresh-token" },
    });
    expect(getToken).toHaveBeenCalledWith("authorization-code");
  });

  it("returns 500 when token exchange fails", async () => {
    getToken.mockRejectedValue(new Error("token exchange failed"));
    jest.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await GET(
      new Request("http://localhost/api/youtube/oauth-callback?code=authorization-code"),
    );

    expect(response.status).toBe(500);
  });
});
