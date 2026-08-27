import { useState } from "react";
import { useToast } from "~/core/design-system/components";
import {
  ticketDeliveryApi,
  type TicketArchive,
} from "../../infrastructure/ticket-delivery.api";
import { ApiRequestError, toUserFacingError } from "~/core/api";

function saveArchive({ blob, fileName }: TicketArchive): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function useTicketArchiveActions(transactionId: string, ticketCode?: string) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { error: errorToast, success: successToast } = useToast();

  const download = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      if (!transactionId || !ticketCode) {
        throw new ApiRequestError("Kode akses tiket tidak tersedia.");
      }
      const archive = await ticketDeliveryApi.downloadArchive(transactionId, ticketCode);
      saveArchive(archive);
      successToast("File tiket berhasil diunduh.");
    } catch (error) {
      errorToast(toUserFacingError(error, "Gagal mengunduh tiket."));
    } finally {
      setIsDownloading(false);
    }
  };

  return { isDownloading, download };
}
