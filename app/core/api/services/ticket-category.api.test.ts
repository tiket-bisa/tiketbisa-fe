import { beforeEach, describe, expect, it, vi } from "vitest";

const publicGet = vi.fn();
const internalGet = vi.fn();

vi.mock("../http-client", () => ({
  httpClient: { get: (...args: unknown[]) => publicGet(...args) },
  internalHttpClient: {
    get: (...args: unknown[]) => internalGet(...args),
    post: vi.fn(),
  },
}));

import { normalizeTicketCategory, ticketCategoryApi } from "./ticket-category.api";

describe("ticket category visibility", () => {
  beforeEach(() => {
    publicGet.mockReset();
    internalGet.mockReset();
  });

  it("normalizes snake_case and camelCase visibility", () => {
    expect(normalizeTicketCategory({ id: "1", is_hidden: true }).is_hidden).toBe(true);
    expect(normalizeTicketCategory({ id: "2", isHidden: true }).is_hidden).toBe(true);
    expect(normalizeTicketCategory({ id: "3" }).is_hidden).toBe(false);
  });

  it("defensively removes hidden categories from public results", async () => {
    publicGet.mockResolvedValue({
      success: true,
      data: [
        { id: "public", name: "VIP A", isHidden: false },
        { id: "bulk", name: "VIP A (Komunitas)", is_hidden: true },
      ],
    });

    const response = await ticketCategoryApi.getByEvent("event-1");

    expect(response.data?.map((category) => category.id)).toEqual(["public"]);
  });

  it("keeps hidden categories available through the authenticated internal API", async () => {
    internalGet.mockResolvedValue({
      success: true,
      data: [{ id: "bulk", name: "VIP A (Komunitas)", is_hidden: true }],
    });

    const response = await ticketCategoryApi.getInternalByEvent("event-1");

    expect(internalGet).toHaveBeenCalledWith("/ticket-category/event/event-1");
    expect(response.data?.[0].is_hidden).toBe(true);
  });
});
