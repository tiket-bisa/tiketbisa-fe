# Tiketbisa Frontend

Event ticketing platform — React Router 7, TypeScript, Tailwind CSS v4, Vite.

## Changelog

### 23 August 2026 — Payment Sessions production rollout

This release added the hosted checkout flow for activated payment methods,
production quality gates and rollback, sanitized user-facing messages, and
reliable release of abandoned checkout locks. It also simplified the order
summary by hiding internal fee formulas and per-ticket fee breakdowns.

Each file below documents its exact added and removed lines. Whitespace-only
content is shown with `␠` markers so the Markdown remains valid.

#### [#59 — feat: support hosted Xendit checkout](https://github.com/tiket-bisa/tiketbisa-fe/pull/59)

Merged `09d5058` · 22 files · +326 / -253

<details>
<summary>Files changed with added/removed lines</summary>

<details>
<summary><code>app/core/api/services/transaction.api.test.ts</code></summary>

**Added lines**

``````diff
+import { describe, expect, it } from "vitest";
+import { mapTransactionApiToFe, type TransactionApiData } from "./transaction.api";
+
+function transaction(status: string): TransactionApiData {
+  return {
+    id: "tx-1",
+    customerName: "Buyer",
+    customerEmail: "buyer@example.com",
+    customerPhone: "08123456789",
+    totalPrice: 10000,
+    status,
+    paymentMethod: "VA",
+    paymentDate: "2026-08-23T00:00:00Z",
+    created: "2026-08-23T00:00:00Z",
+  };
+}
+
+describe("mapTransactionApiToFe", () => {
+  it.each([
+    ["EXPIRED", "expired"],
+    ["WAITING_PAYMENT", "pending"],
+    ["WAITING_APPROVAL", "pending"],
+    ["COMPLETED", "paid"],
+    ["PAID", "paid"],
+    ["CANCELED", "cancelled"],
+    ["CANCELLED", "cancelled"],
+  ] as const)("maps backend status %s to %s", (backendStatus, frontendStatus) => {
+    expect(mapTransactionApiToFe(transaction(backendStatus)).status).toBe(frontendStatus);
+  });
+});
``````

**Removed lines:** None

</details>

<details>
<summary><code>app/core/api/services/transaction.api.ts</code></summary>

**Added lines**

``````diff
+    if (normalizedStatus === "EXPIRED") return "expired";
``````

**Removed lines:** None

</details>

<details>
<summary><code>app/core/constants/transaction.test.ts</code></summary>

**Added lines**

``````diff
+import { describe, expect, it } from "vitest";
+import { mapTransactionStatusFilterToApi, STATUS_MAP, statusFilterOptions } from "./transaction";
+
+describe("transaction status configuration", () => {
+  it("renders expired as a destructive status", () => {
+    expect(STATUS_MAP.expired).toEqual({ label: "Expired", variant: "destructive" });
+  });
+
+  it("exposes an expired filter backed by EXPIRED", () => {
+    expect(statusFilterOptions).toContainEqual({ value: "expired", label: "Expired" });
+    expect(mapTransactionStatusFilterToApi("expired")).toBe("EXPIRED");
+  });
+});
``````

**Removed lines:** None

</details>

<details>
<summary><code>app/core/constants/transaction.ts</code></summary>

**Added lines**

``````diff
+  expired: { label: "Expired", variant: "destructive" },
+  { value: "expired", label: "Expired" },
+
+export function mapTransactionStatusFilterToApi(statusFilter: "all" | TransactionStatus): string | undefined {
+  if (statusFilter === "all") return undefined;
+  if (statusFilter === "pending") return "WAITING_APPROVAL";
+  return statusFilter.toUpperCase();
+}
``````

**Removed lines:** None

</details>

<details>
<summary><code>app/core/types/index.ts</code></summary>

**Added lines**

``````diff
+  status: "pending" | "paid" | "cancelled" | "refunded" | "expired";
``````

**Removed lines**

``````diff
-  status: "pending" | "paid" | "cancelled" | "refunded";
``````

</details>

<details>
<summary><code>app/modules/admin/dashboard/presentation/components/transaction-table.test.tsx</code></summary>

**Added lines**

``````diff
+// @vitest-environment jsdom
+import { render, screen } from "@testing-library/react";
+import { MemoryRouter } from "react-router";
+import { describe, expect, it } from "vitest";
+import type { Transaction } from "~/core/types";
+import { TransactionTable } from "./transaction-table";
+
+describe("TransactionTable", () => {
+  it("shows an expired transaction as Expired instead of Menunggu", () => {
+    const expiredTransaction: Transaction = {
+      id: "tx-expired",
+      event_id: "event-1",
+      event_name: "Event",
+      buyer_name: "Buyer",
+      buyer_email: "buyer@example.com",
+      ticket_name: "Regular",
+      quantity: 1,
+      total_price: 10000,
+      status: "expired",
+    };
+
+    render(
+      <MemoryRouter>
+        <TransactionTable transactions={[expiredTransaction]} />
+      </MemoryRouter>,
+    );
+
+    expect(screen.getByText("Expired")).toBeTruthy();
+    expect(screen.queryByText("Menunggu")).toBeNull();
+  });
+});
``````

**Removed lines:** None

</details>

<details>
<summary><code>app/modules/admin/dashboard/presentation/dashboard.page.tsx</code></summary>

**Added lines**

``````diff
+import { mapTransactionStatusFilterToApi, statusFilterOptions, type TransactionStatus } from "~/core/constants/transaction";
+        status: mapTransactionStatusFilterToApi(statusFilter as "all" | TransactionStatus),
``````

**Removed lines**

``````diff
-import { statusFilterOptions } from "~/core/constants/transaction";
-function mapStatusFilterToApi(statusFilter: string): string | undefined {
-  if (statusFilter === "all") return undefined;
-  if (statusFilter === "pending") return "WAITING_APPROVAL";
-  return statusFilter.toUpperCase();
-}
-
-        status: mapStatusFilterToApi(statusFilter),
``````

</details>

<details>
<summary><code>app/modules/external/checkout/domain/checkout.pricing.test.ts</code></summary>

**Added lines**

``````diff
+
+  it("uses backend-configured hosted channel fee", () => {
+    const baseSummary = buildBaseOrderSummary(mockEvent, mockItems);
+    const summary = buildPaymentOrderSummary(baseSummary, {
+      id: "astrapay", name: "AstraPay", logo: "", category: "E_WALLET",
+      paymentMethod: "EWALLET", feeType: "FLAT", feeValue: 5000,
+    });
+    expect(summary.transactionFee).toBe(5000);
+    expect(summary.totalPrice).toBe(227500);
+  });
``````

**Removed lines:** None

</details>

<details>
<summary><code>app/modules/external/checkout/domain/checkout.pricing.ts</code></summary>

**Added lines**

``````diff
+  if (paymentMethod.feeType === "FLAT") {
+    return { transactionFee: Math.round(paymentMethod.feeValue ?? 0), transactionFeeDescription: `${paymentMethod.name} Rp ${formatRupiah(paymentMethod.feeValue ?? 0)}` };
+  }
+  if (paymentMethod.feeType === "PERCENT") {
+    const rate = paymentMethod.feeValue ?? 0;
+    return { transactionFee: Math.ceil((baseAmount * rate) / 100), transactionFeeDescription: `${paymentMethod.name} ${rate}% dari sub total + biaya layanan` };
+  }
+  if (paymentMethod.feeType === "NONE") return { transactionFee: 0 };
+
``````

**Removed lines:** None

</details>

<details>
<summary><code>app/modules/external/checkout/domain/checkout.types.ts</code></summary>

**Added lines**

``````diff
+export type PaymentCategory = "BANK_TRANSFER" | "E_WALLET_QRIS" | "QRIS" | "E_WALLET" | "PAYLATER" | "OVER_THE_COUNTER";
+  paymentMethod?: string;
+  feeType?: "NONE" | "FLAT" | "PERCENT";
+  feeValue?: number;
+  requiresBankSelection?: boolean;
+  paymentUrl?: string | null;
``````

**Removed lines**

``````diff
-export type PaymentCategory = "BANK_TRANSFER" | "E_WALLET_QRIS";
``````

</details>

<details>
<summary><code>app/modules/external/checkout/domain/checkout.validation.test.ts</code></summary>

**Added lines**

``````diff
+
+  it("does not require a bank when hosted Xendit will collect the bank choice", () => {
+    expect(canProceedWithPayment({ ...validSelection, methodId: "va", bankCode: null }, false)).toBe(true);
+  });
``````

**Removed lines:** None

</details>

<details>
<summary><code>app/modules/external/checkout/domain/checkout.validation.ts</code></summary>

**Added lines**

