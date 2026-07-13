"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { ShieldCheck, Trash2, UserX, UserCheck } from "lucide-react";
import { api, AdminUser } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function AdminUsersPage() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!token) return;
    setUsers(await api.adminUsers(token));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function withBusy(id: number, fn: () => Promise<void>) {
    setError(null);
    setBusyId(id);
    try {
      await fn();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div>
        <h1 className="text-xl font-semibold">Users</h1>
        <p className="mt-1 text-sm text-muted">
          Manage accounts, classify by their onboarding choices, promote admins, or suspend access.
        </p>
      </div>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      <div className="glass mt-4 overflow-x-auto rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="px-5 py-3 font-medium">User</th>
              <th className="px-5 py-3 font-medium">Experience</th>
              <th className="px-5 py-3 font-medium">Risk Profile</th>
              <th className="px-5 py-3 font-medium">Equity</th>
              <th className="px-5 py-3 font-medium">Trades</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === currentUser?.id;
              const busy = busyId === u.id;
              return (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-5 py-3">
                    <p className="font-medium">
                      {u.full_name}{" "}
                      {u.role === "admin" && (
                        <ShieldCheck size={14} className="inline text-accent" />
                      )}
                    </p>
                    <p className="text-xs text-muted">{u.email}</p>
                  </td>
                  <td className="px-5 py-3 capitalize">{u.experience_level}</td>
                  <td className="px-5 py-3 capitalize">{u.risk_profile}</td>
                  <td className="px-5 py-3">${u.equity.toLocaleString()}</td>
                  <td className="px-5 py-3">{u.trade_count}</td>
                  <td className="px-5 py-3">
                    <span
                      className={clsx(
                        "rounded-full px-2.5 py-1 text-xs font-medium",
                        u.is_active
                          ? "bg-success/15 text-success"
                          : "bg-danger/15 text-danger"
                      )}
                    >
                      {u.is_active ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <button
                        title={u.is_active ? "Suspend" : "Reactivate"}
                        disabled={isSelf || busy}
                        onClick={() =>
                          withBusy(u.id, async () => {
                            await api.adminSuspendUser(token!, u.id);
                          })
                        }
                        className="rounded-lg border border-border p-2 hover:bg-surface disabled:opacity-30 transition-colors"
                      >
                        {u.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                      </button>
                      <button
                        title="Promote to admin"
                        disabled={u.role === "admin" || busy}
                        onClick={() =>
                          withBusy(u.id, async () => {
                            await api.adminPromoteUser(token!, u.id);
                          })
                        }
                        className="rounded-lg border border-border p-2 hover:bg-surface disabled:opacity-30 transition-colors"
                      >
                        <ShieldCheck size={14} />
                      </button>
                      <button
                        title="Delete account"
                        disabled={isSelf || busy}
                        onClick={() => {
                          if (confirm(`Delete ${u.email}? This cannot be undone.`)) {
                            withBusy(u.id, async () => {
                              await api.adminDeleteUser(token!, u.id);
                            });
                          }
                        }}
                        className="rounded-lg border border-danger/30 p-2 text-danger hover:bg-danger/10 disabled:opacity-30 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
