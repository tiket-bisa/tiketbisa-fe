import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "~/core/design-system/components";
import {
  ticketDeliveryApi,
  type TicketArchive,
} from "../../infrastructure/ticket-delivery.api";
import { ApiRequestError, toUserFacingError } from "~/core/api";

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
  const [archive, setArchive] = useState<TicketArchive | null>(null);
  const [isPreparingArchive, setIsPreparingArchive] = useState(false);
  const archiveRequestRef = useRef<{ key: string; promise: Promise<TicketArchive> } | null>(null);
  const { error: errorToast, info: infoToast, success: successToast } = useToast();

  const loadArchive = useCallback((): Promise<TicketArchive> => {
    if (!ticketCode) throw new ApiRequestError("Kode akses tiket tidak tersedia.");
    const key = `${transactionId}:${ticketCode}`;
    if (archiveRequestRef.current?.key === key) return archiveRequestRef.current.promise;

    const promise = ticketDeliveryApi.downloadArchive(transactionId, ticketCode);
    archiveRequestRef.current = { key, promise };
    return promise;
  }, [ticketCode, transactionId]);

  const prepareArchive = useCallback(async () => {
    if (!transactionId || !ticketCode) return null;
    setIsPreparingArchive(true);
    try {
      const prepared = await loadArchive();
      setArchive(prepared);
      return prepared;
    } catch (error) {
      archiveRequestRef.current = null;
      setArchive(null);
      throw error;
    } finally {
      setIsPreparingArchive(false);
    }
  }, [loadArchive, ticketCode, transactionId]);

  useEffect(() => {
    let active = true;
    setArchive(null);
    if (!transactionId || !ticketCode) return () => { active = false; };

    setIsPreparingArchive(true);
    void loadArchive()
      .then((prepared) => { if (active) setArchive(prepared); })
      .catch(() => { if (active) archiveRequestRef.current = null; })
      .finally(() => { if (active) setIsPreparingArchive(false); });
    return () => { active = false; };
  }, [loadArchive, ticketCode, transactionId]);

  const download = async () => {
    if (activeAction) return;
    setActiveAction("download");
    try {
      const prepared = archive ?? await prepareArchive();
      if (!prepared) throw new ApiRequestError("Kode akses tiket tidak tersedia.");
      saveArchive(prepared);
      successToast("File tiket berhasil diunduh.");
    } catch (error) {
      errorToast(toUserFacingError(error, "Gagal mengunduh tiket."));
    } finally {
      setActiveAction(null);
    }
  };

  const share = () => {
    if (activeAction) return;
    if (!archive) {
      void prepareArchive().catch((error) => {
        errorToast(toUserFacingError(error, "Gagal menyiapkan tiket."));
      });
      infoToast("Tiket sedang disiapkan. Tekan Bagikan lagi setelah selesai.");
      return;
    }

    const file = new File([archive.blob], archive.fileName, { type: "application/zip" });
    const canShareFile = globalThis.isSecureContext !== false
      && typeof navigator.share === "function"
      && (typeof navigator.canShare !== "function" || navigator.canShare({ files: [file] }));

    if (!canShareFile) {
      saveArchive(archive);
      infoToast("Browser ini belum mendukung berbagi file. Tiket otomatis diunduh.");
      return;
    }

    setActiveAction("share");
    try {
      // Invoke Web Share synchronously in the click handler. Awaiting a network request first loses
      // Chrome Android's transient user activation and results in NotAllowedError/permission denied.
      const shareResult = navigator.share({ files: [file], title: "E-Tiket TiketBisa" });
      void shareResult.catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (error instanceof DOMException && error.name === "NotAllowedError") {
          errorToast("Izin berbagi ditolak. Pastikan halaman dibuka melalui HTTPS lalu coba lagi.");
          return;
        }
        errorToast(toUserFacingError(error, "Gagal membagikan tiket."));
      }).finally(() => setActiveAction(null));
    } catch (error) {
      setActiveAction(null);
      errorToast(toUserFacingError(error, "Gagal membagikan tiket."));
    }
  };

  return { activeAction, isPreparingArchive, isArchiveReady: archive !== null, download, share };
}
