"use client";

import React from "react";
import Input from "@/components/ui/Input";
import { format } from "date-fns";

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

/**
 * Helper to format date strings into standard MM/DD/YYYY format across the app
 */
export function formatDateStandard(dateStr?: string | Date | null): string {
  if (!dateStr) return "--";
  try {
    const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return String(dateStr);
    return format(d, "MM/dd/yyyy");
  } catch {
    return String(dateStr);
  }
}

/**
 * Helper to format time strings into standard 12-hour format with AM/PM
 */
export function formatTimeStandard(timeStr?: string | Date | null): string {
  if (!timeStr) return "TBD";
  try {
    let d: Date;
    if (typeof timeStr === "string") {
      if (timeStr.includes(":") && !timeStr.includes("T")) {
        const [hours, minutes] = timeStr.split(":").map(Number);
        d = new Date();
        d.setHours(hours, minutes, 0, 0);
      } else {
        d = new Date(timeStr);
      }
    } else {
      d = timeStr;
    }
    if (isNaN(d.getTime())) return String(timeStr);
    return format(d, "h:mm a");
  } catch {
    return String(timeStr);
  }
}
