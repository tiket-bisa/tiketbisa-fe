import { useState } from "react";
import { ApiRequestError, toUserFacingError, toUserFacingResponseError } from "~/core/api";
import { transactionApi, type TransactionApiData } from "~/core/api/services/transaction.api";
import { Button, Card, useToast } from "~/core/design-system/components";

interface Props {
  transaction: TransactionApiData;
  available: boolean;
  onUpdated: () => void;
}

export function PaymentReconciliationAction({ transaction, available, onUpdated }: Props) {
  const [loading, setLoading] = useState(false);
  const { success, info, error: showError } = useToast();
  if (!available) return null;
  const provider = transaction.gatewayProvider ?? "gateway";

  const handleCheck = async () => {
    if (loading || !window.confirm(
      `Periksa pembayaran ${provider} untuk transaksi ${transaction.id}? Status hanya berubah jika gateway mengonfirmasi pembayaran sebesar ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(transaction.totalPrice)}.`,
    )) return;

    setLoading(true);
    try {
      const response = await transactionApi.reconcilePayment(transaction.id);
      if (!response.success || !response.data) {
        throw new ApiRequestError(toUserFacingResponseError(response, `Gagal memeriksa pembayaran ${provider}.`));
      }
      if (response.data.status === "COMPLETED") {
        success(`Pembayaran dikonfirmasi ${provider} dan tiket sedang dikirim.`);
      } else if (response.data.status === "PAID_RECONCILIATION_REQUIRED") {
        info("Pembayaran tercatat, tetapi inventori tiket perlu direkonsiliasi.");
      }
    } catch (error) {
      showError(toUserFacingError(error, `Gagal memeriksa pembayaran ${provider}.`));
    } finally {
      onUpdated();
      setLoading(false);
    }
  };

  return (
    <Card padding="md" className="border border-warning/40 bg-warning/5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-text-primary">Pembayaran {provider} belum tercatat selesai.</p>
          <p className="mt-1 text-sm text-text-tertiary">
            Periksa status langsung ke {provider}. Transaksi hanya dikonfirmasi jika pembayaran dan nominal cocok.
          </p>
        </div>
        <Button size="sm" onClick={handleCheck} isLoading={loading}>
          Periksa Pembayaran {provider}
        </Button>
      </div>
    </Card>
  );
}
