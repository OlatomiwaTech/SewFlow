import type { OrderStatus } from "@/types/order";

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export function OrderStatusBadge({ status }: Readonly<OrderStatusBadgeProps>) {
  const styles: Record<OrderStatus, { label: string; bg: string }> = {
    PENDING: { label: "Pending", bg: "bg-amber-100 text-amber-800 border-amber-200" },
    IN_PROGRESS: { label: "In Progress", bg: "bg-blue-100 text-blue-800 border-blue-200" },
    READY: { label: "Ready", bg: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    DELIVERED: { label: "Delivered", bg: "bg-slate-100 text-slate-800 border-slate-200" },
    CANCELLED: { label: "Cancelled", bg: "bg-red-100 text-red-800 border-red-200" },
  };

  const current = styles[status] || styles.PENDING;

  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${current.bg}`}>
      {current.label}
    </span>
  );
}
