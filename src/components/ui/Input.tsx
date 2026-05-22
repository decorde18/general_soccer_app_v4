/**
 * Input Component - Uses Global Theme Variables
 *
 * @example
 * // Basic input
 * <Input placeholder="Enter text" />
 *
 * @example
 * // With label
 * <Input label="Username" placeholder="john_doe" />
 *
 * @example
 * // Error state
 * <Input label="Email" error={true} placeholder="Invalid email" />
 *
 * @example
 * // Different sizes
 * <Input size="sm" />
 * <Input size="md" />
 *
 * @example
 * // Disabled
 * <Input disabled label="Read-only field" value="Cannot edit" />
 */

import React from "react";

import { useFormClasses } from "@/hooks/useFormClasses";
import { cn } from "@/lib/utils";

export default function Input({
  label,
  size = "md",
  disabled = false,
  error = false,
  className = "",
  ...props
}: any) {
  const inputClasses = useFormClasses({ size, disabled, error, className });

  return (
    <div className='flex flex-col mb-2'>
      {label && (
        <label
          className={cn(
            "font-medium mb-1 text-sm",
            error ? "text-red-700" : "text-slate-700",
          )}
        >
          {label}
        </label>
      )}
      <input disabled={disabled} className={inputClasses} {...props} />
    </div>
  );
}
