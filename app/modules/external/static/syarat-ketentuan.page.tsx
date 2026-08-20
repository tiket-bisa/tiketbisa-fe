import { LegalDocument } from "./components/legal-document";
import { TERMS_SECTIONS } from "./content/terms.content";

export default function SyaratKetentuanPage() {
  return (
    <LegalDocument
      title="Syarat dan"
      highlightedTitle="Ketentuan TIKETBISA"
      description="Aturan dan ketentuan penggunaan platform serta transaksi tiket di TIKETBISA."
      sections={TERMS_SECTIONS}
    />
  );
}
