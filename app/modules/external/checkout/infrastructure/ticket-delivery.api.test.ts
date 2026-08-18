import { afterEach, describe, expect, it, vi } from "vitest";
import { ticketDeliveryApi } from "./ticket-delivery.api";

describe("ticketDeliveryApi", () => {
  afterEach(() => vi.restoreAllMocks());

  it("downloads a protected archive and reads its filename", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("zip", {
      status: 200,
      headers: { "Content-Disposition": 'attachment; filename="tickets-order-1.zip"' },
    }));

    const archive = await ticketDeliveryApi.downloadArchive("order-1", "ticket-secret");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/transaction/order-1/tickets/download"),
      { headers: { "x-tb-ticket-code": "ticket-secret" } },
    );
    expect(archive.fileName).toBe("tickets-order-1.zip");
    expect(await archive.blob.text()).toBe("zip");
  });

  it("surfaces the backend error message", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(
      JSON.stringify({ error: { message: "Invalid ticket access code" } }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    ));

    await expect(ticketDeliveryApi.downloadArchive("order-1", "wrong"))
      .rejects.toThrow("Invalid ticket access code");
  });
});
