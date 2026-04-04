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
  const inputBaseStyles = "h-12 rounded-xl border-gray-200 !text-black font-bold placeholder:text-gray-400 focus:ring-4 focus:ring-brand-primary/10 transition-all duration-200 hover:!bg-gray-100 focus:!bg-gray-100 focus:border-brand-primary";
  
  const bgClass = useMemo(() => 
    (value && value.length > 0 ? "!bg-gray-100" : "!bg-white"), 
    [value]
  );

  const errorClass = error ? "border-red-500 !bg-red-50/30" : "";

  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor={id} className="text-sm font-bold text-gray-500 ml-1">
        {label}
      </label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputBaseStyles} ${bgClass} ${errorClass}`}
      />
      {error && (
        <p className="text-xs font-bold text-red-500 ml-1 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
