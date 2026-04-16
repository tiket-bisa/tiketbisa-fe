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
      question: "Bagaimana cara membeli tiket di TiketBisa?",
      answer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
    },
    {
      question: "Metode pembayaran apa saja yang tersedia?",
      answer: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
    },
    {
      question: "Kapan saya akan menerima e-tiket saya?",
      answer: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo."
    },
    {
      question: "Apakah saya bisa melakukan refund tiket?",
      answer: "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident."
    },
    {
      question: "Bagaimana jika saya tidak menerima email konfirmasi?",
      answer: "Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus."
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
