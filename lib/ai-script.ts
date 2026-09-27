import { openai } from "@/lib/openai";

export type ScriptStyle = "modern" | "minimalist" | "vibrant" | "gaming" | "educational";

export type ScriptScene = {
  index: number;
  text: string;
  durationSec: number;
};

export type ScriptRequest = {
  topic: string;
  durationSec?: number;
  language?: "tr" | "en";
  style?: ScriptStyle;
};

export type ScriptResult = {
  title: string;
  scenes: ScriptScene[];
};

function estimateDurationSec(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.ceil(words / 3));
}

export async function generateScriptScenes({
  topic,
  durationSec = 45,
  language = "tr",
  style = "modern",
}: ScriptRequest): Promise<ScriptResult> {
  const safeTopic = topic.trim();

  if (!safeTopic) {
    throw new Error("Topic is required.");
  }

  if (!process.env.OPENAI_API_KEY) {
    const fallback =
      language === "en"
        ? [
            `What is ${safeTopic} and why does it matter?`,
            `Let's cover the top 3 actionable steps for ${safeTopic}.`,
            `Here is one practical example you can apply today.`,
            "If this was helpful, like, subscribe, and share your thoughts.",
          ]
        : [
            `${safeTopic} nedir ve neden önemlidir?`,
            `${safeTopic} için en kritik 3 adımı hızlıca anlatalım.`,
            `${safeTopic} ile bugün başlayabileceğiniz pratik bir örnek verelim.`,
            `Videoyu beğendiyseniz abone olup yorum bırakmayı unutmayın.`,
          ];

    return {
      title: language === "en" ? `${safeTopic} - Quick Guide` : `${safeTopic} - Hızlı Rehber`,
      scenes: fallback.map((text, index) => ({
        index,
        text,
        durationSec: estimateDurationSec(text),
      })),
    };
  }

  const targetSceneCount = Math.max(3, Math.min(8, Math.round(durationSec / 10)));
  const languageLabel = language === "tr" ? "Türkçe" : "English";

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    messages: [
      {
        role: "system",
        content:
          "You write short YouTube narration scenes. Return strict JSON with title and scenes string array only.",
      },
      {
        role: "user",
        content: `Topic: ${safeTopic}\nLanguage: ${languageLabel}\nStyle: ${style}\nTarget scenes: ${targetSceneCount}\nTarget duration seconds: ${durationSec}\nRespond with JSON: {"title": "...", "scenes": ["...", "..."]}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(content) as { title?: string; scenes?: string[] };
  const sceneLines = (parsed.scenes || []).map((scene) => scene.trim()).filter(Boolean);

  if (sceneLines.length === 0) {
    throw new Error("OpenAI did not return valid script scenes.");
  }

  return {
    title: parsed.title?.trim() || `${safeTopic} - Video`,
    scenes: sceneLines.map((text, index) => ({
      index,
      text,
      durationSec: estimateDurationSec(text),
    })),
  };
}
