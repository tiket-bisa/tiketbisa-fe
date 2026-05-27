import type { Page } from "@playwright/test";
import { E2E_INTERNAL_TOKEN } from "./e2e-env";

const AUTH_STORAGE_KEY = "tiketbisa_auth";

export interface AdminSession {
  email: string;
  name: string;
}

export interface PartnerSession {
  email: string;
  name: string;
  brandId: string;
  brandSlug: string;
  brandName: string;
}

export async function setAdminSession(page: Page, session: AdminSession): Promise<void> {
  const payload = {
    email: session.email,
    name: session.name,
    role: "admin",
    internal_token: E2E_INTERNAL_TOKEN,
  };

  await setStorage(page, payload);
}

export async function setPartnerSession(page: Page, session: PartnerSession): Promise<void> {
  const payload = {
    email: session.email,
    name: session.brandName || session.name,
    role: "partner",
    brand_id: session.brandId,
    brand_slug: session.brandSlug,
    brand_name: session.brandName,
    internal_token: E2E_INTERNAL_TOKEN,
  };

  await setStorage(page, payload);
}

async function setStorage(page: Page, payload: Record<string, unknown>): Promise<void> {
  const value = JSON.stringify(payload);

  await page.addInitScript(
    ([key, storedValue]) => {
      localStorage.setItem(key, storedValue);
    },
    [AUTH_STORAGE_KEY, value],
  );
}
