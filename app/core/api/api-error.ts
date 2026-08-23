const BUSINESS_ERROR_STATUSES = new Set([400, 409, 422]);
const DEFAULT_ERROR_MESSAGE = "Permintaan tidak dapat diproses. Silakan coba lagi.";

interface ApiEnvelopeLike {
  success?: boolean;
  status_code?: number;
  error?: unknown;
  request_id?: string;
}

export class ApiRequestError extends Error {
  readonly requestId?: string;
  readonly statusCode?: number;

  constructor(message: string, options: { requestId?: string; statusCode?: number } = {}) {
    super(message);
    this.name = "ApiRequestError";
    this.requestId = options.requestId;
    this.statusCode = options.statusCode;
  }
}

function rawErrorMessage(error: unknown): string | null {
  if (typeof error === "string" && error.trim()) return error.trim();
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message?: unknown }).message ?? "").trim();
    return message || null;
  }
  return null;
}

function normalizeRequestId(value: unknown): string | undefined {
  const requestId = typeof value === "string" ? value.trim() : "";
  return /^[A-Za-z0-9._:-]{1,128}$/.test(requestId) ? requestId : undefined;
}

function withReference(message: string, requestId?: string): string {
  return requestId ? `${message} Kode referensi: ${requestId}.` : message;
}

export function sanitizeApiEnvelope<T>(payload: T, response?: Response): T {
  if (!payload || typeof payload !== "object") return payload;

  const envelope = payload as T & ApiEnvelopeLike;
  if (typeof envelope.success !== "boolean" || typeof envelope.status_code !== "number") {
    return payload;
  }

  const requestId = normalizeRequestId(
    envelope.request_id ?? response?.headers.get("X-Request-Id"),
  );
  const sanitized = { ...envelope, ...(requestId ? { request_id: requestId } : {}) };

  if (envelope.success) return sanitized;

  const message = BUSINESS_ERROR_STATUSES.has(envelope.status_code)
    ? rawErrorMessage(envelope.error) ?? DEFAULT_ERROR_MESSAGE
    : withReference(DEFAULT_ERROR_MESSAGE, requestId);

  return { ...sanitized, error: message };
}

export function apiErrorFromResponse(
  payload: unknown,
  response: Response,
  fallback = DEFAULT_ERROR_MESSAGE,
): ApiRequestError {
  const envelope = sanitizeApiEnvelope(payload as ApiEnvelopeLike, response);
  const requestId = normalizeRequestId(
    envelope?.request_id ?? response.headers.get("X-Request-Id"),
  );
  const statusCode = Number(envelope?.status_code ?? response.status);
  const message = BUSINESS_ERROR_STATUSES.has(statusCode)
    ? rawErrorMessage(envelope?.error) ?? fallback
    : withReference(fallback, requestId);
  return new ApiRequestError(message, { requestId, statusCode });
}

export function toUserFacingError(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError) return error.message;
  return fallback;
}

export function toUserFacingResponseError(
  response: Pick<ApiEnvelopeLike, "success" | "status_code" | "error" | "request_id">,
  fallback: string,
): string {
  const sanitized = sanitizeApiEnvelope(response);
  return rawErrorMessage(sanitized.error) ?? fallback;
}
