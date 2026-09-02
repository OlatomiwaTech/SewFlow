import type { PaymentStatus } from "@/types/payment";

interface PaymentStatusBadgeProps {
  status?: PaymentStatus;
}

export function PaymentStatusBadge({ status = "UNPAID" }: Readonly<PaymentStatusBadgeProps>) {
  const styles: Record<PaymentStatus, { label: string; bg: string }> = {
    UNPAID: { label: "Unpaid", bg: "bg-red-100 text-red-800 border-red-200" },
    PARTIALLY_PAID: { label: "Partially Paid", bg: "bg-amber-100 text-amber-800 border-amber-200" },
    PAID: { label: "Paid", bg: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  };

  const current = styles[status] || styles.UNPAID;

  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${current.bg}`}>
      {current.label}
    </span>
  );
}
