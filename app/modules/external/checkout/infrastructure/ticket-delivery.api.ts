import { toAbsoluteApiUrl } from "~/core/api";

export interface TicketArchive {
  blob: Blob;
  fileName: string;
}

function getFileName(disposition: string | null, transactionId: string): string {
  const encodedName = disposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plainName = disposition?.match(/filename="?([^";]+)"?/i)?.[1];
  const fileName = encodedName ? decodeURIComponent(encodedName) : plainName;
  return fileName?.trim() || `tickets-${transactionId}.zip`;
}

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return body?.error?.message || body?.error || "Gagal menyiapkan tiket";
  } catch {
    return "Gagal menyiapkan tiket";
  }
}

export const ticketDeliveryApi = {
  async downloadArchive(transactionId: string, ticketCode: string): Promise<TicketArchive> {
    const response = await fetch(
      toAbsoluteApiUrl(`/transaction/${encodeURIComponent(transactionId)}/tickets/download`),
      { headers: { "x-tb-ticket-code": ticketCode } },
    );

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    return {
      blob: await response.blob(),
      fileName: getFileName(response.headers.get("Content-Disposition"), transactionId),
    };
  },
};
