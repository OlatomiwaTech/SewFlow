"use client";

import { useState } from "react";
import type {
  CreateMeasurementInput,
  Measurement,
  MeasurementUnit,
} from "@/types/measurement";
import { Ruler, Loader2 } from "lucide-react";

interface MeasurementFormProps {
  initialData?: Measurement | null;
  onSubmit: (data: CreateMeasurementInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function MeasurementForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = "Save Measurement",
}: Readonly<MeasurementFormProps>) {
  const [unit, setUnit] = useState<MeasurementUnit>(initialData?.unit || "CM");
  const [values, setValues] = useState<Record<string, string>>({
    neck: initialData?.neck ? String(initialData.neck) : "",
    shoulder: initialData?.shoulder ? String(initialData.shoulder) : "",
    chest: initialData?.chest ? String(initialData.chest) : "",
    waist: initialData?.waist ? String(initialData.waist) : "",
    hip: initialData?.hip ? String(initialData.hip) : "",
    sleeve: initialData?.sleeve ? String(initialData.sleeve) : "",
    shirtLength: initialData?.shirtLength ? String(initialData.shirtLength) : "",
    trouserLength: initialData?.trouserLength ? String(initialData.trouserLength) : "",
    thigh: initialData?.thigh ? String(initialData.thigh) : "",
    knee: initialData?.knee ? String(initialData.knee) : "",
    ankle: initialData?.ankle ? String(initialData.ankle) : "",
  });
  const [notes, setNotes] = useState<string>(initialData?.notes || "");
  const [error, setError] = useState<string | null>(null);

  const handleFieldChange = (field: string, val: string) => {
    setValues((prev) => ({ ...prev, [field]: val }));
  };

  const parseNum = (val: string) => {
    if (!val || val.trim() === "") return null;
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload: CreateMeasurementInput = {
      unit,
      neck: parseNum(values.neck),
      shoulder: parseNum(values.shoulder),
      chest: parseNum(values.chest),
      waist: parseNum(values.waist),
      hip: parseNum(values.hip),
      sleeve: parseNum(values.sleeve),
      shirtLength: parseNum(values.shirtLength),
      trouserLength: parseNum(values.trouserLength),
      thigh: parseNum(values.thigh),
      knee: parseNum(values.knee),
      ankle: parseNum(values.ankle),
      notes: notes.trim() || null,
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save measurement.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm font-medium border border-destructive/20">
          {error}
        </div>
      )}

      {/* Unit Selector */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-2 font-medium">
          <Ruler className="h-5 w-5 text-primary" />
          <span>Measurement Unit</span>
        </div>

        <div className="inline-flex rounded-lg border p-1 bg-muted/50">
          <button
            type="button"
            onClick={() => setUnit("CM")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              unit === "CM"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Centimeters (cm)
          </button>
          <button
            type="button"
            onClick={() => setUnit("INCH")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              unit === "INCH"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Inches (in)
          </button>
        </div>
      </div>

      {/* Upper Body */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Upper Body ({unit.toLowerCase()})
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field
            label="Neck"
            value={values.neck}
            unit={unit}
            onChange={(v) => handleFieldChange("neck", v)}
            disabled={isLoading}
          />
          <Field
            label="Shoulder"
            value={values.shoulder}
            unit={unit}
            onChange={(v) => handleFieldChange("shoulder", v)}
            disabled={isLoading}
          />
          <Field
            label="Chest / Bust"
            value={values.chest}
            unit={unit}
            onChange={(v) => handleFieldChange("chest", v)}
            disabled={isLoading}
          />
          <Field
            label="Waist"
            value={values.waist}
            unit={unit}
            onChange={(v) => handleFieldChange("waist", v)}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Lower Body */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Lower Body ({unit.toLowerCase()})
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field
            label="Hip"
            value={values.hip}
            unit={unit}
            onChange={(v) => handleFieldChange("hip", v)}
            disabled={isLoading}
          />
          <Field
            label="Thigh"
            value={values.thigh}
            unit={unit}
            onChange={(v) => handleFieldChange("thigh", v)}
            disabled={isLoading}
          />
          <Field
            label="Knee"
            value={values.knee}
            unit={unit}
            onChange={(v) => handleFieldChange("knee", v)}
            disabled={isLoading}
          />
          <Field
            label="Ankle"
            value={values.ankle}
            unit={unit}
            onChange={(v) => handleFieldChange("ankle", v)}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Garment Lengths */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Lengths ({unit.toLowerCase()})
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <Field
            label="Sleeve Length"
            value={values.sleeve}
            unit={unit}
            onChange={(v) => handleFieldChange("sleeve", v)}
            disabled={isLoading}
          />
          <Field
            label="Shirt Length"
            value={values.shirtLength}
            unit={unit}
            onChange={(v) => handleFieldChange("shirtLength", v)}
            disabled={isLoading}
          />
          <Field
            label="Trouser Length"
            value={values.trouserLength}
            unit={unit}
            onChange={(v) => handleFieldChange("trouserLength", v)}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label htmlFor="notes" className="text-sm font-medium">
          Notes & Tailoring Preferences
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Fit preferences, postural adjustments, special details..."
          className="w-full px-3 py-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary"
          disabled={isLoading}
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoading ? "Saving..." : submitLabel}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

interface FieldProps {
  label: string;
  value: string;
  unit: MeasurementUnit;
  onChange: (val: string) => void;
  disabled?: boolean;
}

function Field({ label, value, unit, onChange, disabled }: Readonly<FieldProps>) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground flex justify-between">
        <span>{label}</span>
        <span className="text-[10px] text-muted-foreground">{unit.toLowerCase()}</span>
      </label>
      <input
        type="number"
        step="0.1"
        min="0"
        max="500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.0"
        className="w-full px-3 py-1.5 border rounded-lg bg-background text-sm font-mono outline-none focus:ring-2 focus:ring-primary"
        disabled={disabled}
      />
    </div>
  );
}
