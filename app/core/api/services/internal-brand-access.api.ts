import { internalHttpClient } from "../http-client";

export interface PartnerBrandAccess {
  email: string;
  created?: string | null;
}

export interface ScannerAccountSummary {
  id: string;
  username: string;
  isActive: boolean;
  created?: string | null;
  lastUpdated?: string | null;
}

export interface BrandAccessSummary {
  brandId: string;
  brandName: string;
  partnerEmails: PartnerBrandAccess[];
  scannerAccounts: ScannerAccountSummary[];
}

function normalizePartnerAccess(data: Record<string, unknown>): PartnerBrandAccess {
  return {
    email: String(data.email ?? ""),
    created: (data.created ?? null) as string | null,
  };
}

function normalizeScannerAccess(data: Record<string, unknown>): ScannerAccountSummary {
  return {
    id: String(data.id ?? ""),
    username: String(data.username ?? ""),
    isActive: Boolean(data.isActive ?? data.is_active ?? false),
    created: (data.created ?? null) as string | null,
    lastUpdated: (data.lastUpdated ?? data.last_updated ?? null) as string | null,
  };
}

export function normalizeBrandAccessSummary(data: Record<string, unknown>): BrandAccessSummary {
  const scannerItems = Array.isArray(data.scannerAccounts)
    ? data.scannerAccounts
    : Array.isArray(data.internalUsers)
      ? data.internalUsers
      : [];
  return {
    brandId: String(data.brandId ?? data.brand_id ?? ""),
    brandName: String(data.brandName ?? data.brand_name ?? ""),
    partnerEmails: Array.isArray(data.partnerEmails)
      ? data.partnerEmails.map((item) => normalizePartnerAccess(item as Record<string, unknown>))
      : [],
    scannerAccounts: scannerItems.map((item: unknown) =>
      normalizeScannerAccess(item as Record<string, unknown>)),
  };
}

async function normalizeSummaryResponse(
  response: Awaited<ReturnType<typeof internalHttpClient.post<BrandAccessSummary>>>,
) {
  if (!response.success || !response.data) return response;
  return {
    ...response,
    data: normalizeBrandAccessSummary(response.data as unknown as Record<string, unknown>),
  };
}

export const internalBrandAccessApi = {
  getSummary: async (brandId: string) => {
    const response = await internalHttpClient.get<BrandAccessSummary>(`/brand/${brandId}/access`);
    if (!response.success || !response.data) {
      return response;
    }

    return {
      ...response,
      data: normalizeBrandAccessSummary(response.data as unknown as Record<string, unknown>),
    };
  },

  addPartner: async (brandId: string, email: string) =>
    normalizeSummaryResponse(
      await internalHttpClient.post<BrandAccessSummary>(`/brand/${brandId}/access/partner`, { email }),
    ),

  removePartner: async (brandId: string, email: string) =>
    normalizeSummaryResponse(
      await internalHttpClient.delete<BrandAccessSummary>(`/brand/${brandId}/access/partner`, { email }),
    ),

  upsertScanner: async (brandId: string, username: string, password: string) =>
    normalizeSummaryResponse(
      await internalHttpClient.post<BrandAccessSummary>(`/brand/${brandId}/access/internal-user`, { username, password }),
    ),

  deactivateScanner: async (brandId: string, scannerId: string) =>
    normalizeSummaryResponse(
      await internalHttpClient.delete<BrandAccessSummary>(`/brand/${brandId}/access/internal-user/${scannerId}`),
    ),
};
