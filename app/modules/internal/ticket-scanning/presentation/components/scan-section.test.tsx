// @vitest-environment jsdom

import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScanSection } from "./scan-section";

const scanner = vi.hoisted(() => ({
  useQrScanner: vi.fn(),
  stopScanning: vi.fn(),
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
    checkInResult: null,
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

  it("keeps the camera running and only pauses decoding while a result is open", async () => {
    scanner.useQrScanner.mockReturnValue({
      cameras: [],
      error: null,
      isFileScanning: false,
      isScanning: true,
      isTorchOn: false,
      isTorchSupported: false,
      scanImageFile: vi.fn(),
      selectedCameraId: "camera-1",
      startScanning: vi.fn(),
      stopScanning: scanner.stopScanning,
      switchCamera: vi.fn(),
      toggleTorch: vi.fn(),
      scannerElementId: "qr-scanner-region",
    });

    render(<ScanSection />);

    await waitFor(() => expect(scanner.useQrScanner).toHaveBeenLastCalledWith(
      expect.objectContaining({ disabled: true }),
    ));
    expect(scanner.stopScanning).not.toHaveBeenCalled();
  });
});
