export type ConfigValidationResult = {
  ok: boolean;
  missing: string[];
};

export function validateRequiredEnv(keys: string[]): ConfigValidationResult {
  const missing = keys.filter((key) => !process.env[key] || String(process.env[key]).trim() === "");
  return { ok: missing.length === 0, missing };
}

export function validateVideoPipelineConfig(): ConfigValidationResult {
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim());
  const hasElevenLabs = Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_API_KEY.trim());

  if (hasOpenAI || hasElevenLabs) {
    return { ok: true, missing: [] };
  }

  return {
    ok: false,
    missing: ["OPENAI_API_KEY or ELEVENLABS_API_KEY (TTS provider)"],
  };
}

export function validateYouTubeConfig(): ConfigValidationResult {
  return validateRequiredEnv(["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI", "GOOGLE_REFRESH_TOKEN"]);
}
