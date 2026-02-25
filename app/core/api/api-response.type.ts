/**
 * Tiketbisa — Canonical API Response Contract
 * Source: Tiketbisa Engineer Guide.pdf
 *
 * Every backend endpoint MUST return this shape.
 * Generic `T` represents the payload type inside `data`.
 *
 * Sample from guide:
 * {
 *   "success": true,
 *   "error": null,
 *   "data": { ... },
 *   "reason": null,
 *   "status_code": 200
 * }
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  error: string | null;
  reason: string | null;
  status_code: number;
}

/**
 * Wrapper for paginated collections inside `data`.
 *
 * Per the guide, paginated responses include:
 *   limit, offset, count, and the list payload.
 */
export interface PaginatedData<T> {
  limit: number;
  offset: number;
  count: number;
  [key: string]: T[] | number; // e.g. event_list, transaction_list
}

/**
 * Shorthand: a paginated API response.
 */
export type PaginatedApiResponse<T> = ApiResponse<PaginatedData<T>>;
