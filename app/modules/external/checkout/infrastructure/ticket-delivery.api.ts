import { apiErrorFromResponse, toAbsoluteApiUrl } from "~/core/api";

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

async function getResponseError(response: Response): Promise<Error> {
  try {
    const body = await response.json();
    return apiErrorFromResponse(body, response, "Gagal menyiapkan tiket. Silakan coba lagi.");
  } catch {
    return apiErrorFromResponse(null, response, "Gagal menyiapkan tiket. Silakan coba lagi.");
  }
}

export const ticketDeliveryApi = {
  async downloadArchive(transactionId: string, ticketCode: string): Promise<TicketArchive> {
    const response = await fetch(
      toAbsoluteApiUrl(`/transaction/${encodeURIComponent(transactionId)}/tickets/download`),
      { headers: { "x-tb-ticket-code": ticketCode } },
    );

    if (!response.ok) {
      throw await getResponseError(response);
    }

    return {
      blob: await response.blob(),
      fileName: getFileName(response.headers.get("Content-Disposition"), transactionId),
    };
  },
};
