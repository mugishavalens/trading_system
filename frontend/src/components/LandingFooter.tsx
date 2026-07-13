import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer className="border-t border-border px-6 py-10 text-sm text-muted">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p>© {new Date().getFullYear()} AI Trading Mentor — Demo Project</p>
        <nav className="flex gap-6">
          <Link href="/about" className="hover:text-foreground">About Us</Link>
          <Link href="/contact" className="hover:text-foreground">Contact Us</Link>
        </nav>
        <p>
          Educational demo only. Not financial advice. No real funds are ever
          used.
        </p>
      </div>
    </footer>
  );
}
