import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { VisualTheme } from "@/lib/video-visuals";

const THUMBNAIL_DIR = path.join(process.cwd(), "tmp", "thumbnails");

const THEME_COLORS: Record<VisualTheme, [string, string]> = {
  modern: ["#0f172a", "#2563eb"],
  minimalist: ["#f8fafc", "#475569"],
  vibrant: ["#7c3aed", "#f43f5e"],
  gaming: ["#111827", "#22c55e"],
  educational: ["#1d4ed8", "#f59e0b"],
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function generateThumbnail({
  title,
  subtitle,
  theme = "modern",
}: {
  title: string;
  subtitle?: string;
  theme?: VisualTheme;
}) {
  await mkdir(THUMBNAIL_DIR, { recursive: true });

  const [from, to] = THEME_COLORS[theme];
  const safeTitle = escapeXml(title.slice(0, 40));
  const safeSubtitle = escapeXml((subtitle || "Yeni Video").slice(0, 56));

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}" />
      <stop offset="100%" stop-color="${to}" />
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#bg)" />
  <circle cx="1120" cy="580" r="88" fill="rgba(255,255,255,0.9)" />
  <polygon points="1095,535 1095,625 1165,580" fill="#ef4444" />
  <rect x="80" y="360" width="880" height="250" rx="24" fill="rgba(0,0,0,0.45)" />
  <text x="120" y="450" font-size="88" fill="#fff" font-family="Arial, sans-serif" font-weight="800">${safeTitle}</text>
  <text x="120" y="530" font-size="44" fill="#fef3c7" font-family="Arial, sans-serif" font-weight="600">${safeSubtitle}</text>
  <text x="1060" y="120" font-size="72">⚡</text>
  <text x="1140" y="170" font-size="64">🎯</text>
</svg>`;

  const thumbnailPath = path.join(THUMBNAIL_DIR, `thumbnail-${Date.now()}.svg`);
  await writeFile(thumbnailPath, svg, "utf8");

  return {
    thumbnailPath,
    width: 1280,
    height: 720,
    theme,
  };
}
