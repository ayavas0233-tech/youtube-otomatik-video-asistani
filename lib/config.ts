export type ConfigValidationResult = {
  ok: boolean;
  missing: string[];
};

export function validateRequiredEnv(keys: string[]): ConfigValidationResult {
  const missing = keys.filter((key) => !process.env[key] || String(process.env[key]).trim() === "");
  return { ok: missing.length === 0, missing };
}

export function validateVideoPipelineConfig(): ConfigValidationResult {
  return validateRequiredEnv(["OPENAI_API_KEY"]);
}

export function validateYouTubeConfig(): ConfigValidationResult {
  return validateRequiredEnv(["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI", "GOOGLE_REFRESH_TOKEN"]);
}
