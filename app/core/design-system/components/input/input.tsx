import { type InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-primary"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-lg border bg-surface-alt px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent ${
            error
              ? "border-destructive"
              : "border-border-default hover:border-border-subtle"
          } disabled:bg-button-disabled disabled:text-text-tertiary disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-destructive-text">{error}</p>}
        {!error && hint && <p className="text-xs text-text-tertiary">{hint}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
