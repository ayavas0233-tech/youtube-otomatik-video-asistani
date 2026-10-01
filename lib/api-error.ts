import { randomUUID } from "crypto";

type ApiErrorOptions = {
  error: string;
  errorCode: string;
  statusCode: number;
  message?: string;
  cause?: unknown;
};

export function apiErrorResponse({
  error,
  errorCode,
  statusCode,
  message,
  cause,
}: ApiErrorOptions): Response {
  const errorId = randomUUID();
  if (cause !== undefined && process.env.NODE_ENV === "development") {
    console.error(`[API error ${errorId}] ${errorCode}: ${error}`, cause);
  }

  return Response.json(
    {
      ok: false,
      error,
      errorCode,
      ...(message ? { message } : {}),
      statusCode,
      errorId,
    },
    { status: statusCode },
  );
}
