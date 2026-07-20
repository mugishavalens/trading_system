import { Position } from "@/lib/api";

export default function PositionsTable({ positions }: { positions: Position[] }) {
  if (positions.length === 0) {
    return (
      <p className="p-4 text-sm text-muted">
        No open positions yet — execute a trade to get started.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted">
            <th className="px-4 py-2 font-medium">Asset</th>
            <th className="px-4 py-2 font-medium">Qty</th>
            <th className="px-4 py-2 font-medium">Entry</th>
            <th className="px-4 py-2 font-medium">Current</th>
            <th className="px-4 py-2 font-medium">SL / TP</th>
            <th className="px-4 py-2 font-medium">P&amp;L</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => (
            <tr key={p.symbol} className="border-t border-border">
              <td className="px-4 py-3 font-medium">{p.symbol}</td>
              <td className="px-4 py-3">{p.quantity.toFixed(4)}</td>
              <td className="px-4 py-3">${p.avg_entry_price.toFixed(2)}</td>
              <td className="px-4 py-3">${p.current_price.toFixed(2)}</td>
              <td className="px-4 py-3 text-xs">
                <span className="text-danger">{p.stop_loss ? `SL ${p.stop_loss.toFixed(2)}` : "—"}</span>
                {" / "}
                <span className="text-success">{p.take_profit ? `TP ${p.take_profit.toFixed(2)}` : "—"}</span>
              </td>
              <td
                className={`px-4 py-3 ${
                  p.unrealized_pnl >= 0 ? "text-success" : "text-danger"
                }`}
              >
                {p.unrealized_pnl >= 0 ? "+" : ""}
                ${p.unrealized_pnl.toFixed(2)} ({p.unrealized_pnl_pct.toFixed(2)}%)
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
