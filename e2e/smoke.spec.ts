import { test, expect, type Page } from "@playwright/test";
import {
  seedE2eData,
  getTransactionDetail,
  approveManualTransfer,
  type E2eSeedResult,
} from "./helpers/e2e-api";
import { setAdminSession, setPartnerSession } from "./helpers/e2e-auth";
import { createPaymentProofFile } from "./helpers/e2e-files";

let seeded: Awaited<ReturnType<typeof seedE2eData>> | null = null;
let transactionId: string | null = null;

async function openGatewayPayment(
  page: Page,
  seed: E2eSeedResult,
  method: "va" | "qris",
) {
  await page.goto(`/event/${seed.event.id}`);
  await page.getByRole("button", { name: "Increase" }).first().click();
  const initialLock = page.waitForResponse(
    (response) => response.url().endsWith("/transaction/lock") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Beli Tiket" }).click();
  await initialLock;

  await page.locator("#fullName").fill(seed.buyer.name);
  await page.locator("#email").fill(seed.buyer.email);
  await page.locator("#phoneNumber").fill(seed.buyer.phone);
  await page.locator("#identityNumber").fill(seed.buyer.identityNumber);
  await page.getByLabel("Samakan dengan data utama").check();

  if (method === "va") {
    await page.getByRole("button", { name: "Virtual Account", exact: true }).click();
    await page.getByRole("button", { name: "BCA", exact: true }).click();
  } else {
    await page.getByRole("button", { name: /E-Wallet \/ QRIS Instant Payment/i }).click();
    await page.getByRole("button", { name: "QRIS", exact: true }).click();
  }

  const expectedTotal = method === "va" ? "Rp 155.000" : "Rp 154.500";
  await expect(page.getByText(expectedTotal, { exact: true }).and(page.locator(":visible")).first()).toBeVisible();

  await page.getByLabel(/Syarat & Ketentuan/i).and(page.locator(":visible")).check();
  await page.getByLabel(/Kebijakan Privasi/i).and(page.locator(":visible")).check();
  await page.getByRole("button", { name: /Lanjut ke Pembayaran/i }).and(page.locator(":visible")).click();
  await page.getByRole("button", { name: "Ya, Lanjutkan" }).click();
  await expect(page).toHaveURL(/(?:\?|&)step=4(?:&|$)/);
}

test.beforeAll(async ({ request }) => {
  seeded = await seedE2eData(request);
});

test.describe.serial("local smoke flows", () => {
  test("public browse and checkout", async ({ page }) => {
    if (!seeded) {
      throw new Error("Seed data missing");
    }

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Featured Event" })).toBeVisible();

    await page.goto(`/brand?limit=100`);
    await page.getByRole("button", { name: seeded.brand.name }).click();
    await expect(page.getByRole("heading", { name: seeded.brand.name })).toBeVisible();

    await page.goto(`/event?q=${encodeURIComponent(seeded.event.name)}`);
    await page.getByRole("link", { name: seeded.event.name }).first().click();
    await expect(page.getByRole("heading", { name: seeded.event.name }).first()).toBeVisible();

    await page.getByRole("button", { name: "Increase" }).first().click();
    const initialLock = page.waitForResponse(
      (response) => response.url().endsWith("/transaction/lock") && response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Beli Tiket" }).click();
    await initialLock;

    await page.locator("#fullName").fill(seeded.buyer.name);
    await page.locator("#email").fill(seeded.buyer.email);
    await page.locator("#phoneNumber").fill(seeded.buyer.phone);
    await page.locator("#identityNumber").fill(seeded.buyer.identityNumber);
    await page.getByLabel("Samakan dengan data utama").check();
    await expect(page.locator("#fullName")).toHaveValue(seeded.buyer.name);

    await page.locator('button', { hasText: 'Manual Transfer' }).click();
    await page.getByLabel(/Syarat & Ketentuan/i).and(page.locator(':visible')).check();
    await page.getByLabel(/Kebijakan Privasi/i).and(page.locator(':visible')).check();
    await page.getByRole("button", { name: /Lanjut ke Pembayaran/i }).and(page.locator(':visible')).click();
    await page.getByRole("button", { name: "Ya, Lanjutkan" }).click();

    await expect(page.getByText("Mandiri")).toBeVisible();
    await expect(page.getByText("1010014855397")).toBeVisible();
    await expect(page.getByText("PT. Tiketbisa Digital Sejahtera")).toBeVisible();

    const proofFile = createPaymentProofFile();
    await page.setInputFiles('input[type="file"]', proofFile);
    await page.getByRole("button", { name: /Upload Bukti Pembayaran/i }).click();

    await expect(
      page.getByRole("heading", { name: /Pembayaran sedang diverifikasi/i }),
    ).toBeVisible();

    transactionId = new URL(page.url()).searchParams.get("orderId");
    expect(transactionId).toBeTruthy();
  });

  test("VA keeps the backend deadline across reload and creates an invoice", async ({ page }) => {
    if (!seeded) throw new Error("Seed data missing");

    await openGatewayPayment(page, seeded, "va");
    const deadline = await page.evaluate(() => sessionStorage.getItem("tiketbisa_checkout_deadline"));
    expect(deadline).toBeTruthy();

    await page.reload();
    await expect(page).toHaveURL(/(?:\?|&)step=4(?:&|$)/);
    const reloadedDeadline = await page.evaluate(() => sessionStorage.getItem("tiketbisa_checkout_deadline"));
    expect(Number(reloadedDeadline)).toBeLessThanOrEqual(Number(deadline));

    await expect(page.getByText("Nomor Virtual Account", { exact: true })).toBeVisible();
    await expect(page.getByText("BCA", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Salin Nomor VA" })).toBeEnabled();
  });

  test("QRIS keeps the backend deadline across reload and creates a QR", async ({ page }) => {
    if (!seeded) throw new Error("Seed data missing");

    await openGatewayPayment(page, seeded, "qris");
    const deadline = await page.evaluate(() => sessionStorage.getItem("tiketbisa_checkout_deadline"));
    expect(deadline).toBeTruthy();

    await page.reload();
    const reloadedDeadline = await page.evaluate(() => sessionStorage.getItem("tiketbisa_checkout_deadline"));
    expect(Number(reloadedDeadline)).toBeLessThanOrEqual(Number(deadline));
    await expect(page.getByText("Selesaikan Pembayaran QRIS", { exact: true })).toBeVisible();
    await expect(page.getByText("Perbesar", { exact: true })).toBeVisible();
  });

  test("internal admin approval and partner scan", async ({ page, request }) => {
    if (!seeded) {
      throw new Error("Seed data missing");
    }
    expect(transactionId).toBeTruthy();

    await setAdminSession(page, seeded.admin);
    await page.goto("/internal-tb/admin");
    await expect(page.getByRole("heading", { name: /Dashboard Admin/i })).toBeVisible();

    await page.goto(`/internal-tb/admin/transactions/${transactionId}`);
    await expect(page.getByRole("heading", { name: /Detail Transaksi/i })).toBeVisible();

    await page.getByRole("button", { name: "Approve" }).click();
    await expect(page.getByRole("heading", { name: /Dashboard Admin/i })).toBeVisible();

    const detail = await getTransactionDetail(request, transactionId as string, seeded.admin.email);
    const issuedTicket = detail.ticketDetails?.[0]?.issuedTickets?.[0];
    expect(issuedTicket?.codeHash).toBeTruthy();

    await setPartnerSession(page, seeded.partner);
    await page.goto("/internal-tb/partner");
    await expect(page.getByRole("heading", { name: /Beranda/i })).toBeVisible();

    await page.goto("/internal-tb/partner/scan");
    await page.getByLabel("Event").selectOption({ label: seeded.event.name });
    await page.getByLabel("Kategori Tiket").selectOption({ label: seeded.ticketCategory.name });
    await page.getByRole("button", { name: "Terapkan" }).click();
    await page.getByPlaceholder(/Masukkan kode tiket/i).fill(issuedTicket.codeHash);
    await page.getByRole("button", { name: "Validasi" }).click();
    await expect(page.getByText("VALID", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Check In" }).click();
    await expect(page.getByText("SUCCESS CHECKED-IN", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Tutup hasil scan" }).click();
    await page.getByPlaceholder(/Masukkan kode tiket/i).fill(issuedTicket.codeHash);
    await page.getByRole("button", { name: "Validasi" }).click();
    await expect(page.getByText("ALREADY CHECKED-IN", { exact: true })).toBeVisible();
  });
});
