"use client";

import React from "react";
import Input from "@/components/ui/Input";
import { formatDateStandard, formatTimeStandard } from "@/lib/utils/dateTimeUtils";

export { formatDateStandard, formatTimeStandard };

interface DateSelectProps {
  label?: string;
  value?: string; // Expects YYYY-MM-DD
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  placeholder?: string;
  [key: string]: any;
}

/**
 * Standardized DateSelect component ensuring MM/DD/YYYY date presentation
 */
export default function DateSelect({
  label,
  value,
  onChange,
  disabled = false,
  error = false,
  className = "",
  placeholder = "mm/dd/yyyy",
  ...props
}: DateSelectProps) {
  return (
    <Input
      type="date"
      label={label}
      value={value}
      onChange={onChange}
      disabled={disabled}
      error={error}
      className={className}
      placeholder={placeholder}
      {...props}
    />
  );
}
