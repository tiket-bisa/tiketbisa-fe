import { internalHttpClient } from "~/core/api";

export interface PartnerTicketIngestRequest {
  brand_id: string;
  event_id: string;
  ticket_category_id: string;
  partner: string;
  codes: string[];
}

export interface PartnerTicketIngestResponse {
  inserted: number;
  skipped: number;
}

export const partnerTicketApi = {
  ingest: (request: PartnerTicketIngestRequest) =>
    internalHttpClient.post<PartnerTicketIngestResponse>("/partner-ticket/ingest", request),
};
