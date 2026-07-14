"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, LogIn, UserPlus, Lock } from "lucide-react";
import Link from "next/link";

interface AuthGateProps {
  onClose: () => void;
  message?: string;
}

export default function AuthGate({
  onClose,
  message = "Sign in to access this feature.",
}: AuthGateProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      />

      {/* Card */}
      <motion.div
        key="card"
        initial={{ opacity: 0, scale: 0.92, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: -20 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-surface p-8 shadow-2xl"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-xl text-muted hover:text-foreground hover:bg-surface-2 transition-colors"
        >
          <X size={15} />
        </button>

        {/* Icon */}
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent mb-5">
          <Lock size={24} />
        </div>

        <h2 className="text-xl font-bold">Sign in required</h2>
        <p className="mt-2 text-sm text-muted">{message}</p>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/login"
            onClick={onClose}
            className="flex items-center justify-center gap-2 rounded-xl bg-accent py-3 font-semibold text-black hover:bg-accent-2 transition-colors"
          >
            <LogIn size={16} /> Sign In
          </Link>
          <Link
            href="/login?mode=register"
            onClick={onClose}
            className="flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-foreground hover:bg-surface-2 transition-colors"
          >
            <UserPlus size={16} /> Create Free Account
          </Link>
        </div>

        <p className="mt-4 text-center text-xs text-muted">
          $100,000 in virtual funds · No real money · Free forever
        </p>
      </motion.div>
    </AnimatePresence>
  );
}
