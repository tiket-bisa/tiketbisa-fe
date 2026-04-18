import { useState } from "react";
import { Tabs } from "~/core/design-system/components";
import { DashboardSection } from "./components/dashboard-section";
import { ScanSection } from "./components/scan-section";

const tabItems = [
  { value: "scan", label: "Scan Tiket" },
  { value: "dashboard", label: "Dashboard Tiket" },
];

/** Internal — Ticket Scanning (Scan Tiket) */
export default function TicketScanningPage() {
  const [tab, setTab] = useState("scan");

  return (
    <div className="space-y-6">
      <h1 className="text-text-primary text-2xl font-bold">Scan Tiket</h1>

      <Tabs items={tabItems} value={tab} onChange={setTab} />

      {tab === "scan" ? <ScanSection /> : <DashboardSection />}
    </div>
  );
}
