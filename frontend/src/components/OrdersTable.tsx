import { X } from "lucide-react";
import { Order } from "@/lib/api";

export default function OrdersTable({
  orders,
  onCancel,
}: {
  orders: Order[];
  onCancel: (id: number) => void;
}) {
  if (orders.length === 0) {
    return (
      <p className="p-4 text-sm text-muted">
        No open limit/stop orders — they sit here until price reaches your trigger.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted">
            <th className="px-4 py-2 font-medium">Asset</th>
            <th className="px-4 py-2 font-medium">Type</th>
            <th className="px-4 py-2 font-medium">Side</th>
            <th className="px-4 py-2 font-medium">Qty</th>
            <th className="px-4 py-2 font-medium">Trigger</th>
            <th className="px-4 py-2 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-t border-border">
              <td className="px-4 py-2 font-medium">{o.symbol}</td>
              <td className="px-4 py-2 capitalize text-muted">{o.order_type}</td>
              <td className={`px-4 py-2 font-medium ${o.side === "BUY" ? "text-success" : "text-danger"}`}>
                {o.side}
              </td>
              <td className="px-4 py-2 tabular-nums">{o.quantity.toFixed(4)}</td>
              <td className="px-4 py-2 tabular-nums">{o.trigger_price.toFixed(4)}</td>
              <td className="px-4 py-2 text-right">
                <button
                  onClick={() => onCancel(o.id)}
                  title="Cancel order"
                  className="rounded p-1 text-muted hover:bg-danger/10 hover:text-danger transition-colors"
                >
                  <X size={13} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
