// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useQrScanner } from "./use-qr-scanner";

const scannerMocks = vi.hoisted(() => ({
  instances: [] as Array<{
    isScanning: boolean;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    getRunningTrackCameraCapabilities: ReturnType<typeof vi.fn>;
  }>,
  getCameras: vi.fn(),
}));

vi.mock("html5-qrcode", () => {
  class Html5Qrcode {
    static getCameras = scannerMocks.getCameras;
    isScanning = false;
    start = vi.fn(async () => { this.isScanning = true; });
    stop = vi.fn(async () => { this.isScanning = false; });
    scanFileV2 = vi.fn();
    clear = vi.fn();
    getRunningTrackCameraCapabilities = vi.fn(() => ({
      torchFeature: () => ({ isSupported: () => false }),
    }));

    constructor() {
      scannerMocks.instances.push(this);
    }
  }

  return {
    Html5Qrcode,
    Html5QrcodeSupportedFormats: {
      QR_CODE: 0,
      CODE_128: 1,
      CODE_39: 2,
      CODE_93: 3,
      EAN_13: 4,
      EAN_8: 5,
    },
  };
});

describe("useQrScanner keep-alive", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    scannerMocks.instances.length = 0;
    scannerMocks.getCameras.mockResolvedValue([{ id: "back-camera", label: "Back Camera" }]);
  });

  it("restarts a requested camera that becomes inactive after check-in", async () => {
    const { result } = renderHook(() => useQrScanner({ onScanSuccess: vi.fn() }));
    await waitFor(() => expect(result.current.selectedCameraId).toBe("back-camera"));

    await act(async () => result.current.startScanning());
    expect(result.current.isScanning).toBe(true);
    scannerMocks.instances[0].isScanning = false;

    await act(async () => result.current.ensureScanning());

    expect(scannerMocks.instances).toHaveLength(2);
    expect(scannerMocks.instances[1].start).toHaveBeenCalledTimes(1);
    expect(result.current.isScanning).toBe(true);
  });

  it("does not reopen a camera the operator explicitly stopped", async () => {
    const { result } = renderHook(() => useQrScanner({ onScanSuccess: vi.fn() }));
    await waitFor(() => expect(result.current.selectedCameraId).toBe("back-camera"));
    await act(async () => result.current.startScanning());
    await act(async () => result.current.stopScanning());

    await act(async () => result.current.ensureScanning());

    expect(scannerMocks.instances).toHaveLength(1);
    expect(result.current.isScanning).toBe(false);
  });

  it("suppresses repeated frames but immediately accepts a different ticket", async () => {
    const onScanSuccess = vi.fn();
    const { result } = renderHook(() => useQrScanner({ onScanSuccess }));
    await waitFor(() => expect(result.current.selectedCameraId).toBe("back-camera"));
    await act(async () => result.current.startScanning());

    const decoded = scannerMocks.instances[0].start.mock.calls[0][2] as (code: string) => void;
    act(() => {
      decoded("ticket-a");
      decoded("ticket-a");
      decoded("ticket-b");
    });

    expect(onScanSuccess.mock.calls).toEqual([["ticket-a"], ["ticket-b"]]);
  });

  it("does not consume the next ticket while validation is busy", async () => {
    const onScanSuccess = vi.fn();
    const { result, rerender } = renderHook(
      ({ disabled }) => useQrScanner({ onScanSuccess, disabled }),
      { initialProps: { disabled: false } },
    );
    await waitFor(() => expect(result.current.selectedCameraId).toBe("back-camera"));
    await act(async () => result.current.startScanning());
    const decoded = scannerMocks.instances[0].start.mock.calls[0][2] as (code: string) => void;

    act(() => decoded("ticket-a"));
    rerender({ disabled: true });
    act(() => {
      decoded("ticket-a");
      decoded("ticket-b");
    });
    rerender({ disabled: false });
    act(() => decoded("ticket-b"));

    expect(onScanSuccess.mock.calls).toEqual([["ticket-a"], ["ticket-b"]]);
  });
});
