import { type ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
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
    { variant = "primary", size = "md", fullWidth, className = "", ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary cursor-pointer disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? "w-full" : ""} ${className}`}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
