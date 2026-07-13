import clsx from "clsx";

export default function StatCard({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string;
  tone?: "success" | "danger" | "accent" | "neutral";
  hint?: string;
}) {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-xs text-muted">{label}</p>
      <p
        className={clsx(
          "mt-1.5 text-xl font-semibold",
          tone === "success" && "text-success",
          tone === "danger" && "text-danger",
          tone === "accent" && "text-accent",
          (!tone || tone === "neutral") && "text-foreground"
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
