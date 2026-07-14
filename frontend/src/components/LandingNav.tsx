"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Bot, Menu, X, Sun, Moon, User, Settings, LayoutDashboard, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Learn", href: "/learn" },
  { label: "News", href: "/news" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Contact Us", href: "/contact" },
];

export default function LandingNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleLogout() {
    logout();
    setProfileOpen(false);
    router.push("/");
  }

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-border/60 bg-background/80 backdrop-blur-xl shadow-lg shadow-black/5"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo — always goes home */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-2 text-black shadow-lg shadow-accent/30 group-hover:shadow-accent/50 transition-shadow">
            <Bot size={18} />
          </div>
          <span className="text-lg font-bold tracking-tight">
            AI Trading <span className="text-accent">Mentor</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(({ label, href }) => {
            const active = pathname === href;
            return (
              <Link
                key={label}
                href={href}
                className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  active ? "text-accent" : "text-muted hover:text-foreground hover:bg-surface/60"
                }`}
              >
                {label}
                {active && (
                  <span className="absolute bottom-0 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-accent" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="hidden items-center gap-2 md:flex">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            suppressHydrationWarning
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted hover:text-foreground hover:bg-surface transition-colors"
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {user ? (
            /* Profile dropdown */
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium hover:bg-surface-2 transition-colors"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/20 text-accent text-xs font-bold">
                  {user.full_name?.[0]?.toUpperCase() ?? "U"}
                </div>
                <span className="max-w-[100px] truncate">{user.full_name?.split(" ")[0]}</span>
                <ChevronDown size={13} className={`text-muted transition-transform ${profileOpen ? "rotate-180" : ""}`} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-surface shadow-xl shadow-black/20 overflow-hidden z-50">
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold truncate">{user.full_name}</p>
                    <p className="text-xs text-muted truncate">{user.email}</p>
                    <span className="mt-1.5 inline-block rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent capitalize">
                      {user.role}
                    </span>
                  </div>

                  {/* Links */}
                  <div className="p-1.5">
                    <Link
                      href={user.role === "admin" ? "/admin" : "/dashboard"}
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-muted hover:text-foreground hover:bg-surface-2 transition-colors"
                    >
                      <LayoutDashboard size={15} /> Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-muted hover:text-foreground hover:bg-surface-2 transition-colors"
                    >
                      <User size={15} /> My Profile
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-muted hover:text-foreground hover:bg-surface-2 transition-colors"
                    >
                      <Settings size={15} /> Settings
                    </Link>
                  </div>

                  <div className="border-t border-border p-1.5">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-danger hover:bg-danger/10 transition-colors"
                    >
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl px-4 py-2 text-sm font-medium text-muted hover:text-foreground hover:bg-surface/60 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-gradient-to-r from-accent to-amber-400 px-5 py-2 text-sm font-semibold text-black shadow-lg shadow-accent/30 hover:shadow-accent/50 transition-shadow"
              >
                Create Account
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={toggleTheme}
            suppressHydrationWarning
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted"
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button
            className="rounded-lg border border-border p-2 text-muted"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border/60 bg-background/95 backdrop-blur-xl px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted hover:text-foreground hover:bg-surface/60 transition-colors"
              >
                {label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-2 py-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-accent text-sm font-bold">
                      {user.full_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.full_name}</p>
                      <p className="text-xs text-muted">{user.email}</p>
                    </div>
                  </div>
                  <Link href={user.role === "admin" ? "/admin" : "/dashboard"} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl bg-accent/10 px-4 py-2.5 text-sm font-medium text-accent">
                    <LayoutDashboard size={15} /> Dashboard
                  </Link>
                  <Link href="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium">
                    <User size={15} /> My Profile
                  </Link>
                  <button onClick={handleLogout} className="flex items-center gap-2 rounded-xl border border-danger/30 px-4 py-2.5 text-sm font-medium text-danger">
                    <LogOut size={15} /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)} className="rounded-xl border border-border px-4 py-2.5 text-center text-sm font-medium">
                    Sign In
                  </Link>
                  <Link href="/register" onClick={() => setOpen(false)} className="rounded-xl bg-gradient-to-r from-accent to-amber-400 px-4 py-2.5 text-center text-sm font-semibold text-black">
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
