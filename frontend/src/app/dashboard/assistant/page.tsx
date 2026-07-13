"use client";

import { useRef, useState } from "react";
import { Bot, Loader2, Send, User as UserIcon } from "lucide-react";
import { api, ChatMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const SUGGESTIONS = [
  "What is RSI?",
  "Explain risk management basics",
  "What's the difference between a stop-loss and a take-profit?",
  "What are candlesticks?",
];

export default function AssistantPage() {
  const { token } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your AI trading tutor. Ask me about indicators, strategies, or risk management — I'll keep things educational, not personalized financial advice.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    if (!token || !text.trim() || sending) return;
    const userMessage: ChatMessage = { role: "user", content: text.trim() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setSending(true);
    try {
      const res = await api.chat(token, userMessage.content, messages);
      setMessages([...nextMessages, { role: "assistant", content: res.reply }]);
    } catch {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: "Something went wrong reaching the assistant. Please try again.",
        },
      ]);
    } finally {
      setSending(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <div>
        <h1 className="text-xl font-semibold">AI Assistant</h1>
        <p className="mt-1 text-sm text-muted">
          Your trading tutor — educational only, never personalized financial advice.
        </p>
      </div>

      <div className="glass mt-4 flex-1 space-y-4 overflow-y-auto rounded-2xl p-5">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                m.role === "user" ? "bg-surface-2" : "bg-accent/20 text-accent"
              }`}
            >
              {m.role === "user" ? <UserIcon size={16} /> : <Bot size={16} />}
            </div>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user"
                  ? "bg-accent text-black"
                  : "bg-background/60 border border-border"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Loader2 size={14} className="animate-spin" /> Thinking...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            className="rounded-full border border-border px-3 py-1.5 text-xs text-muted hover:border-accent hover:text-accent transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-3 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about RSI, risk management, strategies..."
          className="flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 font-medium text-black hover:bg-accent-2 disabled:opacity-50 transition-colors"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
