import { useState } from "react";
import { Card } from "~/core/design-system/components/card";

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-divider last:border-0">
      <button
        className="w-full flex items-center justify-between py-6 text-left focus:outline-none transition-colors group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`text-lg font-semibold transition-colors ${isOpen ? "text-brand-primary" : "text-text-primary group-hover:text-brand-primary"}`}>
          {question}
        </span>
        <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${isOpen ? "bg-brand-primary/10 rotate-180" : "bg-surface-alt"}`}>
          <svg className={`h-5 w-5 ${isOpen ? "text-brand-primary" : "text-text-tertiary"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-96 pb-6 opacity-100" : "max-h-0 opacity-0"}`}>
        <p className="text-text-secondary leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  );
}

/** External — FAQ (Static) */
export default function FAQPage() {
  const faqs = [
    {
      question: "1. Bagaimana cara membeli tiket di TiketBisa?",
      answer: "Pilih event yang ingin Anda kunjungi, tentukan kategori tiket dan jumlah tiket yang diinginkan, isi data diri, kemudian lanjutkan ke halaman checkout untuk menyelesaikan pembayaran."
    },
    {
      question: "2. Metode pembayaran apa saja yang tersedia?",
      answer: "TiketBisa menyediakan berbagai metode pembayaran seperti manual transfer, Virtual Account, QRIS, e-wallet, kartu debit/kredit, dan metode pembayaran lain yang tersedia pada halaman checkout."
    },
    {
      question: "3. Apakah saya harus memiliki akun untuk membeli tiket?",
      answer: "Tidak. Pengguna bisa langsung membeli tiket yang tersedia dan menyelesaikan transaksi tanpa pembuatan akun."
    },
    {
      question: "4. Kapan e-ticket akan diterima?",
      answer: "E-ticket akan dikirim secara otomatis melalui email setelah pembayaran berhasil diverifikasi"
    },
    {
      question: "5. Saya belum menerima e-ticket, apa yang harus dilakukan?",
      answer: "Pastikan alamat email yang digunakan saat pembelian sudah benar dan aktif. Periksa folder Spam, Junk, atau Promotions. Jika tiket masih belum diterima, silakan hubungi Customer Support TiketBisa."
    },
    {
      question: "6. Apakah tiket yang sudah dibeli dapat direfund?",
      answer: "Kebijakan refund mengikuti ketentuan masing-masing penyelenggara event. Beberapa event mungkin tidak menyediakan refund kecuali event dibatalkan atau dijadwalkan ulang."
    },
    {
      question: "7. Apakah tiket dapat dipindah tangankan?",
      answer: "Ketentuan pemindahan tiket mengikuti kebijakan event yang berlaku. Untuk beberapa event, tiket bersifat personal dan wajib menggunakan identitas yang sesuai."
    }
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold tracking-tight text-text-primary sm:text-5xl">
          Pertanyaan <span className="text-brand-primary">Umum</span>
        </h1>
        <p className="mt-4 text-lg text-text-secondary">
          Cari jawaban untuk pertanyaan Anda di sini. Jika masih butuh bantuan, hubungi tim kami.
        </p>
      </div>

      <Card className="p-2 border-border-default bg-surface-alt/30 backdrop-blur-sm overflow-hidden">
        <div className="divide-y divide-divider px-6">
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </Card>

      <div className="mt-12 text-center">
        <p className="text-text-secondary">
          Belum menemukan jawaban yang Anda cari?{" "}
          <a href="/hubungi" className="text-brand-primary font-bold hover:underline">
            Hubungi Kami
          </a>
        </p>
      </div>
    </div>
  );
}
