export interface IntegrationClient {
  id: string;
  code: string;
  name: string;
  clientKey: string;
  active: boolean;
  activeKeyCount: number;
}

export interface IntegrationClientKey {
  id: string;
  fingerprint: string;
  validFrom: string;
  validUntil: string | null;
  active: boolean;
}

export function normalizeClientCode(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "_");
}

export function generateClientKey(code: string): string {
  const normalizedCode = normalizeClientCode(code)
    .toLowerCase()
    .replace(/_/g, "-") || "client";
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  const random = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `tb_${normalizedCode}_${random}`;
}
