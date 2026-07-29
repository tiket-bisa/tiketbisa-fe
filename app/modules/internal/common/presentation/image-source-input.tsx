import { useEffect, useRef, useState } from "react";
import { Button, Input } from "~/core/design-system/components";
import { normalizeImageUrl } from "~/core/api";
import { useIsMounted } from "./use-is-mounted";
import { useObjectUrlRegistry } from "./use-object-url-registry";

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

type ImageSourceInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  uploadFile: (file: File) => Promise<string>;
  cropSquare?: boolean;
  disabled?: boolean;
  hint?: string;
};

type CropState = {
  file: File;
  previewUrl: string;
};

export async function fileToBase64(file: File): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Gagal membaca file gambar"));
        return;
      }
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(new Error("Gagal membaca file gambar"));
    reader.readAsDataURL(file);
  });
}

export function ImageSourceInput({
  label,
  value,
  onChange,
  uploadFile,
  cropSquare = false,
  disabled = false,
  hint,
}: ImageSourceInputProps) {
  const [mode, setMode] = useState<"link" | "upload">("link");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cropState, setCropState] = useState<CropState | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isMounted = useIsMounted();
  const { createObjectUrl, revokeObjectUrl } = useObjectUrlRegistry();
  const previewUrl = localPreviewUrl ?? normalizeImageUrl(value);

  useEffect(() => {
    setPreviewError(false);
  }, [previewUrl]);

  const handleFile = async (file: File | null) => {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError("Ukuran gambar maksimal 10MB.");
      return;
    }
    if (cropSquare) {
      setCropState({ file, previewUrl: createObjectUrl(file) });
      return;
    }
    const objectUrl = createObjectUrl(file);
    setLocalPreviewUrl(objectUrl);
    try {
      await uploadAndSet(file);
    } finally {
      revokeObjectUrl(objectUrl);
      if (isMounted()) {
        setLocalPreviewUrl(null);
      }
    }
  };

  const uploadAndSet = async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      const imageUrl = await uploadFile(file);
      if (!isMounted()) return;
      onChange(imageUrl);
      setPreviewError(false);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      if (isMounted()) {
        setError(err instanceof Error ? err.message : "Gagal mengunggah gambar.");
      }
    } finally {
      if (isMounted()) {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="text-sm font-medium text-text-primary">{label}</label>
        <div className="inline-flex rounded-lg border border-border-default bg-surface-alt p-1">
          <button
            type="button"
            disabled={disabled || isUploading}
            onClick={() => setMode("link")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              mode === "link" ? "bg-brand-primary text-white" : "text-text-secondary hover:bg-surface-hover"
            }`}
          >
            Link
          </button>
          <button
            type="button"
            disabled={disabled || isUploading}
            onClick={() => setMode("upload")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              mode === "upload" ? "bg-brand-primary text-white" : "text-text-secondary hover:bg-surface-hover"
            }`}
          >
            Upload file
          </button>
        </div>
      </div>

      {mode === "link" ? (
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://.../image.jpg"
          disabled={disabled || isUploading}
          hint={hint}
        />
      ) : (
        <div className="space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            disabled={disabled || isUploading}
            onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
            className="w-full rounded-lg border border-border-default bg-surface-alt px-3 py-2 text-sm text-text-primary file:mr-4 file:rounded-md file:border-0 file:bg-brand-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-primary-hover disabled:cursor-not-allowed disabled:bg-button-disabled"
          />
          <p className="text-xs text-text-tertiary">
            {cropSquare ? "Upload gambar, atur crop 1:1, lalu simpan." : "PNG, JPG, atau WEBP. Maksimal 10MB."}
          </p>
        </div>
      )}

      {(value || localPreviewUrl) && (
        <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface-alt">
          <img
            src={previewUrl}
            alt={`${label} preview`}
            onError={() => setPreviewError(true)}
            className="h-32 w-full object-cover"
          />
        </div>
      )}
      {previewError && <p className="text-xs text-destructive-text">Preview gambar tidak dapat dimuat.</p>}
      {error && <p className="text-xs text-destructive-text">{error}</p>}
      {cropState && (
        <CropModal
          cropState={cropState}
          onCancel={() => {
            revokeObjectUrl(cropState.previewUrl);
            setCropState(null);
            if (inputRef.current) inputRef.current.value = "";
          }}
          onSave={async (file) => {
            revokeObjectUrl(cropState.previewUrl);
            setCropState(null);
            await uploadAndSet(file);
          }}
        />
      )}
      {isUploading && <p className="text-xs text-text-tertiary">Mengunggah gambar...</p>}
    </div>
  );
}

function CropModal({
  cropState,
  onCancel,
  onSave,
}: {
  cropState: CropState;
  onCancel: () => void;
  onSave: (file: File) => Promise<void>;
}) {
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const isMounted = useIsMounted();

  useEffect(() => {
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
  }, [cropState.previewUrl]);

  const handleSave = async () => {
    const image = imageRef.current;
    if (!image) return;
    setIsSaving(true);
    try {
      const cropped = await cropImageToSquare(image, cropState.file.name, zoom, offsetX, offsetY);
      await onSave(cropped);
    } finally {
      if (isMounted()) {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Atur Crop Logo</h3>
          <p className="text-sm text-text-tertiary">Logo akan disimpan dalam rasio 1:1.</p>
        </div>
        <div className="mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-xl border border-border-default bg-surface-alt">
          <img
            ref={imageRef}
            src={cropState.previewUrl}
            alt="Crop preview"
            className="h-full w-full object-cover"
            style={{
              transform: `scale(${zoom}) translate(${offsetX}px, ${offsetY}px)`,
              transformOrigin: "center",
            }}
          />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Slider label="Zoom" min={1} max={2.5} step={0.05} value={zoom} onChange={setZoom} />
          <Slider label="Geser X" min={-80} max={80} step={1} value={offsetX} onChange={setOffsetX} />
          <Slider label="Geser Y" min={-80} max={80} step={1} value={offsetY} onChange={setOffsetY} />
        </div>
        <div className="mt-5 flex justify-between gap-2">
          <Button type="button" variant="ghost" onClick={() => { setZoom(1); setOffsetX(0); setOffsetY(0); }}>
            Reset
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onCancel}>
              Batal
            </Button>
            <Button type="button" onClick={() => void handleSave()} isLoading={isSaving}>
              Simpan Crop
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="space-y-1 text-xs font-medium text-text-secondary">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-brand-primary"
      />
    </label>
  );
}

async function cropImageToSquare(
  image: HTMLImageElement,
  originalName: string,
  zoom: number,
  offsetX: number,
  offsetY: number,
): Promise<File> {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Browser tidak mendukung crop gambar.");

  const naturalWidth = image.naturalWidth;
  const naturalHeight = image.naturalHeight;
  const sourceSize = Math.min(naturalWidth, naturalHeight) / zoom;
  const sourceX = clamp((naturalWidth - sourceSize) / 2 - offsetX * (naturalWidth / size), 0, naturalWidth - sourceSize);
  const sourceY = clamp((naturalHeight - sourceSize) / 2 - offsetY * (naturalHeight / size), 0, naturalHeight - sourceSize);

  ctx.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((nextBlob) => {
      if (!nextBlob) {
        reject(new Error("Gagal membuat crop gambar."));
        return;
      }
      resolve(nextBlob);
    }, "image/png", 0.92);
  });

  const baseName = originalName.replace(/\.[^.]+$/, "") || "brand-logo";
  return new File([blob], `${baseName}-cropped.png`, { type: "image/png" });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
