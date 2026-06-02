import { test, expect } from "@playwright/test";
import { seedE2eData, getTransactionDetail, approveManualTransfer } from "./helpers/e2e-api";
import { setAdminSession, setPartnerSession } from "./helpers/e2e-auth";
import { createPaymentProofFile } from "./helpers/e2e-files";

let seeded: Awaited<ReturnType<typeof seedE2eData>> | null = null;
let transactionId: string | null = null;

test.beforeAll(async ({ request }) => {
  seeded = await seedE2eData(request);
});

test.describe.serial("local smoke flows", () => {
  test("public browse and checkout", async ({ page }) => {
    if (!seeded) {
      throw new Error("Seed data missing");
    }

    page.on('request', request => console.log('>>', request.method(), request.url()));
    page.on('response', response => console.log('<<', response.status(), response.url()));

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Featured Event" })).toBeVisible();

    await page.goto(`/brand?limit=100`);
    await page.getByRole("button", { name: seeded.brand.name }).click();
    await expect(page.getByRole("heading", { name: seeded.brand.name })).toBeVisible();

    await page.goto(`/event?q=${encodeURIComponent(seeded.event.name)}`);
    await page.getByRole("link", { name: seeded.event.name }).first().click();
    await expect(page.getByRole("heading", { name: seeded.event.name }).first()).toBeVisible();

    await page.getByRole("tab", { name: /Tiket/i }).click();
    await page.getByRole("button", { name: "Increase" }).first().click();
    await page.getByRole("button", { name: "Beli Tiket" }).click();

    await page.getByLabel("Nama Lengkap").fill(seeded.buyer.name);
    await page.getByLabel("Alamat Email").fill(seeded.buyer.email);
    await page.getByLabel("Nomor Telepon").fill(seeded.buyer.phone);
    await page.locator("#identityType").selectOption(seeded.buyer.identityType);
    await page.locator("#identityNumber").fill(seeded.buyer.identityNumber);

    await page.getByRole("button", { name: /Lanjut ke Pembayaran/i }).click();

    await page.locator('button', { hasText: 'Manual Transfer' }).click();
    await page.getByLabel(/Syarat & Ketentuan/i).and(page.locator(':visible')).check();
    await page.getByLabel(/Kebijakan Privasi/i).and(page.locator(':visible')).check();
    await page.getByRole("button", { name: "Bayar Sekarang", exact: true }).and(page.locator(':visible')).click();

    await page.getByRole("button", { name: /Konfirmasi & Bayar Sekarang/i }).click();
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
    await page.getByPlaceholder(/Masukkan kode tiket/i).fill(issuedTicket.codeHash);
    await page.getByRole("button", { name: /Check In/i }).click();
    await expect(page.getByText(/Valid - Check In Berhasil/i)).toBeVisible();

    await page.getByPlaceholder(/Masukkan kode tiket/i).fill(issuedTicket.codeHash);
    await page.getByRole("button", { name: /Check In/i }).click();
    await expect(page.getByText(/Sudah Check In/i)).toBeVisible();
  });
});
