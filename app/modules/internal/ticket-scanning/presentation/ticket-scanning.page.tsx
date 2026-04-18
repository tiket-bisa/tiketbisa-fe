import { useState } from "react";
import { Tabs } from "~/core/design-system/components";
import { useAuth } from "~/core/auth";
import { DashboardSection } from "./components/dashboard-section";
import { ScanSection } from "./components/scan-section";

const tabItems = [
  { value: "scan", label: "Scan Tiket" },
  { value: "dashboard", label: "Dashboard Tiket" },
];

/** Partner — Ticket Scanning (filtered by partner's brand) */
export default function TicketScanningPage() {
  const [tab, setTab] = useState("scan");
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-text-primary text-2xl font-bold">Scan Tiket</h1>

      <Tabs items={tabItems} value={tab} onChange={setTab} />

      {tab === "scan" ? <ScanSection /> : <DashboardSection brandSlug={user?.brand_slug} />}
    </div>
  );
}
