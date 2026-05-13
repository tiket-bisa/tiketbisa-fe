import { useState, useMemo } from "react";
import { SearchInput, Pagination, Select, Card, Avatar, Button, Input } from "~/core/design-system/components";
import { useApiQuery } from "~/core/api";
import {
  internalBrandApi,
  mapInternalBrandToFe,
  normalizeInternalBrand,
  type InternalBrandApiData,
} from "~/core/api/services/internal-brand.api";

const ITEMS_PER_PAGE = 8;

const sortOptions = [
  { value: "name_asc", label: "Nama A-Z" },
  { value: "name_desc", label: "Nama Z-A" },
];

/** Admin — Brand management (view all partner brands) */
export default function AdminBrandsPage() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name_asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editingBrand, setEditingBrand] = useState<InternalBrandApiData | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    logoPath: "",
    bannerPath: "",
    description: "",
  });

  // Fetch brands from real API
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

  const filtered = useMemo(() => {
    let result = allBrands.filter((b) =>
      b.name.toLowerCase().includes(search.toLowerCase()),
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

  const resetForm = () => {
    setFormMode(null);
    setEditingBrand(null);
    setFormError(null);
    setFormSuccess(null);
    setFormData({ name: "", logoPath: "", bannerPath: "", description: "" });
  };

  const startCreate = () => {
    setFormMode("create");
    setEditingBrand(null);
    setFormError(null);
    setFormSuccess(null);
    setFormData({ name: "", logoPath: "", bannerPath: "", description: "" });
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
    });
  };

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

    if (!formData.name.trim()) {
      setFormError("Nama brand wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        logoPath: formData.logoPath.trim() || null,
        bannerPath: formData.bannerPath.trim() || null,
        description: formData.description.trim() || null,
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
        setFormData({ name: "", logoPath: "", bannerPath: "", description: "" });
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
      await refetch();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Koneksi bermasalah.");
    } finally {
      setIsSubmitting(false);
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
        <h1 className="text-text-primary text-2xl font-bold">Semua Brand Partner</h1>
        <Button variant="primary" onClick={startCreate}>Tambah Brand</Button>
      </div>

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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Logo URL"
                name="logoPath"
                value={formData.logoPath}
                onChange={handleChange}
                placeholder="https://.../logo.png"
              />
              <Input
                label="Banner URL"
                name="bannerPath"
                value={formData.bannerPath}
                onChange={handleChange}
                placeholder="https://.../banner.jpg"
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
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            onClear={() => { setSearch(""); setCurrentPage(1); }}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select options={sortOptions} value={sortBy} onChange={(e) => setSortBy(e.target.value)} label="" placeholder="Urutkan" />
        </div>
      </div>

      {/* Brand Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paged.map((brand) => (
          <Card key={brand.id} hoverable padding="md">
            <div className="flex flex-col items-center gap-3 py-2">
              <Avatar src={brand.logo_url} fallback={brand.name} size="xl" />
              <span className="text-text-primary text-sm font-semibold text-center">{brand.name}</span>
              {brand.description && (
                <span className="text-text-tertiary text-xs text-center">{brand.description}</span>
              )}
              <div className="w-full border-t border-border-subtle pt-3 mt-1 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-text-tertiary">ID</span>
                  <span className="text-text-primary font-mono text-[10px]">{brand.id}</span>
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
        ))}
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
  );
}
