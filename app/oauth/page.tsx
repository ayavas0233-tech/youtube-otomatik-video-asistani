"use client";

import { useEffect, useState } from "react";

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Google yetkilendirmesi reddedildi.",
  invalid_state: "Güvenlik doğrulaması başarısız oldu (geçersiz state). Lütfen tekrar deneyin.",
  missing_code: "Google yetkilendirme kodu alınamadı.",
  token_exchange_failed: "Token değişimi başarısız oldu. Google Client ID/Secret ve redirect URI'yi kontrol edin.",
};

export default function OAuthPage() {
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const errorParam = params.get("error");

    // Clean sensitive-looking query params from the visible URL/history.
    // No tokens are ever sent here, but we still avoid leaving status/error
    // markers in the address bar after they've been read.
    window.history.replaceState({}, "", window.location.pathname);

    if (status === "success") {
      setSuccess(true);
      setConnected(true);
      setLoading(false);
      return;
    }

    if (errorParam) {
      setError(ERROR_MESSAGES[errorParam] || "Google yetkilendirmesi başarısız oldu.");
      setLoading(false);
      return;
    }

    async function loadStatus() {
      try {
        const [statusResponse, authUrlResponse] = await Promise.all([
          fetch("/api/youtube/status"),
          fetch("/api/youtube/auth-url"),
        ]);

        const statusData = await statusResponse.json();
        if (statusData.ok && statusData.connected) {
          setConnected(true);
        }

        const authUrlData = await authUrlResponse.json();
        if (!authUrlResponse.ok || !authUrlData.ok || !authUrlData.authUrl) {
          setError(authUrlData.message || "Google OAuth URL'si hazırlanamadı.");
          setLoading(false);
          return;
        }

        setAuthUrl(authUrlData.authUrl);
      } catch (err) {
        console.error(err);
        setError("Google OAuth bağlantısı hazırlanırken sorun oluştu.");
      } finally {
        setLoading(false);
      }
    }

    loadStatus();
  }, []);

  const handleConnect = () => {
    if (!authUrl) {
      return;
    }
    // authUrl only points to Google's consent screen; no tokens are ever
    // present on this page or in this redirect.
    window.location.href = authUrl;
  };

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#07111f", color: "#e5edf9" }}>
      <div style={{ width: "100%", maxWidth: 560, background: "rgba(14, 27, 43, 0.9)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 24, padding: 32 }}>
        <p style={{ margin: 0, color: "#9cb2d1", letterSpacing: "0.12em", textTransform: "uppercase", fontSize: 12 }}>YouTube OAuth</p>
        <h1 style={{ margin: "10px 0 12px", fontSize: "2rem" }}>Google hesabı ile bağlan</h1>

        {success || connected ? (
          <div style={{ background: "rgba(66,211,146,0.08)", border: "1px solid rgba(66,211,146,0.2)", borderRadius: 16, padding: 16, color: "#baf7d5" }}>
            Yetkilendirme başarılı. Hesabın bağlı ve video yükleme için hazır.
          </div>
        ) : null}

        {error ? (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 16, padding: 16, color: "#fecaca", marginTop: 16 }}>
            {error}
          </div>
        ) : null}

        {!loading && !success && !connected ? (
          <button
            onClick={handleConnect}
            disabled={!authUrl}
            style={{
              width: "100%",
              border: 0,
              borderRadius: 16,
              padding: "14px 22px",
              background: "linear-gradient(135deg, #7c9cff, #5d7cf7)",
              color: "white",
              fontWeight: 700,
              cursor: authUrl ? "pointer" : "not-allowed",
              opacity: authUrl ? 1 : 0.7,
              marginTop: 20,
            }}
          >
            {authUrl ? "YouTube ile bağlan" : "Hazırlanıyor..."}
          </button>
        ) : null}

        {loading ? (
          <div style={{ padding: "18px 12px", color: "#9cb2d1", marginTop: 20 }}>Google bağlantısı hazırlanıyor...</div>
        ) : null}
      </div>
    </main>
  );
}
