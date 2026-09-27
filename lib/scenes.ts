export type Scene = {
  id: number;
  title: string;
  narration: string;
  visualPrompt: string;
  duration: number;
};

export function splitIntoScenes(script: string[]): Scene[] {
  const cleaned = script
    .map((line) => line.trim())
    .filter(Boolean);

  if (!cleaned.length) {
    return [];
  }

  return cleaned.map((line, index) => ({
    id: index + 1,
    title: `Sahne ${index + 1}`,
    narration: line,
    visualPrompt: buildVisualPrompt(line),
    duration: estimateDuration(line),
  }));
}

function buildVisualPrompt(text: string): string {
  const cleaned = text
    .replace(/\s+/g, " ")
    .trim();

  const base = `Cinematic modern YouTube thumbnail style, high detail, clear composition, vibrant colors, professional lighting, clean background, realistic visuals, marketing video aesthetic, ${cleaned}`;

  return base.slice(0, 900);
}

function estimateDuration(text: string): number {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.max(3, Math.ceil(wordCount / 8));
}
