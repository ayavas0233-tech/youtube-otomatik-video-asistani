import { mkdir, writeFile } from "fs/promises";
import path from "path";

export type VisualTheme = "modern" | "minimalist" | "vibrant" | "gaming" | "educational";

export type VisualRequest = {
  text: string;
  theme?: VisualTheme;
  width?: number;
  height?: number;
};

export type VisualResult = {
  imagePath: string;
  width: number;
  height: number;
  theme: VisualTheme;
};

const VISUAL_DIR = path.join(process.cwd(), "tmp", "visuals");
const MAX_WIDTH = 3840;
const MAX_HEIGHT = 2160;

const THEME_GRADIENTS: Record<VisualTheme, [string, string]> = {
  modern: ["#0f172a", "#2563eb"],
  minimalist: ["#f8fafc", "#cbd5e1"],
  vibrant: ["#7c3aed", "#ec4899"],
  gaming: ["#111827", "#10b981"],
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

function clampSize(value: number, max: number) {
  return Math.max(320, Math.min(max, Math.floor(value)));
}

export async function generateStyledBackground({
  text,
  theme = "modern",
  width = 1920,
  height = 1080,
}: VisualRequest): Promise<VisualResult> {
  await mkdir(VISUAL_DIR, { recursive: true });

  const [from, to] = THEME_GRADIENTS[theme];
  const safeText = escapeXml(text);
  const safeWidth = clampSize(width, MAX_WIDTH);
  const safeHeight = clampSize(height, MAX_HEIGHT);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${safeWidth}" height="${safeHeight}" viewBox="0 0 ${safeWidth} ${safeHeight}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}" />
      <stop offset="100%" stop-color="${to}" />
    </linearGradient>
  </defs>
  <rect width="${safeWidth}" height="${safeHeight}" fill="url(#bg)" />
  <rect x="80" y="${Math.round(safeHeight * 0.6)}" width="${safeWidth - 160}" height="220" rx="24" fill="rgba(0,0,0,0.35)" />
  <text x="${Math.round(safeWidth / 2)}" y="${Math.round(safeHeight * 0.72)}" text-anchor="middle" font-size="72" font-family="Arial, sans-serif" fill="#ffffff" font-weight="700">${safeText.slice(0, 60)}</text>
</svg>`;

  const filePath = path.join(VISUAL_DIR, `visual-${Date.now()}.svg`);
  await writeFile(filePath, svg, "utf8");

  return {
    imagePath: filePath,
    width: safeWidth,
    height: safeHeight,
    theme,
  };
}
