// @vitest-environment jsdom
import { useEffect } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import AdminScanPage from "./scan.page";

const state = vi.hoisted(() => ({
  query: { data: [], loading: false, error: null as string | null, refetch: vi.fn() },
  mount: vi.fn(), unmount: vi.fn(),
}));
vi.mock("~/core/api", () => ({ useApiQuery: () => state.query }));
vi.mock("~/core/realtime", () => ({ useRealtimeSubscription: vi.fn() }));
vi.mock("react-router", () => ({ Link: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("~/modules/internal/ticket-scanning/presentation/components", () => ({
  ScanSection: () => {
    useEffect(() => { state.mount(); return () => { state.unmount(); }; }, []);
    return <div>SUCCESS CHECKED-IN</div>;
  },
  QrGeneratorSection: () => null,
}));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it("keeps scanner and result mounted throughout dashboard refetch and failure", () => {
  const view = render(<AdminScanPage />);
  state.query.loading = true;
  view.rerender(<AdminScanPage />);
  expect(screen.getByText("SUCCESS CHECKED-IN")).toBeTruthy();
  state.query.loading = false;
  state.query.error = "Network unavailable";
  view.rerender(<AdminScanPage />);
  expect(screen.getByText("SUCCESS CHECKED-IN")).toBeTruthy();
  expect(state.mount).toHaveBeenCalledTimes(1);
  expect(state.unmount).not.toHaveBeenCalled();
});
