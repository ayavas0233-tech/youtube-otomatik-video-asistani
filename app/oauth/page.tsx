"use client";

import { useEffect, useState } from "react";

export default function OAuthPage() {
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const errorParam = params.get("error");

    if (status === "success") {
      setSuccess(true);
      setLoading(false);
      return;
    }

    if (errorParam) {
      setError(`OAuth error: ${errorParam}`);
      setLoading(false);
      return;
    }

    async function loadAuthUrl() {
      try {
        const response = await fetch("/api/youtube/auth-url");
        const data = await response.json();

        if (!response.ok || !data.ok || !data.authUrl) {
          throw new Error(data.message || "Could not prepare Google OAuth URL.");
        }

        setAuthUrl(data.authUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : "OAuth setup failed.");
      } finally {
        setLoading(false);
      }
    }

    loadAuthUrl();
  }, []);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 600, border: "1px solid #ddd", borderRadius: 12, padding: 24 }}>
        <h1>YouTube OAuth</h1>
        <p>Google hesabınız ile bağlanıp güvenli şekilde refresh token kaydı yapın.</p>

        {loading ? <p>Yükleniyor...</p> : null}
        {success ? <p role="status" aria-live="polite" style={{ color: "green" }}>OAuth başarılı, kanal doğrulaması yapılabilir.</p> : null}
        {error ? <p role="alert" style={{ color: "crimson" }}>{error}</p> : null}

        {!loading && !success && !error && authUrl ? (
          <a
            href={authUrl}
            className="oauth-link"
            style={{
              display: "inline-block",
              padding: "10px 14px",
              borderRadius: 8,
              background: "#2563eb",
              color: "#fff",
              textDecoration: "none",
              outlineOffset: 2,
            }}
          >
            YouTube ile Bağlan
          </a>
        ) : null}
      </div>
    </main>
  );
}
