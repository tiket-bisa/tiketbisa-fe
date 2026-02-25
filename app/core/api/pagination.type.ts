/**
 * Tiketbisa — Pagination Parameters
 *
 * Mandatory for every list endpoint.
 */
export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface SortablePaginationParams extends PaginationParams {
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export const DEFAULT_PAGINATION: PaginationParams = {
  limit: 10,
  offset: 0,
} as const;
