/**
 * GenericForm Component - Uses Global Theme Variables
 *
 * @example
 * <GenericForm
 *   config={entityConfig}
 *   initialData={editingData}
 *   onSubmit={async (data) => { await saveData(data) }}
 *   onCancel={() => setShowForm(false)}
 * />
 */

"use client";

import { useState, useEffect } from "react";
import { type FormField, type EntityConfig } from "@/components/entities/types";
import { X } from "lucide-react";

interface GenericFormProps<T extends Record<string, unknown>> {
  config: EntityConfig;
  initialData?: T | null;
  onSubmit: (data: Record<string, string>) => Promise<void>;
  onCancel: () => void;
}

export function GenericForm<T extends Record<string, unknown>>({
  config,
  initialData,
  onSubmit,
  onCancel,
}: GenericFormProps<T>) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      const mapped: Record<string, string> = {};
      config.form.fields.forEach((f) => {
        mapped[f.key] = String(initialData[f.key] ?? "");
      });
      setValues(mapped);
    } else {
      const defaults: Record<string, string> = {};
      config.form.fields.forEach((f) => {
        defaults[f.key] =
          f.type === "select" && f.options?.length ? f.options[0].value : "";
      });
      setValues(defaults);
    }
    setErrors({});
  }, [initialData, config]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    config.form.fields.forEach((f) => {
      if (f.required && !values[f.key]?.trim()) {
        newErrors[f.key] = `${f.label} is required`;
      }
      const rule = config.form.validationRules?.[f.key];
      if (rule && values[f.key]) {
        const msg = rule(values[f.key]);
        if (msg) newErrors[f.key] = msg;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit(values);
    } finally {
      setLoading(false);
    }
  };

  const isEditing = !!initialData;

  return (
    <div className='modal-overlay p-4 backdrop-blur-sm'>
      <div className='bg-surface border border-border rounded-xl w-full max-w-lg overflow-hidden shadow-xl'>
        {/* Header */}
        <div className='flex items-center justify-between px-5 py-4 border-b border-border'>
          <h2 className='text-[15px] font-semibold text-text'>
            {isEditing ? `Edit ${config.singular}` : `Add ${config.singular}`}
          </h2>
          <button
            onClick={onCancel}
            className='p-1.5 rounded-md text-muted hover:text-text hover:bg-muted/20 transition-colors'
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className='p-5'>
          <div className='grid grid-cols-12 gap-4'>
            {config.form.fields.map((field) => (
              <div
                key={field.key}
                className={field.gridColumn ?? "col-span-12"}
              >
                <FieldInput
                  field={field}
                  value={values[field.key] ?? ""}
                  error={errors[field.key]}
                  onChange={(val) => {
                    setValues((prev) => ({ ...prev, [field.key]: val }));
                    if (errors[field.key])
                      setErrors((prev) => ({ ...prev, [field.key]: "" }));
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className='flex justify-end gap-2 px-5 py-3.5 border-t border-border'>
          <button
            onClick={onCancel}
            className='px-4 py-2 text-sm border border-border rounded-lg text-text-label hover:bg-background transition-colors'
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className='px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-accent-hover disabled:opacity-50 transition-colors font-medium'
          >
            {loading ? "Saving..." : `Save ${config.singular}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldInput({
  field,
  value,
  error,
  onChange,
}: {
  field: FormField;
  value: string;
  error?: string;
  onChange: (val: string) => void;
}) {
  const base =
    "w-full px-3 py-2 text-sm border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";
  const errClass = error
    ? "border-danger focus:border-danger focus:ring-danger/30"
    : "border-border";

  return (
    <div className='flex flex-col gap-1.5'>
      <label className='text-xs font-medium text-text-label'>
        {field.label}
        {field.required && <span className='text-danger ml-0.5'>*</span>}
      </label>

      {field.type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className={`${base} ${errClass} resize-none`}
        />
      ) : field.type === "select" && field.options ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${base} ${errClass}`}
        >
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={
            field.type === "date"
              ? "date"
              : field.type === "number"
                ? "number"
                : "text"
          }
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={`${base} ${errClass}`}
        />
      )}

      {error && <p className='text-xs text-danger font-medium'>{error}</p>}
    </div>
  );
}
