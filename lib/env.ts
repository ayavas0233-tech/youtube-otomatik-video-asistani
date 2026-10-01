const STARTUP_ENV_VARS = [
  "OPENAI_API_KEY",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
] as const;

export function getMissingEnvironmentVariables(
  variables: readonly string[],
): string[] {
  return variables.filter((name) => !process.env[name]?.trim());
}

export function validateEnvironment(): void {
  const missing = getMissingEnvironmentVariables(STARTUP_ENV_VARS);
  if (missing.length > 0 && process.env.NODE_ENV === "development") {
    console.warn(
      `Optional integrations are unavailable; missing environment variables: ${missing.join(", ")}`,
    );
  }
}
