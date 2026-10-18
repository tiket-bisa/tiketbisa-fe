import { useEffect, useState } from "react";
import { internalHttpClient, toUserFacingError, type ApiResponse } from "~/core/api";

export interface CommunityAccount { id: string; username: string; brand_id: string; record_flag: number }
export interface CommunityEvent { id: string; name: string }
export interface CommunityQuota { category_id: string; category_name: string; total: number; issued: number }
export interface GenerationRow {
  transaction_id: string; created: string | number; customer_email: string; username: string;
  category_id: string; category_name: string; quantity: number; delivery_status: string;
}
export interface CommunityOverview {
  quotas: CommunityQuota[];
  history: GenerationRow[];
  daily: { day: string; category_id: string; category_name: string; quantity: number; actions: number }[];
}
export async function unwrap<T>(request: Promise<ApiResponse<T>>): Promise<T> {
  const response = await request;
  if (!response.success) throw new Error(typeof response.error === "string" ? response.error : "Permintaan belum dapat diproses.");
  return response.data;
}
export const communityApi = {
  accounts: (brandId: string) => unwrap(internalHttpClient.get<CommunityAccount[]>(`/community/accounts?brandId=${encodeURIComponent(brandId)}`)),
  events: () => unwrap(internalHttpClient.get<CommunityEvent[]>("/community/events")),
  overview: (event: string, account = "", offset = 0) => unwrap(internalHttpClient.get<CommunityOverview>(`/community/events/${encodeURIComponent(event)}/overview?accountId=${encodeURIComponent(account)}&offset=${offset}`)),
  generate: (body: { eventId: string; email: string; requestId: string; tickets: { categoryId: string; quantity: number }[] }) =>
    unwrap(internalHttpClient.post<{ transactionId: string }>("/community/generate", body)),
  create: (body: { brandId: string; username: string; password: string }) => unwrap(internalHttpClient.post("/community/accounts", body)),
  active: (id: string, active: boolean) => unwrap(internalHttpClient.put(`/community/accounts/${encodeURIComponent(id)}/active`, { active })),
  quota: (body: { accountId: string; categoryId: string; quantity: number }) => unwrap(internalHttpClient.post("/community/quotas", body)),
  retryEmail: (id: string) => unwrap(internalHttpClient.post(`/community/generations/${encodeURIComponent(id)}/email`, {})),
};
// Keep scope changes and late responses from showing the previous account's information.
export function useCommunityQuery<T>(fetcher: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{ data: T | null; error: string | null; loading: boolean }>({ data: null, error: null, loading: true });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let current = true;
    setState({ data: null, error: null, loading: true });
    void fetcher().then(data => { if (current) setState({ data, error: null, loading: false }); })
      .catch(error => { if (current) setState({ data: null, error: toUserFacingError(error, "Data belum dapat dimuat."), loading: false }); });
    return () => { current = false; };
    // The caller supplies the complete query scope.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, revision]);
  return { ...state, refresh: () => setRevision(value => value + 1) };
}
