"use client";

import { useState } from "react";

type FullVideoResponse = {
  ok: boolean;
  message?: string;
  progress?: string[];
  script?: { title: string; scenes: Array<{ text: string }> };
  video?: { videoPath: string; durationSec: number; fileSizeBytes: number };
  thumbnail?: { thumbnailPath: string };
  subtitles?: { subtitlePath: string; format: string };
};

export default function GeneratePage() {
  const [topic, setTopic] = useState("Yapay zeka ile içerik üretimi");
  const [durationSec, setDurationSec] = useState(45);
  const [language, setLanguage] = useState<"tr" | "en">("tr");
  const [style, setStyle] = useState<"modern" | "minimalist" | "vibrant" | "gaming" | "educational">("modern");
  const [resolution, setResolution] = useState<"720p" | "1080p" | "2k" | "4k">("1080p");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FullVideoResponse | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/generate/full-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, durationSec, language, style, resolution }),
      });

      const data = (await response.json()) as FullVideoResponse;
      setResult(data);
    } catch (error) {
      setResult({ ok: false, message: error instanceof Error ? error.message : "Unexpected error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 880, margin: "0 auto" }}>
      <h1>Video Generation</h1>
      <p>Topic, duration, language ve style seçip tam pipeline çalıştırın.</p>

      <div style={{ display: "grid", gap: 12 }}>
        <label>
          Topic
          <input value={topic} onChange={(event) => setTopic(event.target.value)} style={{ display: "block", width: "100%" }} />
        </label>

        <label>
          Duration (sec)
          <input type="number" min={15} max={300} value={durationSec} onChange={(event) => setDurationSec(Number(event.target.value))} />
        </label>

        <label>
          Language
          <select value={language} onChange={(event) => setLanguage(event.target.value as "tr" | "en")}>
            <option value="tr">tr</option>
            <option value="en">en</option>
          </select>
        </label>

        <label>
          Style
          <select value={style} onChange={(event) => setStyle(event.target.value as typeof style)}>
            <option value="modern">modern</option>
            <option value="minimalist">minimalist</option>
            <option value="vibrant">vibrant</option>
            <option value="gaming">gaming</option>
            <option value="educational">educational</option>
          </select>
        </label>

        <label>
          Resolution
          <select value={resolution} onChange={(event) => setResolution(event.target.value as typeof resolution)}>
            <option value="720p">720p</option>
            <option value="1080p">1080p</option>
            <option value="2k">2k</option>
            <option value="4k">4k</option>
          </select>
        </label>

        <button onClick={handleGenerate} disabled={loading}>{loading ? "Generating..." : "⚡ Hızlı Oluştur"}</button>
      </div>

      {result ? (
        <pre style={{ marginTop: 16, padding: 12, background: "#f5f5f5", borderRadius: 8, whiteSpace: "pre-wrap" }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </main>
  );
}
