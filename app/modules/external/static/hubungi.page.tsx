import { Button } from "~/core/design-system/components/button";
import { Input } from "~/core/design-system/components/input";
import { Card } from "~/core/design-system/components/card";

/** External — Hubungi Kami (Static) */
export default function HubungiPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold tracking-tight text-text-primary sm:text-5xl">
          Hubungi <span className="text-brand-primary">Kami</span>
        </h1>
        <p className="mt-4 text-lg text-text-secondary">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod.
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
                  <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Lorem Ipsum</h3>
                  <p className="mt-1 text-text-secondary font-medium">lorem.ipsum@example.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 h-10 w-10 shrink-0 rounded-lg bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20">
                  <svg className="h-5 w-5 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Alamat Kantor</h3>
                  <p className="mt-1 text-text-secondary leading-relaxed font-medium">
                    Lorem ipsum dolor sit amet<br />
                    Consectetur adipiscing elit<br />
                    Indonesia
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-divider">
            <h3 className="text-lg font-bold text-text-primary mb-4">Jam Operasional</h3>
            <p className="text-text-secondary">Senin - Jumat: Lorem Ipsum</p>
            <p className="text-text-secondary">Sabtu - Minggu: Lorem Ipsum</p>
          </div>
        </div>

        {/* Contact Form */}
        <Card className="p-8 border-border-default bg-surface-alt/50 backdrop-blur-sm">
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Nama Lengkap</label>
                <Input placeholder="Lorem Ipsum" className="bg-surface-primary" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Email</label>
                <Input type="email" placeholder="lorem@example.com" className="bg-surface-primary" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Subjek</label>
              <Input placeholder="Lorem Ipsum Dolor" className="bg-surface-primary" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Pesan</label>
              <textarea 
                className="w-full min-h-[150px] rounded-xl border border-border-default bg-surface-primary p-4 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
                placeholder="Lorem ipsum dolor sit amet..."
              />
            </div>

            <Button className="w-full h-12 text-lg font-bold" variant="primary">
              Kirim Pesan
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
