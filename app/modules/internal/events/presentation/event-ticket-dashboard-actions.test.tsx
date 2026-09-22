import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { EventDashboardBackButton, TicketCodeExportButton } from "./event-ticket-dashboard-actions";

describe("event ticket dashboard actions", () => {
  it("navigates back using the labelled arrow action", () => {
    const onClick = vi.fn();
    const element = EventDashboardBackButton({ onClick });
    const markup = renderToStaticMarkup(element);

    element.props.onClick();

    expect(onClick).toHaveBeenCalledOnce();
    expect(markup).toContain("arrow_back");
    expect(markup).toContain("Kembali ke Daftar Event");
  });

  it("uses the download label and blocks repeat clicks while loading", () => {
    const onClick = vi.fn();
    const enabled = TicketCodeExportButton({ downloading: false, onClick });
    const loading = TicketCodeExportButton({ downloading: true, onClick });
    const enabledMarkup = renderToStaticMarkup(enabled);
    const loadingMarkup = renderToStaticMarkup(loading);

    enabled.props.onClick();
    expect(onClick).toHaveBeenCalledOnce();
    expect(enabledMarkup).toContain("download");
    expect(enabledMarkup).toContain("Unduh Semua Kode (CSV)");
    expect(loadingMarkup).toContain("disabled");
  });
});
