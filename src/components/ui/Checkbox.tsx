import React from "react";

import { cn } from "@/lib/utils";

export default function Checkbox({
  label,
  checked,
  disabled = false,
  onChange,
  error = false,
  className = "",
}: any) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onChange) return;
    const isChecked = e.target.checked;
    try {
      onChange(isChecked, e);
    } catch {
      onChange(e);
    }
  };

  return (
    <label className='flex items-center gap-2 cursor-pointer mb-2'>
      <input
        type='checkbox'
        checked={Boolean(checked)}
        onChange={handleChange}
        disabled={disabled}
        className={cn(
          "w-5 h-5 accent-primary rounded-[var(--radius-sm)] border border-border",
          disabled && "opacity-60 cursor-not-allowed",
          error && "border-danger",
          className
        )}
      />
      {label && (
        <span
          className={cn(
            "text-[var(--color-text-label)] text-[var(--font-size-small)]",
            error && "text-danger"
          )}
        >
          {label}
        </span>
      )}
    </label>
  );
}
