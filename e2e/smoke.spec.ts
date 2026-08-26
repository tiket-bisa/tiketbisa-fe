import { test, expect, type Page } from "@playwright/test";
import {
  seedE2eData,
  getTransactionDetail,
  postPaymentSessionWebhook,
  type E2eSeedResult,
} from "./helpers/e2e-api";
import { setAdminSession, setPartnerSession } from "./helpers/e2e-auth";
import { createPaymentProofFile } from "./helpers/e2e-files";

let seeded: Awaited<ReturnType<typeof seedE2eData>> | null = null;
let transactionId: string | null = null;

interface HostedMethod {
  id: "va" | "qris";
  name: string;
  expectedTotal: string;
}

const nativeMethods: HostedMethod[] = [
  { id: "va", name: "Virtual Account", expectedTotal: "Rp 155.000" },
  { id: "qris", name: "QRIS", expectedTotal: "Rp 154.500" },
];

async function openNativePayment(
  page: Page,
  seed: E2eSeedResult,
  method: HostedMethod,
): Promise<string> {
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

  await page.getByRole("button", { name: new RegExp(`^${method.name}`) }).click();
  await expect(page.getByText(method.expectedTotal, { exact: true }).and(page.locator(":visible")).first()).toBeVisible();

  await page.locator('[data-checkout-consent]:visible input[type="checkbox"]').nth(0).check();
  await page.locator('[data-checkout-consent]:visible input[type="checkbox"]').nth(1).check();
  await page.getByRole("button", { name: /Lanjut ke Pembayaran/i }).and(page.locator(":visible")).click();
  await page.getByRole("button", { name: "Ya, Lanjutkan" }).click();
  await expect(page.getByRole("heading", {
    name: method.id === "qris" ? "Pembayaran QRIS" : "Pembayaran Virtual Account",
  })).toBeVisible();
  const transactionId = new URL(page.url()).searchParams.get("orderId");
  expect(transactionId).toBeTruthy();
  return transactionId as string;
}

test.beforeAll(async ({ request }) => {
  seeded = await seedE2eData(request);
});

test.describe.serial("local smoke flows", () => {
  test("abandoned checkout releases its ticket reservation", async ({ page, request }) => {
    if (!seeded) throw new Error("Seed data missing");

    await page.goto(`/event/${seeded.event.id}`);
    await page.getByRole("button", { name: "Increase" }).first().click();
    const initialLock = page.waitForResponse(
      (response) => response.url().endsWith("/transaction/lock") && response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Beli Tiket" }).click();
    const lockResponse = await initialLock;
    const lockEnvelope = await lockResponse.json();
    const lockId = lockEnvelope.data?.userId as string;
    expect(lockId).toBeTruthy();

    const releaseResponse = page.waitForResponse(
      (response) => response.url().endsWith(`/transaction/lock/${lockId}`)
        && response.request().method() === "DELETE",
    );
    await page.getByRole("button", { name: "Kembali" }).first().click();
    await expect((await releaseResponse).ok()).toBeTruthy();

    const ttlResponse = await request.get(
      `${process.env.E2E_API_BASE_URL ?? "http://localhost:8080"}/transaction/ttl/locks/`
        + `${seeded.event.id}/${seeded.ticketCategory.id}/${lockId}`,
    );
    const ttlEnvelope = await ttlResponse.json();
    expect(Number(ttlEnvelope.data?.remainingSeconds ?? ttlEnvelope.data?.remaining_seconds ?? 0)).toBe(0);
  });

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
    await page.locator('[data-checkout-consent]:visible input[type="checkbox"]').nth(0).check();
    await page.locator('[data-checkout-consent]:visible input[type="checkbox"]').nth(1).check();
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

  test("native QRIS completes only after the verified webhook", async ({ page, request }) => {
    if (!seeded) throw new Error("Seed data missing");

    const hostedTransactionId = await openNativePayment(page, seeded, nativeMethods[1]);
    await page.getByRole("button", { name: "Tampilkan QRIS" }).click();
    await expect(page.getByText(/QRIS siap dipindai/)).toBeVisible();
    await expect(page.getByText(/Xendit/i)).toHaveCount(0);

    await postPaymentSessionWebhook(request, hostedTransactionId, "payment_session.completed");
    await postPaymentSessionWebhook(request, hostedTransactionId, "payment_session.completed");
    await expect(page.getByRole("heading", { name: "Pembayaran Berhasil!" })).toBeVisible({ timeout: 15_000 });

    const detail = await getTransactionDetail(request, hostedTransactionId, seeded.admin.email);
    expect(detail.transaction.status).toBe("COMPLETED");
    expect(detail.ticketDetails[0]?.issuedTickets).toHaveLength(1);
  });

  test("dynamic VA bank selection is native and an expired session is recorded", async ({ page, request }) => {
    if (!seeded) throw new Error("Seed data missing");

    const lastTransactionId = await openNativePayment(page, seeded, nativeMethods[0]);
    await page.getByLabel("Pilih bank Virtual Account").selectOption("BRI_VIRTUAL_ACCOUNT");
    await page.getByRole("button", { name: "Buat Nomor Virtual Account" }).click();
    await expect(page.getByText(/Nomor VA BRI siap digunakan/)).toBeVisible();
    await expect(page.getByText(/Xendit/i)).toHaveCount(0);
    await postPaymentSessionWebhook(request, lastTransactionId, "payment_session.expired");

    await setAdminSession(page, seeded.admin);
    await page.goto("/internal-tb/admin");
    const expiredRow = page.getByRole("row").filter({ hasText: lastTransactionId });
    await expect(expiredRow.getByText("Expired", { exact: true })).toBeVisible();
    await expiredRow.getByRole("button", { name: "Detail" }).click();
    await expect(page).toHaveURL(/\/internal-tb\/admin\/transactions\//);
    await expect(page.getByRole("heading", { name: "Detail Transaksi" })).toBeVisible();
    await expect(page.getByText("Expired", { exact: true })).toBeVisible();
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
    await page.reload();
    await expect(page.getByText("Kategori Aktif", { exact: true })).toBeVisible();
    await expect(page.getByText(`${seeded.event.name} — ${seeded.ticketCategory.name}`, { exact: true })).toBeVisible();
    await page.getByPlaceholder(/Masukkan kode tiket/i).fill(issuedTicket.codeHash);
    await page.getByRole("button", { name: "Validasi" }).click();
    await expect(page.getByText("VALID", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Check In" }).click();
    await expect(page.getByText("SUCCESS CHECKED-IN", { exact: true })).toBeVisible();
    await expect(page.getByText("Tiket berhasil check-in", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Tutup hasil scan" }).click();
    await page.getByPlaceholder(/Masukkan kode tiket/i).fill(issuedTicket.codeHash);
    await page.getByRole("button", { name: "Validasi" }).click();
    await expect(page.getByText("ALREADY CHECKED-IN", { exact: true })).toBeVisible();
  });
});
