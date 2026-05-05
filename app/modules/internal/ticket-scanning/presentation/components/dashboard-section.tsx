import { useMemo } from "react";
import { useApiQuery } from "~/core/api";
import { analyticsApi } from "~/modules/internal/analytics/analytics.api";

/** Ticket dashboard showing available vs checked-in */
export function DashboardSection({ brandSlug }: { brandSlug?: string }) {
  const { data: apiTickets, loading } = useApiQuery(
    () => analyticsApi.getTicketScanningDashboard(),
    []
  );

  const tickets = useMemo(
    () => (apiTickets || []).filter((t) => !brandSlug || t.brandSlug === brandSlug),
    [apiTickets, brandSlug]
  );

  if (loading) {
    return <div className="text-center py-8 text-text-tertiary">Memuat dashboard...</div>;
  }

  return (
    <div className="space-y-4">
      {tickets.map((summary) => {
        const soldPercent =
          summary.totalTickets > 0
            ? Math.round((summary.soldTickets / summary.totalTickets) * 100)
            : 0;
        const checkedInPercent =
          summary.soldTickets > 0
            ? Math.round((summary.checkedInTickets / summary.soldTickets) * 100)
            : 0;

        return (
          <Card key={summary.eventId} padding="md">
            <h3 className="text-text-primary font-semibold mb-4">
              {summary.eventName}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-text-tertiary text-xs uppercase tracking-wide">
                  Total
                </p>
                <p className="text-text-primary text-xl font-bold mt-1">
                  {summary.totalTickets.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-text-tertiary text-xs uppercase tracking-wide">
                  Tersedia
                </p>
                <p className="text-success-text text-xl font-bold mt-1">
                  {summary.availableTickets.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-text-tertiary text-xs uppercase tracking-wide">
                  Terjual
                </p>
                <p className="text-brand-primary text-xl font-bold mt-1">
                  {summary.soldTickets.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-text-tertiary text-xs uppercase tracking-wide">
                  Check-in
                </p>
                <p className="text-warning-default text-xl font-bold mt-1">
                  {summary.checkedInTickets.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div>
                <div className="flex justify-between text-xs text-text-tertiary mb-1">
                  <span>Terjual</span>
                  <span>{soldPercent}%</span>
                </div>
                <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-primary rounded-full transition-all"
                    style={{ width: `${soldPercent}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-text-tertiary mb-1">
                  <span>Checked-in (dari terjual)</span>
                  <span>{checkedInPercent}%</span>
                </div>
                <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary-default rounded-full transition-all"
                    style={{ width: `${checkedInPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
