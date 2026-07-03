import { useEffect, useMemo, useRef, useState } from "react";
import type { SelectOption } from "~/core/design-system/components";
import { INDONESIAN_CITY_OPTIONS } from "~/shared/constants/city.constants";

interface SearchableCitySelectProps {
  label?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
}

export function SearchableCitySelect({
  label = "Kota",
  name = "city",
  value,
  onChange,
  disabled,
  required,
}: SearchableCitySelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const options = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const baseOptions = normalizedQuery
      ? INDONESIAN_CITY_OPTIONS.filter((city) => city.label.toLowerCase().includes(normalizedQuery))
      : INDONESIAN_CITY_OPTIONS;

    const hasCurrentValue = value
      ? INDONESIAN_CITY_OPTIONS.some((city) => city.value.toLowerCase() === value.toLowerCase())
      : true;

    if (!hasCurrentValue) {
      return [{ value, label: value }, ...baseOptions];
    }

    return baseOptions;
  }, [query, value]);

  const selectCity = (city: SelectOption) => {
    onChange(city.value);
    setQuery(city.label);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-text-primary">
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id={name}
          name={name}
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            onChange("");
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          disabled={disabled}
          required={required}
          placeholder="Cari kota..."
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={`${name}-options`}
          className="w-full rounded-lg border border-border-default bg-surface-alt px-3 py-2 pr-9 text-sm text-text-primary placeholder:text-text-tertiary transition-colors hover:border-border-subtle focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent disabled:bg-button-disabled disabled:text-text-tertiary disabled:cursor-not-allowed"
        />
        <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-base text-text-tertiary">
          expand_more
        </span>
      </div>

      {isOpen && !disabled && (
        <div
          id={`${name}-options`}
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-lg border border-border-default bg-white py-1 shadow-lg"
          role="listbox"
        >
          {options.length > 0 ? (
            options.map((city) => (
              <button
                key={city.value}
                type="button"
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-surface-hover ${
                  city.value === value ? "font-semibold text-brand-primary" : "text-text-primary"
                }`}
                onClick={() => selectCity(city)}
                role="option"
                aria-selected={city.value === value}
              >
                {city.label}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-text-tertiary">Kota tidak ditemukan</div>
          )}
        </div>
      )}
    </div>
  );
}
