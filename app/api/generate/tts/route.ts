import { NextResponse } from "next/server";
import { generateSceneAudios, VOICES } from "@/lib/tts";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      scenes?: Array<{ text: string }>;
      voices?: string[];
    };

    const scenes = (payload.scenes || []).filter((scene) => scene.text?.trim());
    if (scenes.length === 0) {
      return NextResponse.json({ ok: false, message: "At least one scene text is required." }, { status: 400 });
    }

    const voices = payload.voices?.length ? payload.voices : [VOICES.rachel];
    const audios = await generateSceneAudios(scenes, voices);

    return NextResponse.json({ ok: true, audios });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "TTS generation failed." },
      { status: 500 },
    );
  }
}
