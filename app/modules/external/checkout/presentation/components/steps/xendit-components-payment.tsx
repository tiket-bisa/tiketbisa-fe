import { useEffect, useRef, useState } from "react";
import { XenditComponents } from "xendit-components-web";
import { Button, Card } from "~/core/design-system/components";

export interface XenditComponentsPaymentProps {
  componentsSdkKey: string;
  paymentMethodId: string;
  deadline: string;
  onCheckStatus: () => void;
  onBack: () => void;
  onExpire: () => void;
}

/**
 * Native Payment Session UI. The short-lived SDK key is kept only in component memory.
 * Completion events trigger a local status check; only the verified backend webhook may
 * advance the order to paid/success.
 */
export function XenditComponentsRealPayment({
  componentsSdkKey,
  paymentMethodId,
  deadline,
  onCheckStatus,
  onBack,
  onExpire,
}: XenditComponentsPaymentProps) {
  const channelContainerRef = useRef<HTMLDivElement>(null);
  const actionContainerRef = useRef<HTMLDivElement>(null);
  const componentsRef = useRef<XenditComponents | null>(null);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const components = new XenditComponents({ componentsSdkKey });
    componentsRef.current = components;

    let channelElement: HTMLElement | null = null;
    let actionElement: HTMLElement | null = null;

    const mountActionContainer = () => {
      if (!actionContainerRef.current || actionElement) return;
      actionElement = components.createActionContainerComponent({
        qrCode: { qrCodeOnly: paymentMethodId === "qris" },
      });
      actionContainerRef.current.replaceChildren(actionElement);
    };

    const onInit = () => {
      if (!channelContainerRef.current) return;
      if (paymentMethodId === "qris") {
        const qris = components.getActiveChannels({ filter: "QRIS" })[0];
        if (!qris) {
          setError("QRIS belum tersedia. Silakan pilih metode pembayaran lain.");
          return;
        }
        channelElement = components.createChannelComponent(qris);
      } else {
        // The VA session is restricted to activated VA channels. The SDK picker lets the
        // buyer choose a bank, then generates a one-time VA number for this transaction.
        channelElement = components.createChannelPickerComponent();
      }
      channelContainerRef.current.replaceChildren(channelElement);
      mountActionContainer();
    };
    const onReady = () => setReady(true);
    const onNotReady = () => setReady(false);
    const onSubmissionBegin = () => {
      setSubmitting(true);
      setError(null);
    };
    const onSubmissionEnd = () => setSubmitting(false);
    const onActionBegin = () => {
      mountActionContainer();
      setAwaitingConfirmation(true);
    };
    const onComplete = () => {
      setSubmitting(false);
      setAwaitingConfirmation(true);
      onCheckStatus();
    };
    const onPending = () => {
      setSubmitting(false);
      setAwaitingConfirmation(true);
    };
    const onExpired = () => onExpire();
    const onFatalError = () => {
      setSubmitting(false);
      setError("Pembayaran belum dapat dimuat. Silakan coba lagi.");
    };

    components.addEventListener("init", onInit);
    components.addEventListener("submission-ready", onReady);
    components.addEventListener("submission-not-ready", onNotReady);
    components.addEventListener("submission-begin", onSubmissionBegin);
    components.addEventListener("submission-end", onSubmissionEnd);
    components.addEventListener("action-begin", onActionBegin);
    components.addEventListener("session-complete", onComplete);
    components.addEventListener("session-pending", onPending);
    components.addEventListener("session-expired-or-canceled", onExpired);
    components.addEventListener("fatal-error", onFatalError);

    return () => {
      components.removeEventListener("init", onInit);
      components.removeEventListener("submission-ready", onReady);
      components.removeEventListener("submission-not-ready", onNotReady);
      components.removeEventListener("submission-begin", onSubmissionBegin);
      components.removeEventListener("submission-end", onSubmissionEnd);
      components.removeEventListener("action-begin", onActionBegin);
      components.removeEventListener("session-complete", onComplete);
      components.removeEventListener("session-pending", onPending);
      components.removeEventListener("session-expired-or-canceled", onExpired);
      components.removeEventListener("fatal-error", onFatalError);
      components.abortSubmission();
      if (channelElement) components.destroyComponent(channelElement);
      if (actionElement) components.destroyComponent(actionElement);
      componentsRef.current = null;
    };
  }, [componentsSdkKey, onCheckStatus, onExpire, paymentMethodId]);

  const submit = () => {
    const components = componentsRef.current;
    if (!components) return;
    if (!ready) {
      components.showValidationErrors();
      return;
    }
    components.submit();
  };

  const checkStatus = () => {
    // The SDK's immediate poll rebuilds its action/channel UI when the session is still pending,
    // which sends QRIS buyers back to the pre-generation screen. Our backend status endpoint is
    // the authoritative check and already observes the verified webhook result.
    onCheckStatus();
  };

  return (
    <Card className="max-w-2xl mx-auto p-6 md:p-10 rounded-3xl space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-black text-text-primary">
          {paymentMethodId === "qris" ? "Pembayaran QRIS" : "Pembayaran Virtual Account"}
        </h2>
        <p className="text-sm font-medium text-text-secondary">
          Selesaikan pembayaran sebelum {deadline} WIB.
        </p>
      </div>

      <div ref={channelContainerRef} data-testid="xendit-channel-container" />
      <div ref={actionContainerRef} data-testid="xendit-action-container" className="min-h-0" />

      {error && <p role="alert" className="text-sm font-bold text-destructive-text text-center">{error}</p>}
      {awaitingConfirmation && (
        <p className="text-sm font-medium text-text-secondary text-center">
          Menunggu konfirmasi pembayaran…
        </p>
      )}

      <Button onClick={submit} disabled={!ready || submitting} className="w-full py-5 rounded-2xl text-lg font-black">
        {submitting ? "Memproses…" : paymentMethodId === "qris" ? "Tampilkan QRIS" : "Buat Nomor Virtual Account"}
      </Button>
      {awaitingConfirmation && (
        <Button variant="secondary" onClick={checkStatus} className="w-full rounded-2xl">
          Cek Status Pembayaran
        </Button>
      )}
      <button type="button" onClick={onBack} className="block mx-auto text-sm font-bold text-text-secondary hover:text-text-primary cursor-pointer">
        Keluar dari pembayaran
      </button>
    </Card>
  );
}
