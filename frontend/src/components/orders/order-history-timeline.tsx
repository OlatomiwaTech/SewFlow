import type { OrderHistory } from "@/types/order";
import { OrderStatusBadge } from "./order-status-badge";

interface OrderHistoryTimelineProps {
  history?: OrderHistory[];
}

export function OrderHistoryTimeline({ history }: Readonly<OrderHistoryTimelineProps>) {
  if (!history || history.length === 0) {
    return (
      <div className="text-sm text-slate-500 py-3 italic text-center">
        No status history recorded yet.
      </div>
    );
  }

  return (
    <div className="flow-root my-2">
      <ul className="-mb-8">
        {history.map((item, idx) => {
          const isLast = idx === history.length - 1;
          const formattedDate = new Date(item.createdAt).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <li key={item.id}>
              <div className="relative pb-8">
                {!isLast && (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex space-x-3 items-start">
                  <div>
                    <span className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center ring-8 ring-white text-slate-600 text-xs font-bold border border-slate-200">
                      {history.length - idx}
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.fromStatus && (
                          <>
                            <OrderStatusBadge status={item.fromStatus} />
                            <span className="text-slate-400 text-xs">→</span>
                          </>
                        )}
                        <OrderStatusBadge status={item.toStatus} />
                      </div>
                      {item.note && (
                        <p className="text-xs text-slate-600 mt-1 font-mono">
                          {item.note}
                        </p>
                      )}
                    </div>
                    <div className="whitespace-nowrap text-right text-xs text-slate-400">
                      <time dateTime={item.createdAt}>{formattedDate}</time>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
