"use client";

import { motion } from "framer-motion";

const SEGMENTS = ["Conservative", "Moderate", "Aggressive"];

export default function Gauge({
  profile,
}: {
  profile: "conservative" | "moderate" | "aggressive";
}) {
  const index = SEGMENTS.findIndex(
    (s) => s.toLowerCase() === profile
  );
  const pct = ((index + 1) / SEGMENTS.length) * 100;

  return (
    <div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-surface-2">
        <motion.div
          className="h-full rounded-full bg-accent"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted">
        {SEGMENTS.map((s) => (
          <span
            key={s}
            className={s.toLowerCase() === profile ? "font-medium text-accent" : ""}
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
