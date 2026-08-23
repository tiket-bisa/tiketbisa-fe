import { useEffect, useState } from "react";
import { Card, Avatar, Button, Input, Select } from "~/core/design-system/components";
import { useAuth } from "~/core/auth";
import { toUserFacingError, useApiQuery } from "~/core/api";
import {
  internalBrandApi,
  mapInternalBrandToFe,
  normalizeInternalBrand,
  type InternalBrandApiData,
} from "~/core/api/services/internal-brand.api";
import { fileToBase64, ImageSourceInput } from "~/modules/internal/common/presentation/image-source-input";
import {
  HOME_DOMICILE_OPTIONS,
  normalizeHomeDomicile,
} from "~/shared/constants/domicile.constants";

/** Partner — Brand detail page (shows partner's own brand info) */
export default function BrandPage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    logoPath: "",
    bannerPath: "",
    description: "",
    adminFee: "",
    category: "",
    subCategory: "",
    sponsorPath: "",
    homeOnly: false,
    homeCity: "",
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
      adminFee: brandRaw.adminFee != null ? String(brandRaw.adminFee) : "",
      category: brandRaw.category ?? "",
      subCategory: brandRaw.subCategory ?? "",
      sponsorPath: brandRaw.sponsorPath ?? "",
      homeOnly: Boolean(brandRaw.homeOnly),
      homeCity: normalizeHomeDomicile(brandRaw.homeCity),
    });
  }, [brandRaw]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
      return;
    }
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
      const isFootball = formData.category.trim() === "sepak_bola";
      const payload: Partial<InternalBrandApiData> = {
        name: formData.name.trim(),
        logoPath: formData.logoPath.trim() || null,
        bannerPath: formData.bannerPath.trim() || null,
        description: formData.description.trim() || null,
        adminFee: formData.adminFee.trim() === "" ? 0 : Number(formData.adminFee) || 0,
        category: formData.category.trim() || null,
        subCategory: formData.subCategory.trim() || null,
        sponsorPath: formData.sponsorPath.trim() || null,
        homeOnly: isFootball ? formData.homeOnly : false,
        homeCity: isFootball && formData.homeOnly ? formData.homeCity.trim() || null : null,
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
      setFormError(toUserFacingError(err, "Koneksi bermasalah."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadBrandImage = async (file: File, imageKind: "LOGO" | "BANNER") => {
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

  const isFootballCategory = formData.category.trim() === "sepak_bola";

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
              {brandRaw?.category && (
                <span className="bg-surface-hover px-2 py-1 rounded">Kategori: {brandRaw.category}</span>
              )}
              {brandRaw?.subCategory && (
                <span className="bg-surface-hover px-2 py-1 rounded">Sub: {brandRaw.subCategory}</span>
              )}
              {brandRaw?.adminFee != null && (
                <span className="bg-surface-hover px-2 py-1 rounded">Biaya Layanan: Rp{brandRaw.adminFee}</span>
              )}
              {brandRaw?.homeOnly && (
                <span className="bg-surface-hover px-2 py-1 rounded">
                  Domisili: {brandRaw.homeCity || "-"}
                </span>
              )}
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input
                label="Biaya Layanan (Admin Fee)"
                name="adminFee"
                type="number"
                min="0"
                step="500"
                value={formData.adminFee}
                onChange={handleChange}
                placeholder="0"
                hint="Per tiket, dalam Rupiah."
              />
              <Select
                label="Kategori"
                name="category"
                value={formData.category}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, category: e.target.value, subCategory: "" }))
                }
                placeholder="Pilih kategori"
                options={[
                  { value: "sepak_bola", label: "Sepak Bola" },
                  { value: "musik", label: "Musik" },
                  { value: "lari", label: "Lari" },
                ]}
              />
              <Input
                label="Sub Kategori"
                name="subCategory"
                value={formData.subCategory}
                onChange={handleChange}
                placeholder="Contoh: Liga 1"
              />
            </div>

            <ImageSourceInput
              label="Logo Sponsor (1 gambar berisi semua sponsor)"
              value={formData.sponsorPath}
              onChange={(value) => setFormData((prev) => ({ ...prev, sponsorPath: value }))}
              uploadFile={(file) => uploadBrandImage(file, "BANNER")}
              disabled={isSubmitting}
              hint="Gabungkan semua logo sponsor ke dalam satu gambar."
            />

            {isFootballCategory && (
              <div className="space-y-3 rounded-lg border border-border-subtle p-4">
                <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
                  <input
                    type="checkbox"
                    name="homeOnly"
                    checked={formData.homeOnly}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-border-default accent-brand-primary"
                  />
                  Batasi pembelian untuk KTP berdomisili tertentu (Home Only)
                </label>
                {formData.homeOnly && (
                  <Select
                    label="Kota Domisili"
                    name="homeCity"
                    value={formData.homeCity}
                    onChange={handleChange}
                    options={HOME_DOMICILE_OPTIONS}
                    placeholder="Pilih kota atau provinsi"
                    required
                  />
                )}
                {formData.homeOnly && (
                  <p className="text-xs text-text-tertiary">
                    Pembeli wajib memiliki KTP dari kota/kabupaten atau provinsi yang dipilih.
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
