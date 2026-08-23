import { useState } from "react";
import { Button, Input } from "~/core/design-system/components";
import { transactionApi, type TicketEmailDeliveryMode } from "~/core/api/services/transaction.api";
import { ApiRequestError, toUserFacingError, toUserFacingResponseError } from "~/core/api";

interface TicketDeliveryActionsProps {
  transactionId?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  ticketCount?: number;
  buttonLabel?: string;
}

type DeliveryAction = "download" | "email-original" | "email-custom";

export function TicketDeliveryActions({
  transactionId,
  customerName,
  customerEmail,
  ticketCount = 0,
  buttonLabel = "Kirim / Download Tiket",
}: TicketDeliveryActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customEmail, setCustomEmail] = useState(customerEmail ?? "");
  const [activeAction, setActiveAction] = useState<DeliveryAction | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canUseActions = Boolean(transactionId);
  const isBusy = activeAction !== null;

  const openModal = () => {
    setCustomEmail(customerEmail ?? "");
    setMessage(null);
    setError(null);
    setIsOpen(true);
  };

  const closeModal = () => {
    if (isBusy) return;
    setIsOpen(false);
  };

  const handleDownload = async () => {
    if (!transactionId) return;
    setActiveAction("download");
    setMessage(null);
    setError(null);

    try {
      const response = await transactionApi.downloadTickets(transactionId);
      if (!response.success || !response.data) {
        throw new ApiRequestError(toUserFacingResponseError(response, "Gagal mengunduh tiket."));
      }

      const url = URL.createObjectURL(response.data.blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = response.data.fileName || `tickets-${transactionId}.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("File tiket berhasil disiapkan.");
    } catch (err) {
      setError(toUserFacingError(err, "Gagal mengunduh tiket."));
    } finally {
      setActiveAction(null);
    }
  };

  const handleSendEmail = async (deliveryMode: TicketEmailDeliveryMode) => {
    if (!transactionId) return;
    const recipientEmail = deliveryMode === "CUSTOM_EMAIL" ? customEmail.trim() : customerEmail?.trim();
    if (!recipientEmail) {
      setError("Email tujuan wajib diisi.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      setError("Format email tujuan tidak valid.");
      return;
    }

    const action: DeliveryAction = deliveryMode === "CUSTOM_EMAIL" ? "email-custom" : "email-original";
    setActiveAction(action);
    setMessage(null);
    setError(null);

    try {
      const response = await transactionApi.sendTicketEmail(transactionId, {
        deliveryMode,
        email: deliveryMode === "CUSTOM_EMAIL" ? recipientEmail : undefined,
      });
      if (!response.success || !response.data) {
        throw new ApiRequestError(toUserFacingResponseError(response, "Gagal mengirim tiket."));
      }
      setMessage(`Tiket masuk antrean kirim ke ${response.data.recipientEmail}.`);
    } catch (err) {
      setError(toUserFacingError(err, "Gagal mengirim tiket."));
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <>
      <Button type="button" variant="secondary" size="sm" onClick={openModal} disabled={!canUseActions}>
        <span className="material-symbols-outlined mr-1 text-base">confirmation_number</span>
        {buttonLabel}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
            <div className="border-b border-border-subtle px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">Kirim / Download Tiket</h2>
                  <p className="mt-1 font-mono text-xs text-text-tertiary">{transactionId}</p>
                </div>
                <button
                  type="button"
                  className="rounded-md p-1 text-text-tertiary hover:bg-surface-hover hover:text-text-primary"
                  onClick={closeModal}
                  disabled={isBusy}
                  aria-label="Tutup"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
            </div>

            <div className="space-y-5 px-5 py-5">
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase text-text-tertiary">Pembeli</dt>
                  <dd className="mt-1 text-text-primary">{customerName || "-"}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-text-tertiary">Email Asli</dt>
                  <dd className="mt-1 break-all text-text-primary">{customerEmail || "-"}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-text-tertiary">Jumlah Tiket</dt>
                  <dd className="mt-1 text-text-primary">{ticketCount.toLocaleString("id-ID")}</dd>
                </div>
              </dl>

              {message && <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-success-text">{message}</div>}
              {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-destructive-text">{error}</div>}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button type="button" variant="secondary" onClick={handleDownload} isLoading={activeAction === "download"}>
                  <span className="material-symbols-outlined mr-2 text-base">download</span>
                  Download ZIP
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleSendEmail("ORIGINAL_CUSTOMER_EMAIL")}
                  disabled={!customerEmail}
                  isLoading={activeAction === "email-original"}
                >
                  <span className="material-symbols-outlined mr-2 text-base">forward_to_inbox</span>
                  Kirim ke Email Asli
                </Button>
              </div>

              <div className="space-y-3 border-t border-border-subtle pt-4">
                <Input
                  label="Email Tujuan Lain"
                  type="email"
                  value={customEmail}
                  onChange={(event) => setCustomEmail(event.target.value)}
                  placeholder="nama@email.com"
                  disabled={isBusy}
                />
                <Button
                  type="button"
                  fullWidth
                  onClick={() => handleSendEmail("CUSTOM_EMAIL")}
                  isLoading={activeAction === "email-custom"}
                >
                  <span className="material-symbols-outlined mr-2 text-base">alternate_email</span>
                  Kirim ke Email Ini
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
