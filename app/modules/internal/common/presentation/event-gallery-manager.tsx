import { useEffect, useMemo, useState } from "react";
import { Button, Input } from "~/core/design-system/components";
import { toAbsoluteApiUrl } from "~/core/api";
import { internalEventApi, type EventImageData } from "~/core/api/services/internal-event.api";

type EventGalleryManagerProps = {
  eventId?: string | null;
  uploadFile: (file: File) => Promise<string>;
  disabled?: boolean;
  onCoverChange?: (imageUrl: string) => void;
};

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

function normalizeImageUrl(value: string): string {
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || value.startsWith("data:") || value.startsWith("blob:")) {
    return value;
  }

  const legacyLocalPathMatch = value.match(/\/(temp-(?:event-banners|brand-images)\/[^/]+)$/);
  if (legacyLocalPathMatch) {
    return toAbsoluteApiUrl(`/${legacyLocalPathMatch[1]}`);
  }

  return toAbsoluteApiUrl(value);
}

export function EventGalleryManager({
  eventId,
  uploadFile,
  disabled = false,
  onCoverChange,
}: EventGalleryManagerProps) {
  const [images, setImages] = useState<EventImageData[]>([]);
  const [linkValue, setLinkValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedImages = useMemo(
    () => [...images].sort((a, b) => Number(b.isCover) - Number(a.isCover) || a.sortOrder - b.sortOrder),
    [images],
  );

  const loadImages = async () => {
    if (!eventId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await internalEventApi.getImages(eventId);
      if (!result.success || !result.data) {
        setError(result.error || "Gagal memuat galeri event.");
        return;
      }
      setImages(result.data.images ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat galeri event.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setImages([]);
    void loadImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const addImageUrl = async (imageUrl: string) => {
    if (!eventId || !imageUrl.trim()) return;
    setIsMutating(true);
    setError(null);
    try {
      const result = await internalEventApi.addImage(eventId, {
        imageUrl: imageUrl.trim(),
        sortOrder: images.length,
        isCover: images.length === 0,
      });
      if (!result.success) {
        setError(result.error || "Gagal menambahkan gambar.");
        return;
      }
      setLinkValue("");
      await loadImages();
      if (images.length === 0) onCoverChange?.(imageUrl.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambahkan gambar.");
    } finally {
      setIsMutating(false);
    }
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError("Ukuran gambar maksimal 10MB.");
      return;
    }
    setIsMutating(true);
    setError(null);
    try {
      const imageUrl = await uploadFile(file);
      await addImageUrl(imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunggah gambar.");
    } finally {
      setIsMutating(false);
    }
  };

  const persistOrder = async (nextImages: EventImageData[], coverImageId?: string) => {
    if (!eventId) return;
    setIsMutating(true);
    setError(null);
    try {
      const result = await internalEventApi.reorderImages(eventId, {
        images: nextImages.map((image, index) => ({ id: image.id, sortOrder: index })),
        coverImageId: coverImageId ?? nextImages.find((image) => image.isCover)?.id,
      });
      if (!result.success || !result.data) {
        setError(result.error || "Gagal menyimpan urutan galeri.");
        return;
      }
      setImages(result.data.images);
      const cover = result.data.images.find((image) => image.isCover);
      if (cover) onCoverChange?.(cover.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan urutan galeri.");
    } finally {
      setIsMutating(false);
    }
  };

  const moveImage = async (imageId: string, direction: -1 | 1) => {
    const current = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = current.findIndex((image) => image.id === imageId);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= current.length) return;
    [current[index], current[targetIndex]] = [current[targetIndex], current[index]];
    await persistOrder(current);
  };

  const setCover = async (imageId: string) => {
    await persistOrder(images, imageId);
  };

  const deleteImage = async (imageId: string) => {
    if (!eventId) return;
    const confirmed = window.confirm("Hapus gambar dari galeri event?");
    if (!confirmed) return;
    setIsMutating(true);
    setError(null);
    try {
      const result = await internalEventApi.deleteImage(eventId, imageId);
      if (!result.success) {
        setError(result.error || "Gagal menghapus gambar.");
        return;
      }
      await loadImages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus gambar.");
    } finally {
      setIsMutating(false);
    }
  };

  if (!eventId) {
    return (
      <div className="rounded-lg border border-border-subtle bg-surface-alt p-4 text-sm text-text-tertiary">
        Simpan event terlebih dahulu untuk menambahkan galeri gambar.
      </div>
    );
  }

  return (
    <section className="space-y-4 rounded-xl border border-border-subtle bg-surface-primary p-4">
      <div>
        <h3 className="text-base font-semibold text-text-primary">Galeri Event</h3>
        <p className="text-sm text-text-tertiary">
          Tambahkan beberapa gambar katalog event. Gambar cover akan dipakai sebagai banner utama.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto]">
        <Input
          value={linkValue}
          onChange={(event) => setLinkValue(event.target.value)}
          placeholder="https://.../image.jpg"
          disabled={disabled || isMutating}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => void addImageUrl(linkValue)}
          disabled={!linkValue.trim() || disabled || isMutating}
        >
          Tambah Link
        </Button>
      </div>

      <input
        type="file"
        multiple
        accept="image/png,image/jpeg,image/jpg,image/webp"
        disabled={disabled || isMutating}
        onChange={async (event) => {
          const files = Array.from(event.target.files ?? []);
          for (const file of files) {
            await handleFile(file);
          }
          event.target.value = "";
        }}
        className="w-full rounded-lg border border-border-default bg-surface-alt px-3 py-2 text-sm text-text-primary file:mr-4 file:rounded-md file:border-0 file:bg-brand-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-primary-hover disabled:cursor-not-allowed disabled:bg-button-disabled"
      />

      {isLoading && <p className="text-sm text-text-tertiary">Memuat galeri...</p>}
      {error && <p className="text-sm text-destructive-text">{error}</p>}

      {sortedImages.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sortedImages.map((image, index) => (
            <div key={image.id} className="overflow-hidden rounded-lg border border-border-subtle bg-surface-alt">
              <div className="relative aspect-video bg-surface-hover">
                <img src={normalizeImageUrl(image.imageUrl)} alt="Event gallery" className="h-full w-full object-cover" />
                {image.isCover && (
                  <span className="absolute left-2 top-2 rounded-full bg-brand-primary px-2 py-1 text-xs font-semibold text-white">
                    Cover
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 p-3">
                <Button type="button" variant="ghost" onClick={() => void moveImage(image.id, -1)} disabled={index === 0 || isMutating}>
                  Naik
                </Button>
                <Button type="button" variant="ghost" onClick={() => void moveImage(image.id, 1)} disabled={index === sortedImages.length - 1 || isMutating}>
                  Turun
                </Button>
                <Button type="button" variant="secondary" onClick={() => void setCover(image.id)} disabled={image.isCover || isMutating}>
                  Jadikan Cover
                </Button>
                <Button type="button" variant="ghost" onClick={() => void deleteImage(image.id)} disabled={isMutating}>
                  Hapus
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border-default p-4 text-sm text-text-tertiary">
          Belum ada gambar galeri.
        </div>
      )}
    </section>
  );
}
