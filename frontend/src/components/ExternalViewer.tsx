"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Maximize2, Minimize2, ExternalLink, AlertTriangle } from "lucide-react";

interface ExternalViewerProps {
  url: string;
  title: string;
  onClose: () => void;
}

export default function ExternalViewer({ url, title, onClose }: ExternalViewerProps) {
  const [expanded, setExpanded] = useState(false);
  const [iframeBlocked, setIframeBlocked] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Some sites (Google News included) block iframes via X-Frame-Options.
  // We detect this by listening for an error on the iframe load.
  // If blocked, we show a fallback with an open-in-tab option.
  function handleIframeLoad(e: React.SyntheticEvent<HTMLIFrameElement>) {
    try {
      // If the iframe content is blocked, contentDocument will be null or throw
      const doc = (e.target as HTMLIFrameElement).contentDocument;
      if (!doc) setIframeBlocked(true);
    } catch {
      setIframeBlocked(true);
    }
  }

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
      />

      {/* Viewer panel */}
      <motion.div
        key="panel"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 340, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className={`fixed z-50 flex flex-col rounded-2xl border border-border bg-surface shadow-2xl transition-all duration-300 ${
          expanded
            ? "inset-4"
            : "inset-x-4 top-16 bottom-16 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[780px]"
        }`}
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-danger/70" />
              <div className="h-3 w-3 rounded-full bg-accent/70" />
              <div className="h-3 w-3 rounded-full bg-success/70" />
            </div>
            <p className="ml-2 text-sm font-medium text-foreground truncate">{title}</p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Open in real tab */}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in new tab"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-surface-2 transition-colors"
            >
              <ExternalLink size={14} />
            </a>
            {/* Expand / shrink */}
            <button
              onClick={() => setExpanded((v) => !v)}
              title={expanded ? "Shrink" : "Expand"}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-surface-2 transition-colors"
            >
              {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            {/* Close */}
            <button
              onClick={onClose}
              title="Close"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 relative overflow-hidden rounded-b-2xl">
          {iframeBlocked ? (
            /* Fallback when site blocks iframe embedding */
            <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                <AlertTriangle size={24} />
              </div>
              <div>
                <p className="font-semibold">This site can&apos;t be embedded</p>
                <p className="mt-1 text-sm text-muted max-w-sm">
                  {title} prevents embedding for security reasons. Open it in a new tab instead.
                </p>
              </div>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-black hover:bg-accent-2 transition-colors"
              >
                <ExternalLink size={14} /> Open in new tab
              </a>
            </div>
          ) : (
            <iframe
              src={url}
              title={title}
              className="h-full w-full border-0"
              onLoad={handleIframeLoad}
              onError={() => setIframeBlocked(true)}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
