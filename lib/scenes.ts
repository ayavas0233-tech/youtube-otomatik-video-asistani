export type Scene = {
  order: number;
  narration: string;
  visualPrompt: string;
  duration: number;
};

export function splitIntoScenes(script: string | string[]): Scene[] {
  const text = Array.isArray(script) ? script.join("\n") : script;

  const blocks = text
    .split(/\n\s*\n/g)
    .flatMap((chunk) => chunk.split("\n"))
    .map((line) => line.replace(/^[-*\d.)\s]+/, "").trim())
    .filter(Boolean);

  if (!blocks.length) {
    return [];
  }

  return blocks.map((narration, index) => ({
    order: index + 1,
    narration,
    visualPrompt: buildVisualPrompt(narration),
    duration: estimateDuration(narration),
  }));
}

function buildVisualPrompt(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const base = `Cinematic modern YouTube scene, high detail, realistic lighting, clean composition, 16:9 framing, ${cleaned}`;

  return base.slice(0, 900);
}

function estimateDuration(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(3, Math.ceil(words / 2.6));
}
