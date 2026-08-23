import { ApiRequestError, apiFetch, toUserFacingResponseError } from "~/core/api";
import type { ApiResponse } from "~/core/api";

export interface ContactMessageRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function sendContactMessage(payload: ContactMessageRequest): Promise<void> {
  const response = await apiFetch<ApiResponse<null>>("/contact", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!response.success) {
    throw new ApiRequestError(toUserFacingResponseError(response, "Gagal mengirim pesan."));
  }
}
