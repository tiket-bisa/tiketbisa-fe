import { useState } from "react";
import { Button, useToast } from "~/core/design-system/components";
import { transactionApi } from "~/core/api/services/transaction.api";
import { ApiRequestError, toUserFacingError, toUserFacingResponseError } from "~/core/api";
import { useObjectUrlRegistry } from "./use-object-url-registry";

type ProofPreview = {
  fileName: string;
  mimeType: string;
  url: string;
  isObjectUrl: boolean;
};

interface PaymentProofActionsProps {
  transactionId: string;
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mimeType });
}

export function PaymentProofActions({ transactionId }: PaymentProofActionsProps) {
  const [activeAction, setActiveAction] = useState<"view" | "download" | null>(null);
  const [preview, setPreview] = useState<ProofPreview | null>(null);
  const { error: errorToast } = useToast();
  const { createObjectUrl, revokeObjectUrl } = useObjectUrlRegistry();

  const closePreview = () => {
    if (preview?.isObjectUrl) {
      revokeObjectUrl(preview.url);
    }
    setPreview(null);
  };

  const handleView = async () => {
    setActiveAction("view");
    try {
      const response = await transactionApi.getPaymentProof(transactionId);
      if (!response.success || !response.data) {
        throw new ApiRequestError(toUserFacingResponseError(response, "Bukti transfer tidak ditemukan."));
      }

      const file = response.data;
      closePreview();
      if (file.signedUrl) {
        setPreview({
          fileName: file.fileName,
          mimeType: file.mimeType,
          url: file.signedUrl,
          isObjectUrl: false,
        });
        return;
      }
      if (!file.base64Content) {
        throw new ApiRequestError("Bukti transfer tidak tersedia.");
      }

      const mimeType = file.mimeType || "application/octet-stream";
      setPreview({
        fileName: file.fileName,
        mimeType,
        url: createObjectUrl(base64ToBlob(file.base64Content, mimeType)),
        isObjectUrl: true,
      });
    } catch (error) {
      errorToast(toUserFacingError(error, "Gagal membuka bukti transfer."));
    } finally {
      setActiveAction(null);
    }
  };

  const handleDownload = async () => {
    setActiveAction("download");
    try {
      const response = await transactionApi.downloadPaymentProof(transactionId);
      if (!response.success || !response.data) {
        throw new ApiRequestError(toUserFacingResponseError(response, "Gagal mengunduh bukti transfer."));
      }

      const url = createObjectUrl(response.data.blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = response.data.fileName || `payment-proof-${transactionId}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      revokeObjectUrl(url);
    } catch (error) {
      errorToast(toUserFacingError(error, "Gagal mengunduh bukti transfer."));
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button type="button" variant="secondary" onClick={handleView} isLoading={activeAction === "view"} disabled={activeAction !== null}>
          Buka Bukti Transfer
        </Button>
        <Button type="button" variant="secondary" onClick={handleDownload} isLoading={activeAction === "download"} disabled={activeAction !== null}>
          Download Bukti Transfer
        </Button>
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-proof-title"
            className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between gap-4 border-b border-border-subtle px-5 py-4">
              <div className="min-w-0">
                <h2 id="payment-proof-title" className="text-lg font-semibold text-text-primary">Bukti Transfer</h2>
                <p className="truncate text-xs text-text-tertiary">{preview.fileName}</p>
              </div>
              <button
                type="button"
                onClick={closePreview}
                className="rounded-md p-1 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary cursor-pointer"
                aria-label="Tutup bukti transfer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-surface-alt p-4">
              {preview.mimeType.startsWith("image/") ? (
                <img src={preview.url} alt={`Bukti transfer ${preview.fileName}`} className="mx-auto max-h-[75vh] max-w-full object-contain" />
              ) : preview.mimeType === "application/pdf" ? (
                <iframe src={preview.url} title={`Bukti transfer ${preview.fileName}`} className="h-[75vh] w-full rounded-lg bg-white" />
              ) : (
                <div className="py-12 text-center">
                  <p className="text-sm text-text-secondary">Format file tidak dapat dipratinjau.</p>
                  <a href={preview.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-semibold text-brand-primary hover:underline">
                    Buka file
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
