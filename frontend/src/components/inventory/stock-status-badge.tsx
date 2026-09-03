import type { StockStatus } from "@/types/inventory";

interface StockStatusBadgeProps {
  status: StockStatus;
}

export function StockStatusBadge({ status }: Readonly<StockStatusBadgeProps>) {
  const styles: Record<StockStatus, { label: string; bg: string }> = {
    IN_STOCK: {
      label: "In Stock",
      bg: "bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold",
    },
    LOW_STOCK: {
      label: "Low Stock",
      bg: "bg-amber-100 text-amber-900 border-amber-300 font-bold animate-pulse",
    },
    OUT_OF_STOCK: {
      label: "Out of Stock",
      bg: "bg-rose-100 text-rose-900 border-rose-300 font-bold",
    },
  };

  const current = styles[status] || styles.IN_STOCK;

  return (
    <span
      className={`inline-flex items-center text-xs px-2.5 py-0.5 rounded-full border ${current.bg}`}
    >
      {current.label}
    </span>
  );
}
