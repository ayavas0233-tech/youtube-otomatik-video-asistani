import { openai } from "@/lib/openai";

export type GeneratedImage = {
  prompt: string;
  url?: string;
  base64?: string;
};

export async function generateImage({
  prompt,
  size = "1024x1024",
}: {
  prompt: string;
  size?: "256x256" | "512x512" | "1024x1024";
}): Promise<GeneratedImage> {
  const trimmed = prompt.trim();

  if (!trimmed) {
    throw new Error("Görsel prompt boş olamaz.");
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      prompt: trimmed,
      url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
    };
  }

  try {
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt: trimmed,
      size,
    });

    const first = response.data?.[0];

    return {
      prompt: trimmed,
      url: first?.url || undefined,
      base64: first?.b64_json || undefined,
    };
  } catch (error) {
    console.error("OpenAI image generation failed:", error);

    return {
      prompt: trimmed,
      url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
    };
  }
}
