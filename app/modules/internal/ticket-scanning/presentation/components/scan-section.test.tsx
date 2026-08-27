// @vitest-environment jsdom

import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScanSection } from "./scan-section";

const scanner = vi.hoisted(() => ({
  useQrScanner: vi.fn(),
  startScanning: vi.fn(),
  stopScanning: vi.fn(),
  ensureScanning: vi.fn(),
}));

const scanFlow = vi.hoisted(() => ({
  checkInResult: { status: "SUCCESS", message: "Berhasil" },
}));

vi.mock("../hooks/use-qr-scanner", () => ({ useQrScanner: scanner.useQrScanner }));
vi.mock("../hooks/use-scan-flow", () => ({
  useScanFlow: () => ({
    validateResult: {
      status: "ALREADY_CHECKED_IN",
      message: "Tiket sudah check-in",
      codeHash: "ticket-code",
      codeType: "QR_CODE",
    },
    checkInResult: scanFlow.checkInResult,
    isValidating: false,
    isCheckingIn: false,
    isBusy: false,
    handleScan: vi.fn(),
    confirmCheckIn: vi.fn(),
    clearResult: vi.fn(),
  }),
}));
vi.mock("./category-picker", () => ({
  CategoryPicker: () => <div data-testid="category-picker" />,
}));
vi.mock("../scan-selection-storage", () => ({
  readScanSelection: () => ({ eventId: "event-1", categoryId: "category-1", label: "Category" }),
  persistScanSelection: vi.fn(),
}));

describe("ScanSection camera lifecycle", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("keeps decoding enabled so a new ticket can replace the open result", async () => {
    scanner.useQrScanner.mockReturnValue({
      cameras: [],
      error: null,
      isFileScanning: false,
      isScanning: true,
      isTorchOn: false,
      isTorchSupported: false,
      scanImageFile: vi.fn(),
      selectedCameraId: "camera-1",
      startScanning: scanner.startScanning,
      stopScanning: scanner.stopScanning,
      ensureScanning: scanner.ensureScanning,
      switchCamera: vi.fn(),
      toggleTorch: vi.fn(),
      scannerElementId: "qr-scanner-region",
    });

    render(<ScanSection />);

    await waitFor(() => expect(scanner.useQrScanner).toHaveBeenLastCalledWith(
      expect.objectContaining({ disabled: false }),
    ));
    expect(scanner.stopScanning).not.toHaveBeenCalled();
    await waitFor(() => expect(scanner.ensureScanning).toHaveBeenCalled());
  });

  it("automatically starts the selected camera when the saved category is restored", async () => {
    scanner.useQrScanner.mockReturnValue({
      cameras: [{ id: "camera-1", label: "Back Camera" }],
      error: null,
      isFileScanning: false,
      isScanning: false,
      isTorchOn: false,
      isTorchSupported: false,
      scanImageFile: vi.fn(),
      selectedCameraId: "camera-1",
      startScanning: scanner.startScanning,
      stopScanning: scanner.stopScanning,
      ensureScanning: scanner.ensureScanning,
      switchCamera: vi.fn(),
      toggleTorch: vi.fn(),
      scannerElementId: "qr-scanner-region",
    });

    render(<ScanSection />);

    await waitFor(() => expect(scanner.startScanning).toHaveBeenCalledWith("camera-1"));
    expect(scanner.startScanning).toHaveBeenCalledTimes(1);
  });
});
