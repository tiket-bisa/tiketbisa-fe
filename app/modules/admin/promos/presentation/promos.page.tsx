import { useMemo, useRef, useState } from "react";
import { ApiRequestError, toUserFacingError, toUserFacingResponseError, useApiQuery } from "~/core/api";
import { brandApi, mapBrandApiToFe } from "~/core/api/services/brand.api";
import {
  EMPTY_PROMO_FORM,
  promoFormToPayload,
  promoToForm,
  validatePromoForm,
  type PromoFormState,
} from "../domain/promo-form";
import { promoAdminApi, type PromoData } from "../infrastructure/promo.api";
import { DeactivatePromoDialog } from "./components/deactivate-promo-dialog";
import { PromoForm } from "./components/promo-form";
import { PromoList } from "./components/promo-list";

type Feedback = { type: "success" | "error"; message: string };

export default function PromosPage() {
  const [form, setForm] = useState<PromoFormState>(EMPTY_PROMO_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [promoToDeactivate, setPromoToDeactivate] = useState<PromoData | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const { data: promos, loading, error, refetch } = useApiQuery(() => promoAdminApi.list(), []);
  const { data: brands } = useApiQuery(async () => {
    const response = await brandApi.getList({ limit: 100, offset: 0 });
    if (!response.success || !response.data) {
      throw new ApiRequestError(toUserFacingResponseError(response, "Gagal memuat brand."));
    }
    return (response.data.brands ?? []).map(mapBrandApiToFe);
  }, []);

  const brandNames = useMemo(() => new Map((brands ?? []).map((brand) => [brand.id, brand.name])), [brands]);
  const brandOptions = useMemo(() => [
    { value: "", label: "Semua brand (global)" },
    ...(brands ?? []).map((brand) => ({ value: brand.id, label: brand.name })),
  ], [brands]);

  const resetForm = () => {
    setForm(EMPTY_PROMO_FORM);
    setFeedback(null);
  };

  const focusForm = () => requestAnimationFrame(() => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    formRef.current?.focus({ preventScroll: true });
  });

  const editPromo = (promo: PromoData) => {
    setForm(promoToForm(promo));
    setFeedback(null);
    focusForm();
  };

  const savePromo = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSaving) return;
    setFeedback(null);
    const validationError = validatePromoForm(form);
    if (validationError) {
      setFeedback({ type: "error", message: validationError });
      return;
    }

    setIsSaving(true);
    try {
      const payload = promoFormToPayload(form);
      const response = form.id
        ? await promoAdminApi.update(form.id, payload)
        : await promoAdminApi.create(payload);
      if (!response.success) {
        setFeedback({ type: "error", message: toUserFacingResponseError(response, "Gagal menyimpan promo.") });
        return;
      }
      setForm(EMPTY_PROMO_FORM);
      setFeedback({ type: "success", message: "Promo berhasil disimpan." });
      refetch();
    } catch (error) {
      setFeedback({ type: "error", message: toUserFacingError(error, "Gagal menyimpan promo.") });
    } finally {
      setIsSaving(false);
    }
  };

  const deactivatePromo = async () => {
    const promo = promoToDeactivate;
    if (!promo?.id || deactivatingId) return;
    setDeactivatingId(promo.id);
    setFeedback(null);
    try {
      const response = await promoAdminApi.deactivate(promo.id);
      if (!response.success) {
        setFeedback({ type: "error", message: toUserFacingResponseError(response, "Gagal menonaktifkan promo.") });
        return;
      }
      if (form.id === promo.id) setForm(EMPTY_PROMO_FORM);
      setPromoToDeactivate(null);
      setFeedback({ type: "success", message: "Promo dinonaktifkan." });
      refetch();
    } catch (error) {
      setFeedback({ type: "error", message: toUserFacingError(error, "Gagal menonaktifkan promo.") });
    } finally {
      setDeactivatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-text-primary">Promo</h1>
        <p className="mt-1 text-sm text-text-tertiary">Kelola kode promo global atau khusus brand.</p>
      </header>

      <PromoForm
        form={form}
        formRef={formRef}
        brandOptions={brandOptions}
        feedback={feedback}
        isSaving={isSaving}
        onChange={(field, value) => setForm((current) => ({ ...current, [field]: value }))}
        onSubmit={savePromo}
        onCancel={resetForm}
      />

      <PromoList
        promos={promos ?? []}
        brandNames={brandNames}
        loading={loading}
        error={error}
        deactivatingId={deactivatingId}
        onEdit={editPromo}
        onDeactivate={setPromoToDeactivate}
      />

      <DeactivatePromoDialog
        promo={promoToDeactivate}
        isLoading={deactivatingId !== null}
        onConfirm={deactivatePromo}
        onClose={() => setPromoToDeactivate(null)}
      />
    </div>
  );
}
