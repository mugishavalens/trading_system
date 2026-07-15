"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { Bot, TrendingUp, Zap, Shield } from "lucide-react";

export default function AuthSplit({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — premium fintech visualization */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden lg:flex"
        style={{ background: "linear-gradient(135deg, #020617 0%, #0a0f1e 50%, #020617 100%)" }}
      >
        {/* Animated background canvas */}
        <MarketCanvas />

        {/* Overlay gradient */}
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 80% 60% at 20% 80%, rgba(245,158,11,0.08) 0%, transparent 60%)" }}
        />

        {/* Logo */}
        <div className="relative z-10 p-10">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-400 text-black shadow-lg shadow-amber-500/30">
              <Bot size={18} />
            </div>
            <span className="text-lg font-bold text-white">
              AI Trading <span className="text-amber-400">Mentor</span>
            </span>
          </Link>
        </div>

        {/* Center content */}
        <div className="relative z-10 px-10 pb-4">
          {/* Live signal card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="rounded-2xl border border-white/10 p-5 mb-4"
            style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">Live AI Signal</span>
              </div>
              <span className="rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-bold text-green-400">BUY</span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold text-white">ETH/USD</p>
                <p className="text-sm text-slate-400 mt-0.5">91% confidence · RSI recovering</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-amber-400">$3,241</p>
                <p className="text-xs text-green-400">+2.4% today</p>
              </div>
            </div>
            {/* Mini candlestick bars */}
            <div className="mt-4 flex items-end gap-1 h-10">
              {[40, 55, 45, 70, 60, 80, 65, 90, 75, 95, 85, 100].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: 0.05 * i + 0.5, duration: 0.4 }}
                  className="flex-1 rounded-sm"
                  style={{ background: h > 70 ? "rgba(245,158,11,0.8)" : "rgba(245,158,11,0.3)" }}
                />
              ))}
            </div>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="grid grid-cols-3 gap-3 mb-4"
          >
            {[
              { icon: TrendingUp, label: "Win Rate", value: "73%" },
              { icon: Zap, label: "AI Signals", value: "Live" },
              { icon: Shield, label: "Risk Guard", value: "Active" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label}
                className="rounded-xl border border-white/10 p-3 text-center"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <Icon size={14} className="mx-auto text-amber-400 mb-1" />
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-sm font-bold text-white">{value}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10 px-10 pb-8">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-xs text-slate-600"
          >
            Bloomberg Terminal meets modern AI · Demo platform · Virtual funds only
          </motion.p>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16 bg-background relative">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: "radial-gradient(ellipse 60% 50% at 80% 20%, rgba(245,158,11,0.05) 0%, transparent 60%)" }} />

        <div className="mx-auto w-full max-w-sm">
          {/* Mobile logo */}
          <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accent">
              <Bot size={16} />
            </div>
            <span className="font-bold">AI Trading <span className="text-accent">Mentor</span></span>
          </Link>

          {/* Card — flip card lives here, no overflow clipping */}
          <div className="rounded-3xl p-8"
            style={{
              background: "var(--surface)",
              boxShadow: "var(--neumorph-shadow)",
              border: "1px solid var(--glass-border)",
              overflow: "visible",
            }}>
            {title && <h1 className="text-2xl font-bold">{title}</h1>}
            {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
            <div className={title ? "mt-8" : ""}>{children}</div>
          </div>

          {/* Back to home */}
          <div className="mt-6 text-center">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarketCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Neural network nodes
    const nodes: { x: number; y: number; vx: number; vy: number; r: number }[] = Array.from({ length: 28 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 1,
    }));

    // Price line points
    let pricePoints: number[] = Array.from({ length: 80 }, (_, i) =>
      canvas.height * 0.55 + Math.sin(i * 0.15) * 40 + (Math.random() - 0.5) * 20
    );

    let frame = 0;
    let animId: number;

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connection lines between nearby nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(245,158,11,${0.06 * (1 - dist / 140)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(245,158,11,0.35)";
        ctx.fill();

        // Move
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });

      // Scroll price line
      pricePoints.shift();
      const last = pricePoints[pricePoints.length - 1];
      pricePoints.push(last + (Math.random() - 0.48) * 8);

      // Draw price line
      const stepX = canvas.width / (pricePoints.length - 1);
      ctx.beginPath();
      pricePoints.forEach((y, i) => {
        if (i === 0) ctx.moveTo(0, y);
        else ctx.lineTo(i * stepX, y);
      });
      ctx.strokeStyle = "rgba(245,158,11,0.5)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Glow dot at end of price line
      const lastY = pricePoints[pricePoints.length - 1];
      ctx.beginPath();
      ctx.arc(canvas.width, lastY, 4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(245,158,11,0.9)";
      ctx.fill();
      const grd = ctx.createRadialGradient(canvas.width, lastY, 0, canvas.width, lastY, 16);
      grd.addColorStop(0, "rgba(245,158,11,0.3)");
      grd.addColorStop(1, "rgba(245,158,11,0)");
      ctx.beginPath();
      ctx.arc(canvas.width, lastY, 16, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Horizontal grid lines
      for (let i = 1; i < 5; i++) {
        const y = (canvas.height / 5) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.strokeStyle = "rgba(255,255,255,0.03)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      frame++;
      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{ opacity: 0.9 }}
    />
  );
}
