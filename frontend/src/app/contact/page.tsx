"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import LandingNav from "@/components/LandingNav";
import LandingFooter from "@/components/LandingFooter";
import { api, ApiError } from "@/lib/api";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.submitContact({ name, email, message });
      setSent(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex-1">
      <LandingNav />

      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-4xl gap-10 lg:grid-cols-2">
          <div>
            <span className="inline-block rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-medium text-accent">
              Get in touch
            </span>
            <h1 className="mt-6 text-3xl font-bold tracking-tight">
              Questions, feedback, or ideas?
            </h1>
            <p className="mt-4 text-muted">
              This is a demo project, but messages sent here go straight to
              the platform&apos;s admin panel — a real person will read it.
            </p>
            <div className="mt-8 flex items-center gap-3 text-sm text-muted">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <Mail size={16} />
              </div>
              Response times vary — this is a demo, not a staffed support line.
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            {sent ? (
              <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 size={32} className="text-success" />
                <p className="mt-4 font-semibold">Message sent</p>
                <p className="mt-1 text-sm text-muted">
                  Thanks for reaching out — we&apos;ll take a look.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-6 text-sm text-accent hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm text-muted">Name</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-4 py-2.5 outline-none focus:border-accent"
                    placeholder="Jane Trader"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-4 py-2.5 outline-none focus:border-accent"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted">Message</label>
                  <textarea
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="mt-1 w-full resize-none rounded-lg border border-border bg-surface px-4 py-2.5 outline-none focus:border-accent"
                    placeholder="What's on your mind?"
                  />
                </div>
                {error && <p className="text-sm text-danger">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 font-medium text-black hover:bg-accent-2 disabled:opacity-60 transition-colors"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  Send message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
