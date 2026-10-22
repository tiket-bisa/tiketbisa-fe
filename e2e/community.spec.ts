import { test, expect, type Page } from "@playwright/test";

const quotas = [
  {
    category_id: "north",
    category_name: "Tribun Utara (Komunitas)",
    total: 10,
    issued: 2,
  },
];
const overview = { quotas, history: [], daily: [] };
async function session(
  page: Page,
  role: "community" | "partner" | "admin" = "community",
) {
  await page.addInitScript(
    (role) =>
      localStorage.setItem(
        "tiketbisa_auth",
        JSON.stringify({
          role,
          identifier: role === "community" ? "fans" : "operator@example.com",
          email: "operator@example.com",
          name: "Fans",
          username: "fans",
          brand_id: "club",
          brand_slug: "persik",
          brand_name: "Persik Kediri",
          internal_token: "test-fixture",
        }),
      ),
    role,
  );
}
function envelope(data: unknown) {
  return {
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ success: true, status_code: 200, data }),
  };
}
test("community generates with username, preserves retry identity, and renders narrow screens", async ({
  page,
}, testInfo) => {
  await session(page);
  const requests: {
    requestId: string;
    customerEmail: string;
    tickets: { quantity: number }[];
  }[] = [];
  let completed = false;
  await page.route("**/internal-tb/**", async (route) => {
    if (route.request().resourceType() === "document") return route.continue();
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/user/me"))
      return route.fulfill(
        envelope({ role: "community", username: "fans", brandId: "club" }),
      );
    if (path.endsWith("/event"))
      return route.fulfill(
        envelope({
          events: [
            { id: "match", name: "Persik vs Lawan — Pertandingan Kandang" },
          ],
        }),
      );
    if (path.endsWith("/overview"))
      return route.fulfill(
        envelope(
          completed
            ? {
                ...overview,
                quotas: [{ ...quotas[0], issued: 5 }],
                history: [
                  {
                    transaction_id: "tx-1",
                    customer_email: "recipient@example.com",
                    username: "fans",
                    created: "2026-10-18T11:00:00+07:00",
                    category_id: "north",
                    category_name: quotas[0].category_name,
                    quantity: 3,
                    delivery_status: "PENDING",
                  },
                ],
              }
            : overview,
        ),
      );
    if (path.endsWith("/transaction/manual-generate")) {
      requests.push(route.request().postDataJSON());
      if (requests.length === 1) return route.abort("failed");
      completed = true;
      return route.fulfill(
        envelope({ north: [{ id: "ticket-1", ticketTransactionId: "tx-1" }] }),
      );
    }
    return route.fulfill(envelope({}));
  });
  await page.goto("/internal-tb/community");
  await page.getByLabel("Event aktif").selectOption("match");
  await expect(page.getByText("Nama pada tiket:")).toContainText("fans");
  await page.getByLabel("Email penerima").fill("recipient@example.com");
  await page.getByLabel("Email penerima").press("Tab");
  await expect(
    page.getByLabel(quotas[0].category_name, { exact: true }),
  ).toBeFocused();
  await page.getByLabel(quotas[0].category_name, { exact: true }).fill("3");
  await page.getByLabel(quotas[0].category_name, { exact: true }).press("Tab");
  await expect(
    page.getByRole("button", { name: "Generate dan kirim tiket" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByRole("button", { name: "Generate dan kirim tiket" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Tiket berhasil diterbitkan" }),
  ).toBeVisible();
  expect(requests).toHaveLength(2);
  expect(requests[0].requestId).toEqual(requests[1].requestId);
  expect(requests[1].tickets[0].quantity).toBe(3);
  expect(requests[1]).not.toHaveProperty("customerName");
  await expect(page.getByText("Email dalam antrean")).toBeVisible();
  await page.setViewportSize({ width: 320, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("community-mobile.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({
    path: testInfo.outputPath("community-desktop.png"),
    fullPage: true,
  });
});
test("community cannot visit the admin dashboard", async ({
  page,
}, testInfo) => {
  await session(page);
  await page.route("**/internal-tb/user/me", (route) =>
    route.fulfill(envelope({ role: "community" })),
  );
  await page.route("**/internal-tb/event?**", (route) =>
    route.fulfill(envelope({ events: [] })),
  );
  await page.goto("/internal-tb/admin");
  await expect(page).toHaveURL(/\/internal-tb\/community$/);
  await expect(
    page.getByText("Belum ada event aktif untuk klub ini."),
  ).toBeVisible();
});
test("partner allocates quota and sees daily totals per community", async ({
  page,
}, testInfo) => {
  await session(page, "partner");
  let allocated: unknown;
  await page.route("**/internal-tb/**", async (route) => {
    if (route.request().resourceType() === "document") return route.continue();
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/user/me"))
      return route.fulfill(envelope({ role: "partner" }));
    if (path.endsWith("/brand"))
      return route.fulfill(
        envelope({ brands: [{ id: "club", name: "Persik Kediri" }] }),
      );
    if (path.endsWith("/event"))
      return route.fulfill(
        envelope({ events: [{ id: "match", name: "Persik vs Lawan" }] }),
      );
    if (path.endsWith("/brand/club/access"))
      return route.fulfill(
        envelope({
          brandId: "club",
          internalUsers: [
            {
              id: "fans-id",
              username: "fans",
              role: "community",
              isActive: true,
            },
          ],
        }),
      );
    if (path.endsWith("/overview"))
      return route.fulfill(
        envelope({
          ...overview,
          daily: [
            {
              day: "2026-10-18",
              category_id: "north",
              category_name: quotas[0].category_name,
              quantity: 2,
              actions: 1,
            },
          ],
        }),
      );
    if (path.endsWith("/quotas")) {
      allocated = route.request().postDataJSON();
      return route.fulfill(envelope({ added: 5 }));
    }
    return route.fulfill(envelope({}));
  });
  await page.goto("/internal-tb/partner/communities");
  await page
    .getByLabel("Akun komunitas", { exact: true })
    .selectOption("fans-id");
  await page.getByLabel("Event", { exact: true }).selectOption("match");
  await page.getByLabel("Kategori bulk Komunitas").selectOption("north");
  await page.getByLabel("Tambahan kuota").fill("5");
  await page.getByRole("button", { name: "Tambah kuota", exact: true }).click();
  await expect(
    page.getByRole("status").filter({
      hasText: "Kuota komunitas dan total bulk event berhasil ditambah",
    }),
  ).toBeVisible();
  expect(allocated).toEqual({
    accountId: "fans-id",
    categoryId: "north",
    quantity: 5,
  });
  await expect(
    page.getByRole("heading", { name: "Rekap harian" }),
  ).toBeVisible();
  await page.setViewportSize({ width: 320, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("manage-mobile.png"),
    fullPage: true,
  });
});
test("admin community navigation reflows at tablet width", async ({ page }) => {
  await session(page, "admin");
  await page.route("**/internal-tb/**", async (route) => {
    if (route.request().resourceType() === "document") return route.continue();
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/brand"))
      return route.fulfill(
        envelope({ brands: [{ id: "club", name: "Persik Kediri" }] }),
      );
    if (path.endsWith("/event")) return route.fulfill(envelope({ events: [] }));
    if (path.endsWith("/brand/club/access"))
      return route.fulfill(envelope({ brandId: "club", internalUsers: [] }));
    return route.fulfill(envelope({ role: "admin" }));
  });
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto("/internal-tb/admin/communities");
  await page.getByLabel("Klub", { exact: true }).selectOption("club");
  await expect(
    page.getByText("Belum ada akun komunitas.", { exact: false }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("partner manages community accounts through the existing brand access flow", async ({
  page,
}) => {
  await session(page, "partner");
  let exists = false;
  let active = true;
  const saved: unknown[] = [];
  const summary = () => ({
    brandId: "club",
    internalUsers: exists
      ? [
          {
            id: "fans-id",
            username: "fans",
            role: "community",
            isActive: active,
          },
        ]
      : [],
  });
  await page.route("**/internal-tb/**", async (route) => {
    if (route.request().resourceType() === "document") return route.continue();
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/user/me"))
      return route.fulfill(envelope({ role: "partner" }));
    if (path.endsWith("/brand"))
      return route.fulfill(
        envelope({ brands: [{ id: "club", name: "Persik Kediri" }] }),
      );
    if (path.endsWith("/event")) return route.fulfill(envelope({ events: [] }));
    if (path.endsWith("/brand/club/access"))
      return route.fulfill(envelope(summary()));
    if (
      path.endsWith("/access/internal-user") &&
      route.request().method() === "POST"
    ) {
      saved.push(route.request().postDataJSON());
      exists = true;
      active = true;
      return route.fulfill(envelope(summary()));
    }
    if (
      path.endsWith("/access/internal-user/fans-id") &&
      route.request().method() === "DELETE"
    ) {
      active = false;
      return route.fulfill(envelope(summary()));
    }
    return route.fulfill(envelope({}));
  });
  await page.goto("/internal-tb/partner/communities");
  await page
    .getByText("Buat akun / atur ulang password", { exact: true })
    .click();
  await page.getByLabel("Username komunitas").fill("fans");
  await page.getByLabel("Password").fill("test-password");
  await page.getByRole("button", { name: "Simpan akun", exact: true }).click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Akun komunitas berhasil disimpan" }),
  ).toBeVisible();
  await page
    .getByLabel("Akun komunitas", { exact: true })
    .selectOption("fans-id");
  await page
    .getByRole("button", { name: "Nonaktifkan akun", exact: true })
    .click();
  await expect(
    page.getByText(
      "Simpan username yang sama dengan password baru untuk mengaktifkan kembali.",
    ),
  ).toBeVisible();
  await page.getByLabel("Username komunitas").fill("fans");
  await page.getByLabel("Password").fill("reset-password");
  await page.getByRole("button", { name: "Simpan akun", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Nonaktifkan akun", exact: true }),
  ).toBeVisible();
  expect(saved).toEqual([
    { username: "fans", password: "test-password", role: "community" },
    { username: "fans", password: "reset-password", role: "community" },
  ]);
});

test("community retries email through the existing transaction endpoint without generating tickets", async ({
  page,
}) => {
  await session(page);
  let queued = false;
  let resendBody: unknown;
  const mutations: string[] = [];
  await page.route("**/internal-tb/**", async (route) => {
    if (route.request().resourceType() === "document") return route.continue();
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() === "POST") mutations.push(path);
    if (path.endsWith("/user/me"))
      return route.fulfill(envelope({ role: "community" }));
    if (path.endsWith("/event"))
      return route.fulfill(
        envelope({ events: [{ id: "match", name: "Persik vs Lawan" }] }),
      );
    if (path.endsWith("/overview"))
      return route.fulfill(
        envelope({
          ...overview,
          history: [
            {
              transaction_id: "tx-1",
              customer_email: "recipient@example.com",
              username: "fans",
              created: "2026-10-18T11:00:00+07:00",
              category_id: "north",
              category_name: quotas[0].category_name,
              quantity: 2,
              delivery_status: queued ? "PENDING" : "FAILED",
            },
          ],
        }),
      );
    if (path.endsWith("/transaction/detail/tx-1/tickets/email")) {
      resendBody = route.request().postDataJSON();
      queued = true;
      return route.fulfill(envelope({ transactionId: "tx-1", queued: true }));
    }
    return route.fulfill(envelope({}));
  });
  await page.goto("/internal-tb/community");
  await page.getByLabel("Event aktif").selectOption("match");
  await page
    .getByRole("button", { name: "Kirim ulang email tiket", exact: true })
    .click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Email tiket dimasukkan ke antrean lagi" }),
  ).toBeVisible();
  await expect(
    page.getByText("Email dalam antrean", { exact: true }),
  ).toBeVisible();
  expect(resendBody).toEqual({ deliveryMode: "ORIGINAL_CUSTOMER_EMAIL" });
  expect(mutations).toEqual([
    "/internal-tb/transaction/detail/tx-1/tickets/email",
  ]);
});
