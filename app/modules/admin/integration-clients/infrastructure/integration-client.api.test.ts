import { beforeEach, describe, expect, it, vi } from "vitest";
import { internalHttpClient } from "~/core/api";
import { generateClientKey, normalizeClientCode } from "../domain/integration-client";
import {
  integrationClientApi,
  normalizeIntegrationClient,
  normalizeIntegrationClientKey,
} from "./integration-client.api";

vi.mock("~/core/api", () => ({
  internalHttpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const http = vi.mocked(internalHttpClient);

describe("integrationClientApi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("normalizes camelCase and snake_case client responses", () => {
    expect(normalizeIntegrationClient({
      id: "c1", code: "BETANG", name: "Betang", client_key: "key-1", active: true, active_key_count: 2,
    })).toMatchObject({ clientKey: "key-1", activeKeyCount: 2 });
    expect(normalizeIntegrationClient({
      id: "c2", code: "BRIMO", name: "BRImo", clientKey: "key-2", active: "true", activeKeyCount: 1,
    })).toMatchObject({ clientKey: "key-2", active: true, activeKeyCount: 1 });
  });

  it("normalizes key validity fields", () => {
    expect(normalizeIntegrationClientKey({
      id: "k1", fingerprint: "abc", valid_from: "2026-01-01T00:00:00Z", valid_until: null, active: true,
    })).toEqual({
      id: "k1", fingerprint: "abc", validFrom: "2026-01-01T00:00:00Z", validUntil: null, active: true,
    });
  });

  it("calls client and key mutation endpoints with backend-compatible payloads", async () => {
    http.post.mockResolvedValue({ success: true, data: { id: "c1" }, error: null, reason: null, status_code: 201 });
    http.put.mockResolvedValue({ success: true, data: { id: "c1", active: false }, error: null, reason: null, status_code: 200 });

    await integrationClientApi.create({ code: "BETANG", name: "Betang", client_key: "tb_betang_123" });
    await integrationClientApi.addKey("c1", {
      public_key_pem: "-----BEGIN PUBLIC KEY-----...-----END PUBLIC KEY-----",
      valid_from: "2026-01-01T00:00:00.000Z",
      valid_until: null,
    });
    await integrationClientApi.updateKeyStatus("c1", "k1", false);

    expect(http.post).toHaveBeenNthCalledWith(1, "/integration-clients", {
      code: "BETANG", name: "Betang", client_key: "tb_betang_123",
    });
    expect(http.post).toHaveBeenNthCalledWith(2, "/integration-clients/c1/keys", expect.objectContaining({
      valid_from: "2026-01-01T00:00:00.000Z",
    }));
    expect(http.put).toHaveBeenCalledWith("/integration-clients/c1/keys/k1/status", { active: false });
  });
});

describe("integration client helpers", () => {
  it("normalizes codes and generates unique recognizable client keys", () => {
    expect(normalizeClientCode("bank kalteng!" )).toBe("BANK_KALTENG_");
    const first = generateClientKey("BANK_KALTENG");
    const second = generateClientKey("BANK_KALTENG");
    expect(first).toMatch(/^tb_bank-kalteng_[a-f0-9]{32}$/);
    expect(second).toMatch(/^tb_bank-kalteng_[a-f0-9]{32}$/);
    expect(first).not.toBe(second);
  });
});
