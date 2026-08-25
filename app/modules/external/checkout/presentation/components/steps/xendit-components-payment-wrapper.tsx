import { lazy, Suspense, useState } from "react";
import { Button, Card } from "~/core/design-system/components";
import type { XenditComponentsPaymentProps } from "./xendit-components-payment";

const XenditComponentsRealPayment = lazy(async () => {
  const module = await import("./xendit-components-payment");
  return { default: module.XenditComponentsRealPayment };
});

export function XenditComponentsPayment(props: XenditComponentsPaymentProps) {
  if (props.componentsSdkKey.startsWith("MOCK-COMPONENTS-")) {
    return <MockComponentsPayment {...props} />;
  }
  return (
    <Suspense fallback={<ComponentsLoading deadline={props.deadline} />}>
      <XenditComponentsRealPayment {...props} />
    </Suspense>
  );
}

function ComponentsLoading({ deadline }: { deadline: string }) {
  return (
    <Card className="max-w-2xl mx-auto p-8 rounded-3xl text-center space-y-2">
      <h2 className="text-2xl font-black text-text-primary">Menyiapkan pembayaran</h2>
      <p className="text-sm font-medium text-text-secondary">Selesaikan pembayaran sebelum {deadline} WIB.</p>
    </Card>
  );
}

/** Deterministic local/E2E UI. Production always loads the official SDK component above. */
function MockComponentsPayment({ paymentMethodId, deadline, onCheckStatus, onBack }: XenditComponentsPaymentProps) {
  const [bank, setBank] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const isQris = paymentMethodId === "qris";
  const ready = isQris || Boolean(bank);

  return (
    <Card className="max-w-2xl mx-auto p-6 md:p-10 rounded-3xl space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-black text-text-primary">
          {isQris ? "Pembayaran QRIS" : "Pembayaran Virtual Account"}
        </h2>
        <p className="text-sm font-medium text-text-secondary">Selesaikan pembayaran sebelum {deadline} WIB.</p>
      </div>
      {!isQris && (
        <label className="grid gap-2 text-sm font-bold text-text-secondary">
          Pilih bank
          <select aria-label="Pilih bank Virtual Account" value={bank} onChange={(event) => setBank(event.target.value)} className="h-12 rounded-xl border border-gray-200 px-3">
            <option value="">Pilih bank</option>
            <option value="BRI_VIRTUAL_ACCOUNT">BRI</option>
            <option value="BNI_VIRTUAL_ACCOUNT">BNI</option>
          </select>
        </label>
      )}
      {submitted && (
        <div className="rounded-2xl bg-surface-hover p-5 text-center text-sm font-bold text-text-primary">
          {isQris ? "QRIS siap dipindai (mode pengujian)" : `Nomor VA ${bank.split("_")[0]} siap digunakan (mode pengujian)`}
        </div>
      )}
      <Button onClick={() => setSubmitted(true)} disabled={!ready} className="w-full py-5 rounded-2xl text-lg font-black">
        {isQris ? "Tampilkan QRIS" : "Buat Nomor Virtual Account"}
      </Button>
      {submitted && <Button variant="secondary" onClick={onCheckStatus} className="w-full rounded-2xl">Cek Status Pembayaran</Button>}
      <button type="button" onClick={onBack} className="block mx-auto text-sm font-bold text-text-secondary hover:text-text-primary cursor-pointer">Keluar dari pembayaran</button>
    </Card>
  );
}
