import fs from "fs/promises";

import { openai } from "@/lib/openai";

export type GeneratedImage = {
  prompt: string;
  url?: string;
  base64?: string;
};

type ImageSize = "1024x1024" | "1280x720";

function createPlaceholderBase64(prompt: string, size: ImageSize): string {
  const [width, height] = size.split("x");
  const safePrompt = prompt.replace(/[<>&]/g, " ").slice(0, 200);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop stop-color='#111827' offset='0'/><stop stop-color='#2563eb' offset='1'/></linearGradient></defs><rect width='100%' height='100%' fill='url(#g)'/><text x='50%' y='45%' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Arial, sans-serif' font-size='40'>AI Visual</text><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' fill='#dbeafe' font-family='Arial, sans-serif' font-size='22'>${safePrompt}</text></svg>`;

  return Buffer.from(svg, "utf8").toString("base64");
}

export async function generateImage({
  prompt,
  size = "1024x1024",
}: {
  prompt: string;
  size?: ImageSize;
}): Promise<GeneratedImage> {
  const trimmed = prompt.trim();

  if (!trimmed) {
    throw new Error("Görsel prompt boş olamaz.");
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      prompt: trimmed,
      base64: createPlaceholderBase64(trimmed, size),
    };
  }

  try {
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt: trimmed,
      size: size === "1280x720" ? "1024x1024" : size,
    });

    const first = response.data?.[0];

    if (!first?.url && !first?.b64_json) {
      throw new Error("Image response is empty.");
    }

    return {
      prompt: trimmed,
      url: first.url || undefined,
      base64: first.b64_json || undefined,
    };
  } catch (error) {
    console.error("OpenAI image generation failed:", error);

    return {
      prompt: trimmed,
      base64: createPlaceholderBase64(trimmed, size),
    };
  }
}

export async function saveGeneratedImage(
  image: GeneratedImage,
  outputPath: string,
): Promise<string> {
  if (image.base64) {
    await fs.writeFile(outputPath, Buffer.from(image.base64, "base64"));
    return outputPath;
  }

  if (image.url) {
    const response = await fetch(image.url);

    if (!response.ok) {
      throw new Error(`Görsel indirilemedi: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(outputPath, buffer);
    return outputPath;
  }

  throw new Error("Üretilen görselde URL veya base64 bulunamadı.");
}
