import { Trade } from "@/lib/api";

export default function TradeHistoryTable({ trades }: { trades: Trade[] }) {
  if (trades.length === 0) {
    return <p className="p-4 text-sm text-muted">No trades yet.</p>;
  }

  return (
    <div className="max-h-80 overflow-y-auto overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-surface">
          <tr className="text-left text-xs text-muted">
            <th className="px-4 py-2 font-medium">Time</th>
            <th className="px-4 py-2 font-medium">Asset</th>
            <th className="px-4 py-2 font-medium">Side</th>
            <th className="px-4 py-2 font-medium">Qty</th>
            <th className="px-4 py-2 font-medium">Price</th>
            <th className="px-4 py-2 font-medium">Realized P&amp;L</th>
            <th className="px-4 py-2 font-medium">Source</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t) => (
            <tr key={t.id} className="border-t border-border">
              <td className="px-4 py-3 text-muted">
                {new Date(t.executed_at).toLocaleTimeString()}
              </td>
              <td className="px-4 py-3 font-medium">{t.symbol}</td>
              <td
                className={`px-4 py-3 ${
                  t.side === "BUY" ? "text-success" : "text-danger"
                }`}
              >
                {t.side}
              </td>
              <td className="px-4 py-3">{t.quantity.toFixed(4)}</td>
              <td className="px-4 py-3">${t.price.toFixed(2)}</td>
              <td className="px-4 py-3">
                {t.realized_pnl != null ? (
                  <span className={t.realized_pnl >= 0 ? "text-success" : "text-danger"}>
                    {t.realized_pnl >= 0 ? "+" : ""}${t.realized_pnl.toFixed(2)}
                  </span>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-3 text-muted">
                {t.source === "ai_auto" ? "AI" : "Manual"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
