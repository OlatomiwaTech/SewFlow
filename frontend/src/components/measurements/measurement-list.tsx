"use client";

import { useState } from "react";
import type { Measurement } from "@/types/measurement";
import { MeasurementDetail } from "./measurement-detail";
import { Plus, Ruler, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

interface MeasurementListProps {
  measurements: Measurement[];
  isLoading?: boolean;
  onAdd: () => void;
  onEdit: (measurement: Measurement) => void;
  onDelete: (measurementId: string) => Promise<void>;
}

export function MeasurementList({
  measurements,
  isLoading = false,
  onAdd,
  onEdit,
  onDelete,
}: Readonly<MeasurementListProps>) {
  const [expandedId, setExpandedId] = useState<string | null>(
    measurements.length > 0 ? measurements[0].id : null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this measurement record?")) {
      return;
    }
    try {
      setDeletingId(id);
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (measurements.length === 0) {
    return (
      <div className="rounded-xl border p-12 text-center bg-card">
        <Ruler className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-lg font-semibold">No measurements recorded</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
          Create the first measurement profile for this customer to start tracking tailoring records over time.
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add First Measurement
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Measurement History</h2>
          <p className="text-xs text-muted-foreground">
            {measurements.length} saved {measurements.length === 1 ? "session" : "sessions"}
          </p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Measurement
        </button>
      </div>

      <div className="space-y-4">
        {measurements.map((m, index) => {
          const isExpanded = expandedId === m.id;
          const isLatest = index === 0;

          return (
            <div
              key={m.id}
              className={`rounded-xl border bg-card transition-all ${
                isLatest ? "ring-1 ring-primary/30 shadow-sm" : ""
              }`}
            >
              {/* Session Accordion Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : m.id)}
              >
                <div className="flex items-center gap-3">
                  <Ruler className="h-5 w-5 text-primary" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{formatDate(m.createdAt)}</span>
                      {isLatest && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary text-primary-foreground">
                          Latest
                        </span>
                      )}
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                        {m.unit}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Chest: {m.chest !== null ? `${m.chest} ${m.unit.toLowerCase()}` : "—"} | Waist:{" "}
                      {m.waist !== null ? `${m.waist} ${m.unit.toLowerCase()}` : "—"} | Hip:{" "}
                      {m.hip !== null ? `${m.hip} ${m.unit.toLowerCase()}` : "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {deletingId === m.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Session Detail Content */}
              {isExpanded && (
                <div className="p-4 pt-0 border-t">
                  <div className="pt-4">
                    <MeasurementDetail
                      measurement={m}
                      onEdit={() => onEdit(m)}
                      onDelete={() => handleDelete(m.id)}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
