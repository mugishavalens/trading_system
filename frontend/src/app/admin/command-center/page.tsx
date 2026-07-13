"use client";

import { useState } from "react";
import { Loader2, Send, Terminal } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const SUGGESTIONS = [
  "How is AI performance trending across symbols right now?",
  "Summarize today's trading activity in a sentence.",
  "Which users are most active, based on recent trades?",
  "Is the platform leaning more manual or AI-executed trades?",
];

interface Exchange {
  question: string;
  answer: string;
  generatedBy: string;
}

export default function CommandCenterPage() {
  const { token } = useAuth();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Exchange[]>([]);

  async function ask(q: string) {
    if (!token || !q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.adminAiQuery(token, q);
      setHistory((h) => [{ question: q, answer: res.answer, generatedBy: res.generated_by }, ...h]);
      setQuestion("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reach the AI Command Center");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <Terminal size={20} className="text-accent" /> AI Command Center
        </h1>
        <p className="mt-1 text-sm text-muted">
          Ask questions about platform stats, AI performance, and recent activity — answered
          from the same data as the rest of this dashboard, not invented.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
        className="glass flex items-center gap-3 rounded-2xl p-3"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about users, trades, or AI performance..."
          className="flex-1 bg-transparent px-2 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 font-medium text-black hover:bg-accent-2 disabled:opacity-60 transition-colors"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Ask
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => ask(s)}
            disabled={loading}
            className="rounded-full border border-border px-3 py-1.5 text-xs text-muted hover:bg-surface hover:text-foreground disabled:opacity-50 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="space-y-4">
        {history.map((h, i) => (
          <div key={i} className="glass rounded-2xl p-5">
            <p className="text-sm font-medium">{h.question}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{h.answer}</p>
            <p className="mt-2 text-xs text-muted">
              {h.generatedBy === "claude" ? "Answered by Claude" : "AI model unavailable"}
            </p>
          </div>
        ))}
        {history.length === 0 && (
          <p className="text-sm text-muted">Ask a question above to get started.</p>
        )}
      </div>
    </div>
  );
}
