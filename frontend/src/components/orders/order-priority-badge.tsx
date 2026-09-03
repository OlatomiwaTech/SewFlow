import type { OrderPriority } from "@/types/order";

interface OrderPriorityBadgeProps {
  priority: OrderPriority;
}

export function OrderPriorityBadge({ priority }: Readonly<OrderPriorityBadgeProps>) {
  const styles: Record<OrderPriority, { label: string; bg: string }> = {
    LOW: { label: "Low Priority", bg: "bg-slate-100 text-slate-700 border-slate-200" },
    MEDIUM: { label: "Medium", bg: "bg-blue-50 text-blue-700 border-blue-200" },
    HIGH: { label: "High", bg: "bg-amber-100 text-amber-900 border-amber-300 font-bold" },
    URGENT: { label: "⚡ Urgent", bg: "bg-rose-100 text-rose-900 border-rose-300 font-bold animate-pulse" },
  };

  const current = styles[priority] || styles.MEDIUM;

  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded border ${current.bg}`}>
      {current.label}
    </span>
  );
}
