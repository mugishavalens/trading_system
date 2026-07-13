"use client";

import Link from "next/link";
import { Bot } from "lucide-react";

export default function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accent">
            <Bot size={18} />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            AI Trading Mentor
          </span>
        </Link>
        <nav className="hidden gap-8 text-sm text-muted md:flex">
          <Link href="/#features" className="hover:text-foreground">Features</Link>
          <Link href="/#how-it-works" className="hover:text-foreground">How it Works</Link>
          <Link href="/about" className="hover:text-foreground">About</Link>
          <Link href="/contact" className="hover:text-foreground">Contact</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-muted hover:text-foreground"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black hover:bg-accent-2 transition-colors"
          >
            Start Free Demo
          </Link>
        </div>
      </div>
    </header>
  );
}
