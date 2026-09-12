/**
 * Button Component - Uses Global Theme Variables
 * 
 * @example
 * // Primary button (default)
 * <Button variant="primary" size="md">Click me</Button>
 * 
 * @example
 * // Various variants
 * <Button variant="success">Success</Button>
 * <Button variant="danger">Delete</Button>
 * <Button variant="outline">Cancel</Button>
 * <Button variant="secondary">Secondary</Button>
 * 
 * @example
 * // Different sizes
 * <Button size="xs">Tiny</Button>
 * <Button size="sm">Small</Button>
 * <Button size="md">Medium</Button>
 * <Button size="lg">Large</Button>
 * 
 * @example
 * // Disabled state
 * <Button disabled>Disabled</Button>
 */

"use client";
import { cn } from "@/lib/utils";
import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "danger" | "success" | "muted" | "ghost" | "default";
  size?: "xs" | "sm" | "md" | "lg";
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  isLoading = false,
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-xl font-bold transition-all duration-200 active:scale-95 mb-0 select-none shadow-sm";
  const sizes: Record<string, string> = {
    xs: "text-[0.7rem] px-1.5 py-0.5",
    sm: "text-xs px-2 py-1",
    md: "text-base px-4 py-2",
    lg: "text-lg px-6 py-3",
  };

  const variants: Record<string, string> = {
    primary: "bg-primary text-white hover:bg-accent-hover shadow-primary/20",
    default: "bg-primary text-white hover:bg-accent-hover shadow-primary/20",
    success: "bg-success text-white hover:opacity-90 shadow-success/20",
    muted: "bg-muted text-white cursor-not-allowed border-none",
    outline: "border-2 border-border text-text hover:bg-background",
    danger: "border border-border bg-danger text-white hover:opacity-90",
    secondary: "bg-secondary text-white hover:opacity-90",
    ghost: "bg-transparent text-text hover:bg-background/80 shadow-none border-none",
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      disabled={isDisabled}
      className={cn(
        base,
        sizes[size],
        variants[variant],
        isDisabled && "opacity-60 cursor-not-allowed pointer-events-none",
        className
      )}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin h-3.5 w-3.5 text-current shrink-0"
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
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
