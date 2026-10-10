"use client";

import React from "react";
import Select from "@/components/ui/Select";

interface ClubTypeSelectorProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
}

export const CLUB_TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "club", label: "Club" },
  { value: "high_school", label: "High School" },
];

export default function ClubTypeSelector({
  value,
  onChange,
  className = "",
}: ClubTypeSelectorProps) {
  return (
    <div className={`p-4 border-b border-border ${className}`}>
      <Select
        label="Program Type"
        value={value}
        onChange={onChange}
        options={CLUB_TYPE_OPTIONS}
        width="full"
        showPlaceholder={false}
      />
    </div>
  );
}
