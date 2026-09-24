import { Button } from "~/core/design-system/components";

export function EventDashboardBackButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="ghost" onClick={onClick} className="mb-2">
      <span className="material-symbols-outlined text-base leading-none" aria-hidden="true">arrow_back</span>
      Kembali ke Daftar Event
    </Button>
  );
}

export function TicketCodeExportButton({
  downloading,
  onClick,
}: {
  downloading: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      disabled={downloading}
      isLoading={downloading}
      onClick={onClick}
    >
      <span className="material-symbols-outlined text-base leading-none" aria-hidden="true">download</span>
      Unduh Semua Kode (CSV)
    </Button>
  );
}
