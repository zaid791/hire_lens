import React, { useCallback, useEffect, useState } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { AdminUserRow, fetchAllUsers } from '../services/adminService';

interface AdminPageProps {
  onBack: () => void;
}

export function AdminPage({ onBack }: AdminPageProps) {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await fetchAllUsers());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const linkedCount = users.filter((user) => user.telegramLinked).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#0c1322] text-[#ccc3d8] font-body">
      <Navbar />

      <main className="flex-grow px-6 py-10 max-w-6xl mx-auto w-full">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <button
              onClick={onBack}
              className="text-sm text-[#958da1] hover:text-[#d2bbff] transition-colors inline-flex items-center gap-1 mb-3"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Back to dashboard
            </button>
            <h1 className="font-headline text-3xl md:text-4xl font-bold text-[#d2bbff]">
              Admin Panel
            </h1>
            <p className="text-sm text-[#958da1] mt-1">
              Website users, subscription tiers, daily quota, and Telegram status
            </p>
          </div>

          <button
            onClick={loadUsers}
            disabled={loading}
            className="self-start md:self-auto inline-flex items-center gap-2 bg-[#141b2b] border border-[#2e3545] text-[#dce2f7] px-4 py-2 rounded-lg text-sm hover:border-[#7c3aed]/50 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl border border-[#2e3545] bg-[#141b2b] p-4">
            <p className="text-xs font-mono uppercase text-[#958da1]">Total users</p>
            <p className="text-2xl font-headline font-bold text-[#dce2f7] mt-1">
              {loading ? '—' : users.length}
            </p>
          </div>
          <div className="rounded-xl border border-[#2e3545] bg-[#141b2b] p-4">
            <p className="text-xs font-mono uppercase text-[#958da1]">Telegram linked</p>
            <p className="text-2xl font-headline font-bold text-green-400/90 mt-1">
              {loading ? '—' : linkedCount}
            </p>
          </div>
          <div className="rounded-xl border border-[#2e3545] bg-[#141b2b] p-4">
            <p className="text-xs font-mono uppercase text-[#958da1]">Premium accounts</p>
            <p className="text-2xl font-headline font-bold text-[#d2bbff] mt-1">
              {loading ? '—' : users.filter((user) => user.subscriptionTier === 'premium').length}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-[#ffb4ab] bg-[#410002]/40 text-[#ffdad6] px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-[#2e3545] bg-[#070e1d]/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[#2e3545] text-left text-xs font-mono uppercase tracking-wide text-[#958da1]">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Used today</th>
                  <th className="px-4 py-3">Remaining</th>
                  <th className="px-4 py-3">Telegram</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-[#958da1] animate-pulse">
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-[#958da1]">
                      No website users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-[#2e3545]/60 last:border-b-0 hover:bg-[#141b2b]/60"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#dce2f7]">
                          {user.email ?? 'No email on file'}
                        </div>
                        <div className="text-xs text-[#958da1] font-mono mt-0.5">
                          {user.id.slice(0, 12)}…
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex uppercase text-[10px] font-bold tracking-wide px-2 py-0.5 rounded border border-[#7c3aed]/50 bg-[#7c3aed]/20 text-[#d2bbff]">
                          {user.subscriptionTier}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[#ccc3d8]">
                        {user.requestsToday} / {user.limit}
                      </td>
                      <td className="px-4 py-3 font-mono text-[#dce2f7]">
                        {user.remaining}
                      </td>
                      <td className="px-4 py-3">
                        {user.telegramLinked ? (
                          <span className="inline-flex items-center gap-1 text-green-400/90">
                            <span className="material-symbols-outlined text-base">check_circle</span>
                            {user.telegramUsername ? `@${user.telegramUsername}` : 'Linked'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[#958da1]">
                            <span className="material-symbols-outlined text-base">link_off</span>
                            Not linked
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
