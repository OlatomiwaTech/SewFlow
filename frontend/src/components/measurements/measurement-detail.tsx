"use client";

import type { Measurement } from "@/types/measurement";
import { Calendar, Ruler, FileText, Edit, Trash2 } from "lucide-react";

interface MeasurementDetailProps {
  measurement: Measurement;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function MeasurementDetail({
  measurement,
  onEdit,
  onDelete,
}: Readonly<MeasurementDetailProps>) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const unitLabel = measurement.unit.toLowerCase();

  const upperBody = [
    { label: "Neck", value: measurement.neck },
    { label: "Shoulder", value: measurement.shoulder },
    { label: "Chest / Bust", value: measurement.chest },
    { label: "Waist", value: measurement.waist },
  ];

  const lowerBody = [
    { label: "Hip", value: measurement.hip },
    { label: "Thigh", value: measurement.thigh },
    { label: "Knee", value: measurement.knee },
    { label: "Ankle", value: measurement.ankle },
  ];

  const lengths = [
    { label: "Sleeve Length", value: measurement.sleeve },
    { label: "Shirt Length", value: measurement.shirtLength },
    { label: "Trouser Length", value: measurement.trouserLength },
  ];

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">{formatDate(measurement.createdAt)}</span>
            <span className="text-xs px-2 py-0.5 rounded font-bold bg-primary/10 text-primary uppercase">
              {measurement.unit}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-medium hover:bg-accent transition-colors"
            >
              <Edit className="h-3.5 w-3.5" />
              Edit Record
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-destructive/20 text-destructive rounded-lg text-xs font-medium hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Record
            </button>
          )}
        </div>
      </div>

      {/* Categorized Measurements Grid */}
      <div className="grid gap-6 sm:grid-cols-3">
        {/* Upper Body */}
        <div className="space-y-3 rounded-lg border p-4 bg-card/50">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Ruler className="h-3.5 w-3.5 text-primary" />
            Upper Body
          </h4>
          <div className="space-y-2">
            {upperBody.map((item) => (
              <div key={item.label} className="flex justify-between items-center text-sm border-b pb-1 last:border-0">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-mono font-semibold">
                  {item.value !== null ? `${item.value} ${unitLabel}` : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Lower Body */}
        <div className="space-y-3 rounded-lg border p-4 bg-card/50">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Ruler className="h-3.5 w-3.5 text-primary" />
            Lower Body
          </h4>
          <div className="space-y-2">
            {lowerBody.map((item) => (
              <div key={item.label} className="flex justify-between items-center text-sm border-b pb-1 last:border-0">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-mono font-semibold">
                  {item.value !== null ? `${item.value} ${unitLabel}` : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Lengths */}
        <div className="space-y-3 rounded-lg border p-4 bg-card/50">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Ruler className="h-3.5 w-3.5 text-primary" />
            Lengths
          </h4>
          <div className="space-y-2">
            {lengths.map((item) => (
              <div key={item.label} className="flex justify-between items-center text-sm border-b pb-1 last:border-0">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-mono font-semibold">
                  {item.value !== null ? `${item.value} ${unitLabel}` : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notes */}
      {measurement.notes && (
        <div className="rounded-lg border p-4 bg-card/50 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <FileText className="h-3.5 w-3.5 text-primary" />
            <span>Notes</span>
          </div>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{measurement.notes}</p>
        </div>
      )}
    </div>
  );
}
