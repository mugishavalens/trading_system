"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

export default function LiveTicker<T>({
  items,
  keyFn,
  renderItem,
  emptyText = "Nothing yet.",
  maxItems = 8,
}: {
  items: T[];
  keyFn: (item: T) => string | number;
  renderItem: (item: T) => ReactNode;
  emptyText?: string;
  maxItems?: number;
}) {
  const visible = items.slice(0, maxItems);

  if (visible.length === 0) {
    return <p className="p-4 text-sm text-muted">{emptyText}</p>;
  }

  return (
    <div className="divide-y divide-border">
      <AnimatePresence initial={false}>
        {visible.map((item) => (
          <motion.div
            key={keyFn(item)}
            layout
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="px-4 py-3"
          >
            {renderItem(item)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
