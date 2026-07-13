"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { Trash2, Mail, MailOpen } from "lucide-react";
import { api, ContactMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function AdminMessagesPage() {
  const { token } = useAuth();
  const [messages, setMessages] = useState<ContactMessage[]>([]);

  async function load() {
    if (!token) return;
    setMessages(await api.adminMessages(token));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function markRead(id: number) {
    if (!token) return;
    await api.adminMarkMessageRead(token, id);
    load();
  }

  async function remove(id: number) {
    if (!token) return;
    await api.adminDeleteMessage(token, id);
    load();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold">Messages</h1>
        <p className="mt-1 text-sm text-muted">
          Submissions from the public Contact Us page.
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={clsx(
              "glass rounded-2xl p-5",
              !m.is_read && "border-2 border-accent/30"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{m.name}</p>
                <p className="text-xs text-muted">{m.email}</p>
              </div>
              <div className="flex gap-2">
                {!m.is_read && (
                  <button
                    title="Mark as read"
                    onClick={() => markRead(m.id)}
                    className="rounded-lg border border-border p-2 hover:bg-surface transition-colors"
                  >
                    <MailOpen size={14} />
                  </button>
                )}
                <button
                  title="Delete"
                  onClick={() => remove(m.id)}
                  className="rounded-lg border border-danger/30 p-2 text-danger hover:bg-danger/10 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <p className="mt-3 text-sm text-foreground/90">{m.message}</p>
            <p className="mt-3 text-xs text-muted">
              {new Date(m.created_at).toLocaleString()}
            </p>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="glass flex items-center gap-3 rounded-2xl p-6 text-sm text-muted">
            <Mail size={18} /> No messages yet.
          </div>
        )}
      </div>
    </div>
  );
}
