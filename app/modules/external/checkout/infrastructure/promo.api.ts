import { apiFetch } from "~/core/api";
import type { ApiResponse } from "~/core/api";

export interface ApplyPromoResult {
  promoId: string;
  discount: number;
}

function getApiErrorMessage(response: unknown, fallback: string): string {
  const payload = response as any;
  if (payload?.error?.message) return String(payload.error.message);
  if (typeof payload?.error === "string" && payload.error) return payload.error;
  if (payload?.reason) return String(payload.reason);
  return fallback;
}

export const promoApi = {
  /**
   * Apply a promo code for an event. Public route, no auth required.
   * Backend validates and returns the discount amount; the FE only ever
   * uses this for display — the authoritative recalculation happens when
   * the order is stored/executed on the backend.
   */
  async applyPromo(code: string, eventId: string): Promise<ApplyPromoResult> {
    const response = await apiFetch<ApiResponse<ApplyPromoResult>>("/promo/apply", {
      method: "POST",
      body: JSON.stringify({ code, eventId }),
    });

    if (!response.success || !response.data) {
      throw new Error(getApiErrorMessage(response, "Kode promo tidak valid"));
    }

    return response.data;
  },
};
