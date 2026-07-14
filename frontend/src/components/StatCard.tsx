import clsx from "clsx";

const TONE_STYLES = {
  success: { value: "text-success", bar: "bg-success", glow: "shadow-success/20" },
  danger:  { value: "text-danger",  bar: "bg-danger",  glow: "shadow-danger/20" },
  accent:  { value: "text-accent",  bar: "bg-accent",  glow: "shadow-accent/20" },
  neutral: { value: "text-foreground", bar: "bg-muted", glow: "" },
};

export default function StatCard({
  label,
  value,
  tone,
  hint,
  icon,
}: {
  label: string;
  value: string;
  tone?: "success" | "danger" | "accent" | "neutral";
  hint?: string;
  icon?: React.ReactNode;
}) {
  const t = TONE_STYLES[tone ?? "neutral"];

  return (
    <div className={clsx(
      "glass rounded-2xl p-5 transition-all duration-200 hover:shadow-lg",
      tone && tone !== "neutral" && `hover:${t.glow}`
    )}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-muted uppercase tracking-wide">{label}</p>
        {icon && (
          <div className={clsx("flex h-8 w-8 items-center justify-center rounded-xl opacity-80",
            tone === "success" && "bg-success/15 text-success",
            tone === "danger"  && "bg-danger/15 text-danger",
            tone === "accent"  && "bg-accent/15 text-accent",
            (!tone || tone === "neutral") && "bg-surface-2 text-muted",
          )}>
            {icon}
          </div>
        )}
      </div>
      <p className={clsx("mt-2 text-2xl font-bold tracking-tight", t.value)}>{value}</p>
      {hint && (
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1 flex-1 rounded-full bg-surface-2">
            <div className={clsx("h-1 rounded-full transition-all", t.bar)} style={{ width: "60%" }} />
          </div>
          <p className="text-xs text-muted">{hint}</p>
        </div>
      )}
    </div>
  );
}
