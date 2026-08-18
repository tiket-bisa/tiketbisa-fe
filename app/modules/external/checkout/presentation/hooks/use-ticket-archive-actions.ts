import { useState } from "react";
import { useToast } from "~/core/design-system/components";
import {
  ticketDeliveryApi,
  type TicketArchive,
} from "../../infrastructure/ticket-delivery.api";

type TicketArchiveAction = "download" | "share";

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
  const [activeAction, setActiveAction] = useState<TicketArchiveAction | null>(null);
  const { error: errorToast, info: infoToast, success: successToast } = useToast();

  const loadArchive = async (): Promise<TicketArchive> => {
    if (!ticketCode) throw new Error("Kode akses tiket tidak tersedia.");
    return ticketDeliveryApi.downloadArchive(transactionId, ticketCode);
  };

  const download = async () => {
    if (activeAction) return;
    setActiveAction("download");
    try {
      saveArchive(await loadArchive());
      successToast("File tiket berhasil diunduh.");
    } catch (error) {
      errorToast(error instanceof Error ? error.message : "Gagal mengunduh tiket.");
    } finally {
      setActiveAction(null);
    }
  };

  const share = async () => {
    if (activeAction) return;
    setActiveAction("share");
    try {
      const archive = await loadArchive();
      const file = new File([archive.blob], archive.fileName, { type: "application/zip" });
      const canShareFile = typeof navigator.share === "function"
        && (typeof navigator.canShare !== "function" || navigator.canShare({ files: [file] }));

      if (canShareFile) {
        await navigator.share({ files: [file], title: "E-Tiket TiketBisa" });
      } else {
        saveArchive(archive);
        infoToast("Browser ini belum mendukung berbagi file. Tiket otomatis diunduh.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      errorToast(error instanceof Error ? error.message : "Gagal membagikan tiket.");
    } finally {
      setActiveAction(null);
    }
  };

  return { activeAction, download, share };
}
