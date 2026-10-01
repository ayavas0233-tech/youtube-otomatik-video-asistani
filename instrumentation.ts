import { validateEnvironment } from "@/lib/env";

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    validateEnvironment();
  }
}
