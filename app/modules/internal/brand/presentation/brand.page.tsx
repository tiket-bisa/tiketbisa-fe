import { useEffect, useState } from "react";
import { Card, Avatar, Button, Input } from "~/core/design-system/components";
import { useAuth } from "~/core/auth";
import { useApiQuery } from "~/core/api";
import {
  internalBrandApi,
  mapInternalBrandToFe,
  normalizeInternalBrand,
  type InternalBrandApiData,
} from "~/core/api/services/internal-brand.api";
import { fileToBase64, ImageSourceInput } from "~/modules/internal/common/presentation/image-source-input";
import { SponsorManager } from "~/modules/internal/common/presentation/sponsor-manager";

/** Partner — Brand detail page (shows partner's own brand info) */
export default function BrandPage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    logoPath: "",
    bannerPath: "",
    description: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: brandRaw, loading, error, refetch } = useApiQuery(
    async () => {
      if (!user?.brand_id) return null;
      const res = await internalBrandApi.getById(user.brand_id);
      if (!res.success || !res.data) return null;
      return normalizeInternalBrand(res.data);
    },
    [user?.brand_id],
  );

  const brand = brandRaw ? mapInternalBrandToFe(brandRaw) : null;

  useEffect(() => {
    if (!brandRaw) return;
    setFormData({
      name: brandRaw.name ?? "",
      logoPath: brandRaw.logoPath ?? "",
      bannerPath: brandRaw.bannerPath ?? "",
      description: brandRaw.description ?? "",
    });
  }, [brandRaw]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!brandRaw) return;
    if (!formData.name.trim()) {
      setFormError("Nama brand wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<InternalBrandApiData> = {
        name: formData.name.trim(),
        logoPath: formData.logoPath.trim() || null,
        bannerPath: formData.bannerPath.trim() || null,
        description: formData.description.trim() || null,
      };

      const result = await internalBrandApi.update(brandRaw.id, payload);
      if (!result.success) {
        setFormError(result.error || "Gagal memperbarui brand.");
        return;
      }

      setFormSuccess("Brand berhasil diperbarui.");
      await refetch();
      setIsEditing(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Koneksi bermasalah.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadBrandImage = async (file: File, imageKind: "LOGO" | "BANNER" | "SPONSOR") => {
    const imageBase64 = await fileToBase64(file);
    const result = await internalBrandApi.uploadImage({
      imageBase64,
      imageMimeType: file.type || "application/octet-stream",
      imageFileName: file.name || "brand-image",
      imageKind,
    });
    if (!result.success || !result.data?.imageUrl) {
      throw new Error(result.error || "Gagal mengunggah gambar brand.");
    }
    return result.data.imageUrl;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-text-tertiary">Memuat data brand...</p>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-text-tertiary">
          {error ? `Gagal memuat data: ${error}` : "Brand tidak ditemukan"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-text-primary text-2xl font-bold">Brand</h1>
        <Button variant="secondary" onClick={() => setIsEditing((prev) => !prev)}>
          {isEditing ? "Tutup" : "Edit Brand"}
        </Button>
      </div>

      <Card padding="md">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Avatar src={brand.logo_url} fallback={brand.name} size="xl" />
          <div className="text-center sm:text-left space-y-2">
            <h2 className="text-text-primary text-xl font-bold">{brand.name}</h2>
            {brand.description && (
              <p className="text-text-secondary text-sm">{brand.description}</p>
            )}
            <div className="flex flex-wrap gap-2 text-xs text-text-tertiary">
              <span className="bg-surface-hover px-2 py-1 rounded">ID: {brand.id}</span>
              <span className="bg-surface-hover px-2 py-1 rounded">Slug: {brand.slug}</span>
            </div>
          </div>
        </div>
      </Card>

      {isEditing && (
        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            {formError && (
              <div className="bg-red-50 text-destructive-text p-3 rounded-md text-sm">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="bg-green-50 text-success-text p-3 rounded-md text-sm">
                {formSuccess}
              </div>
            )}

            <Input
              label="Nama Brand"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ImageSourceInput
                label="Logo Brand"
                value={formData.logoPath}
                onChange={(value) => setFormData((prev) => ({ ...prev, logoPath: value }))}
                uploadFile={(file) => uploadBrandImage(file, "LOGO")}
                cropSquare
                disabled={isSubmitting}
              />
              <ImageSourceInput
                label="Banner Brand"
                value={formData.bannerPath}
                onChange={(value) => setFormData((prev) => ({ ...prev, bannerPath: value }))}
                uploadFile={(file) => uploadBrandImage(file, "BANNER")}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-primary" htmlFor="brand-description">
                Deskripsi
              </label>
              <textarea
                id="brand-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-default bg-surface-alt px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                rows={4}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </Card>
      )}

      <SponsorManager
        scope="brand"
        ownerId={brand.id}
        disabled={isSubmitting}
      />
    </div>
  );
}
