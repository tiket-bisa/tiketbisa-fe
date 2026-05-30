import { useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "~/core/design-system/components/button";
import { Input } from "~/core/design-system/components/input";
import { Card } from "~/core/design-system/components/card";
import { sendContactMessage } from "./contact.api";

const INITIAL_FORM = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

/** External — Hubungi Kami (Static) */
export default function HubungiPage() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof typeof INITIAL_FORM) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.name.trim()) {
      setError("Nama lengkap wajib diisi.");
      return;
    }
    if (!formData.email.trim()) {
      setError("Email wajib diisi.");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email.trim())) {
      setError("Format email tidak valid.");
      return;
    }
    if (!formData.message.trim()) {
      setError("Pesan wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      await sendContactMessage({
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      });
      setSuccess("Pesan berhasil dikirim. Tim kami akan segera menghubungi Anda.");
      setFormData(INITIAL_FORM);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim pesan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold tracking-tight text-text-primary sm:text-5xl">
          Hubungi <span className="text-brand-primary">Kami</span>
        </h1>
        <p className="mt-4 text-lg text-text-secondary">
          Kami siap membantu untuk kebutuhan event dan tiket Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Contact Info */}
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-6">Informasi Kontak</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="mt-1 h-10 w-10 shrink-0 rounded-lg bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20">
                  <svg className="h-5 w-5 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Email</h3>
                  <p className="mt-1 text-text-secondary font-medium">helpdesk@tiketbisa.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 h-10 w-10 shrink-0 rounded-lg bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20">
                  <svg className="h-5 w-5 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">WhatsApp</h3>
                  <p className="mt-1 text-text-secondary font-medium">+62 xxx xxxx xxxx</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-divider">
            <h3 className="text-lg font-bold text-text-primary mb-4">Jam Operasional</h3>
            <p className="text-text-secondary">Setiap Hari: 09.00 – 21.00 WIB</p>
          </div>
        </div>

        {/* Contact Form */}
        <Card className="p-8 border-border-default bg-surface-alt/50 backdrop-blur-sm">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-destructive-text">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-success-text">
                {success}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Nama Lengkap</label>
                <Input
                  placeholder="Masukkan nama lengkap"
                  className="bg-surface-primary"
                  value={formData.name}
                  onChange={handleChange("name")}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Email</label>
                <Input
                  type="email"
                  placeholder="nama@email.com"
                  className="bg-surface-primary"
                  value={formData.email}
                  onChange={handleChange("email")}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Subjek</label>
              <Input
                placeholder="Contoh: Kerja sama event"
                className="bg-surface-primary"
                value={formData.subject}
                onChange={handleChange("subject")}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Pesan</label>
              <textarea 
                className="w-full min-h-[150px] rounded-xl border border-border-default bg-surface-primary p-4 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
                placeholder="Tulis pesan Anda di sini"
                value={formData.message}
                onChange={handleChange("message")}
                disabled={isSubmitting}
              />
            </div>

            <Button className="w-full h-12 text-lg font-bold" variant="primary" isLoading={isSubmitting}>
              {isSubmitting ? "Mengirim..." : "Kirim Pesan"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
