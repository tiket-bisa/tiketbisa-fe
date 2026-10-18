import { useEffect, useState } from "react";
import { internalBrandAccessApi } from "~/core/api/services/internal-brand-access.api";
import { internalEventApi } from "~/core/api/services/internal-event.api";
import { transactionApi } from "~/core/api/services/transaction.api";
import {
  internalHttpClient,
  toUserFacingError,
  type ApiResponse,
} from "~/core/api";

export interface CommunityAccount {
  id: string;
  username: string;
  brand_id: string;
  record_flag: number;
}
export interface CommunityEvent {
  id: string;
  name: string;
}
export interface CommunityQuota {
  category_id: string;
  category_name: string;
  total: number;
  issued: number;
}
export interface GenerationRow {
  transaction_id: string;
  created: string | number;
  customer_email: string;
  username: string;
  category_id: string;
  category_name: string;
  quantity: number;
  delivery_status: string;
}
export interface CommunityOverview {
  quotas: CommunityQuota[];
  history: GenerationRow[];
  daily: {
    day: string;
    category_id: string;
    category_name: string;
    quantity: number;
    actions: number;
  }[];
}
export async function unwrap<T>(request: Promise<ApiResponse<T>>): Promise<T> {
  const response = await request;
  if (!response.success)
    throw new Error(
      typeof response.error === "string"
        ? response.error
        : "Permintaan belum dapat diproses.",
    );
  return response.data;
}
export const communityApi = {
  accounts: async (brandId: string): Promise<CommunityAccount[]> => {
    const summary = await unwrap(internalBrandAccessApi.getSummary(brandId));
    return summary.communityAccounts.map((account) => ({
      id: account.id,
      username: account.username,
      brand_id: brandId,
      record_flag: account.isActive ? 1 : 0,
    }));
  },
  events: async (): Promise<CommunityEvent[]> => {
    const result = await unwrap(
      internalEventApi.getList({ status: "ONGOING", limit: 200, offset: 0 }),
    );
    return result.events;
  },
  overview: (event: string, account = "", offset = 0) =>
    unwrap(
      internalHttpClient.get<CommunityOverview>(
        `/community/events/${encodeURIComponent(event)}/overview?accountId=${encodeURIComponent(account)}&offset=${offset}`,
      ),
    ),
  generate: async (body: {
    eventId: string;
    email: string;
    requestId: string;
    tickets: { categoryId: string; quantity: number }[];
  }) => {
    const result = await unwrap(
      transactionApi.manualGenerateTickets({
        eventId: body.eventId,
        customerEmail: body.email,
        requestId: body.requestId,
        paymentMethod: "COMPLIMENTARY",
        codeType: "QR_CODE",
        tickets: body.tickets,
      }),
    );
    return { transactionId: result.id };
  },
  create: (body: { brandId: string; username: string; password: string }) =>
    unwrap(
      internalBrandAccessApi.upsertInternalUser(
        body.brandId,
        body.username,
        body.password,
        "community",
      ),
    ),
  deactivate: (brandId: string, accountId: string) =>
    unwrap(internalBrandAccessApi.deactivateInternalUser(brandId, accountId)),
  quota: (body: { accountId: string; categoryId: string; quantity: number }) =>
    unwrap(internalHttpClient.post("/community/quotas", body)),
  retryEmail: (id: string) =>
    unwrap(
      transactionApi.sendTicketEmail(id, {
        deliveryMode: "ORIGINAL_CUSTOMER_EMAIL",
      }),
    ),
};
// Keep scope changes and late responses from showing the previous account's information.
export function useCommunityQuery<T>(
  fetcher: () => Promise<T>,
  deps: unknown[],
) {
  const [state, setState] = useState<{
    data: T | null;
    error: string | null;
    loading: boolean;
  }>({ data: null, error: null, loading: true });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let current = true;
    setState({ data: null, error: null, loading: true });
    void fetcher()
      .then((data) => {
        if (current) setState({ data, error: null, loading: false });
      })
      .catch((error) => {
        if (current)
          setState({
            data: null,
            error: toUserFacingError(error, "Data belum dapat dimuat."),
            loading: false,
          });
      });
    return () => {
      current = false;
    };
    // The caller supplies the complete query scope.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, revision]);
  return { ...state, refresh: () => setRevision((value) => value + 1) };
}
