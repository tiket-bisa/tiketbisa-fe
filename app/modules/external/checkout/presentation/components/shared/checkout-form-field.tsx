import { Input } from "~/core/design-system/components";
import { useMemo } from "react";

export interface CheckoutFormFieldProps {
  id: string;
  label: string;
  placeholder?: string;
  type?: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  className?: string;
}

export function CheckoutFormField({ 
  id, 
  label, 
  placeholder, 
  type = "text", 
  value, 
  error, 
  onChange, 
  className = "" 
}: CheckoutFormFieldProps) {
  const inputBaseStyles = "h-12 rounded-xl border-gray-200 text-text-primary font-bold placeholder:text-text-tertiary focus:ring-4 focus:ring-brand-primary/10 transition-all duration-200 hover:bg-surface-hover focus:bg-surface-hover focus:border-brand-primary";
  
  const bgClass = useMemo(() => 
    (value && value.length > 0 ? "bg-surface-hover" : "bg-surface-primary"), 
    [value]
  );

  const errorClass = error ? "border-destructive bg-destructive-bg" : "";
  const errorId = `${id}-error`;

  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor={id} className="text-sm font-bold text-text-secondary ml-1">
        {label}
      </label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputBaseStyles} ${bgClass} ${errorClass}`}
      />
      {error && (
        <p id={errorId} className="text-xs font-bold text-destructive-text ml-1 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
