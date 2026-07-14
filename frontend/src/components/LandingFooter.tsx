import Link from "next/link";
import { Bot, Code2, Share2 } from "lucide-react";

const LINKS = {
  Platform: [
    { label: "Home", href: "/" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Markets", href: "/dashboard/markets" },
    { label: "Portfolio", href: "/dashboard/portfolio" },
  ],
  Learn: [
    { label: "All Courses", href: "/learn" },
    { label: "Fundamentals", href: "/learn" },
    { label: "Indicators", href: "/learn" },
    { label: "Strategies", href: "/learn" },
  ],
  Company: [
    { label: "About Us", href: "/about" },
    { label: "News", href: "/news" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Contact Us", href: "/contact" },
  ],
};

export default function LandingFooter() {
  return (
    <footer className="border-t border-white/10 px-6 pt-16 pb-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 mb-12">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-amber-400 text-black">
                <Bot size={18} />
              </div>
              <span className="font-bold">AI Trading <span className="text-accent">Mentor</span></span>
            </Link>
            <p className="mt-4 text-sm text-muted leading-relaxed">
              An AI-powered demo trading platform for learning, analyzing, and
              practicing — with virtual funds only.
            </p>
            <div className="mt-4 flex gap-3">
              <a href="#" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-muted hover:text-foreground hover:border-white/20 transition-colors">
                <Code2 size={14} />
              </a>
              <a href="#" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-muted hover:text-foreground hover:border-white/20 transition-colors">
                <Share2 size={14} />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([group, links]) => (
            <div key={group}>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-4">{group}</p>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-muted hover:text-foreground transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-muted">© {new Date().getFullYear()} AI Trading Mentor — Demo Project</p>
          <p className="text-xs text-muted text-center">
            Educational demo only · Not financial advice · No real funds used
          </p>
        </div>
      </div>
    </footer>
  );
}
