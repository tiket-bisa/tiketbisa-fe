import { Input } from "~/core/design-system/components";
import type { BuyerInfo, OrderItem, TicketHolder } from "../../../domain/checkout.types";
import type { HolderFieldErrors } from "../../hooks/use-checkout-form";

export interface TicketHolderInputsProps {
  items: OrderItem[];
  buyerInfo: BuyerInfo;
  holders: TicketHolder[];
  holderErrors: HolderFieldErrors[];
  sameAsMain: boolean;
  onHolderChange: (index: number, field: keyof TicketHolder, value: string) => void;
  onToggleSameAsMain: (checked: boolean) => void;
  /** [Khusus bola] shown when the event's brand restricts sales to home-city KTP holders. */
  domicileNotice?: string | null;
}

/**
 * Renders one name+NIK input block per selected ticket (up to MAX_TICKETS_PER_ORDER),
 * grouped by ticket category when multiple categories are selected.
 */
export function TicketHolderInputs({
  items,
  buyerInfo,
  holders,
  holderErrors,
  sameAsMain,
  onHolderChange,
  onToggleSameAsMain,
  domicileNotice,
}: TicketHolderInputsProps) {
  const isMultiCategory = items.length > 1;

  // Map each flat holder index to its category label + per-category ordinal ("Tiket 1", "Tiket 2"...).
  let runningIndex = 0;
  const rows: { index: number; label: string; categoryName: string }[] = [];
  items.forEach((item) => {
    for (let i = 0; i < item.quantity; i++) {
      rows.push({
        index: runningIndex,
        label: isMultiCategory ? `${item.ticketName} ${i + 1}` : `Tiket ${runningIndex + 1}`,
        categoryName: item.ticketName,
      });
      runningIndex++;
    }
  });

  return (
    <div className="pt-6 border-t border-gray-100 space-y-6">
      <div>
        <h3 className="text-lg font-extrabold text-text-primary mb-1">Data Pemegang Tiket</h3>
        <p className="text-text-secondary font-medium text-sm">
          Lengkapi nama dan NIK (KTP) untuk setiap tiket yang dibeli.
        </p>
      </div>

      {domicileNotice && (
        <div className="flex items-start gap-3 bg-brand-primary/5 border border-brand-primary/20 p-4 rounded-2xl">
          <svg className="h-5 w-5 text-brand-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs font-bold text-brand-primary leading-relaxed">{domicileNotice}</p>
        </div>
      )}

      <label className="flex items-center gap-3 cursor-pointer group w-fit">
        <div className="relative flex items-center">
          <input
            type="checkbox"
            checked={sameAsMain}
            onChange={(e) => onToggleSameAsMain(e.target.checked)}
            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-gray-200 checked:border-brand-primary checked:bg-brand-primary transition-all"
          />
          <svg className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 left-0.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-sm font-bold text-text-secondary select-none">
          Samakan dengan data utama
        </span>
      </label>

      <div className="space-y-5">
        {rows.map(({ index, label }) => {
          const holder = holders[index] ?? { name: "", identityNumber: "" };
          const holderError = holderErrors[index] ?? {};

          return (
            <div key={index} className="p-5 rounded-2xl border border-gray-100 bg-surface-primary/50 space-y-4">
              <p className="text-xs font-black uppercase tracking-widest text-text-tertiary">{label}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-secondary ml-1">Nama Pemegang Tiket</label>
                  <Input
                    id={`holder-${index}-name`}
                    placeholder="Nama sesuai KTP"
                    value={holder.name}
                    disabled={sameAsMain}
                    aria-invalid={Boolean(holderError.name)}
                    aria-describedby={holderError.name ? `holder-${index}-name-error` : undefined}
                    onChange={(e) => onHolderChange(index, "name", e.target.value)}
                    className={`h-12 rounded-xl border-gray-200 text-text-primary font-bold ${
                      holderError.name ? "border-destructive bg-destructive-bg" : ""
                    }`}
                  />
                  {holderError.name && (
                    <p id={`holder-${index}-name-error`} className="text-xs font-bold text-destructive-text ml-1">{holderError.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-secondary ml-1">NIK (KTP)</label>
                  <Input
                    id={`holder-${index}-identityNumber`}
                    placeholder="16 digit NIK"
                    inputMode="numeric"
                    maxLength={16}
                    value={holder.identityNumber}
                    disabled={sameAsMain}
                    aria-invalid={Boolean(holderError.identityNumber)}
                    aria-describedby={holderError.identityNumber ? `holder-${index}-identityNumber-error` : undefined}
                    onChange={(e) => onHolderChange(index, "identityNumber", e.target.value.replace(/[^0-9]/g, ""))}
                    className={`h-12 rounded-xl border-gray-200 text-text-primary font-bold ${
                      holderError.identityNumber ? "border-destructive bg-destructive-bg" : ""
                    }`}
                  />
                  {holderError.identityNumber && (
                    <p id={`holder-${index}-identityNumber-error`} className="text-xs font-bold text-destructive-text ml-1">{holderError.identityNumber}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
