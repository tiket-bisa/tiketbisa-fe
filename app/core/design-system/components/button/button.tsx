import { type ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-primary text-base-white hover:bg-brand-primary-hover active:bg-brand-primary-active disabled:bg-button-disabled disabled:text-text-tertiary",
  secondary:
    "bg-transparent border border-button-secondary-border text-button-secondary-text hover:bg-surface-hover disabled:bg-button-disabled disabled:text-text-tertiary disabled:border-button-disabled",
  ghost:
    "bg-transparent text-button-ghost-text hover:bg-surface-hover disabled:text-text-tertiary",
  destructive:
    "bg-destructive text-base-white hover:bg-destructive-hover disabled:bg-button-disabled disabled:text-text-tertiary",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-4 py-2 text-sm rounded-lg",
  lg: "px-6 py-3 text-base rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth,
      isLoading,
      className = "",
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary cursor-pointer disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? "w-full" : ""} ${className}`}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-3 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
