import { LegalDocument } from "./components/legal-document";
import { PRIVACY_SECTIONS } from "./content/privacy.content";

export default function KebijakanPrivasiPage() {
  return (
    <LegalDocument
      title="Kebijakan Privasi dan"
      highlightedTitle="Pemrosesan Data"
      description="Ketentuan pengumpulan, penggunaan, penyimpanan, dan perlindungan data pribadi oleh TIKETBISA."
      sections={PRIVACY_SECTIONS}
    />
  );
}
