import type { APIRequestContext } from "@playwright/test";
import {
  E2E_API_BASE_URL,
  E2E_ADMIN_EMAIL,
  E2E_PARTNER_EMAIL,
  E2E_INTERNAL_TOKEN,
  E2E_SEED_EMAIL,
} from "./e2e-env";

interface ApiError {
  message?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: ApiError | string | null;
  status_code?: number;
}

export interface E2eSeedResult {
  admin: { email: string; name: string; token: string };
  partner: {
    email: string;
    name: string;
    token: string;
    brandId: string;
    brandSlug: string;
    brandName: string;
  };
  brand: { id: string; name: string };
  event: { id: string; name: string };
  ticketCategory: { id: string; name: string };
  buyer: {
    name: string;
    email: string;
    phone: string;
    identityType: string;
    identityNumber: string;
  };
}

interface BrandResponse {
  id: string;
  name: string;
}

interface EventResponse {
  id: string;
  name: string;
}

interface TicketCategoryResponse {
  id: string;
  name: string;
}

interface TransactionDetailResponse {
  transaction: { id: string; status: string };
  ticketDetails: Array<{
    issuedTickets: Array<{
      codeHash: string;
      codeType: string;
      id: string;
    }>;
  }>;
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function buildInternalHeaders(email: string): Record<string, string> {
  return {
    "x-tb-identifier": email,
    "x-tb-internal-token": E2E_INTERNAL_TOKEN,
  };
}

async function requestJson<T>(
  request: APIRequestContext,
  method: "get" | "post",
  path: string,
  options: { data?: unknown; headers?: Record<string, string> } = {},
): Promise<T> {
  const url = `${normalizeBaseUrl(E2E_API_BASE_URL)}${path}`;
  const response = await request[method](url, {
    data: options.data,
    headers: options.headers,
  });
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok() || !payload.success) {
    const message =
      typeof payload.error === "string"
        ? payload.error
        : payload.error?.message ?? `Request failed: ${response.status()}`;
    throw new Error(message);
  }

  return payload.data;
}

export async function seedE2eData(request: APIRequestContext): Promise<E2eSeedResult> {
  const seedSuffix = Date.now().toString(36);
  const adminEmail = `admin.${seedSuffix}@tiketbisa.local`;
  const partnerEmail = `partner.${seedSuffix}@tiketbisa.local`;
  const buyerName = `E2E Buyer ${seedSuffix}`;
  const buyerEmail = `buyer.${seedSuffix}@tiketbisa.local`;

  await seedRoles(request, { adminEmail });

  const brand = await createBrand(request, adminEmail, {
    name: `E2E Brand ${seedSuffix}`,
    description: "Brand for E2E smoke tests",
  });

  await seedRoles(request, {
    partnerEmail,
    brandId: brand.id,
  });

  const event = await createEvent(request, adminEmail, {
    brandId: brand.id,
    name: `E2E Event ${seedSuffix}`,
  });

  const ticketCategory = await createTicketCategory(request, adminEmail, {
    eventId: event.id,
    name: "E2E Regular",
  });

  const brandSlug = brand.name.toLowerCase().replace(/\s+/g, "-");

  return {
    admin: {
      email: adminEmail,
      name: "E2E Admin",
      token: E2E_INTERNAL_TOKEN,
    },
    partner: {
      email: partnerEmail,
      name: brand.name,
      token: E2E_INTERNAL_TOKEN,
      brandId: brand.id,
      brandSlug,
      brandName: brand.name,
    },
    brand,
    event,
    ticketCategory,
    buyer: {
      name: buyerName,
      email: buyerEmail,
      phone: "081234567890",
      identityType: "KTP",
      identityNumber: "6271010101010001",
    },
  };
}

export async function getTransactionDetail(
  request: APIRequestContext,
  transactionId: string,
  email: string,
): Promise<TransactionDetailResponse> {
  return requestJson<TransactionDetailResponse>(
    request,
    "get",
    `/internal-tb/transaction/detail/${transactionId}`,
    { headers: buildInternalHeaders(email) },
  );
}

export async function approveManualTransfer(
  request: APIRequestContext,
  transactionId: string,
  email: string,
): Promise<void> {
  await requestJson<Record<string, unknown>>(
    request,
    "post",
    `/internal-tb/transaction/detail/${transactionId}/review`,
    {
      headers: buildInternalHeaders(email),
      data: { action: "APPROVE" },
    },
  );
}

export async function postPaymentSessionWebhook(
  request: APIRequestContext,
  transactionId: string,
  event: "payment_session.completed" | "payment_session.expired",
): Promise<void> {
  const response = await request.post(
    `${normalizeBaseUrl(E2E_API_BASE_URL)}/transaction/webhook/xendit`,
    {
      data: {
        event,
        data: {
          reference_id: transactionId,
          status: event.endsWith(".completed") ? "COMPLETED" : "EXPIRED",
        },
      },
    },
  );
  const payload = (await response.json()) as ApiResponse<unknown>;
  if (!response.ok() || !payload.success) {
    throw new Error(`Webhook failed: ${response.status()} ${JSON.stringify(payload.error)}`);
  }
}

export async function postPaymentCaptureWebhook(
  request: APIRequestContext,
  transactionId: string,
): Promise<void> {
  const response = await request.post(
    `${normalizeBaseUrl(E2E_API_BASE_URL)}/transaction/webhook/xendit/va`,
    {
      data: {
        event: "payment.capture",
        data: {
          reference_id: transactionId,
          status: "SUCCEEDED",
        },
      },
    },
  );
  const payload = (await response.json()) as ApiResponse<unknown>;
  if (!response.ok() || !payload.success) {
    throw new Error(`Webhook failed: ${response.status()} ${JSON.stringify(payload.error)}`);
  }
}

async function seedRoles(
  request: APIRequestContext,
  payload: { adminEmail?: string; partnerEmail?: string; brandId?: string },
): Promise<void> {
  await requestJson<Record<string, unknown>>(request, "post", "/internal-tb/e2e/seed", {
    headers: buildInternalHeaders(E2E_SEED_EMAIL),
    data: payload,
  });
}

async function createBrand(
  request: APIRequestContext,
  adminEmail: string,
  payload: { name: string; description?: string },
): Promise<BrandResponse> {
  return requestJson<BrandResponse>(request, "post", "/internal-tb/brand", {
    headers: buildInternalHeaders(adminEmail),
    data: payload,
  });
}

async function createEvent(
  request: APIRequestContext,
  adminEmail: string,
  payload: { brandId: string; name: string },
): Promise<EventResponse> {
  const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

  return requestJson<EventResponse>(request, "post", "/internal-tb/event", {
    headers: buildInternalHeaders(adminEmail),
    data: {
      brandId: payload.brandId,
      name: payload.name,
      description: "Event for E2E smoke tests",
      termAndCondition: "E2E terms",
      venue: "E2E Venue",
      location: "Jakarta",
      city: "Jakarta",
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      status: "ONGOING",
      isPublished: true,
    },
  });
}

async function createTicketCategory(
  request: APIRequestContext,
  adminEmail: string,
  payload: { eventId: string; name: string },
): Promise<TicketCategoryResponse> {
  return requestJson<TicketCategoryResponse>(request, "post", "/internal-tb/ticket-category", {
    headers: buildInternalHeaders(adminEmail),
    data: {
      eventId: payload.eventId,
      name: payload.name,
      description: "E2E ticket",
      categoryCode: "REG",
      totalTicket: 50,
      price: 150000,
    },
  });
}
