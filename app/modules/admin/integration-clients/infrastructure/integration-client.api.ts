import { internalHttpClient } from "~/core/api";
import type {
  IntegrationClient,
  IntegrationClientKey,
} from "../domain/integration-client";

type UnknownRecord = Record<string, unknown>;

export interface CreateIntegrationClientRequest {
  code: string;
  name: string;
  client_key: string;
}

export interface AddIntegrationClientKeyRequest {
  public_key_pem: string;
  valid_from: string;
  valid_until?: string | null;
}

function stringValue(value: unknown): string {
  return value == null ? "" : String(value);
}

function booleanValue(value: unknown): boolean {
  return value === true || value === "true";
}

export function normalizeIntegrationClient(raw: UnknownRecord): IntegrationClient {
  return {
    id: stringValue(raw.id),
    code: stringValue(raw.code),
    name: stringValue(raw.name),
    clientKey: stringValue(raw.clientKey ?? raw.client_key),
    active: booleanValue(raw.active),
    activeKeyCount: Number(raw.activeKeyCount ?? raw.active_key_count ?? 0) || 0,
  };
}

export function normalizeIntegrationClientKey(raw: UnknownRecord): IntegrationClientKey {
  return {
    id: stringValue(raw.id),
    fingerprint: stringValue(raw.fingerprint),
    validFrom: stringValue(raw.validFrom ?? raw.valid_from),
    validUntil: (raw.validUntil ?? raw.valid_until ?? null) as string | null,
    active: booleanValue(raw.active),
  };
}

export const integrationClientApi = {
  list: async () => {
    const response = await internalHttpClient.get<UnknownRecord[]>("/integration-clients");
    return {
      ...response,
      data: response.success && Array.isArray(response.data)
        ? response.data.map(normalizeIntegrationClient)
        : [],
    };
  },

  create: (request: CreateIntegrationClientRequest) =>
    internalHttpClient.post<{ id: string }>("/integration-clients", request),

  update: (id: string, name: string) =>
    internalHttpClient.put<{ id: string; name: string }>(`/integration-clients/${id}`, { name }),

  updateStatus: (id: string, active: boolean) =>
    internalHttpClient.put<{ id: string; active: boolean }>(`/integration-clients/${id}/status`, { active }),

  listKeys: async (clientId: string) => {
    const response = await internalHttpClient.get<UnknownRecord[]>(`/integration-clients/${clientId}/keys`);
    return {
      ...response,
      data: response.success && Array.isArray(response.data)
        ? response.data.map(normalizeIntegrationClientKey)
        : [],
    };
  },

  addKey: (clientId: string, request: AddIntegrationClientKeyRequest) =>
    internalHttpClient.post<{ id: string; fingerprint: string }>(`/integration-clients/${clientId}/keys`, request),

  updateKeyStatus: (clientId: string, keyId: string, active: boolean) =>
    internalHttpClient.put<{ id: string; active: boolean }>(
      `/integration-clients/${clientId}/keys/${keyId}/status`,
      { active },
    ),
};
