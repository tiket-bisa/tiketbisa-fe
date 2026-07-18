import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from "react";
import {
  SearchInput,
  Pagination,
  Select,
  Card,
  Avatar,
  Button,
  Input,
  Tabs,
} from "~/core/design-system/components";
import { useApiQuery } from "~/core/api/use-api";
import {
  internalBrandApi,
  mapInternalBrandToFe,
  normalizeInternalBrand,
  type InternalBrandApiData,
} from "~/core/api/services/internal-brand.api";
import {
  internalBrandAccessApi,
} from "~/core/api/services/internal-brand-access.api";
import { fileToBase64, ImageSourceInput } from "~/modules/internal/common/presentation/image-source-input";

const ITEMS_PER_PAGE = 8;

const sortOptions = [
  { value: "name_asc", label: "Nama A-Z" },
  { value: "name_desc", label: "Nama Z-A" },
];

const adminTabs = [
  { label: "Brand", value: "brand" },
  { label: "Akses Login", value: "access" },
];

/** Sub-category options per brand category (enum dropdown, cascades from the chosen category). */
const BRAND_SUBCATEGORY_OPTIONS: Record<string, { value: string; label: string }[]> = {
  sepak_bola: [
    { value: "liga_1", label: "Liga 1" },
    { value: "liga_2", label: "Liga 2" },
    { value: "liga_3", label: "Liga 3" },
  ],
  musik: [
    { value: "konser", label: "Konser" },
    { value: "festival", label: "Festival" },
  ],
  lari: [
    { value: "5k", label: "5K" },
    { value: "10k", label: "10K" },
    { value: "half_marathon", label: "Half Marathon" },
    { value: "full_marathon", label: "Full Marathon" },
  ],
};

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Admin — Brand management (view all partner brands) */
export default function AdminBrandsPage() {
  const [accessState, setAccessState] = useState<"idle" | "loading" | "ready" | "unavailable" | "error">("idle");
  const [accessSummary, setAccessSummary] = useState<Awaited<ReturnType<typeof internalBrandAccessApi.getSummary>>["data"] | null>(null);
  const [activeTab, setActiveTab] = useState("brand");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name_asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editingBrand, setEditingBrand] = useState<InternalBrandApiData | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAccessBrandId, setSelectedAccessBrandId] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [scannerUsername, setScannerUsername] = useState("");
  const [scannerPassword, setScannerPassword] = useState("");
  const [accessError, setAccessError] = useState<string | null>(null);
  const [accessSuccess, setAccessSuccess] = useState<string | null>(null);
  const [isAccessSubmitting, setIsAccessSubmitting] = useState(false);
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

  const { data: brandsResponse, loading, error, refetch } = useApiQuery(
    async () => {
      const res = await internalBrandApi.getList({ limit: 200, offset: 0 });
      if (!res.success || !res.data) return [] as InternalBrandApiData[];
      return (res.data.brands ?? []).map(normalizeInternalBrand);
    },
    [],
  );

  const allBrandsRaw = brandsResponse ?? [];
  const allBrands = useMemo(
    () => allBrandsRaw.map(mapInternalBrandToFe),
    [allBrandsRaw],
  );
  const brandById = useMemo(
    () => new Map(allBrandsRaw.map((brand) => [brand.id, brand])),
    [allBrandsRaw],
  );

  const selectedAccessBrand = useMemo(() => {
    if (selectedAccessBrandId) {
      return brandById.get(selectedAccessBrandId) ?? null;
    }
    return allBrandsRaw[0] ?? null;
  }, [allBrandsRaw, brandById, selectedAccessBrandId]);

  const filtered = useMemo(() => {
    const result = allBrands.filter((brand) =>
      brand.name.toLowerCase().includes(search.toLowerCase()),
    );

    if (sortBy === "name_asc") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }
    return result;
  }, [allBrands, search, sortBy]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const accessBrandOptions = allBrandsRaw.map((brand) => ({
    value: brand.id,
    label: brand.name,
  }));

  const accessUnavailableMessage = "Fitur akses login belum aktif di backend yang sedang berjalan. Sinkronkan atau restart backend lalu coba lagi.";
  const isAccessEndpointUnavailable = (statusCode?: number | null) =>
    statusCode === 404 || statusCode === 405;

  const loadAccessSummary = async () => {
    if (!selectedAccessBrand?.id) {
      setAccessSummary(null);
      setAccessState("idle");
      setAccessError(null);
      return;
    }

    setAccessState("loading");
    setAccessError(null);

    const response = await internalBrandAccessApi.getSummary(selectedAccessBrand.id);
    if (response.success && response.data) {
      setAccessSummary(response.data);
      setAccessState("ready");
      return;
    }

    setAccessSummary(null);
    if (isAccessEndpointUnavailable(response.status_code)) {
      setAccessState("unavailable");
      setAccessError(accessUnavailableMessage);
      return;
    }

    setAccessState("error");
    setAccessError(response.error || "Gagal memuat akses login brand.");
  };

  useEffect(() => {
    if (activeTab !== "access") {
      return;
    }

    void loadAccessSummary();
  }, [activeTab, selectedAccessBrand?.id]);

  const resetForm = () => {
    setFormMode(null);
    setEditingBrand(null);
    setFormError(null);
    setFormSuccess(null);
    setFormData({ name: "", logoPath: "", bannerPath: "", description: "", adminFee: "", category: "", subCategory: "", sponsorPath: "", homeOnly: false, homeCity: "" });
  };

  const startCreate = () => {
    setFormMode("create");
    setEditingBrand(null);
    setFormError(null);
    setFormSuccess(null);
    setFormData({ name: "", logoPath: "", bannerPath: "", description: "", adminFee: "", category: "", subCategory: "", sponsorPath: "", homeOnly: false, homeCity: "" });
  };

  const startEdit = (id: string) => {
    const brand = brandById.get(id);
    if (!brand) return;
    setEditingBrand(brand);
    setFormMode("edit");
    setFormError(null);
    setFormSuccess(null);
    setFormData({
      name: brand.name ?? "",
      logoPath: brand.logoPath ?? "",
      bannerPath: brand.bannerPath ?? "",
      description: brand.description ?? "",
      adminFee: brand.adminFee != null ? String(brand.adminFee) : "",
      category: brand.category ?? "",
      subCategory: brand.subCategory ?? "",
      sponsorPath: brand.sponsorPath ?? "",
      homeOnly: Boolean(brand.homeOnly),
      homeCity: brand.homeCity ?? "",
    });
    setActiveTab("brand");
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!formData.name.trim()) {
      setFormError("Nama brand wajib diisi.");
      return;
    }

    const parsedAdminFee = Number(formData.adminFee);
    if (!Number.isFinite(parsedAdminFee) || parsedAdminFee < 0) {
      setFormError("Biaya layanan harus berupa angka 0 atau lebih.");
      return;
    }

    setIsSubmitting(true);
    try {
      const isFootball = formData.category.trim() === "sepak_bola";
      const payload = {
        name: formData.name.trim(),
        logoPath: formData.logoPath.trim() || null,
        bannerPath: formData.bannerPath.trim() || null,
        adminFee: Math.round(parsedAdminFee),
        category: formData.category.trim() || null,
        subCategory: formData.subCategory.trim() || null,
        sponsorPath: formData.sponsorPath.trim() || null,
        homeOnly: isFootball ? formData.homeOnly : false,
        homeCity: isFootball && formData.homeOnly ? formData.homeCity.trim() || null : null,
      };

      const result = formMode === "edit" && editingBrand
        ? await internalBrandApi.update(editingBrand.id, payload)
        : await internalBrandApi.create(payload);

      if (!result.success) {
        setFormError(result.error || "Gagal menyimpan brand.");
        return;
      }

      setFormSuccess(formMode === "edit" ? "Brand berhasil diperbarui." : "Brand berhasil dibuat.");
      await refetch();
      if (formMode === "create") {
        setFormData({ name: "", logoPath: "", bannerPath: "", description: "", adminFee: "", category: "", subCategory: "", sponsorPath: "", homeOnly: false, homeCity: "" });
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Koneksi bermasalah.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Hapus brand ini?");
    if (!confirmed) return;
    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      const result = await internalBrandApi.delete(id);
      if (!result.success) {
        setFormError(result.error || "Gagal menghapus brand.");
        return;
      }
      if (selectedAccessBrandId === id) {
        setSelectedAccessBrandId("");
      }
      await refetch();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Koneksi bermasalah.");
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

  const handleAddPartner = async () => {
    if (!selectedAccessBrand?.id) return;
    setIsAccessSubmitting(true);
    setAccessError(null);
    setAccessSuccess(null);
    try {
      const result = await internalBrandAccessApi.addPartner(selectedAccessBrand.id, partnerEmail.trim());
      if (!result.success) {
        if (isAccessEndpointUnavailable(result.status_code)) {
          setAccessState("unavailable");
          setAccessError(accessUnavailableMessage);
          return;
        }
        setAccessError(result.error || "Gagal menambahkan email Google partner.");
        return;
      }
      setAccessSummary(result.data ?? null);
      setAccessState("ready");
      setPartnerEmail("");
      setAccessSuccess("Email Google partner berhasil dihubungkan ke brand.");
    } catch (err) {
      setAccessError(err instanceof Error ? err.message : "Koneksi bermasalah.");
    } finally {
      setIsAccessSubmitting(false);
    }
  };

  const handleRemovePartner = async (email: string) => {
    if (!selectedAccessBrand?.id) return;
    setIsAccessSubmitting(true);
    setAccessError(null);
    setAccessSuccess(null);
    try {
      const result = await internalBrandAccessApi.removePartner(selectedAccessBrand.id, email);
      if (!result.success) {
        if (isAccessEndpointUnavailable(result.status_code)) {
          setAccessState("unavailable");
          setAccessError(accessUnavailableMessage);
          return;
        }
        setAccessError(result.error || "Gagal menghapus email Google partner.");
        return;
      }
      setAccessSummary(result.data ?? null);
      setAccessState("ready");
      setAccessSuccess("Email Google partner berhasil dilepas dari brand.");
    } catch (err) {
      setAccessError(err instanceof Error ? err.message : "Koneksi bermasalah.");
    } finally {
      setIsAccessSubmitting(false);
    }
  };

  const handleUpsertScanner = async () => {
    if (!selectedAccessBrand?.id) return;
    setIsAccessSubmitting(true);
    setAccessError(null);
    setAccessSuccess(null);
    try {
      const result = await internalBrandAccessApi.upsertScanner(
        selectedAccessBrand.id,
        scannerUsername.trim(),
        scannerPassword,
      );
      if (!result.success) {
        if (isAccessEndpointUnavailable(result.status_code)) {
          setAccessState("unavailable");
          setAccessError(accessUnavailableMessage);
          return;
        }
        setAccessError(result.error || "Gagal menyimpan akun scanner.");
        return;
      }
      setAccessSummary(result.data ?? null);
      setAccessState("ready");
      setScannerUsername("");
      setScannerPassword("");
      setAccessSuccess("Akun scanner berhasil disimpan untuk brand ini.");
    } catch (err) {
      setAccessError(err instanceof Error ? err.message : "Koneksi bermasalah.");
    } finally {
      setIsAccessSubmitting(false);
    }
  };

  const handleDeactivateScanner = async (scannerId: string) => {
    if (!selectedAccessBrand?.id) return;
    setIsAccessSubmitting(true);
    setAccessError(null);
    setAccessSuccess(null);
    try {
      const result = await internalBrandAccessApi.deactivateScanner(selectedAccessBrand.id, scannerId);
      if (!result.success) {
        if (isAccessEndpointUnavailable(result.status_code)) {
          setAccessState("unavailable");
          setAccessError(accessUnavailableMessage);
          return;
        }
        setAccessError(result.error || "Gagal menonaktifkan akun scanner.");
        return;
      }
      setAccessSummary(result.data ?? null);
      setAccessState("ready");
      setAccessSuccess("Akun scanner berhasil dinonaktifkan.");
    } catch (err) {
      setAccessError(err instanceof Error ? err.message : "Koneksi bermasalah.");
    } finally {
      setIsAccessSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-text-tertiary">Memuat data brand...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-destructive-text">Gagal memuat data brand: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-text-primary text-2xl font-bold">Semua Brand Partner</h1>
          <p className="text-sm text-text-tertiary">
            Admin dapat kelola data brand, akun scanner, dan akses email Google partner.
          </p>
        </div>
        <Button variant="primary" onClick={startCreate}>Tambah Brand</Button>
      </div>

      <Card padding="lg">
        <Tabs items={adminTabs} value={activeTab} onChange={setActiveTab} />

        <div className="pt-5">
          {activeTab === "brand" ? (
            <div className="space-y-6">
              {formMode && (
                <Card padding="lg">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="flex flex-col gap-1">
                      <h2 className="text-lg font-semibold text-text-primary">
                        {formMode === "edit" ? "Edit Brand" : "Buat Brand Baru"}
                      </h2>
                      <p className="text-sm text-text-tertiary">
                        Lengkapi detail brand untuk kebutuhan internal dashboard.
                      </p>
                    </div>

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
                      placeholder="Contoh: Jazz Festival"
                      required
                    />

                    <Input
                      label="Biaya Layanan per Tiket"
                      name="adminFee"
                      type="number"
                      min="0"
                      value={formData.adminFee}
                      onChange={handleChange}
                      placeholder="Contoh: 5000"
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

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Select
                        label="Kategori"
                        name="category"
                        value={formData.category}
                        onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value, subCategory: "" }))}
                        placeholder="Pilih kategori"
                        options={[
                          { value: "sepak_bola", label: "Sepak Bola" },
                          { value: "musik", label: "Musik" },
                          { value: "lari", label: "Lari" },
                        ]}
                      />
                      <Select
                        label="Sub Kategori"
                        name="subCategory"
                        value={formData.subCategory}
                        onChange={handleChange}
                        placeholder="Pilih sub kategori"
                        options={BRAND_SUBCATEGORY_OPTIONS[formData.category] ?? []}
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

                    {formData.category.trim() === "sepak_bola" && (
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
                          <Input
                            label="Kota Domisili"
                            name="homeCity"
                            value={formData.homeCity}
                            onChange={handleChange}
                            placeholder="Contoh: Bandung"
                            hint="Pembeli wajib memiliki KTP berdomisili kota ini."
                          />
                        )}
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-text-primary" htmlFor="brand-description">
                        Deskripsi
                      </label>
                      <textarea
                        id="brand-description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Deskripsi singkat tentang brand"
                        className="w-full rounded-lg border border-border-default bg-surface-alt px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                        rows={4}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 justify-end">
                      <Button type="button" variant="ghost" onClick={resetForm}>
                        Batal
                      </Button>
                      <Button type="submit" variant="primary" isLoading={isSubmitting}>
                        {formMode === "edit" ? "Simpan Perubahan" : "Buat Brand"}
                      </Button>
                    </div>
                  </form>
                </Card>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <SearchInput
                    placeholder="Cari nama brand..."
                    value={search}
                    onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }}
                    onClear={() => { setSearch(""); setCurrentPage(1); }}
                  />
                </div>
                <div className="w-full sm:w-48">
                  <Select options={sortOptions} value={sortBy} onChange={(event) => setSortBy(event.target.value)} label="" placeholder="Urutkan" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paged.map((brand) => {
                  const fullBrand = brandById.get(brand.id);
                  return (
                    <Card key={brand.id} hoverable padding="md">
                      <div className="flex flex-col items-center gap-3 py-2">
                        <Avatar src={brand.logo_url} fallback={brand.name} size="xl" />
                        <span className="text-text-primary text-sm font-semibold text-center">{brand.name}</span>
                        {brand.description && (
                          <span className="text-text-tertiary text-xs text-center">{brand.description}</span>
                        )}
                        <div className="w-full border-t border-border-subtle pt-3 mt-1 space-y-1">
                          <div className="flex justify-between text-xs gap-3">
                            <span className="text-text-tertiary">ID</span>
                            <span className="text-text-primary font-mono text-[10px] text-right">{brand.id}</span>
                          </div>
                          <div className="flex justify-between text-xs gap-3">
                            <span className="text-text-tertiary">Biaya layanan</span>
                            <span className="text-text-primary font-medium">{formatRupiah(fullBrand?.adminFee ?? 0)}</span>
                          </div>
                        </div>
                        <div className="flex w-full gap-2 pt-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                            onClick={() => startEdit(brand.id)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setSelectedAccessBrandId(brand.id);
                              setActiveTab("access");
                            }}
                          >
                            Akses
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleDelete(brand.id)}
                            disabled={isSubmitting}
                          >
                            Hapus
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {paged.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-text-tertiary">
                  <p className="text-lg">Tidak ada brand ditemukan</p>
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex justify-center">
                  <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
                <Card padding="lg">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-lg font-semibold text-text-primary">Pilih Brand</h2>
                      <p className="text-sm text-text-tertiary">
                        Hubungkan email Google partner dan akun login scanner per brand.
                      </p>
                    </div>
                    <Select
                      label="Brand"
                      options={accessBrandOptions}
                      value={selectedAccessBrand?.id ?? ""}
                      onChange={(event) => setSelectedAccessBrandId(event.target.value)}
                      placeholder="Pilih brand"
                    />
                    {selectedAccessBrand && (
                      <div className="rounded-xl border border-border-default bg-surface-alt p-4 space-y-2">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={selectedAccessBrand.logoPath ?? undefined}
                            fallback={selectedAccessBrand.name}
                            size="lg"
                          />
                          <div>
                            <p className="text-sm font-semibold text-text-primary">{selectedAccessBrand.name}</p>
                            <p className="text-xs text-text-tertiary">
                              Biaya layanan {formatRupiah(selectedAccessBrand.adminFee ?? 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                <div className="space-y-4">
                  {accessError && (
                    <div className="bg-red-50 text-destructive-text p-3 rounded-md text-sm">
                      {accessError}
                    </div>
                  )}
                  {accessSuccess && (
                    <div className="bg-green-50 text-success-text p-3 rounded-md text-sm">
                      {accessSuccess}
                    </div>
                  )}
                  {accessState === "unavailable" && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <span>{accessUnavailableMessage}</span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            void loadAccessSummary();
                          }}
                          disabled={!selectedAccessBrand}
                        >
                          Coba Lagi
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <Card padding="lg">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-base font-semibold text-text-primary">Email Google Partner</h3>
                          <p className="text-sm text-text-tertiary">
                            Email yang ditambahkan di sini akan login sebagai `partner`.
                          </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                          <div className="flex-1">
                            <Input
                              label="Email Google"
                              type="email"
                              value={partnerEmail}
                              onChange={(event) => setPartnerEmail(event.target.value)}
                              placeholder="partner@brand.com"
                            />
                          </div>
                          <div className="sm:pt-7">
                            <Button
                              variant="primary"
                              onClick={handleAddPartner}
                              isLoading={isAccessSubmitting}
                              disabled={!selectedAccessBrand}
                            >
                              Tambah
                            </Button>
                          </div>
                        </div>

                        {accessState === "loading" ? (
                          <p className="text-sm text-text-tertiary">Memuat partner brand...</p>
                        ) : accessState === "idle" ? (
                          <p className="text-sm text-text-tertiary">Pilih tab akses login untuk memuat data partner.</p>
                        ) : accessState === "unavailable" ? (
                          <p className="text-sm text-text-tertiary">Daftar partner belum bisa dimuat dari backend saat ini.</p>
                        ) : (
                          <div className="space-y-2">
                            {accessSummary?.partnerEmails.length ? (
                              accessSummary.partnerEmails.map((partner) => (
                                <div
                                  key={partner.email}
                                  className="flex items-center justify-between gap-3 rounded-lg border border-border-default px-3 py-2"
                                >
                                  <div>
                                    <p className="text-sm font-medium text-text-primary">{partner.email}</p>
                                    <p className="text-xs text-text-tertiary">
                                      Tersambung sebagai partner
                                    </p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemovePartner(partner.email)}
                                    disabled={isAccessSubmitting}
                                  >
                                    Lepas
                                  </Button>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-text-tertiary">Belum ada email partner untuk brand ini.</p>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>

                    <Card padding="lg">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-base font-semibold text-text-primary">Akun Scanner</h3>
                          <p className="text-sm text-text-tertiary">
                            Admin mengisi manual username dan password untuk login scanner.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          <Input
                            label="Username Scanner"
                            value={scannerUsername}
                            onChange={(event) => setScannerUsername(event.target.value)}
                            placeholder="scanner_brand_a"
                          />
                          <Input
                            label="Password"
                            type="password"
                            value={scannerPassword}
                            onChange={(event) => setScannerPassword(event.target.value)}
                            placeholder="Minimal 6 karakter"
                          />
                          <div className="flex justify-end">
                            <Button
                              variant="primary"
                              onClick={handleUpsertScanner}
                              isLoading={isAccessSubmitting}
                              disabled={!selectedAccessBrand}
                            >
                              Simpan Scanner
                            </Button>
                          </div>
                        </div>

                        {accessState === "loading" ? (
                          <p className="text-sm text-text-tertiary">Memuat akun scanner...</p>
                        ) : accessState === "idle" ? (
                          <p className="text-sm text-text-tertiary">Pilih tab akses login untuk memuat akun scanner.</p>
                        ) : accessState === "unavailable" ? (
                          <p className="text-sm text-text-tertiary">Daftar scanner belum bisa dimuat dari backend saat ini.</p>
                        ) : (
                          <div className="space-y-2">
                            {accessSummary?.scannerAccounts.length ? (
                              accessSummary.scannerAccounts.map((scanner) => (
                                <div
                                  key={scanner.id}
                                  className="flex items-center justify-between gap-3 rounded-lg border border-border-default px-3 py-2"
                                >
                                  <div>
                                    <p className="text-sm font-medium text-text-primary">{scanner.username}</p>
                                    <p className="text-xs text-text-tertiary">
                                      {scanner.isActive ? "Aktif untuk login scanner" : "Nonaktif"}
                                    </p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeactivateScanner(scanner.id)}
                                    disabled={isAccessSubmitting || !scanner.isActive}
                                  >
                                    Nonaktifkan
                                  </Button>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-text-tertiary">Belum ada akun scanner untuk brand ini.</p>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