``````diff
+export function canProceedWithPayment(selection: PaymentSelection, requiresBankSelection = selection.methodId === "va"): boolean {
+    && (!requiresBankSelection || selection.bankCode),
``````

**Removed lines**

``````diff
-export function canProceedWithPayment(selection: PaymentSelection): boolean {
-    && (selection.methodId !== "va" || selection.bankCode),
``````

</details>

<details>
<summary><code>app/modules/external/checkout/infrastructure/order.api.ts</code></summary>

**Added lines**

``````diff
+  paymentUrl?: string | null;
+  paymentUrl?: string | null;
+  paymentUrl?: string | null;
+        id: "astrapay",
+        name: "AstraPay",
+        category: "E_WALLET",
+    case "PAYLATER":
+      return { id: "akulaku", name: "Akulaku", logo: "", category: "PAYLATER" };
+    case "OVER_THE_COUNTER":
+      return { id: "indomaret", name: "Indomaret", logo: "", category: "OVER_THE_COUNTER" };
+    let backendPaymentMethod = paymentMethod.paymentMethod ?? "MANUAL_TRANSFER";
+    if (!paymentMethod.paymentMethod && paymentMethod.category === "BANK_TRANSFER") {
+    } else if (!paymentMethod.paymentMethod && paymentMethod.category === "E_WALLET_QRIS") {
+      paymentUrl?: string | null;
+    const { virtualAccount, qrPayload, paymentUrl, gatewayStatus, gatewayExpiry, ...ticketsByCategory } = response.data;
+      paymentUrl: paymentUrl ?? transactionSnapshot?.paymentUrl ?? null,
+      const paymentUrl = (data.paymentUrl as string | null | undefined) ?? null;
+        paymentUrl,
+        paymentUrl: data.paymentUrl ?? null,
``````

**Removed lines**

``````diff
-        id: "ewallet",
-        name: "E-Wallet",
-        category: "E_WALLET_QRIS",
-    let backendPaymentMethod = "MANUAL_TRANSFER";
-    if (paymentMethod.category === "BANK_TRANSFER") {
-    } else if (paymentMethod.category === "E_WALLET_QRIS") {
-    const { virtualAccount, qrPayload, gatewayStatus, gatewayExpiry, ...ticketsByCategory } = response.data;
``````

</details>

<details>
<summary><code>app/modules/external/checkout/infrastructure/payment.api.test.ts</code></summary>

**Added lines**

``````diff
+      paymentSessionEnabled: false,
+      paymentMethods: [],
+    await expect(paymentApi.getConfiguration()).resolves.toEqual({ virtualAccountBanks: [], paymentSessionEnabled: false, paymentMethods: [] });
+  });
+
+  it("maps hosted methods without requiring a local VA bank choice", async () => {
+    mockApiFetch.mockResolvedValueOnce({
+      success: true,
+      data: {
+        paymentSessionEnabled: true,
+        virtualAccountBanks: [],
+        paymentMethods: [{ id: "va", name: "Virtual Account", category: "BANK_TRANSFER", paymentMethod: "VA", feeType: "FLAT", feeValue: 5000 }],
+      },
+    } as any);
+    const result = await paymentApi.getConfiguration();
+    expect(result.paymentSessionEnabled).toBe(true);
+    expect(result.paymentMethods[0]).toMatchObject({ id: "va", requiresBankSelection: false, feeValue: 5000 });
+    await expect(paymentApi.getConfiguration()).resolves.toEqual({ virtualAccountBanks: [], paymentSessionEnabled: false, paymentMethods: [] });
``````

**Removed lines**

``````diff
-    await expect(paymentApi.getConfiguration()).resolves.toEqual({ virtualAccountBanks: [] });
-    await expect(paymentApi.getConfiguration()).resolves.toEqual({ virtualAccountBanks: [] });
``````

</details>

<details>
<summary><code>app/modules/external/checkout/infrastructure/payment.api.ts</code></summary>

**Added lines**

``````diff
+  { id: "va", name: "Virtual Account", logo: "", category: "BANK_TRANSFER", requiresBankSelection: true },
+  async getConfiguration(): Promise<{ virtualAccountBanks: VirtualAccountBank[]; paymentSessionEnabled: boolean; paymentMethods: PaymentMethod[] }> {
+      const response = await apiFetch<ApiResponse<{ virtualAccountBanks: VirtualAccountBank[]; paymentSessionEnabled?: boolean; paymentMethods?: PaymentMethod[] }>>(
+      if (!response.success || !response.data) return { virtualAccountBanks: [], paymentSessionEnabled: false, paymentMethods: [] };
+      return {
+        virtualAccountBanks: response.data.virtualAccountBanks ?? [],
+        paymentSessionEnabled: response.data.paymentSessionEnabled ?? false,
+        paymentMethods: (response.data.paymentMethods ?? []).map((method) => ({ ...method, logo: method.logo ?? "", requiresBankSelection: false })),
+      };
+      return { virtualAccountBanks: [], paymentSessionEnabled: false, paymentMethods: [] };
``````

**Removed lines**

``````diff
-  { id: "va", name: "Virtual Account", logo: "", category: "BANK_TRANSFER" },
-  async getConfiguration(): Promise<{ virtualAccountBanks: VirtualAccountBank[] }> {
-      const response = await apiFetch<ApiResponse<{ virtualAccountBanks: VirtualAccountBank[] }>>(
-      if (!response.success || !response.data) return { virtualAccountBanks: [] };
-      return { virtualAccountBanks: response.data.virtualAccountBanks ?? [] };
-      return { virtualAccountBanks: [] };
``````

</details>

<details>
<summary><code>app/modules/external/checkout/presentation/checkout.page.tsx</code></summary>

**Added lines**

``````diff
+  const configuredMethods = paymentConfiguration.paymentSessionEnabled && paymentConfiguration.paymentMethods.length > 0
+    ? paymentConfiguration.paymentMethods
+    : paymentMethods;
+  const availablePaymentMethods = paymentConfiguration.paymentSessionEnabled || paymentConfiguration.virtualAccountBanks.length > 0
+    ? configuredMethods
+    : configuredMethods.filter((method) => method.id !== "va");
+    paymentSessionEnabled: paymentConfiguration.paymentSessionEnabled,
+  const { event, paymentMethods, virtualAccountBanks, paymentSessionEnabled, order } = loaderData;
+      paymentUrl: completedOrder.paymentUrl ?? order.paymentUrl,
+                  paymentSessionEnabled={paymentSessionEnabled}
``````

**Removed lines**

``````diff
-  const availablePaymentMethods = paymentConfiguration.virtualAccountBanks.length > 0
-    ? paymentMethods
-    : paymentMethods.filter((method) => method.id !== "va");
-  const { event, paymentMethods, virtualAccountBanks, order } = loaderData;
``````

</details>

<details>
<summary><code>app/modules/external/checkout/presentation/components/steps/payment-instruction.tsx</code></summary>

**Added lines**

``````diff
+    paymentUrl?: string | null;
+    paymentUrl: order.paymentUrl,
+      paymentUrl: order.paymentUrl,
+  }, [order.virtualAccount, order.qrPayload, order.gatewayExpiry, order.paymentUrl]);
+      paymentUrl: result.paymentUrl ?? prev.paymentUrl,
+  if (!isManualTransfer && gatewayData.paymentUrl) {
+    return (
+      <Card className="max-w-2xl mx-auto p-8 md:p-12 rounded-3xl text-center space-y-6">
+        <div className="space-y-2">
+          <h2 className="text-2xl font-black text-text-primary">Pembayaran masih aktif</h2>
+          <p className="text-sm font-medium text-text-secondary">
+            Pilihan channel dan instruksi pembayaran tersedia di halaman aman Xendit sampai {deadline} WIB.
+          </p>
+        </div>
+        <Button onClick={() => window.location.assign(gatewayData.paymentUrl!)} className="w-full py-5 rounded-2xl text-lg font-black">
+          Lanjut ke Xendit
+        </Button>
+        <button type="button" onClick={onBack} className="text-sm font-bold text-text-secondary hover:text-text-primary cursor-pointer">
+          Keluar dari halaman pembayaran
+        </button>
+      </Card>
+    );
+  }
+
``````

**Removed lines**

``````diff
-  }, [order.virtualAccount, order.qrPayload, order.gatewayExpiry]);
``````

</details>

<details>
<summary><code>app/modules/external/checkout/presentation/components/steps/payment-method-selection.tsx</code></summary>

**Added lines**

``````diff
+import type { PaymentMethod, VirtualAccountBank } from "../../../domain/checkout.types";
+  paymentSessionEnabled?: boolean;
+export function PaymentMethodSelection({ methods, virtualAccountBanks, paymentSessionEnabled = false,
+  selectedMethodId, onSelect, selectedBankCode, onSelectBank, className = "" }: PaymentMethodSelectionProps) {
+    <Card className={`p-6 md:p-8 rounded-3xl border-gray-100 ${className}`}>
+      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
+        {methods.map((method) => (
+          <button key={method.id} type="button" onClick={() => onSelect(method.id)}
+            className={`relative min-h-24 rounded-2xl border-2 p-4 text-left transition-all cursor-pointer ${selectedMethodId === method.id
+              ? "border-brand-primary bg-brand-primary/[0.04] ring-1 ring-brand-primary/20"
+              : "border-gray-200 bg-white hover:border-gray-400"}`}>
+            <span className="block text-sm font-black text-text-primary">{method.name}</span>
+            <span className="mt-2 block text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
+              {method.id === "manual" || method.id === "manual_transfer" ? "Verifikasi manual" : "Diproses oleh Xendit"}
+            </span>
+          </button>
+        ))}
+      </div>
+      {!paymentSessionEnabled && selectedMethodId === "va" && (
+        <div className="mt-6 space-y-3 border-t border-gray-100 pt-6">
+          <p className="text-xs font-black uppercase tracking-widest text-text-tertiary">Pilih Bank</p>
+          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
+            {virtualAccountBanks.map((bank) => (
+              <button key={bank.code} type="button" onClick={() => onSelectBank?.(bank.code)}
+                className={`h-14 rounded-xl border-2 text-sm font-black cursor-pointer ${selectedBankCode === bank.code
+                  ? "border-brand-primary text-brand-primary"
+                  : "border-gray-200 text-text-primary hover:border-gray-400"}`}>
+                {bank.name}
+      )}
+    </Card>
``````

**Removed lines**

``````diff
-import { useState } from "react";
-import type { PaymentMethod, PaymentCategory, VirtualAccountBank } from "../../../domain/checkout.types";
-export function PaymentMethodSelection({
-  methods,
-  virtualAccountBanks,
-  selectedMethodId,
-  onSelect,
-  selectedBankCode,
-  onSelectBank,
-  className = "",
-}: PaymentMethodSelectionProps) {
-  const [expandedCategory, setExpandedCategory] = useState<PaymentCategory | null>("BANK_TRANSFER");
-
-  const bankTransferMethods = methods.filter((m) => m.category === "BANK_TRANSFER");
-  const eWalletMethods = methods.filter((m) => m.category === "E_WALLET_QRIS");
-
-  const toggleCategory = (category: PaymentCategory) => {
-    setExpandedCategory(expandedCategory === category ? null : category);
-  };
-
-    <div className={`space-y-4 ${className}`}>
-      {/* Bank Transfer Section */}
-      <Card className="overflow-hidden border-gray-100 rounded-3xl shadow-sm bg-white">
-        <button
-          onClick={() => toggleCategory("BANK_TRANSFER")}
-          className="w-full p-8 flex items-center justify-between hover:bg-gray-50/50 transition-colors text-left cursor-pointer"
-        >
-          <div className="flex items-center gap-4">
-            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
-              <svg className="h-6 w-6 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
-                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
-              </svg>
-            </div>
-            <div>
-              <h3 className="text-lg font-black text-text-primary">Transfer Bank</h3>
-              <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest mt-0.5">Virtual Account</p>
-            </div>
-          </div>
-          <svg␠
-            className={`h-6 w-6 text-text-tertiary transition-transform duration-300 ${expandedCategory === "BANK_TRANSFER" ? "rotate-180" : ""}`}␠
-            fill="none"␠
-            viewBox="0 0 24 24"␠
-            stroke="currentColor"
-          >
-            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
-          </svg>
-        </button>
-␠␠␠␠␠␠␠␠
-        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedCategory === "BANK_TRANSFER" ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}`}>
-          <div className="p-8 pt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
-            {bankTransferMethods.map((method) => (
-              <button
-                key={method.id}
-                onClick={() => onSelect(method.id)}
-                className={`relative flex items-center justify-center p-6 rounded-2xl border-2 transition-all h-24 cursor-pointer ${
-                  selectedMethodId === method.id
-                    ? "border-brand-primary bg-brand-primary/[0.04] ring-1 ring-brand-primary/20"
-                    : "border-gray-200 hover:border-gray-400 bg-white"
-                }`}
-              >
-                <span className={`text-sm font-black uppercase tracking-tighter ${selectedMethodId === method.id ? "text-brand-primary" : "text-text-primary"}`}>
-                  {method.name}
-                </span>
-                {selectedMethodId === method.id && (
-                  <div className="absolute top-2 right-2">
-                     <div className="bg-brand-primary rounded-full p-1 shadow-lg shadow-brand-primary/20 border-2 border-white">
-                       <svg className="h-2 w-2 text-base-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={5}>
-                         <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
-                       </svg>
-                     </div>
-                  </div>
-                )}
-            </div>
-
-            {selectedMethodId === "va" && (
-              <div className="px-8 pb-8 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
-                <p className="text-xs font-black text-text-tertiary uppercase tracking-widest">
-                  Pilih Bank
-                </p>
-                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
-                  {virtualAccountBanks.map((bank) => (
-                    <button
-                      key={bank.code}
-                      type="button"
-                      onClick={() => onSelectBank?.(bank.code)}
-                      className={`relative flex items-center justify-center p-4 rounded-xl border-2 transition-all h-16 cursor-pointer ${
-                        selectedBankCode === bank.code
-                          ? "border-brand-primary bg-brand-primary/[0.04] ring-1 ring-brand-primary/20"
-                          : "border-gray-200 hover:border-gray-400 bg-white"
-                      }`}
-                    >
-                      <span className={`text-sm font-black uppercase tracking-tighter ${selectedBankCode === bank.code ? "text-brand-primary" : "text-text-primary"}`}>
-                        {bank.name}
-                      </span>
-                    </button>
-                  ))}
-                </div>
-              </div>
-            )}
-            </div>
-            </Card>
-
-
-      {/* E-Wallet / QRIS Section */}
-      <Card className="overflow-hidden border-gray-100 rounded-3xl shadow-sm bg-white">
-        <button
-          onClick={() => toggleCategory("E_WALLET_QRIS")}
-          className="w-full p-8 flex items-center justify-between hover:bg-gray-50/50 transition-colors text-left cursor-pointer"
-        >
-          <div className="flex items-center gap-4">
-            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200">
-              <svg className="h-6 w-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
-                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
-              </svg>
-            </div>
-            <div>
-              <h3 className="text-lg font-black text-text-primary">E-Wallet / QRIS</h3>
-              <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest mt-0.5">Instant Payment</p>
-            </div>
-          </div>
-          <svg␠
-            className={`h-6 w-6 text-text-tertiary transition-transform duration-300 ${expandedCategory === "E_WALLET_QRIS" ? "rotate-180" : ""}`}␠
-            fill="none"␠
-            viewBox="0 0 24 24"␠
-            stroke="currentColor"
-          >
-            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
-          </svg>
-        </button>
-
-        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedCategory === "E_WALLET_QRIS" ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}`}>
-          <div className="p-8 pt-4">
-            <div className="flex flex-wrap gap-3">
-               {eWalletMethods.map((method) => (
-                  <button
-                    key={method.id}
-                    onClick={() => onSelect(method.id)}
-                    className={`relative px-6 py-3 rounded-xl border-2 transition-all font-black text-xs uppercase tracking-widest cursor-pointer ${
-                      selectedMethodId === method.id
-                        ? "border-brand-primary bg-brand-primary/5 text-brand-primary ring-1 ring-brand-primary/10"
-                        : "border-gray-200 bg-white text-text-secondary hover:border-gray-400"
-                    }`}
-                  >
-                    {method.name}
-                    {selectedMethodId === method.id && (
-                      <div className="absolute top-1 right-1 z-10">
-                        <div className="bg-brand-primary rounded-full p-0.5 shadow-md border-2 border-white">
-                          <svg className="h-1.5 w-1.5 text-base-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={6}>
-                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
-                          </svg>
-                        </div>
-                      </div>
-                    )}
-                  </button>
-               ))}
-            </div>
-      </Card>
-    </div>
``````

</details>

<details>
<summary><code>app/modules/external/checkout/presentation/hooks/use-checkout-steps.ts</code></summary>

**Added lines**

``````diff
+  const canProceedToPayment = canProceedWithPayment(selection, Boolean(selectedPaymentMethod?.requiresBankSelection));
+    if (existingOrder?.qrPayload || existingOrder?.virtualAccount || existingOrder?.paymentUrl) return;
+        if (result.paymentUrl) {
+          window.location.assign(result.paymentUrl);
+          return;
+        }
+
+    existingOrder?.paymentUrl,
+              if (result.paymentUrl) {
+                window.location.assign(result.paymentUrl);
+                return;
+              }
+
``````

**Removed lines**

``````diff
-  const canProceedToPayment = canProceedWithPayment(selection);
-    if (existingOrder?.qrPayload || existingOrder?.virtualAccount) return;
``````

</details>

<details>
<summary><code>app/modules/internal/dashboard/presentation/dashboard.page.tsx</code></summary>

**Added lines**

``````diff
+import { mapTransactionStatusFilterToApi, STATUS_MAP, statusFilterOptions, type TransactionStatus } from "~/core/constants/transaction";
+        status: mapTransactionStatusFilterToApi(statusFilter as "all" | TransactionStatus),
``````

**Removed lines**

``````diff
-
-const STATUS_MAP = {
-  paid: { label: "Lunas", variant: "success" as const },
-  pending: { label: "Menunggu", variant: "warning" as const },
-  cancelled: { label: "Dibatalkan", variant: "destructive" as const },
-  refunded: { label: "Refund", variant: "default" as const },
-};
-function mapStatusFilterToApi(statusFilter: string): string | undefined {
-  if (statusFilter === "all") return undefined;
-  if (statusFilter === "pending") return "WAITING_APPROVAL";
-  return statusFilter.toUpperCase();
-}
-
-const statusFilterOptions = [
-  { value: "all", label: "Semua Status" },
-  { value: "paid", label: "Lunas" },
-  { value: "pending", label: "Menunggu" },
-  { value: "cancelled", label: "Dibatalkan" },
-  { value: "refunded", label: "Refund" },
-];
-
-        status: mapStatusFilterToApi(statusFilter),
``````

</details>

<details>
<summary><code>e2e/helpers/e2e-api.ts</code></summary>

**Added lines**

``````diff
+export async function postPaymentSessionWebhook(
+  request: APIRequestContext,
+  transactionId: string,
+  event: "payment_session.completed" | "payment_session.expired",
+): Promise<void> {
+  const response = await request.post(
+    `${normalizeBaseUrl(E2E_API_BASE_URL)}/transaction/webhook/xendit`,
+    {
+      data: {
+        event,
+        data: {
+          reference_id: transactionId,
+          status: event.endsWith(".completed") ? "COMPLETED" : "EXPIRED",
+        },
+      },
+    },
+  );
+  const payload = (await response.json()) as ApiResponse<unknown>;
+  if (!response.ok() || !payload.success) {
+    throw new Error(`Webhook failed: ${response.status()} ${JSON.stringify(payload.error)}`);
+  }
+}
+
``````

**Removed lines:** None

</details>

<details>
<summary><code>e2e/smoke.spec.ts</code></summary>

**Added lines**

``````diff
+  postPaymentSessionWebhook,
+interface HostedMethod {
+  id: "va" | "qris" | "astrapay" | "akulaku" | "indomaret";
+  name: string;
+  expectedTotal: string;
+}
+
+const hostedMethods: HostedMethod[] = [
+  { id: "va", name: "Virtual Account", expectedTotal: "Rp 155.000" },
+  { id: "qris", name: "QRIS", expectedTotal: "Rp 154.500" },
+  { id: "astrapay", name: "AstraPay", expectedTotal: "Rp 155.000" },
+  { id: "akulaku", name: "Akulaku", expectedTotal: "Rp 155.000" },
+  { id: "indomaret", name: "Indomaret", expectedTotal: "Rp 155.000" },
+];
+
+async function openHostedPayment(
+  method: HostedMethod,
+): Promise<string> {
+  await page.getByRole("button", { name: new RegExp(`^${method.name}`) }).click();
+  await expect(page.getByText(method.expectedTotal, { exact: true }).and(page.locator(":visible")).first()).toBeVisible();
+  await page.locator('[data-checkout-consent]:visible input[type="checkbox"]').nth(0).check();
+  await page.locator('[data-checkout-consent]:visible input[type="checkbox"]').nth(1).check();
+  await expect(page).toHaveURL(/(?:\?|&)mockPayment=1(?:&|$)/);
+  await expect(page.getByRole("heading", { name: "Pembayaran masih aktif" })).toBeVisible();
+  const transactionId = new URL(page.url()).searchParams.get("orderId");
+  expect(transactionId).toBeTruthy();
+  return transactionId as string;
+    await page.locator('[data-checkout-consent]:visible input[type="checkbox"]').nth(0).check();
+    await page.locator('[data-checkout-consent]:visible input[type="checkbox"]').nth(1).check();
+  test("hosted VA resumes after cancel and completes only after webhook", async ({ page, request }) => {
+    const hostedTransactionId = await openHostedPayment(page, seeded, hostedMethods[0]);
+    const cancelUrl = new URL(page.url());
+    cancelUrl.searchParams.set("payment", "cancelled");
+    await page.goto(cancelUrl.toString());
+    await expect(page.getByRole("heading", { name: "Pembayaran masih aktif" })).toBeVisible();
+    await expect(page.getByRole("button", { name: "Lanjut ke Xendit" })).toBeVisible();
+
+    await postPaymentSessionWebhook(request, hostedTransactionId, "payment_session.completed");
+    await postPaymentSessionWebhook(request, hostedTransactionId, "payment_session.completed");
+    await expect(page.getByRole("heading", { name: "Pembayaran Berhasil!" })).toBeVisible({ timeout: 15_000 });
+    const detail = await getTransactionDetail(request, hostedTransactionId, seeded.admin.email);
+    expect(detail.transaction.status).toBe("COMPLETED");
+    expect(detail.ticketDetails[0]?.issuedTickets).toHaveLength(1);
+  test("all other activated hosted channels redirect and expired session is recorded", async ({ page, request }) => {
+    let lastTransactionId = "";
+    for (const method of hostedMethods.slice(1)) {
+      lastTransactionId = await openHostedPayment(page, seeded, method);
+      await expect(page.getByText("Lanjut ke Xendit", { exact: true })).toBeVisible();
+    }
+    await postPaymentSessionWebhook(request, lastTransactionId, "payment_session.expired");
+    await expect(page.getByRole("heading", { name: "Pembayaran masih aktif" })).toBeVisible();
+
+    await setAdminSession(page, seeded.admin);
+    await page.goto("/internal-tb/admin");
+    const expiredRow = page.getByRole("row").filter({ hasText: lastTransactionId });
+    await expect(expiredRow.getByText("Expired", { exact: true })).toBeVisible();
+    await expiredRow.getByRole("button", { name: "Detail" }).click();
+    await expect(page).toHaveURL(/\/internal-tb\/admin\/transactions\//);
+    await expect(page.getByRole("heading", { name: "Detail Transaksi" })).toBeVisible();
+    await expect(page.getByText("Expired", { exact: true })).toBeVisible();
``````

**Removed lines**

``````diff
-  approveManualTransfer,
-async function openGatewayPayment(
-  method: "va" | "qris",
-) {
-  if (method === "va") {
-    await page.getByRole("button", { name: "Virtual Account", exact: true }).click();
-    await page.getByRole("button", { name: "BCA", exact: true }).click();
-  } else {
-    await page.getByRole("button", { name: /E-Wallet \/ QRIS Instant Payment/i }).click();
-    await page.getByRole("button", { name: "QRIS", exact: true }).click();
-  }
-
-  const expectedTotal = method === "va" ? "Rp 155.000" : "Rp 154.500";
-  await expect(page.getByText(expectedTotal, { exact: true }).and(page.locator(":visible")).first()).toBeVisible();
-  await page.getByLabel(/Syarat & Ketentuan/i).and(page.locator(":visible")).check();
-  await page.getByLabel(/Kebijakan Privasi/i).and(page.locator(":visible")).check();
-  await expect(page).toHaveURL(/(?:\?|&)step=4(?:&|$)/);
-    await page.getByLabel(/Syarat & Ketentuan/i).and(page.locator(':visible')).check();
-    await page.getByLabel(/Kebijakan Privasi/i).and(page.locator(':visible')).check();
-  test("VA keeps the backend deadline across reload and creates an invoice", async ({ page }) => {
-    await openGatewayPayment(page, seeded, "va");
-    const deadline = await page.evaluate(() => sessionStorage.getItem("tiketbisa_checkout_deadline"));
-    expect(deadline).toBeTruthy();
-    await page.reload();
-    await expect(page).toHaveURL(/(?:\?|&)step=4(?:&|$)/);
-    const reloadedDeadline = await page.evaluate(() => sessionStorage.getItem("tiketbisa_checkout_deadline"));
-    expect(Number(reloadedDeadline)).toBeLessThanOrEqual(Number(deadline));
-    await expect(page.getByText("Nomor Virtual Account", { exact: true })).toBeVisible();
-    await expect(page.getByText("BCA", { exact: true })).toBeVisible();
-    await expect(page.getByRole("button", { name: "Salin Nomor VA" })).toBeEnabled();
-  test("QRIS keeps the backend deadline across reload and creates a QR", async ({ page }) => {
-    await openGatewayPayment(page, seeded, "qris");
-    const deadline = await page.evaluate(() => sessionStorage.getItem("tiketbisa_checkout_deadline"));
-    expect(deadline).toBeTruthy();
-
-    const reloadedDeadline = await page.evaluate(() => sessionStorage.getItem("tiketbisa_checkout_deadline"));
-    expect(Number(reloadedDeadline)).toBeLessThanOrEqual(Number(deadline));
-    await expect(page.getByText("Selesaikan Pembayaran QRIS", { exact: true })).toBeVisible();
-    await expect(page.getByText("Perbesar", { exact: true })).toBeVisible();
``````

</details>

</details>

#### [#60 — ci: add frontend quality gates and safe production rollback](https://github.com/tiket-bisa/tiketbisa-fe/pull/60)

Merged `f57a32f` · 12 files · +287 / -119

<details>
<summary>Files changed with added/removed lines</summary>

<details>
<summary><code>.env.example</code></summary>

**Added lines**

``````diff
+
+# Public manual-transfer instructions embedded in the production bundle.
+VITE_MANUAL_TRANSFER_BANK_NAME=Mandiri
+VITE_MANUAL_TRANSFER_ACCOUNT_NUMBER=your_account_number_here
+VITE_MANUAL_TRANSFER_ACCOUNT_HOLDER=PT. Tiketbisa Digital Sejahtera
``````

**Removed lines:** None

</details>

<details>
<summary><code>.github/workflows/ci.yml</code></summary>

**Added lines**

``````diff
+name: Frontend CI
+
+on:
+  pull_request:
+    branches: ["dev", "main"]
+
+permissions:
+  contents: read
+
+concurrency:
+  group: frontend-ci-${{ github.ref }}
+  cancel-in-progress: true
+
+jobs:
+  quality:
+    name: Test, Typecheck and Build
+    runs-on: ubuntu-latest
+    env:
+      VITE_API_BASE_URL: https://api.example.com
+      VITE_API_INTERNAL_BASE_URL: https://api.example.com
+      VITE_GOOGLE_AUTH_CLIENT_ID: ci-client-id
+      VITE_MANUAL_TRANSFER_BANK_NAME: CI Bank
+      VITE_MANUAL_TRANSFER_ACCOUNT_NUMBER: "0000000000"
+      VITE_MANUAL_TRANSFER_ACCOUNT_HOLDER: CI Account
+    steps:
+      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
+      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
+        with:
+          node-version: "22"
+      - run: corepack enable
+      - run: pnpm install --frozen-lockfile
+      - run: pnpm test
+      - run: pnpm typecheck
+      - run: pnpm build
``````

**Removed lines:** None

</details>

<details>
<summary><code>.github/workflows/deploy.yml</code></summary>

**Added lines**

``````diff
+    branches: ["main"]
+
+concurrency:
+  group: tiketbisa-frontend-production
+  cancel-in-progress: false
+
+  quality:
+    name: Test, Typecheck and Build
+    environment: production
+    env:
+      VITE_API_BASE_URL: ${{ vars.VITE_API_BASE_URL }}
+      VITE_API_INTERNAL_BASE_URL: ${{ vars.VITE_API_INTERNAL_BASE_URL }}
+      VITE_GOOGLE_AUTH_CLIENT_ID: ${{ vars.VITE_GOOGLE_AUTH_CLIENT_ID || secrets.VITE_GOOGLE_AUTH_CLIENT_ID }}
+      VITE_MANUAL_TRANSFER_BANK_NAME: ${{ vars.VITE_MANUAL_TRANSFER_BANK_NAME }}
+      VITE_MANUAL_TRANSFER_ACCOUNT_NUMBER: ${{ vars.VITE_MANUAL_TRANSFER_ACCOUNT_NUMBER }}
+      VITE_MANUAL_TRANSFER_ACCOUNT_HOLDER: ${{ vars.VITE_MANUAL_TRANSFER_ACCOUNT_HOLDER }}
+      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
+      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
+        with:
+          node-version: "22"
+      - run: corepack enable
+      - run: pnpm install --frozen-lockfile
+      - name: Validate production build configuration
+          for name in VITE_API_BASE_URL VITE_API_INTERNAL_BASE_URL VITE_GOOGLE_AUTH_CLIENT_ID VITE_MANUAL_TRANSFER_BANK_NAME VITE_MANUAL_TRANSFER_ACCOUNT_NUMBER VITE_MANUAL_TRANSFER_ACCOUNT_HOLDER; do
+            if [ -z "${!name}" ]; then
+              echo "Missing production build configuration: $name" >&2
+              exit 1
+            fi
+          done
+          case "$VITE_API_BASE_URL $VITE_API_INTERNAL_BASE_URL" in
+            *http://*|*localhost*|*127.0.0.1*)
+              echo "Production API URLs must use HTTPS and must not point to localhost" >&2
+              exit 1
+              ;;
+          esac
+      - run: pnpm test
+      - run: pnpm typecheck
+      - run: pnpm build
+  build-and-push:
+    needs: quality
+    runs-on: ubuntu-latest
+    environment: production
+    env:
+      FRONTEND_IMAGE: ghcr.io/${{ github.repository }}/frontend:${{ github.sha }}
+      VITE_API_BASE_URL: ${{ vars.VITE_API_BASE_URL }}
+      VITE_API_INTERNAL_BASE_URL: ${{ vars.VITE_API_INTERNAL_BASE_URL }}
+      VITE_GOOGLE_AUTH_CLIENT_ID: ${{ vars.VITE_GOOGLE_AUTH_CLIENT_ID || secrets.VITE_GOOGLE_AUTH_CLIENT_ID }}
+      VITE_MANUAL_TRANSFER_BANK_NAME: ${{ vars.VITE_MANUAL_TRANSFER_BANK_NAME }}
+      VITE_MANUAL_TRANSFER_ACCOUNT_NUMBER: ${{ vars.VITE_MANUAL_TRANSFER_ACCOUNT_NUMBER }}
+      VITE_MANUAL_TRANSFER_ACCOUNT_HOLDER: ${{ vars.VITE_MANUAL_TRANSFER_ACCOUNT_HOLDER }}
+    steps:
+      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
+      - uses: docker/login-action@c94ce9fb468520275223c153574b00df6fe4bcc9 # v3
+      - name: Build and push immutable image
+            --build-arg "VITE_API_BASE_URL=$VITE_API_BASE_URL" \
+            --build-arg "VITE_API_INTERNAL_BASE_URL=$VITE_API_INTERNAL_BASE_URL" \
+            --build-arg "VITE_MANUAL_TRANSFER_BANK_NAME=$VITE_MANUAL_TRANSFER_BANK_NAME" \
+            --build-arg "VITE_MANUAL_TRANSFER_ACCOUNT_NUMBER=$VITE_MANUAL_TRANSFER_ACCOUNT_NUMBER" \
+            --build-arg "VITE_MANUAL_TRANSFER_ACCOUNT_HOLDER=$VITE_MANUAL_TRANSFER_ACCOUNT_HOLDER" \
+            -t "$FRONTEND_IMAGE" -f Dockerfile .
+          docker push "$FRONTEND_IMAGE"
+
+    needs: build-and-push
+    environment: production
+    env:
+      GHCR_USERNAME: ${{ github.actor }}
+      GHCR_TOKEN: ${{ secrets.GITHUB_TOKEN }}
+      DEPLOY_DIR: /home/${{ secrets.VM_USER }}/tiketbisa-fe
+      RELEASE_DIR: /home/${{ secrets.VM_USER }}/tiketbisa-fe/releases/${{ github.run_id }}
+      GITHUB_RUN_ID: ${{ github.run_id }}
+      FRONTEND_IMAGE: ghcr.io/${{ github.repository }}/frontend:${{ github.sha }}
+      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
+      - name: Upload release configuration
+        uses: appleboy/scp-action@917f8b81dfc1ccd331fef9e2d61bdc6c8be94634 # v0.1.7
+          key: ${{ secrets.SSH_PRIVATE_KEY }}
+          source: docker-compose.yml,scripts/deploy-production.sh
+          target: ${{ env.RELEASE_DIR }}
+      - name: Deploy and verify production
+        uses: appleboy/ssh-action@029f5b4aeeeb58fdfe1410a5d17f967dacf36262 # v1.0.3
+        with:
+          host: ${{ secrets.VM_IP }}
+          username: ${{ secrets.VM_USER }}
+          key: ${{ secrets.SSH_PRIVATE_KEY }}
+          envs: GHCR_USERNAME,GHCR_TOKEN,DEPLOY_DIR,RELEASE_DIR,GITHUB_RUN_ID,FRONTEND_IMAGE
+            chmod +x "$RELEASE_DIR/scripts/deploy-production.sh"
+            "$RELEASE_DIR/scripts/deploy-production.sh"
``````

**Removed lines**

``````diff
-    branches: [ "main" ]
-␠␠␠␠
-  build-and-push:
-    outputs:
-      image-tag: ${{ steps.image.outputs.image-tag }}
-      - name: Checkout code
-        uses: actions/checkout@v4
-
-      - name: Prepare Docker image tag
-        id: image
-          OWNER_LOWER="$(printf '%s' "${GITHUB_REPOSITORY_OWNER}" | tr '[:upper:]' '[:lower:]')"
-          REPO_LOWER="$(printf '%s' "${GITHUB_REPOSITORY#*/}" | tr '[:upper:]' '[:lower:]')"
-          IMAGE_TAG="ghcr.io/${OWNER_LOWER}/${REPO_LOWER}/frontend:latest"
-
-          printf 'image-tag=%s\n' "$IMAGE_TAG" >> "$GITHUB_OUTPUT"
-      - name: Login to GitHub Container Registry
-        uses: docker/login-action@v3
-
-      - name: Build and Push Docker Image
-        env:
-          VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
-          VITE_API_INTERNAL_BASE_URL: ${{ secrets.VITE_API_INTERNAL_BASE_URL }}
-          VITE_GOOGLE_AUTH_CLIENT_ID: ${{ secrets.VITE_GOOGLE_AUTH_CLIENT_ID }}
-          API_BASE_URL="${VITE_API_BASE_URL:-https://api.tiketbisa.com}"
-          API_INTERNAL_BASE_URL="${VITE_API_INTERNAL_BASE_URL:-$API_BASE_URL}"
-
-          case "$API_BASE_URL $API_INTERNAL_BASE_URL" in
-            *localhost:8080*|*127.0.0.1:8080*)
-              echo "::error::Production API build args must not point to localhost"
-              exit 1
-              ;;
-          esac
-
-            --build-arg "VITE_API_BASE_URL=$API_BASE_URL" \
-            --build-arg "VITE_API_INTERNAL_BASE_URL=$API_INTERNAL_BASE_URL" \
-            -t ${{ steps.image.outputs.image-tag }} \
-            -f Dockerfile .
-          docker push ${{ steps.image.outputs.image-tag }}
-␠␠␠␠␠␠␠␠␠␠
-    needs: build-and-push # Wait for the build to finish first
-      - name: Executing remote ssh commands using password
-        uses: appleboy/ssh-action@v1.0.3
-        env:
-          GHCR_TOKEN: ${{ secrets.GITHUB_TOKEN }}
-          GHCR_USERNAME: ${{ github.actor }}
-          IMAGE_TAG: ${{ needs.build-and-push.outputs.image-tag }}
-          key: ${{ secrets.SSH_PRIVATE_KEY }} # The private key we generated earlier
-          envs: GHCR_TOKEN,GHCR_USERNAME,IMAGE_TAG
-
-            log() {
-              printf '[deploy] %s\n' "$1"
-            }
-
-            fail() {
-              printf '[deploy] ERROR: %s\n' "$1" >&2
-              exit 1
-            }
-
-            trap 'status=$?; if [ "$status" -eq 0 ]; then log "Deployment finished successfully"; else printf "[deploy] FAILED\n" >&2; fi' EXIT
-
-            deploy_dir=""
-            for candidate in "$HOME/tiketbisa/fe" "$HOME/tiketbisa-fe" "$HOME/tiketbisa/frontend"; do
-              if [ -f "$candidate/docker-compose.yml" ]; then
-                deploy_dir="$candidate"
-                break
-              fi
-            done
-
-            [ -n "$deploy_dir" ] || fail "Could not find docker-compose.yml in any expected deploy directory"
-
-            log "Using deploy directory: $deploy_dir"
-            cd "$deploy_dir"
-
-            compose_service=""
-            if docker compose config --services >/tmp/deploy-services.txt 2>/dev/null; then
-              if grep -qx 'tiketbisa-fe' /tmp/deploy-services.txt; then
-                compose_service="tiketbisa-fe"
-              elif grep -qx 'app' /tmp/deploy-services.txt; then
-                compose_service="app"
-              else
-                compose_service="$(head -n 1 /tmp/deploy-services.txt)"
-              fi
-            else
-              fail "Unable to read compose services from $deploy_dir/docker-compose.yml"
-            fi
-
-            [ -n "$compose_service" ] || fail "No compose service names were found"
-            [ -n "${IMAGE_TAG:-}" ] || fail "IMAGE_TAG was not provided"
-            [ -n "${GHCR_USERNAME:-}" ] || fail "GHCR_USERNAME was not provided"
-            [ -n "${GHCR_TOKEN:-}" ] || fail "GHCR_TOKEN was not provided"
-
-            log "Using compose service: $compose_service"
-            log "Using image: $IMAGE_TAG"
-
-            override_file="/tmp/tiketbisa-fe-deploy-compose.yml"
-            {
-              printf 'services:\n'
-              printf '  %s:\n' "$compose_service"
-              printf '    image: %s\n' "$IMAGE_TAG"
-            } > "$override_file"
-
-            log "Logging in to GitHub Container Registry"
-
-            log "Pulling latest app image"
-            docker compose -f docker-compose.yml -f "$override_file" pull "$compose_service"
-
-            log "Starting app container"
-            docker compose -f docker-compose.yml -f "$override_file" up -d --no-build "$compose_service"
-
-            log "Pruning unused Docker images"
-            docker system prune -f # Clean up old images to save disk space
``````

</details>

<details>
<summary><code>.github/workflows/e2e.yml</code></summary>

**Added lines**

``````diff
+name: Frontend Release E2E
+
+on:
+  workflow_dispatch:
+    inputs:
+      frontend_url:
+        description: Deployed frontend URL to test
+        required: true
+        type: string
+      api_url:
+        description: Backend URL used by the E2E helpers
+        required: true
+        type: string
+
+permissions:
+  contents: read
+
+jobs:
+  playwright:
+    runs-on: ubuntu-latest
+    environment: production
+    env:
+      E2E_BASE_URL: ${{ inputs.frontend_url }}
+      E2E_API_BASE_URL: ${{ inputs.api_url }}
+    steps:
+      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
+      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
+        with:
+          node-version: "22"
+      - run: corepack enable
+      - run: pnpm install --frozen-lockfile
+      - run: pnpm exec playwright install --with-deps chromium
+      - run: pnpm e2e
+      - name: Upload Playwright diagnostics
+        if: always()
+        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4
+        with:
+          name: playwright-report-${{ github.run_id }}
+          path: |
+            playwright-report/
+            test-results/
+          if-no-files-found: ignore
+          retention-days: 14
``````

**Removed lines:** None

</details>

<details>
<summary><code>Dockerfile</code></summary>

**Added lines**

``````diff
+ARG VITE_MANUAL_TRANSFER_BANK_NAME
+ARG VITE_MANUAL_TRANSFER_ACCOUNT_NUMBER
+ARG VITE_MANUAL_TRANSFER_ACCOUNT_HOLDER
+ENV VITE_MANUAL_TRANSFER_BANK_NAME=$VITE_MANUAL_TRANSFER_BANK_NAME
+ENV VITE_MANUAL_TRANSFER_ACCOUNT_NUMBER=$VITE_MANUAL_TRANSFER_ACCOUNT_NUMBER
+ENV VITE_MANUAL_TRANSFER_ACCOUNT_HOLDER=$VITE_MANUAL_TRANSFER_ACCOUNT_HOLDER
+HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=12 \
+  CMD node -e "fetch('http://127.0.0.1:3000/healthz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
``````

**Removed lines:** None

</details>

<details>
<summary><code>app/core/api/api-url.ts</code></summary>

**Added lines**

``````diff
+  if (import.meta.env.PROD && !import.meta.env.VITE_API_BASE_URL) {
+    throw new Error("VITE_API_BASE_URL is required in production");
+  }
+  const defaultBrowserBaseUrl = DEFAULT_LOCAL_API_BASE_URL;
``````

**Removed lines**

``````diff
-const DEFAULT_PRODUCTION_API_BASE_URL = "https://api.tiketbisa.com";
-  const defaultBrowserBaseUrl = import.meta.env.PROD
-    ? DEFAULT_PRODUCTION_API_BASE_URL
-    : DEFAULT_LOCAL_API_BASE_URL;
``````

</details>

<details>
<summary><code>app/modules/external/checkout/presentation/components/steps/payment-instruction.tsx</code></summary>

**Added lines**

``````diff
+  const productionConfig = (name: string, value: string | undefined, localFallback: string) => {
+    if (import.meta.env.PROD && !value) {
+      throw new Error(`${name} is required in production`);
+    }
+    return value ?? localFallback;
+  };
+    bankName: productionConfig("VITE_MANUAL_TRANSFER_BANK_NAME", import.meta.env.VITE_MANUAL_TRANSFER_BANK_NAME, "Mandiri"),
+    accountNumber: productionConfig("VITE_MANUAL_TRANSFER_ACCOUNT_NUMBER", import.meta.env.VITE_MANUAL_TRANSFER_ACCOUNT_NUMBER, "1010014855397"),
+    accountHolder: productionConfig("VITE_MANUAL_TRANSFER_ACCOUNT_HOLDER", import.meta.env.VITE_MANUAL_TRANSFER_ACCOUNT_HOLDER, "PT. Tiketbisa Digital Sejahtera"),
``````

**Removed lines**

``````diff
-    bankName: import.meta.env.VITE_MANUAL_TRANSFER_BANK_NAME ?? "Mandiri",
-    accountNumber: import.meta.env.VITE_MANUAL_TRANSFER_ACCOUNT_NUMBER ?? "1010014855397",
-    accountHolder: import.meta.env.VITE_MANUAL_TRANSFER_ACCOUNT_HOLDER ?? "PT. Tiketbisa Digital Sejahtera",
``````

</details>

<details>
<summary><code>app/routes.ts</code></summary>

**Added lines**

``````diff
+  route("healthz", "routes/healthz.ts"),
+
``````

**Removed lines:** None

</details>

<details>
<summary><code>app/routes/healthz.ts</code></summary>

**Added lines**

``````diff
+export function loader() {
+  return Response.json(
+    { status: "healthy" },
+    { headers: { "Cache-Control": "no-store" } },
+  );
+}
``````

**Removed lines:** None

</details>

<details>
<summary><code>docker-compose.yml</code></summary>

**Added lines**

``````diff
+    image: ${FRONTEND_IMAGE:-tiketbisa-fe:local}
+        VITE_MANUAL_TRANSFER_BANK_NAME: ${VITE_MANUAL_TRANSFER_BANK_NAME}
+        VITE_MANUAL_TRANSFER_ACCOUNT_NUMBER: ${VITE_MANUAL_TRANSFER_ACCOUNT_NUMBER}
+        VITE_MANUAL_TRANSFER_ACCOUNT_HOLDER: ${VITE_MANUAL_TRANSFER_ACCOUNT_HOLDER}
+    healthcheck:
+      test: ["CMD", "node", "-e", "fetch('http://127.0.0.1:3000/healthz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]
+      interval: 10s
+      timeout: 5s
+      retries: 12
+      start_period: 20s
``````

**Removed lines**

``````diff
-    image: ${TIKETBISA_FE_IMAGE:-ghcr.io/tiket-bisa/tiketbisa-fe/frontend:latest}
``````

</details>

<details>
<summary><code>docs/production-cicd.md</code></summary>

**Added lines**

``````diff
+# Production CI/CD
+
+Production builds use the `production` GitHub Environment. All `VITE_*` values are public values embedded
+in the browser bundle; store them as Environment variables rather than secrets.
+
+Required variables:
+
+- `VITE_API_BASE_URL=https://api.tiketbisa.com`
+- `VITE_API_INTERNAL_BASE_URL=https://api.tiketbisa.com`
+- `VITE_GOOGLE_AUTH_CLIENT_ID`
+- `VITE_MANUAL_TRANSFER_BANK_NAME`
+- `VITE_MANUAL_TRANSFER_ACCOUNT_NUMBER`
+- `VITE_MANUAL_TRANSFER_ACCOUNT_HOLDER`
+
+Required secrets are `VM_IP`, `VM_USER`, and `SSH_PRIVATE_KEY`.
+The existing `VITE_GOOGLE_AUTH_CLIENT_ID` repository secret remains a temporary compatibility source;
+copy the same public client ID into the Environment variable before removing that secret.
+
+Pull requests run unit tests, TypeScript checks, and the production build. A merge to `main` repeats the
+quality gate, publishes an immutable commit-SHA image, deploys it, waits for `/healthz`, and verifies the
+running container uses the expected image. A failure restores the previous Compose file and image.
+
+The `Frontend Release E2E` workflow is a manual release gate. Supply a deployed frontend URL and its API
+URL; Playwright diagnostics are retained as workflow artifacts even when the suite fails.
``````

**Removed lines:** None

</details>

<details>
<summary><code>scripts/deploy-production.sh</code></summary>

**Added lines**

``````diff
+#!/usr/bin/env bash
+set -Eeuo pipefail
+
+: "${DEPLOY_DIR:?DEPLOY_DIR is required}"
+: "${RELEASE_DIR:?RELEASE_DIR is required}"
+: "${FRONTEND_IMAGE:?FRONTEND_IMAGE is required}"
+: "${GITHUB_RUN_ID:?GITHUB_RUN_ID is required}"
+
+cd "$DEPLOY_DIR"
+[[ -f docker-compose.yml ]] || { echo 'Existing frontend docker-compose.yml was not found' >&2; exit 1; }
+
+backup_dir="$DEPLOY_DIR/.deploy-backups/$GITHUB_RUN_ID"
+mkdir -p "$backup_dir"
+cp docker-compose.yml "$backup_dir/docker-compose.yml"
+previous_image="$(docker inspect --format='{{.Config.Image}}' tiketbisa-fe 2>/dev/null || true)"
+[[ -n "$previous_image" ]] || { echo 'Could not determine the currently deployed frontend image' >&2; exit 1; }
+
+next_compose="$DEPLOY_DIR/docker-compose.yml.next"
+next_env="$DEPLOY_DIR/.deploy.env.next"
+cp "$RELEASE_DIR/docker-compose.yml" "$next_compose"
+printf 'FRONTEND_IMAGE=%s\n' "$FRONTEND_IMAGE" > "$next_env"
+docker compose --env-file "$next_env" -f "$next_compose" config >/dev/null
+
+activated=false
+rollback() {
+  local failure_code=$?
+  trap - ERR
+  if [[ "$activated" == true ]]; then
+    echo 'Frontend deployment failed; restoring the previous image and Compose file' >&2
+    cp "$backup_dir/docker-compose.yml" docker-compose.yml
+    printf 'FRONTEND_IMAGE=%s\n' "$previous_image" > .deploy.env
+    docker compose --env-file .deploy.env up -d tiketbisa-fe
+    timeout 150 bash -c 'until [[ "$(docker inspect --format="{{.State.Health.Status}}" tiketbisa-fe 2>/dev/null)" == healthy ]]; do sleep 5; done'
+    curl --fail --silent http://127.0.0.1:3000/healthz >/dev/null
+  fi
+  exit "$failure_code"
+}
+trap rollback ERR
+
+mv "$next_compose" docker-compose.yml
+mv "$next_env" .deploy.env
+activated=true
+
+docker compose --env-file .deploy.env pull tiketbisa-fe
+docker compose --env-file .deploy.env up -d --no-build tiketbisa-fe
+timeout 150 bash -c 'until [[ "$(docker inspect --format="{{.State.Health.Status}}" tiketbisa-fe 2>/dev/null)" == healthy ]]; do sleep 5; done'
+curl --fail --silent http://127.0.0.1:3000/healthz >/dev/null
+
+deployed_image="$(docker inspect --format='{{.Config.Image}}' tiketbisa-fe)"
+[[ "$deployed_image" == "$FRONTEND_IMAGE" ]] || {
+  printf 'Expected image %s but container uses %s\n' "$FRONTEND_IMAGE" "$deployed_image" >&2
+  exit 1
+}
+
+trap - ERR
+echo "Frontend deployment completed with image $FRONTEND_IMAGE"
``````

**Removed lines:** None

</details>

</details>

#### [#61 — fix: detect compose-managed frontend container](https://github.com/tiket-bisa/tiketbisa-fe/pull/61)

Merged `dd431d0` · 1 file · +39 / -5

<details>
<summary>Files changed with added/removed lines</summary>

<details>
<summary><code>scripts/deploy-production.sh</code></summary>

**Added lines**

``````diff
+previous_container_id="$(docker compose ps -q tiketbisa-fe 2>/dev/null || true)"
+previous_image="$(docker inspect --format='{{.Config.Image}}' "$previous_container_id" 2>/dev/null || true)"
+wait_for_frontend_health() {
+  local env_file="$1"
+  local deadline=$((SECONDS + 150))
+  local container_id
+
+  while ((SECONDS < deadline)); do
+    container_id="$(docker compose --env-file "$env_file" ps -q tiketbisa-fe 2>/dev/null || true)"
+    if [[ -n "$container_id" ]] &&
+       [[ "$(docker inspect --format='{{.State.Health.Status}}' "$container_id" 2>/dev/null || true)" == healthy ]]; then
+      return 0
+    fi
+    sleep 5
+  done
+
+  echo 'Frontend container did not become healthy within 150 seconds' >&2
+  return 1
+}
+
+wait_for_rollback_health() {
+  local deadline=$((SECONDS + 150))
+
+  while ((SECONDS < deadline)); do
+    if curl --fail --silent http://127.0.0.1:3000/healthz >/dev/null 2>&1 ||
+       curl --fail --silent http://127.0.0.1:3000/ >/dev/null 2>&1; then
+      return 0
+    fi
+    sleep 5
+  done
+
+  echo 'Restored frontend did not become reachable within 150 seconds' >&2
+  return 1
+}
+
+    wait_for_rollback_health
+wait_for_frontend_health .deploy.env
+deployed_container_id="$(docker compose --env-file .deploy.env ps -q tiketbisa-fe)"
+deployed_image="$(docker inspect --format='{{.Config.Image}}' "$deployed_container_id")"
``````

**Removed lines**

``````diff
-previous_image="$(docker inspect --format='{{.Config.Image}}' tiketbisa-fe 2>/dev/null || true)"
-    timeout 150 bash -c 'until [[ "$(docker inspect --format="{{.State.Health.Status}}" tiketbisa-fe 2>/dev/null)" == healthy ]]; do sleep 5; done'
-    curl --fail --silent http://127.0.0.1:3000/healthz >/dev/null
-timeout 150 bash -c 'until [[ "$(docker inspect --format="{{.State.Health.Status}}" tiketbisa-fe 2>/dev/null)" == healthy ]]; do sleep 5; done'
-deployed_image="$(docker inspect --format='{{.Config.Image}}' tiketbisa-fe)"
``````

</details>

</details>

#### [#62 — fix: sanitize user-facing messages](https://github.com/tiket-bisa/tiketbisa-fe/pull/62)

Merged `f353cbb` · 39 files · +397 / -144

<details>
<summary>Files changed with added/removed lines</summary>

<details>
<summary><code>app/core/api/api-error.test.ts</code></summary>

**Added lines**

``````diff
+import { describe, expect, it } from "vitest";
+import {
+  ApiRequestError,
+  sanitizeApiEnvelope,
+  toUserFacingError,
+  toUserFacingResponseError,
+} from "./api-error";
+
+describe("API error sanitization", () => {
+  it("preserves actionable business validation", () => {
+    const response = sanitizeApiEnvelope({
+      success: false,
+      status_code: 400,
+      data: null,
+      error: { code: "900", message: "NIK harus 16 digit angka" },
+      request_id: "request-400",
+    });
+
+    expect(response.error).toBe("NIK harus 16 digit angka");
+  });
+
+  it.each([
+    "Xendit returned BANK_NOT_ACTIVATED",
+    "Redis connection failed at internal-host",
+    "Invalid JSON response from server",
+    "SQL constraint transaction_gateway_ref_key",
+  ])("hides technical server detail: %s", (technicalMessage) => {
+    const response = sanitizeApiEnvelope({
+      success: false,
+      status_code: 500,
+      data: null,
+      error: { code: "900", message: technicalMessage },
+      request_id: "request-500",
+    });
+
+    expect(response.error).toBe(
+      "Permintaan tidak dapat diproses. Silakan coba lagi. Kode referensi: request-500.",
+    );
+    expect(response.error).not.toContain(technicalMessage);
+  });
+
+  it("uses a safe fallback for unknown runtime errors", () => {
+    expect(toUserFacingError(new Error("database password leaked"), "Data gagal dimuat."))
+      .toBe("Data gagal dimuat.");
+  });
+
+  it("retains an already-sanitized API error", () => {
+    const error = new ApiRequestError(
+      "Transaksi gagal. Kode referensi: request-1.",
+      { requestId: "request-1", statusCode: 500 },
+    );
+    expect(toUserFacingError(error, "Fallback")).toBe(error.message);
+  });
+
+  it("formats sanitized response failures for UI consumers", () => {
+    expect(toUserFacingResponseError({
+      success: false,
+      status_code: 503,
+      error: "upstream refused connection",
+      request_id: "request-503",
+    }, "Gagal menyimpan data."))
+      .toBe("Permintaan tidak dapat diproses. Silakan coba lagi. Kode referensi: request-503.");
+  });
+});
``````

**Removed lines:** None

</details>

<details>
<summary><code>app/core/api/api-error.ts</code></summary>

**Added lines**

``````diff
+const BUSINESS_ERROR_STATUSES = new Set([400, 409, 422]);
+const DEFAULT_ERROR_MESSAGE = "Permintaan tidak dapat diproses. Silakan coba lagi.";
+
+interface ApiEnvelopeLike {
+  success?: boolean;
+  status_code?: number;
+  error?: unknown;
+  request_id?: string;
+}
+
+export class ApiRequestError extends Error {
+  readonly requestId?: string;
+  readonly statusCode?: number;
+
+  constructor(message: string, options: { requestId?: string; statusCode?: number } = {}) {
+    super(message);
+    this.name = "ApiRequestError";
+    this.requestId = options.requestId;
+    this.statusCode = options.statusCode;
+  }
+}
+
+function rawErrorMessage(error: unknown): string | null {
+  if (typeof error === "string" && error.trim()) return error.trim();
+  if (error && typeof error === "object" && "message" in error) {
+    const message = String((error as { message?: unknown }).message ?? "").trim();
+    return message || null;
+  }
+  return null;
+}
+
+function normalizeRequestId(value: unknown): string | undefined {
+  const requestId = typeof value === "string" ? value.trim() : "";
+  return /^[A-Za-z0-9._:-]{1,128}$/.test(requestId) ? requestId : undefined;
+}
+
+function withReference(message: string, requestId?: string): string {
+  return requestId ? `${message} Kode referensi: ${requestId}.` : message;
+}
+
+export function sanitizeApiEnvelope<T>(payload: T, response?: Response): T {
+  if (!payload || typeof payload !== "object") return payload;
+
+  const envelope = payload as T & ApiEnvelopeLike;
+  if (typeof envelope.success !== "boolean" || typeof envelope.status_code !== "number") {
+    return payload;
+  }
+
+  const requestId = normalizeRequestId(
+    envelope.request_id ?? response?.headers.get("X-Request-Id"),
+  );
+  const sanitized = { ...envelope, ...(requestId ? { request_id: requestId } : {}) };
+
+  if (envelope.success) return sanitized;
+
+  const message = BUSINESS_ERROR_STATUSES.has(envelope.status_code)
+    ? rawErrorMessage(envelope.error) ?? DEFAULT_ERROR_MESSAGE
+    : withReference(DEFAULT_ERROR_MESSAGE, requestId);
+
+  return { ...sanitized, error: message };
+}
+
+export function apiErrorFromResponse(
+  payload: unknown,
+  response: Response,
+  fallback = DEFAULT_ERROR_MESSAGE,
+): ApiRequestError {
+  const envelope = sanitizeApiEnvelope(payload as ApiEnvelopeLike, response);
+  const requestId = normalizeRequestId(
+    envelope?.request_id ?? response.headers.get("X-Request-Id"),
+  );
+  const statusCode = Number(envelope?.status_code ?? response.status);
+  const message = BUSINESS_ERROR_STATUSES.has(statusCode)
+    ? rawErrorMessage(envelope?.error) ?? fallback
+    : withReference(fallback, requestId);
+  return new ApiRequestError(message, { requestId, statusCode });
+}
+
+export function toUserFacingError(error: unknown, fallback: string): string {
+  if (error instanceof ApiRequestError) return error.message;
+  return fallback;
+}
+
+export function toUserFacingResponseError(
+  response: Pick<ApiEnvelopeLike, "success" | "status_code" | "error" | "request_id">,
+  fallback: string,
+): string {
+  const sanitized = sanitizeApiEnvelope(response);
+  return rawErrorMessage(sanitized.error) ?? fallback;
+}
``````

**Removed lines:** None

</details>

<details>
<summary><code>app/core/api/api-fetch.ts</code></summary>

**Added lines**

``````diff
+import { ApiRequestError, apiErrorFromResponse, sanitizeApiEnvelope } from "./api-error";
+        throw new ApiRequestError("Respons layanan tidak dapat diproses. Silakan coba lagi.", {
+          requestId: response.headers.get("X-Request-Id") ?? undefined,
+          statusCode: response.status,
+        });
+      throw apiErrorFromResponse(null, response);
+    throw new ApiRequestError("Respons layanan tidak dapat diproses. Silakan coba lagi.", {
+      requestId: response.headers.get("X-Request-Id") ?? undefined,
+      statusCode: response.status,
+    });
+    throw apiErrorFromResponse(payload, response);
+  return sanitizeApiEnvelope(payload, response);
``````

**Removed lines**

``````diff
-        throw new Error("Invalid JSON response from server");
-      throw new Error(`Request failed with status ${response.status}`);
-    throw new Error(`Expected JSON response but received '${contentType || "unknown"}'`);
-    const errorMessage = typeof payload.error === "string" && payload.error.trim().length > 0
-      ? payload.error
-      : `Request failed with status ${response.status}`;
-    throw new Error(errorMessage);
-  return payload;
``````

</details>

<details>
<summary><code>app/core/api/api-response.type.ts</code></summary>

**Added lines**

``````diff
+  request_id?: string;
``````

**Removed lines:** None

</details>

<details>
<summary><code>app/core/api/http-client.ts</code></summary>

**Added lines**

``````diff
+import { apiErrorFromResponse, sanitizeApiEnvelope, toUserFacingResponseError } from "./api-error";
+      let fallback: string;
+        fallback = "Ukuran file terlalu besar. Maksimal 10MB.";
+        fallback = "Layanan sedang tidak tersedia. Coba lagi nanti.";
+        fallback = "Layanan belum merespons. Coba lagi nanti.";
+        fallback = "Permintaan tidak dapat diproses. Silakan coba lagi.";
+      const requestError = apiErrorFromResponse(null, response, fallback);
+        error: requestError.message,
+        request_id: requestError.requestId,
+    const json = sanitizeApiEnvelope(await response.json(), response);
+      error: json.success ? null : toUserFacingResponseError(json, "Permintaan tidak dapat diproses. Silakan coba lagi."),
+      reason: json.reason ?? null,
+      request_id: json.request_id,
+      error: "Koneksi bermasalah. Periksa jaringan lalu coba lagi.",
``````

**Removed lines**

``````diff
-      let errorMessage: string;
-        errorMessage = "Ukuran file terlalu besar. Maksimal 10MB.";
-        errorMessage = "Server sedang tidak tersedia. Coba lagi nanti.";
-        errorMessage = "Server tidak merespons. Coba lagi nanti.";
-        errorMessage = `Server error (${response.status})`;
-        error: errorMessage,
-    const json = await response.json();
-      error: json.error?.message ?? null,
-      reason: json.error?.code ?? null,
-      error: error instanceof Error ? error.message : "Network error",
``````

</details>

<details>
<summary><code>app/core/api/index.ts</code></summary>

**Added lines**

``````diff
+export {
+  ApiRequestError,
+  apiErrorFromResponse,
+  sanitizeApiEnvelope,
+  toUserFacingError,
+  toUserFacingResponseError,
+} from "./api-error";
``````

**Removed lines:** None

</details>

<details>
<summary><code>app/core/api/use-api.ts</code></summary>

**Added lines**

``````diff
+import { toUserFacingError } from "./api-error";
+            .catch((err) => setError(toUserFacingError(err, "Data belum dapat dimuat. Coba muat ulang.")))
``````

**Removed lines**

``````diff
-            .catch((err) => setError(err instanceof Error ? err.message : "Unknown error"))
``````

</details>

<details>
<summary><code>app/core/auth/google-oauth.client.ts</code></summary>

**Added lines**

``````diff
+      reject(new ApiRequestError("Login belum dapat digunakan. Silakan coba lagi."));
+        () => reject(new ApiRequestError("Layanan login belum dapat dimuat. Silakan coba lagi.")),
+      reject(new ApiRequestError("Layanan login belum dapat dimuat. Silakan coba lagi."));
+    throw new ApiRequestError("Layanan login belum tersedia. Silakan coba lagi." );
+    throw new ApiRequestError("Layanan login belum tersedia. Silakan coba lagi.");
+          reject(new ApiRequestError("Login tidak berhasil. Silakan coba lagi."));
+          reject(new ApiRequestError("Login tidak berhasil. Silakan coba lagi."));
+      reject(new ApiRequestError("Layanan login belum tersedia. Silakan coba lagi."));
+import { ApiRequestError } from "~/core/api/api-error";
``````

**Removed lines**

``````diff
-      reject(new Error("Google OAuth is only available in browser"));
-        () => reject(new Error("Failed to load Google Identity script")),
-      reject(new Error("Failed to load Google Identity script"));
-    throw new Error("VITE_GOOGLE_AUTH_CLIENT_ID is not configured");
-    throw new Error("Google OAuth client is unavailable");
-          reject(
-            new Error(
-              response.error_description ?? `Google OAuth error: ${response.error}`,
-            ),
-          );
-          reject(new Error("Google OAuth did not return authorization code"));
-      reject(new Error("Failed to initialize Google OAuth client"));
``````

</details>

<details>
<summary><code>app/modules/admin/brands/presentation/brands.page.tsx</code></summary>

**Added lines**

``````diff
+import { toUserFacingError, toUserFacingResponseError } from "~/core/api";
+const accessUnavailableMessage = "Fitur akses login belum tersedia. Muat ulang halaman lalu coba lagi.";
+    setAccessError(toUserFacingResponseError(response, "Gagal memuat akses login brand."));
+      setFormError(toUserFacingError(err, "Koneksi bermasalah."));
+      setFormError(toUserFacingError(err, "Koneksi bermasalah."));
+      setAccessError(toUserFacingError(err, "Koneksi bermasalah."));
+      setAccessError(toUserFacingError(err, "Koneksi bermasalah."));
+      setAccessError(toUserFacingError(err, "Koneksi bermasalah."));
+      setAccessError(toUserFacingError(err, "Koneksi bermasalah."));
+                          <p className="text-sm text-text-tertiary">Daftar partner belum dapat dimuat. Coba muat ulang.</p>
+                          <p className="text-sm text-text-tertiary">Daftar scanner belum dapat dimuat. Coba muat ulang.</p>
``````

**Removed lines**

``````diff
-const accessUnavailableMessage = "Fitur akses login belum aktif di backend yang sedang berjalan. Sinkronkan atau restart backend lalu coba lagi.";
-    setAccessError(response.error || "Gagal memuat akses login brand.");
-      setFormError(err instanceof Error ? err.message : "Koneksi bermasalah.");
-      setFormError(err instanceof Error ? err.message : "Koneksi bermasalah.");
-      setAccessError(err instanceof Error ? err.message : "Koneksi bermasalah.");
-      setAccessError(err instanceof Error ? err.message : "Koneksi bermasalah.");
-      setAccessError(err instanceof Error ? err.message : "Koneksi bermasalah.");
-      setAccessError(err instanceof Error ? err.message : "Koneksi bermasalah.");
-                          <p className="text-sm text-text-tertiary">Daftar partner belum bisa dimuat dari backend saat ini.</p>
-                          <p className="text-sm text-text-tertiary">Daftar scanner belum bisa dimuat dari backend saat ini.</p>
``````

</details>

<details>
<summary><code>app/modules/admin/events/presentation/events.page.tsx</code></summary>

**Added lines**

``````diff
+import { toUserFacingError, useApiQuery } from "~/core/api";
+      setFormError(toUserFacingError(err, "Koneksi bermasalah."));
+      setFormError(toUserFacingError(err, "Koneksi bermasalah."));
``````

**Removed lines**

``````diff
-import { useApiQuery } from "~/core/api";
-      setFormError(err instanceof Error ? err.message : "Koneksi bermasalah.");
-      setFormError(err instanceof Error ? err.message : "Koneksi bermasalah.");
``````

</details>

<details>
<summary><code>app/modules/admin/integration-clients/presentation/integration-clients.page.tsx</code></summary>

**Added lines**

``````diff
+import { ApiRequestError, toUserFacingResponseError, useApiQuery } from "~/core/api";
+    if (!response.success) {
+      throw new ApiRequestError(toUserFacingResponseError(response, "Gagal memuat integration clients."));
+    }
+    if (!response.success) {
+      throw new ApiRequestError(toUserFacingResponseError(response, "Gagal memuat RSA public keys."));
+    }
+        setPageError(toUserFacingResponseError(response, "Gagal membuat integration client."));
+      if (!response.success) return setPageError(toUserFacingResponseError(response, "Gagal memperbarui nama client."));
+      if (!response.success) return setPageError(toUserFacingResponseError(response, "Gagal memperbarui status client."));
+      if (!response.success) return setPageError(toUserFacingResponseError(response, "Gagal menambahkan public key."));
+      if (!response.success) return setPageError(toUserFacingResponseError(response, "Gagal memperbarui status key."));
``````

**Removed lines**

``````diff
-import { useApiQuery } from "~/core/api";
-    if (!response.success) throw new Error(response.error || "Gagal memuat integration clients.");
-    if (!response.success) throw new Error(response.error || "Gagal memuat RSA public keys.");
-        setPageError(response.error || "Gagal membuat integration client.");
-      if (!response.success) return setPageError(response.error || "Gagal memperbarui nama client.");
-      if (!response.success) return setPageError(response.error || "Gagal memperbarui status client.");
-      if (!response.success) return setPageError(response.error || "Gagal menambahkan public key.");
-      if (!response.success) return setPageError(response.error || "Gagal memperbarui status key.");
``````

</details>

<details>
<summary><code>app/modules/admin/promos/infrastructure/promo.api.ts</code></summary>

**Added lines**

``````diff
+import { ApiRequestError, internalHttpClient, toUserFacingResponseError } from "~/core/api";
+    if (!response.success || !response.data) {
+      throw new ApiRequestError(toUserFacingResponseError(response, "Gagal memuat promo."));
+    }
``````

**Removed lines**

``````diff
-import { internalHttpClient } from "~/core/api";
-    if (!response.success || !response.data) throw new Error(response.error || "Gagal memuat promo");
``````

</details>

<details>
<summary><code>app/modules/admin/promos/presentation/promos.page.tsx</code></summary>

**Added lines**

``````diff
+import { ApiRequestError, toUserFacingError, toUserFacingResponseError, useApiQuery } from "~/core/api";
+    if (!response.success || !response.data) {
+      throw new ApiRequestError(toUserFacingResponseError(response, "Gagal memuat brand."));
+    }
+        setFeedback({ type: "error", message: toUserFacingResponseError(response, "Gagal menyimpan promo.") });
+      setFeedback({ type: "error", message: toUserFacingError(error, "Gagal menyimpan promo.") });
+        setFeedback({ type: "error", message: toUserFacingResponseError(response, "Gagal menonaktifkan promo.") });
+      setFeedback({ type: "error", message: toUserFacingError(error, "Gagal menonaktifkan promo.") });
``````

**Removed lines**

``````diff
-import { useApiQuery } from "~/core/api";
-    if (!response.success || !response.data) throw new Error(response.error || "Gagal memuat brand");
-        setFeedback({ type: "error", message: response.error || "Gagal menyimpan promo." });
-      setFeedback({ type: "error", message: error instanceof Error ? error.message : "Gagal menyimpan promo." });
-        setFeedback({ type: "error", message: response.error || "Gagal menonaktifkan promo." });
-      setFeedback({ type: "error", message: error instanceof Error ? error.message : "Gagal menonaktifkan promo." });
``````

</details>

<details>
<summary><code>app/modules/admin/transactions/presentation/transaction-details.page.tsx</code></summary>

**Added lines**

``````diff
+import { ApiRequestError, toUserFacingError, toUserFacingResponseError, useApiQuery } from "~/core/api";
+        throw new ApiRequestError(toUserFacingResponseError(response, "Gagal memproses approval."));
+      errorToast(toUserFacingError(error, "Gagal memproses approval."));
``````

**Removed lines**

``````diff
-import { useApiQuery } from "~/core/api";
-        throw new Error(response.error ?? "Gagal memproses approval");
-      errorToast(error instanceof Error ? error.message : "Gagal memproses approval");
``````

</details>

<details>
<summary><code>app/modules/external/checkout/infrastructure/ticket-delivery.api.test.ts</code></summary>

**Added lines**

``````diff
+  it("does not surface a technical backend error message", async () => {
+      .rejects.toThrow("Gagal menyiapkan tiket. Silakan coba lagi.");
``````

**Removed lines**

``````diff
-  it("surfaces the backend error message", async () => {
-      .rejects.toThrow("Invalid ticket access code");
``````

</details>

<details>
<summary><code>app/modules/external/checkout/infrastructure/ticket-delivery.api.ts</code></summary>

**Added lines**

``````diff
+import { apiErrorFromResponse, toAbsoluteApiUrl } from "~/core/api";
+async function getResponseError(response: Response): Promise<Error> {
+    return apiErrorFromResponse(body, response, "Gagal menyiapkan tiket. Silakan coba lagi.");
+    return apiErrorFromResponse(null, response, "Gagal menyiapkan tiket. Silakan coba lagi.");
+      throw await getResponseError(response);
``````

**Removed lines**

``````diff
-import { toAbsoluteApiUrl } from "~/core/api";
-async function getErrorMessage(response: Response): Promise<string> {
-    return body?.error?.message || body?.error || "Gagal menyiapkan tiket";
-    return "Gagal menyiapkan tiket";
-      throw new Error(await getErrorMessage(response));
``````

</details>

<details>
<summary><code>app/modules/external/checkout/presentation/components/shared/order-summary-card.tsx</code></summary>

**Added lines**

``````diff
+              <span className="block text-sm font-medium text-text-secondary">Biaya transaksi</span>
``````

**Removed lines**

``````diff
-              <span className="block text-sm font-medium text-text-secondary">Biaya transaksi (payment gateway)</span>
``````

</details>

<details>
<summary><code>app/modules/external/checkout/presentation/components/steps/manual-transfer-pending.tsx</code></summary>

**Added lines**

``````diff
+      label: "Menunggu verifikasi pembayaran",
``````

**Removed lines**

``````diff
-      label: "Menunggu approval manual transfer",
``````

</details>

<details>
<summary><code>app/modules/external/checkout/presentation/components/steps/payment-instruction.test.tsx</code></summary>

**Added lines**

``````diff
+// @vitest-environment jsdom
+
+import { render, screen } from "@testing-library/react";
+import { describe, expect, it, vi } from "vitest";
+import { ToastProvider } from "~/core/design-system/components";
+import { PaymentInstruction } from "./payment-instruction";
+
+describe("PaymentInstruction hosted checkout", () => {
+  it("menggunakan copy pembayaran yang netral", () => {
+    render(
+      <ToastProvider>
+        <PaymentInstruction
+          order={{
+            orderId: "order-1",
+            status: "PENDING",
+            totalAmount: 25_000,
+            paymentMethod: { id: "va", name: "Virtual Account", logo: "", category: "BANK_TRANSFER" },
+            expiryTime: "2026-08-23T18:00:00.000Z",
+            paymentUrl: "https://payments.example.test/order-1",
+          }}
+          event={{
+            id: "event-1",
+            name: "Test Event",
+            brand: "Test Brand",
+            description: "",
+            imageUrl: "",
+            date: "23 Agustus 2026",
+            location: "Jakarta",
+            tickets: [],
+          }}
+          onAction={vi.fn()}
+          onBack={vi.fn()}
+          onExpire={vi.fn()}
+        />
+      </ToastProvider>,
+    );
+
+    expect(screen.getByRole("button", { name: "Lanjutkan Pembayaran" })).toBeTruthy();
+    expect(screen.getAllByText(/halaman pembayaran/i)).toHaveLength(2);
+    expect(screen.queryByText(/xendit/i)).toBeNull();
+    expect(screen.queryByText(/channel/i)).toBeNull();
+    expect(screen.queryByText(/payment gateway/i)).toBeNull();
+  });
+});
``````

**Removed lines:** None

</details>

<details>
<summary><code>app/modules/external/checkout/presentation/components/steps/payment-instruction.tsx</code></summary>

**Added lines**

``````diff
+            Pilihan metode dan instruksi pembayaran tersedia di halaman pembayaran sampai {deadline} WIB.
+          Lanjutkan Pembayaran
``````

**Removed lines**

``````diff
-            Pilihan channel dan instruksi pembayaran tersedia di halaman aman Xendit sampai {deadline} WIB.
-          Lanjut ke Xendit
``````

</details>

<details>
<summary><code>app/modules/external/checkout/presentation/components/steps/payment-method-selection.test.tsx</code></summary>

**Added lines**

``````diff
+// @vitest-environment jsdom
+
+import { fireEvent, render, screen } from "@testing-library/react";
+import { describe, expect, it, vi } from "vitest";
+import { PaymentMethodSelection } from "./payment-method-selection";
+
+describe("PaymentMethodSelection", () => {
+  it("menampilkan nama metode tanpa subtitle internal", () => {
+    const onSelect = vi.fn();
+    render(
+      <PaymentMethodSelection
+        methods={[
+          { id: "manual", name: "Manual Transfer", logo: "", category: "BANK_TRANSFER" },
+          { id: "va", name: "Virtual Account", logo: "", category: "BANK_TRANSFER" },
+          { id: "qris", name: "QRIS", logo: "", category: "QRIS" },
+        ]}
+        virtualAccountBanks={[]}
+        paymentSessionEnabled
+        selectedMethodId="va"
+        onSelect={onSelect}
+      />,
+    );
+
+    expect(screen.getByText("Manual Transfer")).toBeTruthy();
+    expect(screen.getByText("Virtual Account")).toBeTruthy();
+    expect(screen.getByText("QRIS")).toBeTruthy();
+    expect(screen.queryByText(/verifikasi manual/i)).toBeNull();
+    expect(screen.queryByText(/diproses oleh xendit/i)).toBeNull();
+
+    fireEvent.click(screen.getByText("QRIS"));
+    expect(onSelect).toHaveBeenCalledWith("qris");
+  });
+});
``````

**Removed lines:** None

</details>

<details>
<summary><code>app/modules/external/checkout/presentation/components/steps/payment-method-selection.tsx</code></summary>

**Added lines**

``````diff
+            className={`relative flex min-h-24 items-center rounded-2xl border-2 p-4 text-left transition-all cursor-pointer ${selectedMethodId === method.id
``````

**Removed lines**

``````diff
-            className={`relative min-h-24 rounded-2xl border-2 p-4 text-left transition-all cursor-pointer ${selectedMethodId === method.id
-            <span className="mt-2 block text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
-              {method.id === "manual" || method.id === "manual_transfer" ? "Verifikasi manual" : "Diproses oleh Xendit"}
-            </span>
``````

</details>

<details>
<summary><code>app/modules/external/checkout/presentation/hooks/use-ticket-archive-actions.ts</code></summary>

**Added lines**

``````diff
+import { ApiRequestError, toUserFacingError } from "~/core/api";
+    if (!ticketCode) throw new ApiRequestError("Kode akses tiket tidak tersedia.");
+      if (!prepared) throw new ApiRequestError("Kode akses tiket tidak tersedia.");
+      errorToast(toUserFacingError(error, "Gagal mengunduh tiket."));
+        errorToast(toUserFacingError(error, "Gagal menyiapkan tiket."));
+        errorToast(toUserFacingError(error, "Gagal membagikan tiket."));
+      errorToast(toUserFacingError(error, "Gagal membagikan tiket."));
``````

**Removed lines**

``````diff
-    if (!ticketCode) throw new Error("Kode akses tiket tidak tersedia.");
-      if (!prepared) throw new Error("Kode akses tiket tidak tersedia.");
-      errorToast(error instanceof Error ? error.message : "Gagal mengunduh tiket.");
-        errorToast(error instanceof Error ? error.message : "Gagal menyiapkan tiket.");
-        errorToast(error instanceof Error ? error.message : "Gagal membagikan tiket.");
-      errorToast(error instanceof Error ? error.message : "Gagal membagikan tiket.");
``````

</details>

<details>
<summary><code>app/modules/external/static/contact.api.ts</code></summary>

**Added lines**

``````diff
+import { ApiRequestError, apiFetch, toUserFacingResponseError } from "~/core/api";
+    throw new ApiRequestError(toUserFacingResponseError(response, "Gagal mengirim pesan."));
``````

**Removed lines**

``````diff
-import { apiFetch } from "~/core/api";
-    throw new Error(response.error ?? "Gagal mengirim pesan");
``````

</details>

<details>
<summary><code>app/modules/external/static/hubungi.page.tsx</code></summary>

**Added lines**

``````diff
+import { toUserFacingError } from "~/core/api";
+      setError(toUserFacingError(err, "Gagal mengirim pesan."));
``````

**Removed lines**

``````diff
-      setError(err instanceof Error ? err.message : "Gagal mengirim pesan.");
``````

</details>

<details>
<summary><code>app/modules/internal/brand/presentation/brand.page.tsx</code></summary>

**Added lines**

``````diff
+import { toUserFacingError, useApiQuery } from "~/core/api";
+      setFormError(toUserFacingError(err, "Koneksi bermasalah."));
``````

**Removed lines**

``````diff
-import { useApiQuery } from "~/core/api";
-      setFormError(err instanceof Error ? err.message : "Koneksi bermasalah.");
``````

</details>

<details>
<summary><code>app/modules/internal/common/infrastructure/partner.api.ts</code></summary>

**Added lines**

``````diff
+import { ApiRequestError, internalHttpClient, toUserFacingResponseError } from "~/core/api";
+    throw new ApiRequestError(toUserFacingResponseError(response, defaultMessage));
``````

**Removed lines**

``````diff
-import { internalHttpClient } from "~/core/api";
-    throw new Error(response.error ?? defaultMessage);
``````

</details>

<details>
<summary><code>app/modules/internal/common/presentation/event-gallery-manager.tsx</code></summary>

**Added lines**

``````diff
+import { normalizeImageUrl, toUserFacingError } from "~/core/api";
+        setError(toUserFacingError(err, "Gagal memuat galeri event."));
+        setError(toUserFacingError(err, "Gagal menambahkan gambar."));
+        setError(toUserFacingError(err, "Gagal mengunggah gambar."));
+      setError(toUserFacingError(err, "Gagal menyimpan urutan galeri."));
+      setError(toUserFacingError(err, "Gagal menghapus gambar."));
``````

**Removed lines**

``````diff
-import { normalizeImageUrl } from "~/core/api";
-        setError(err instanceof Error ? err.message : "Gagal memuat galeri event.");
-        setError(err instanceof Error ? err.message : "Gagal menambahkan gambar.");
-        setError(err instanceof Error ? err.message : "Gagal mengunggah gambar.");
-      setError(err instanceof Error ? err.message : "Gagal menyimpan urutan galeri.");
-      setError(err instanceof Error ? err.message : "Gagal menghapus gambar.");
``````

</details>

<details>
<summary><code>app/modules/internal/common/presentation/image-source-input.tsx</code></summary>

**Added lines**

``````diff
+import { normalizeImageUrl, toUserFacingError } from "~/core/api";
+        setError(toUserFacingError(err, "Gagal mengunggah gambar."));
``````

**Removed lines**

``````diff
-import { normalizeImageUrl } from "~/core/api";
-        setError(err instanceof Error ? err.message : "Gagal mengunggah gambar.");
``````

</details>

<details>
<summary><code>app/modules/internal/common/presentation/payment-proof-actions.tsx</code></summary>

**Added lines**

``````diff
+import { ApiRequestError, toUserFacingError, toUserFacingResponseError } from "~/core/api";
+        throw new ApiRequestError(toUserFacingResponseError(response, "Bukti transfer tidak ditemukan."));
+        throw new ApiRequestError("Bukti transfer tidak tersedia.");
+      errorToast(toUserFacingError(error, "Gagal membuka bukti transfer."));
+        throw new ApiRequestError(toUserFacingResponseError(response, "Gagal mengunduh bukti transfer."));
+      errorToast(toUserFacingError(error, "Gagal mengunduh bukti transfer."));
``````

**Removed lines**

``````diff
-        throw new Error(response.error ?? "Bukti transfer tidak ditemukan");
-        throw new Error("Bukti transfer tidak tersedia");
-      errorToast(error instanceof Error ? error.message : "Gagal membuka bukti transfer");
-        throw new Error(response.error ?? "Gagal download bukti transfer");
-      errorToast(error instanceof Error ? error.message : "Gagal download bukti transfer");
``````

</details>

<details>
<summary><code>app/modules/internal/common/presentation/use-partner-dashboard-data.ts</code></summary>

**Added lines**

``````diff
+import { ApiRequestError, toUserFacingError } from "~/core/api";
+          throw new ApiRequestError("Brand partner tidak ditemukan.");
+          error: toUserFacingError(error, "Data partner belum dapat dimuat. Coba muat ulang."),
``````

**Removed lines**

``````diff
-          throw new Error("Brand partner tidak ditemukan di data internal");
-          error:
-            error instanceof Error
-              ? error.message
-              : "Gagal mengambil data internal partner",
``````

</details>

<details>
<summary><code>app/modules/internal/events/presentation/events.page.tsx</code></summary>

**Added lines**

``````diff
+import { toUserFacingError, useApiQuery } from "~/core/api";
+      setFormError(toUserFacingError(err, "Koneksi bermasalah."));
+      setFormError(toUserFacingError(err, "Koneksi bermasalah."));
``````

**Removed lines**

``````diff
-import { useApiQuery } from "~/core/api";
-      setFormError(err instanceof Error ? err.message : "Koneksi bermasalah.");
-      setFormError(err instanceof Error ? err.message : "Koneksi bermasalah.");
``````

</details>

<details>
<summary><code>app/modules/internal/events/presentation/generate-complimentary-ticket.page.tsx</code></summary>

**Added lines**

``````diff
+import { toUserFacingError, useApiQuery } from "~/core/api";
+      setDownloadError(toUserFacingError(err, "Gagal mengunduh tiket."));
+        msg: toUserFacingError(err, "Gagal mengirim email tiket."),
``````

**Removed lines**

``````diff
-import { useApiQuery } from "~/core/api";
-      setDownloadError(err instanceof Error ? err.message : "Gagal mengunduh tiket.");
-        msg: err instanceof Error ? err.message : "Gagal mengirim email tiket.",
``````

</details>

<details>
<summary><code>app/modules/internal/ticket-delivery/presentation/ticket-delivery-actions.tsx</code></summary>

**Added lines**

``````diff
+import { ApiRequestError, toUserFacingError, toUserFacingResponseError } from "~/core/api";
+        throw new ApiRequestError(toUserFacingResponseError(response, "Gagal mengunduh tiket."));
+      setError(toUserFacingError(err, "Gagal mengunduh tiket."));
+        throw new ApiRequestError(toUserFacingResponseError(response, "Gagal mengirim tiket."));
+      setError(toUserFacingError(err, "Gagal mengirim tiket."));
``````

**Removed lines**

``````diff
-        throw new Error(response.error ?? "Gagal download tiket");
-      setError(err instanceof Error ? err.message : "Gagal download tiket");
-        throw new Error(response.error ?? "Gagal mengirim tiket");
-      setError(err instanceof Error ? err.message : "Gagal mengirim tiket");
``````

</details>

<details>
<summary><code>app/modules/internal/ticket-scanning/presentation/hooks/use-checkin.ts</code></summary>

**Added lines**

``````diff
+import { toUserFacingError, toUserFacingResponseError } from "~/core/api";
+            toUserFacingResponseError(response, "Tiket tidak dapat diproses."),
+          message: toUserFacingError(error, "Gagal memproses scan."),
``````

**Removed lines**

``````diff
-            response.error,
-          message: error instanceof Error ? error.message : "Gagal memproses scan",
``````

</details>

<details>
<summary><code>app/modules/internal/ticket-scanning/presentation/hooks/use-scan-flow.ts</code></summary>

**Added lines**

``````diff
+import { toUserFacingError, toUserFacingResponseError } from "~/core/api";
+            buildValidateFailure(
+              normalizedCode,
+              codeType,
+              response.status_code,
+              toUserFacingResponseError(response, "Tiket tidak dapat divalidasi."),
+            ),
+          message: toUserFacingError(error, "Gagal memproses scan."),
+          message: toUserFacingResponseError(response, "Check-in gagal, silakan coba lagi."),
+        message: toUserFacingError(error, "Check-in gagal, silakan coba lagi."),
``````

**Removed lines**

``````diff
-            buildValidateFailure(normalizedCode, codeType, response.status_code, response.error),
-          message: error instanceof Error ? error.message : "Gagal memproses scan",
-          message: response.error || "Check-in gagal, silakan coba lagi.",
-        message: error instanceof Error ? error.message : "Check-in gagal, silakan coba lagi.",
``````

</details>

<details>
<summary><code>app/modules/internal/transaction-details/presentation/transaction-details.page.tsx</code></summary>

**Added lines**

``````diff
+import { ApiRequestError, toUserFacingError, toUserFacingResponseError, useApiQuery } from "~/core/api";
+        throw new ApiRequestError(toUserFacingResponseError(response, "Gagal memproses approval."));
+      errorToast(toUserFacingError(error, "Gagal memproses approval."));
``````

**Removed lines**

``````diff
-import { useApiQuery } from "~/core/api";
-        throw new Error(response.error ?? "Gagal memproses approval");
-      errorToast(error instanceof Error ? error.message : "Gagal memproses approval");
``````

</details>

<details>
<summary><code>app/root.tsx</code></summary>

**Added lines**

``````diff
+  let message = "Terjadi kendala";
+  let details = "Halaman belum dapat ditampilkan. Silakan coba lagi.";
+    message = error.status === 404 ? "404" : "Terjadi kendala";
+        ? "Halaman yang dicari tidak ditemukan."
+        : details;
``````

**Removed lines**

``````diff
-  let message = "Oops!";
-  let details = "An unexpected error occurred.";
-  let stack: string | undefined;
-    message = error.status === 404 ? "404" : "Error";
-        ? "The requested page could not be found."
-        : error.statusText || details;
-  } else if (import.meta.env.DEV && error && error instanceof Error) {
-    details = error.message;
-    stack = error.stack;
-      {stack && (
-        <pre className="w-full p-4 overflow-x-auto">
-          <code>{stack}</code>
-        </pre>
-      )}
``````

</details>

<details>
<summary><code>e2e/smoke.spec.ts</code></summary>

**Added lines**

``````diff
+    await expect(page.getByRole("button", { name: "Lanjutkan Pembayaran" })).toBeVisible();
+    await expect(page.getByText(/Xendit/i)).toHaveCount(0);
+      await expect(page.getByText("Lanjutkan Pembayaran", { exact: true })).toBeVisible();
+      await expect(page.getByText(/Xendit/i)).toHaveCount(0);
``````

**Removed lines**

``````diff
-    await expect(page.getByRole("button", { name: "Lanjut ke Xendit" })).toBeVisible();
-      await expect(page.getByText("Lanjut ke Xendit", { exact: true })).toBeVisible();
``````

</details>

</details>

#### [#63 — fix: release abandoned checkout locks](https://github.com/tiket-bisa/tiketbisa-fe/pull/63)

Merged `a8ece88` · 6 files · +77 / -4

<details>
<summary>Files changed with added/removed lines</summary>

<details>
<summary><code>app/modules/external/checkout/infrastructure/order.api.test.ts</code></summary>

**Added lines**

``````diff
+  it("releaseCheckout explicitly releases an abandoned reservation", async () => {
+    mockApiFetch.mockResolvedValueOnce({
+      success: true,
+      data: { released: true },
+    } as any);
+
+    await orderApi.releaseCheckout("lock-001", mockEventId);
+
+    expect(mockApiFetch).toHaveBeenCalledWith("/transaction/lock/lock-001", {
+      method: "DELETE",
+      body: JSON.stringify({ eventId: mockEventId }),
+    });
+  });
+
``````

**Removed lines:** None

</details>

<details>
<summary><code>app/modules/external/checkout/infrastructure/order.api.ts</code></summary>

**Added lines**

``````diff
+  /** Release an abandoned checkout. Persisted orders are protected by the backend. */
+  async releaseCheckout(lockId: string, eventId: string): Promise<void> {
+    const response = await apiFetch<ApiResponse<{ released: boolean }>>(`/transaction/lock/${lockId}`, {
+      method: "DELETE",
+      body: JSON.stringify({ eventId }),
+    });
+
+    if (!response.success) {
+      throw new Error(getApiErrorMessage(response, "Checkout belum dapat dibatalkan"));
+    }
+  },
+
``````

**Removed lines:** None

</details>

<details>
<summary><code>app/modules/external/checkout/presentation/components/layout/checkout-sidebar.tsx</code></summary>

**Added lines**

``````diff
+            aria-label="Kembali"
``````

**Removed lines:** None

</details>

<details>
<summary><code>app/modules/external/checkout/presentation/components/layout/checkout-sticky-bar.tsx</code></summary>

**Added lines**

``````diff
+            aria-label="Kembali"
``````

**Removed lines:** None

</details>

<details>
<summary><code>app/modules/external/checkout/presentation/hooks/use-checkout-steps.ts</code></summary>

**Added lines**

``````diff
+  const releaseActiveCheckout = useCallback((activeLockId?: string | null) => {
+    const checkoutId = activeLockId ?? lockId ?? searchParams.get("lockId");
+    if (!checkoutId || searchParams.get("orderId")) return;
+    void orderApi.releaseCheckout(checkoutId, event.id).catch((error) => {
+      // TTL remains the safety net if the browser loses its connection during cancellation.
+      console.error("Failed to release checkout reservation", error);
+    });
+  }, [event.id, lockId, searchParams]);
+
+    releaseActiveCheckout();
+  }, [clearCheckoutStorage, event.id, navigate, params.eventId, releaseActiveCheckout, warningToast]);
+    releaseActiveCheckout();
+  }, [clearCheckoutStorage, event.id, navigate, params.eventId, releaseActiveCheckout, warningToast]);
+      setBlockingError(null);
+      const message = "Tiket belum dapat direservasi. Periksa ketersediaan tiket lalu coba lagi.";
+      setBlockingError(message);
+      errorToast(message);
+  }, [lockId, currentStep, event.id, baseSummary, setSearchParams, exceedsTicketLimit, redirectForTicketLimit, errorToast]);
+      releaseActiveCheckout();
+  }, [clearCheckoutStorage, currentStep, navigate, params.eventId, releaseActiveCheckout]);
``````

**Removed lines**

``````diff
-  }, [clearCheckoutStorage, event.id, navigate, params.eventId, warningToast]);
-  }, [clearCheckoutStorage, event.id, navigate, params.eventId, warningToast]);
-  }, [lockId, currentStep, event.id, baseSummary, setSearchParams, exceedsTicketLimit, redirectForTicketLimit]);
-  }, [clearCheckoutStorage, currentStep, navigate, params.eventId]);
``````

</details>

<details>
<summary><code>e2e/smoke.spec.ts</code></summary>

**Added lines**

``````diff
+  test("abandoned checkout releases its ticket reservation", async ({ page, request }) => {
+    if (!seeded) throw new Error("Seed data missing");
+
+    await page.goto(`/event/${seeded.event.id}`);
+    await page.getByRole("button", { name: "Increase" }).first().click();
+    const initialLock = page.waitForResponse(
+      (response) => response.url().endsWith("/transaction/lock") && response.request().method() === "POST",
+    );
+    await page.getByRole("button", { name: "Beli Tiket" }).click();
+    const lockResponse = await initialLock;
+    const lockEnvelope = await lockResponse.json();
+    const lockId = lockEnvelope.data?.userId as string;
+    expect(lockId).toBeTruthy();
+
+    const releaseResponse = page.waitForResponse(
+      (response) => response.url().endsWith(`/transaction/lock/${lockId}`)
+        && response.request().method() === "DELETE",
+    );
+    await page.getByRole("button", { name: "Kembali" }).first().click();
+    await expect((await releaseResponse).ok()).toBeTruthy();
+
+    const ttlResponse = await request.get(
+      `${process.env.E2E_API_BASE_URL ?? "http://localhost:8080"}/transaction/ttl/locks/`
+        + `${seeded.event.id}/${seeded.ticketCategory.id}/${lockId}`,
+    );
+    const ttlEnvelope = await ttlResponse.json();
+    expect(Number(ttlEnvelope.data?.remainingSeconds ?? ttlEnvelope.data?.remaining_seconds ?? 0)).toBe(0);
+  });
+
``````

**Removed lines:** None

</details>

</details>

#### [#65 — fix: hide fee breakdown details](https://github.com/tiket-bisa/tiketbisa-fe/pull/65)

Merged `c147b93` · 2 files · +42 / -13

<details>
<summary>Files changed with added/removed lines</summary>

<details>
<summary><code>app/modules/external/checkout/presentation/components/shared/order-summary-card.test.tsx</code></summary>

**Added lines**

``````diff
+// @vitest-environment jsdom
+
+import { cleanup, render, screen } from "@testing-library/react";
+import { afterEach, describe, expect, it } from "vitest";
+import type { OrderSummary } from "../../../domain/checkout.types";
+import { OrderSummaryCard } from "./order-summary-card";
+
+afterEach(cleanup);
+
+const baseSummary: OrderSummary = {
+  subtotal: 10000,
+  serviceFeePerTicket: 500,
+  serviceFee: 500,
+  transactionFee: 315,
+  discount: 0,
+  totalPrice: 10815,
+  ticketCount: 1,
+  items: [{ ticketId: "ticket-1", ticketName: "Regular", price: 10000, quantity: 1 }],
+};
+
+describe("OrderSummaryCard", () => {
+  it.each([
+    "QRIS 3% dari sub total + biaya layanan",
+    "Virtual Account Rp 5.000",
+    "AstraPay Rp 5.000",
+    "Akulaku Rp 5.000",
+    "Indomaret Rp 5.000",
+  ])("menyembunyikan rincian biaya untuk %s", (transactionFeeDescription) => {
+    render(<OrderSummaryCard summary={{ ...baseSummary, transactionFeeDescription }} />);
+
+    expect(screen.getByText("Biaya layanan")).toBeTruthy();
+    expect(screen.getByText("Biaya transaksi")).toBeTruthy();
+    expect(screen.getByText("Rp 500")).toBeTruthy();
+    expect(screen.getByText("Rp 315")).toBeTruthy();
+    expect(screen.queryByText("500 x 1 tiket")).toBeNull();
+    expect(screen.queryByText(transactionFeeDescription)).toBeNull();
+  });
+});
``````

**Removed lines:** None

</details>

<details>
<summary><code>app/modules/external/checkout/presentation/components/shared/order-summary-card.tsx</code></summary>

**Added lines**

``````diff
+          <div className="flex justify-between items-center gap-4">
+            <span className="text-sm font-medium text-text-secondary">Biaya layanan</span>
+          <div className="flex justify-between items-center gap-4">
+            <span className="text-sm font-medium text-text-secondary">Biaya transaksi</span>
``````

**Removed lines**

``````diff
-import { formatServiceFeeBreakdown } from "../../../domain/checkout.pricing";
-          <div className="flex justify-between items-start gap-4">
-            <div className="space-y-1">
-              <span className="block text-sm font-medium text-text-secondary">Biaya layanan</span>
-              <span className="block text-xs font-medium text-text-tertiary">{formatServiceFeeBreakdown(summary)}</span>
-            </div>
-          <div className="flex justify-between items-start gap-4">
-            <div className="space-y-1">
-              <span className="block text-sm font-medium text-text-secondary">Biaya transaksi</span>
-              {summary.transactionFeeDescription && (
-                <span className="block text-xs font-medium text-text-tertiary">{summary.transactionFeeDescription}</span>
-              )}
-            </div>
``````

</details>

</details>

## Tech Stack

| Layer           | Technology                         |
| --------------- | ---------------------------------- |
| Framework       | React Router 7 (SSR)               |
| Language        | TypeScript 5 (strict)              |
| Styling         | Tailwind CSS v4 (CSS-first config) |
| Bundler         | Vite 7                             |
| Package Manager | **pnpm** (mandatory)               |

## Getting Started

```bash
pnpm install
pnpm dev          # → http://localhost:5173
pnpm build        # Production build
pnpm start        # Serve production build
pnpm typecheck    # Type-check without emitting
```

### Environment Variables

```bash
cp .env.example .env
```

### Local Development — Internal Dashboard

The internal dashboard uses a single `/internal-tb` entry point in production.
For local dev, open:

```
http://localhost:5173/internal-tb
```

The checkout flow stays on the public `/checkout/*` path.

## E2E Smoke Tests (Local)

Prerequisites:
- Backend compose is running with E2E mode explicitly enabled and the local E2E seeder allowed:

  ```bash
  cd ../tiketbisa-be
  TB_E2E_MODE=true SUPER_ADMIN_EMAIL=e2e-admin@tiketbisa.local docker compose up -d --build
  ```
- Frontend dev server is running.

```bash
cd tiketbisa-fe
pnpm install
pnpm exec playwright install
pnpm e2e
```

### Optional Environment Variables (E2E)

```bash
E2E_BASE_URL=http://localhost:5173
E2E_API_BASE_URL=http://localhost:8080
E2E_ADMIN_EMAIL=admin.e2e@tiketbisa.local
E2E_PARTNER_EMAIL=partner.e2e@tiketbisa.local
E2E_INTERNAL_TOKEN=e2e-token
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

## Architecture

### Domain Separation

The project is divided into two domains:

| Domain       | URL (Production)      | Path Prefix  | Description                                 |
| ------------ | --------------------- | ------------ | ------------------------------------------- |
| **External** | `tiketbisa.com`       | `/`          | Public platform — landing, search, checkout |
| **Internal** | `tiketbisa.com` | `/internal-tb/*` | Internal dashboard — role-based access, analytics, scanning |

### Directory Structure

```
app/
├── core/                              # Shared kernel (cross-domain)
│   ├── api/
│   │   ├── api-response.type.ts       # ApiResponse<T> contract
│   │   ├── pagination.type.ts         # PaginationParams (limit/offset)
│   │   └── index.ts                   # Barrel exports
│   ├── auth/                          # Auth provider & guard
│   ├── design-system/
│   │   ├── theme.ts                   # TS color token constants
│   │   └── components/                # Shared UI atoms
│   ├── types/
│   │   └── index.ts                   # Shared domain entities
│   └── utils/
│       └── index.ts
│
├── modules/
│   ├── external/                      # PUBLIC PLATFORM
│   │   ├── landing/
│   │   │   ├── domain/                # .type.ts, .entity.ts
│   │   │   ├── infrastructure/        # API calls, mappers
│   │   │   └── presentation/          # .page.tsx, hooks, components
│   │   ├── event-search/              # (same 3-layer pattern)
│   │   ├── brand/
│   │   ├── checkout/                  # Trust Mode enforced
│   │   └── static/                    # Simple pages (tentang, hubungi)
│   │
│   └── internal/                      # INTERNAL DASHBOARD
│       ├── entry/                      # Single Google sign-in entry point
│       ├── dashboard/
│       ├── brand/
│       ├── events/
│       ├── revenue-analytics/
│       ├── transaction-details/
│       └── ticket-scanning/
│
├── shared/                            # Cross-module reusables
│   ├── components/                    # Shared UI beyond design system
│   ├── hooks/                         # Shared custom hooks
│   └── utils/                         # Shared utilities
│
├── layouts/
│   ├── external.layout.tsx            # Header + nav + Footer + <Outlet/>
│   ├── internal.layout.tsx            # Internal header + nav + <Outlet/>
│   └── checkout.layout.tsx            # Trust Mode — minimal, Brand Purple only
│
├── app.css                            # Tailwind + design tokens
├── root.tsx                           # HTML shell
└── routes.ts                          # Route config
```

### 3-Layer Pattern (per module)

Every module under `modules/` follows three layers:

| Layer             | Contains                               | Extension                |
| ----------------- | -------------------------------------- | ------------------------ |
| `domain/`         | Entities, interfaces, type definitions | `.type.ts`, `.entity.ts` |
| `infrastructure/` | API calls (fetch/axios), data mappers  | `.ts`                    |
| `presentation/`   | Page components, hooks, sub-components | `.page.tsx`, `.tsx`      |

### API Contract

All API responses **must** match this TypeScript interface:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: ApiError | null;
  status_code: number;
}
```

All list endpoints **must** use pagination:

```typescript
interface PaginationParams {
  limit: number;
  offset: number;
}
```

### Design Tokens (from Engineer Guide)

| Section       | Token                     | Hex       | Usage                |
| ------------- | ------------------------- | --------- | -------------------- |
| **Base**      | `base.white`              | `#FFFFFF` | Main app background  |
|               | `base.inverse`            | `#0F0B1F` | Dark mode background |
| **Surface**   | `primary.surface`         | `#0F0B1F` | Big components       |
|               | `primary.surface-alt`     | `#17122B` | Cards, panels        |
|               | `primary.surface-hover`   | `#211A3A` | Hover surfaces       |
| **Brand 4.1** | `brand.primary.default`   | `#6D5CFF` | Main CTA             |
|               | `brand.primary.hover`     | `#5A4AE6` | Hover state          |
|               | `brand.primary.active`    | `#4C3FD1` | Pressed              |
|               | `brand.primary.subtle`    | `#2A2355` | Soft background      |
| **Brand 4.2** | `brand.secondary.default` | `#22C7A9` | Secondary actions    |
|               | `brand.secondary.hover`   | `#1DAE94` | Hover                |
|               | `brand.secondary.subtle`  | `#163F3A` | Badge background     |
| **Club 5**    | `club.accent`             | runtime   | Club dynamic color   |
|               | `club.accentSubtle`       | runtime   | Club subtle bg       |
|               | `club.accentText`         | runtime   | Text on club accent  |
| **Text 8**    | `text.primary`            | `#F5F3FF` | Main text            |
|               | `text.secondary`          | `#C7C2FF` | Supporting text      |
|               | `text.tertiary`           | `#8B85B3` | Caption              |
|               | `text.inverse`            | `#0F0B1F` | On light background  |
| **Border 9**  | `border.default`          | `#2B2550` | Default border       |
|               | `border.subtle`           | `#221C40` | Subtle border        |
|               | `divider`                 | `#1C1735` | Divider lines        |

**Trust Mode (Checkout):** The `[data-trust-mode="true"]` CSS selector locks `--color-accent` to Brand Purple and removes all dynamic club accents.

## Git Strategy

### Branch Naming

| Prefix        | Usage                      |
| ------------- | -------------------------- |
| `feature/*`   | New features               |
| `refactor/*`  | Code improvements          |
| `hotfix/*`    | Production bug fixes       |
| `ci/*`        | CI/CD pipeline changes     |
| `migration/*` | Database / data migrations |

### Rules

- **pnpm only** — do not use npm or yarn
- **TypeScript strict mode** — no `any` unless explicitly justified
- **Path alias** — use `~/` to import from `app/` (e.g. `import { theme } from "~/core/design-system/theme"`)

---

Built with ❤️ using React Router.
