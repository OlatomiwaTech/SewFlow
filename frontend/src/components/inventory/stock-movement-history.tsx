import type { MovementType, StockMovement } from "@/types/inventory";
import { ArrowUpRight, ArrowDownRight, Layers, Calendar } from "lucide-react";

interface StockMovementHistoryProps {
  movements?: StockMovement[];
  unit?: string;
}

const TYPE_LABELS: Record<MovementType, { label: string; bg: string }> = {
  INITIAL_STOCK: { label: "Initial Stock", bg: "bg-purple-100 text-purple-800 border-purple-200" },
  PURCHASE: { label: "Purchase", bg: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  ADJUSTMENT: { label: "Adjustment", bg: "bg-blue-100 text-blue-800 border-blue-200" },
  USAGE: { label: "Usage", bg: "bg-amber-100 text-amber-800 border-amber-200" },
  RETURN: { label: "Return", bg: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  WASTE: { label: "Waste / Damage", bg: "bg-rose-100 text-rose-800 border-rose-200" },
};

export function StockMovementHistory({
  movements,
  unit = "",
}: Readonly<StockMovementHistoryProps>) {
  if (!movements || movements.length === 0) {
    return (
      <div className="rounded-lg border p-6 text-center bg-card/50">
        <Layers className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-xs text-muted-foreground font-medium">
          No stock movements recorded yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {movements.map((m) => {
        const change = Number(m.quantityChange);
        const isAddition = change > 0;
        const before = Number(m.quantityBefore);
        const after = Number(m.quantityAfter);
        const typeInfo = TYPE_LABELS[m.type] || TYPE_LABELS.ADJUSTMENT;

        const formattedDate = new Date(m.createdAt).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <div
            key={m.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg bg-card/60 gap-3"
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg border ${
                  isAddition
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                {isAddition ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono font-bold text-sm ${
                      isAddition ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {isAddition ? `+${change}` : change} {unit}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${typeInfo.bg}`}
                  >
                    {typeInfo.label}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="h-3 w-3" />
                    {formattedDate}
                  </span>
                </div>

                {m.notes && <p className="text-xs text-muted-foreground italic">{m.notes}</p>}
              </div>
            </div>

            <div className="text-right font-mono text-xs text-muted-foreground self-end sm:self-center">
              <span className="text-muted-foreground/70">{before}</span>
              <span className="mx-1.5">→</span>
              <span className="font-bold text-foreground">{after} {unit}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
