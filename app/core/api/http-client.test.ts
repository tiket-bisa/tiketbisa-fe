// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AUTH_STORAGE_KEY } from "~/core/auth/auth.constants";
import { internalHttpClient } from "./http-client";

describe("internalHttpClient authorization handling", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
      clear: () => values.clear(),
      key: (index: number) => Array.from(values.keys())[index] ?? null,
      get length() { return values.size; },
    } as Storage;
    Object.defineProperty(window, "localStorage", { value: storage, configurable: true });
    vi.stubGlobal("localStorage", storage);
    storage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
      identifier: "scanner-1",
      internal_token: "token",
    }));
  });

  it("keeps the authenticated session on a scoped 403 response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: false,
      data: null,
      status_code: 403,
      error: { code: "FORBIDDEN", message: "Forbidden" },
    }), { status: 403, headers: { "content-type": "application/json" } })));

    const response = await internalHttpClient.get("/event");

    expect(response.status_code).toBe(403);
    expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).not.toBeNull();
  });
});
