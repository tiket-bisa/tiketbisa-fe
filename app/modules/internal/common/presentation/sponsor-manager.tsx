import { useEffect, useMemo, useState } from "react";
import { Button, Input } from "~/core/design-system/components";
import { internalBrandApi } from "~/core/api/services/internal-brand.api";
import { internalEventApi } from "~/core/api/services/internal-event.api";
import { fileToBase64 } from "./image-source-input";

type SponsorData = {
  id: string;
  name: string;
  imageUrl: string;
  sortOrder: number;
};

type SponsorManagerProps = {
  scope: "brand" | "event";
  ownerId?: string | null;
  brandId?: string | null;
  disabled?: boolean;
};

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

export function SponsorManager({
  scope,
  ownerId,
  brandId,
  disabled = false,
}: SponsorManagerProps) {
  const [sponsors, setSponsors] = useState<SponsorData[]>([]);
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedSponsors = useMemo(
    () => [...sponsors].sort((a, b) => a.sortOrder - b.sortOrder),
    [sponsors],
  );

  const loadSponsors = async () => {
    if (!ownerId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = scope === "brand"
        ? await internalBrandApi.getSponsors(ownerId)
        : await internalEventApi.getSponsors(ownerId);
      if (!result.success || !result.data) {
        setError(result.error || "Gagal memuat sponsor.");
        return;
      }
      setSponsors(result.data.sponsors ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat sponsor.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setSponsors([]);
    setName("");
    setImageUrl("");
    setEditingId(null);
    void loadSponsors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId, scope]);

  const resetForm = () => {
    setName("");
    setImageUrl("");
    setEditingId(null);
  };

  const saveSponsor = async () => {
    if (!ownerId) return;
    if (!name.trim() || !imageUrl.trim()) {
      setError("Nama sponsor dan gambar wajib diisi.");
      return;
    }
    setIsMutating(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        imageUrl: imageUrl.trim(),
        sortOrder: editingId
          ? sponsors.find((sponsor) => sponsor.id === editingId)?.sortOrder ?? sponsors.length
          : sponsors.length,
      };
      const result = scope === "brand"
        ? editingId
          ? await internalBrandApi.updateSponsor(ownerId, editingId, payload)
          : await internalBrandApi.addSponsor(ownerId, payload)
        : editingId
          ? await internalEventApi.updateSponsor(ownerId, editingId, payload)
          : await internalEventApi.addSponsor(ownerId, payload);
      if (!result.success) {
        setError(result.error || "Gagal menyimpan sponsor.");
        return;
      }
      resetForm();
      await loadSponsors();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan sponsor.");
    } finally {
      setIsMutating(false);
    }
  };

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
    setIsMutating(true);
    try {
      const result = await internalBrandApi.uploadImage({
        imageBase64: await fileToBase64(file),
        imageMimeType: file.type || "application/octet-stream",
        imageFileName: file.name || "sponsor-image",
        imageKind: "SPONSOR",
      });
      if (!result.success || !result.data?.imageUrl) {
        setError(result.error || "Gagal mengunggah logo sponsor.");
        return;
      }
      setImageUrl(result.data.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunggah logo sponsor.");
    } finally {
      setIsMutating(false);
    }
  };

  const moveSponsor = async (sponsorId: string, direction: -1 | 1) => {
    if (!ownerId) return;
    const current = [...sortedSponsors];
    const index = current.findIndex((sponsor) => sponsor.id === sponsorId);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= current.length) return;
    [current[index], current[targetIndex]] = [current[targetIndex], current[index]];
    setIsMutating(true);
    setError(null);
    try {
      const payload = { sponsors: current.map((sponsor, sortOrder) => ({ id: sponsor.id, sortOrder })) };
      const result = scope === "brand"
        ? await internalBrandApi.reorderSponsors(ownerId, payload)
        : await internalEventApi.reorderSponsors(ownerId, payload);
      if (!result.success || !result.data) {
        setError(result.error || "Gagal menyimpan urutan sponsor.");
        return;
      }
      setSponsors(result.data.sponsors ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan urutan sponsor.");
    } finally {
      setIsMutating(false);
    }
  };

  const deleteSponsor = async (sponsorId: string) => {
    if (!ownerId) return;
    const confirmed = window.confirm("Hapus sponsor ini?");
    if (!confirmed) return;
    setIsMutating(true);
    setError(null);
    try {
      const result = scope === "brand"
        ? await internalBrandApi.deleteSponsor(ownerId, sponsorId)
        : await internalEventApi.deleteSponsor(ownerId, sponsorId);
      if (!result.success) {
        setError(result.error || "Gagal menghapus sponsor.");
        return;
      }
      await loadSponsors();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus sponsor.");
    } finally {
      setIsMutating(false);
    }
  };

  const copyBrandSponsors = async () => {
    if (!brandId || !ownerId) return;
    setIsMutating(true);
    setError(null);
    try {
      const result = await internalBrandApi.copySponsorsToEvent(brandId, ownerId);
      if (!result.success || !result.data) {
        setError(result.error || "Gagal menyalin sponsor brand.");
        return;
      }
      setSponsors(result.data.sponsors ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyalin sponsor brand.");
    } finally {
      setIsMutating(false);
    }
  };

  if (!ownerId) {
    return (
      <section className="rounded-lg border border-border-subtle bg-surface-alt p-4 text-sm text-text-tertiary">
        Simpan data terlebih dahulu untuk mengatur sponsor.
      </section>
    );
  }

  const isBusy = disabled || isLoading || isMutating;

  return (
    <section className="space-y-4 rounded-xl border border-border-subtle bg-surface-primary p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-text-primary">
            {scope === "brand" ? "Sponsor Tim" : "Sponsor Event"}
          </h3>
          <p className="text-sm text-text-tertiary">
            Logo sponsor ini akan tampil di bagian sponsor pada tiket PDF.
          </p>
        </div>
        {scope === "event" && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void copyBrandSponsors()}
            disabled={!brandId || isBusy}
          >
            Salin Sponsor Brand
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1.5fr_auto]">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nama sponsor"
          disabled={isBusy}
        />
        <Input
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          placeholder="https://.../sponsor.png"
          disabled={isBusy}
        />
        <Button
          type="button"
          variant="primary"
          onClick={() => void saveSponsor()}
          disabled={isBusy || !name.trim() || !imageUrl.trim()}
        >
          {editingId ? "Simpan" : "Tambah"}
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          disabled={isBusy}
          onChange={(event) => {
            void handleFile(event.target.files?.[0] ?? null);
            event.target.value = "";
          }}
          className="w-full rounded-lg border border-border-default bg-surface-alt px-3 py-2 text-sm text-text-primary file:mr-4 file:rounded-md file:border-0 file:bg-brand-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-primary-hover disabled:cursor-not-allowed disabled:bg-button-disabled"
        />
        {editingId && (
          <Button type="button" variant="ghost" onClick={resetForm} disabled={isBusy}>
            Batal Edit
          </Button>
        )}
      </div>

      {isLoading && <p className="text-sm text-text-tertiary">Memuat sponsor...</p>}
      {isMutating && <p className="text-sm text-text-tertiary">Menyimpan sponsor...</p>}
      {error && <p className="text-sm text-destructive-text">{error}</p>}

      {sortedSponsors.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sortedSponsors.map((sponsor, index) => (
            <div key={sponsor.id} className="overflow-hidden rounded-lg border border-border-subtle bg-surface-alt">
              <div className="flex h-24 items-center justify-center bg-white p-4">
                <img src={sponsor.imageUrl} alt={sponsor.name} className="max-h-full max-w-full object-contain" />
              </div>
              <div className="space-y-3 p-3">
                <p className="text-sm font-semibold text-text-primary">{sponsor.name}</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void moveSponsor(sponsor.id, -1)}
                    disabled={index === 0 || isBusy}
                  >
                    Naik
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void moveSponsor(sponsor.id, 1)}
                    disabled={index === sortedSponsors.length - 1 || isBusy}
                  >
                    Turun
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setEditingId(sponsor.id);
                      setName(sponsor.name);
                      setImageUrl(sponsor.imageUrl);
                    }}
                    disabled={isBusy}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void deleteSponsor(sponsor.id)}
                    disabled={isBusy}
                  >
                    Hapus
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border-default p-4 text-sm text-text-tertiary">
          Belum ada sponsor.
        </div>
      )}
    </section>
  );
}
