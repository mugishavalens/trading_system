export default function BreakdownBars({
  data,
}: {
  data: Record<string, number>;
}) {
  const entries = Object.entries(data);
  const total = entries.reduce((sum, [, v]) => sum + v, 0) || 1;

  if (entries.length === 0) {
    return <p className="text-sm text-muted">No data yet.</p>;
  }

  return (
    <div className="space-y-3">
      {entries.map(([label, value]) => (
        <div key={label}>
          <div className="flex justify-between text-xs text-muted">
            <span className="capitalize">{label}</span>
            <span>{value}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-surface-2">
            <div
              className="h-2 rounded-full bg-accent"
              style={{ width: `${(value / total) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
