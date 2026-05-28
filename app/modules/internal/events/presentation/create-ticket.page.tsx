import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Card, Button } from "~/core/design-system/components";
import { ticketCategoryApi } from "~/core/api/services/ticket-category.api";
import { useAuth } from "~/core/auth";
import { formatIDRInput, parseIDRInput } from "~/core/utils";

export default function CreateTicketPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryCode: "",
    totalTicket: "",
    price: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "price") {
      setFormData((prev) => ({ ...prev, price: formatIDRInput(value) }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await ticketCategoryApi.create({
        eventId: eventId,
        name: formData.name,
        description: formData.description,
        categoryCode: formData.categoryCode,
        totalTicket: parseInt(formData.totalTicket) || 0,
        price: parseIDRInput(formData.price),
      });

      if (res.success && res.data) {
        setSuccessMsg("Tiket berhasil dibuat!");
        setTimeout(() => {
          // Navigating back
          if (user?.role === "admin") {
            navigate("/internal-tb/admin/events");
          } else {
            navigate("/internal-tb/partner/events");
          }
        }, 1500);
      } else {
        setErrorMsg(res.error || "Gagal membuat tiket.");
      }
    } catch (err) {
      setErrorMsg("Koneksi bermasalah.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="text-text-secondary hover:text-text-primary"
        >
          <span className="material-symbols-outlined text-xl leading-none">
            arrow_back
          </span>
        </button>
        <h1 className="text-text-primary text-2xl font-bold">Buat Tiket Baru</h1>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMsg && (
            <div className="bg-red-50 text-destructive-text p-3 rounded-md text-sm">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="bg-green-50 text-success-text p-3 rounded-md text-sm">
              {successMsg}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="name">
              Nama Tiket <span className="text-destructive-text">*</span>
            </label>
            <input
              required
              id="name"
              name="name"
              type="text"
              className="w-full rounded-md border border-gray-300 p-2"
              placeholder="Contoh: Tiket Reguler"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="categoryCode">
              Kode Kategori <span className="text-destructive-text">*</span>
            </label>
            <input
              required
              id="categoryCode"
              name="categoryCode"
              type="text"
              className="w-full rounded-md border border-gray-300 p-2"
              placeholder="Contoh: REG"
              value={formData.categoryCode}
              onChange={handleChange}
            />
            <p className="text-xs text-text-secondary mt-1">Kode unik maksimal 5 karakter. Contoh: VIP, REG1.</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="description">
              Deskripsi
            </label>
            <textarea
              id="description"
              name="description"
              className="w-full rounded-md border border-gray-300 p-2 min-h-[80px]"
              placeholder="Tambahkan informasi tentang tiket ini (opsional)"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="price">
                Harga (Rp) <span className="text-destructive-text">*</span>
              </label>
              <input
                required
                id="price"
                name="price"
                type="text"
                inputMode="numeric"
                className="w-full rounded-md border border-gray-300 p-2"
                placeholder="Contoh: 150.000"
                value={formData.price}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="totalTicket">
                Jumlah Tiket <span className="text-destructive-text">*</span>
              </label>
              <input
                required
                id="totalTicket"
                name="totalTicket"
                type="number"
                min="1"
                className="w-full rounded-md border border-gray-300 p-2"
                placeholder="Contoh: 100"
                value={formData.totalTicket}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !formData.name || !formData.categoryCode || !formData.price || !formData.totalTicket}
            >
              {loading ? "Menyimpan..." : "Simpan Tiket"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
