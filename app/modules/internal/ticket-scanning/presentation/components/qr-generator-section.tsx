import { useState, useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card, Button } from "~/core/design-system/components";

/**
 * Generates a sample TKB ticket code matching the backend format.
 * QR format: TKB<UUID><12-char-hash>
 */
function generateSampleQRCode(): string {
  const uuid = crypto.randomUUID();
  const chars = "0123456789ABCDEF";
  let hash = "";
  for (let i = 0; i < 12; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return `TKB${uuid}${hash}`;
}

/**
 * Generates a sample TKB barcode matching the backend format.
 * Barcode format: TKB<UUID><6-digit-random>
 */
function generateSampleBarcode(): string {
  const uuid = crypto.randomUUID();
  const random = String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
  return `TKB${uuid}${random}`;
}

export function QrGeneratorSection() {
  const [codeType, setCodeType] = useState<"QR_CODE" | "BARCODE">("QR_CODE");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const handleGenerate = () => {
    const code =
      codeType === "QR_CODE"
        ? generateSampleQRCode()
        : generateSampleBarcode();
    setGeneratedCode(code);
  };

  return (
    <div className="space-y-6">
      <Card padding="md">
        <h3 className="text-text-primary font-semibold mb-3">
          Generate Test Ticket Code
        </h3>
        <p className="text-text-tertiary text-sm mb-4">
          Generate kode tiket sample untuk testing scan. Kode ini mengikuti
          format backend (TKB + UUID + hash/random).
        </p>

        <div className="flex items-center gap-4 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="codeType"
              value="QR_CODE"
              checked={codeType === "QR_CODE"}
              onChange={() => setCodeType("QR_CODE")}
              className="accent-brand-primary"
            />
            <span className="text-text-primary text-sm">QR Code</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="codeType"
              value="BARCODE"
              checked={codeType === "BARCODE"}
              onChange={() => setCodeType("BARCODE")}
              className="accent-brand-primary"
            />
            <span className="text-text-primary text-sm">Barcode</span>
          </label>
        </div>

        <Button variant="primary" onClick={handleGenerate}>
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">
              qr_code_2
            </span>
            Generate Kode
          </span>
        </Button>
      </Card>

      {generatedCode && (
        <Card padding="md">
          <h3 className="text-text-primary font-semibold mb-3">
            Kode Tiket ({codeType === "QR_CODE" ? "QR Code" : "Barcode"})
          </h3>

          {/* QR Code Image */}
          <div className="flex flex-col items-center gap-4 mb-4">
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG value={generatedCode} size={200} level="M" />
            </div>
          </div>

          {/* Code String */}
          <div className="bg-surface-alt rounded-lg p-3">
            <p className="text-text-tertiary text-xs mb-1">Kode:</p>
            <p className="text-text-primary font-mono text-xs break-all select-all">
              {generatedCode}
            </p>
          </div>

          <p className="text-text-tertiary text-xs mt-3">
            Scan QR di atas dengan kamera, atau copy kode dan paste ke input
            manual pada tab "Scan Tiket".
          </p>
        </Card>
      )}
    </div>
  );
}
