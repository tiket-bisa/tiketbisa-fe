import { test, expect } from "@playwright/test";

const categories = [
  {
    id: "vip",
    eventId: "match",
    name: "VIP Utama — Nama Kategori Panjang untuk Pertandingan Kandang",
    categoryCode: "VIP",
    totalTicket: 100,
    issuedTicket: 10,
    soldTicket: 7,
    reservedTicket: 6,
    remainingTicket: 87,
    checkedInTicket: 2,
    price: 100000,
  },
  {
    id: "regular",
    eventId: "match",
    name: "Reguler",
    categoryCode: "REG",
    totalTicket: 500,
    issuedTicket: 100,
    soldTicket: 90,
    reservedTicket: 10,
    remainingTicket: 400,
    checkedInTicket: 20,
    price: 50000,
  },
];

for (const role of ["admin", "partner"] as const) {
  test(`${role} category filter scopes summaries and lists and can return to all categories`, async ({
    page,
  }) => {
    const requests: URL[] = [];
    await page.addInitScript(
      (role) =>
        localStorage.setItem(
          "tiketbisa_auth",
          JSON.stringify({
            role,
            identifier: "operator@example.com",
            email: "operator@example.com",
            name: "Operator",
            brand_id: "club",
            internal_token: "fixture",
          }),
        ),
      role,
    );
    await page.route("**/internal-tb/**", async (route) => {
      if (route.request().resourceType() === "document")
        return route.continue();
      const url = new URL(route.request().url());
      let data: unknown = {};
      if (url.pathname.endsWith("/tickets/dashboard")) {
        requests.push(url);
        const selected = categories.filter(
          (c) =>
            !url.searchParams.get("categoryId") ||
            c.id === url.searchParams.get("categoryId"),
        );
        data = {
          event: {
            id: "match",
            name: "Persik Kediri VS PSS Sleman",
            status: "ONGOING",
            endDate: "2099-10-20T00:00:00Z",
          },
          categories,
          inventory: {
            totalTicket: selected.reduce((sum, c) => sum + c.totalTicket, 0),
            remainingTicket: selected.reduce(
              (sum, c) => sum + c.remainingTicket,
              0,
            ),
            checkedInTicket: selected.reduce(
              (sum, c) => sum + c.checkedInTicket,
              0,
            ),
          },
          revenue: selected.reduce((sum, c) => sum + c.soldTicket * c.price, 0),
          soldTickets: selected.reduce((sum, c) => sum + c.soldTicket, 0),
          issuedTickets: selected.map((c) => ({
            id: `ticket-${c.id}`,
            ticketCategoryId: c.id,
            categoryName: c.name,
            status: "ISSUED",
            customerName: `Buyer ${c.id}`,
          })),
          totalCount: selected.length,
          limit: 50,
          offset: 0,
        };
      } else if (url.pathname.endsWith("/transaction")) {
        data = { transactions: [], totalCount: 0, totalPages: 1 };
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, status_code: 200, data }),
      });
    });
    await page.goto(`/internal-tb/${role}/events/match/tickets`);
    const filter = page.getByLabel("Kategori", { exact: true });
    const summary = (name: string) =>
      page
        .locator("div.rounded-xl")
        .filter({
          has: page.getByText(name, { exact: true }).and(page.locator("p")),
        });
    await expect(filter).toBeVisible();
    expect((await filter.boundingBox())!.y).toBeLessThan(
      (await summary("Kuota").boundingBox())!.y,
    );
    await filter.focus();
    await expect(filter).toBeFocused();
    await filter.selectOption("vip");
    await expect(page.getByText("Buyer regular", { exact: true })).toHaveCount(
      0,
    );
    await expect(page.getByText("Buyer vip", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Reguler", exact: true }),
    ).toHaveCount(0);
    await expect(filter.locator("option")).toHaveCount(3);
    await expect(summary("Kuota")).toContainText("100");
    await expect(summary("Direservasi")).toContainText("6");
    await expect(summary("Sisa")).toContainText("87");
    await expect(summary("Terjual & Lunas")).toContainText("7");
    await expect(summary("Checked In")).toContainText("2");
    await expect(summary("Revenue Event")).toContainText("700.000");
    expect(requests.at(-1)?.searchParams.get("categoryId")).toBe("vip");
    await page.getByLabel("Status", { exact: true }).selectOption("CHECKED_IN");
    await expect
      .poll(() => requests.at(-1)?.searchParams.get("status"))
      .toBe("CHECKED_IN");
    expect(requests.at(-1)?.searchParams.get("categoryId")).toBe("vip");
    await filter.selectOption("regular");
    await expect(
      page.getByText("Buyer regular", { exact: true }),
    ).toBeVisible();
    await expect(summary("Kuota")).toContainText("500");
    await filter.selectOption("all");
    await expect(page.getByText("Buyer vip", { exact: true })).toBeVisible();
    await expect(summary("Kuota")).toContainText("600");
    await expect(summary("Sisa")).toContainText("487");
    await expect(summary("Direservasi")).toContainText("16");
    await expect(summary("Checked In")).toContainText("22");
    for (const width of [320, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(filter).toBeVisible();
      expect(
        await page.evaluate(
          () =>
            document.querySelector("main")!.scrollWidth <=
            document.querySelector("main")!.clientWidth,
        ),
      ).toBeTruthy();
    }
    await page.screenshot({
      path: `/tmp/category-dashboard-${role}.png`,
      fullPage: true,
    });
  });
}
