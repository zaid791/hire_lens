import React, { useState } from 'react';
import { createTelegramConnectUrl } from '../services/telegramLinkService';

interface TelegramConnectProps {
  linked: boolean;
  onRefresh?: () => void;
}

export function TelegramConnect({ linked, onRefresh }: TelegramConnectProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = await createTelegramConnectUrl();
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start Telegram linking.');
    } finally {
      setLoading(false);
    }
  };

  if (linked) {
    return (
      <div className="mb-8 flex items-center justify-center gap-2 text-sm text-green-400/90 font-mono">
        <span className="material-symbols-outlined text-base">check_circle</span>
        Telegram connected to your account
      </div>
    );
  }

  return (
    <div className="mb-8 max-w-xl mx-auto rounded-xl border border-[#7c3aed]/40 bg-[#141b2b]/80 p-4 text-left">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-[#d2bbff] mt-0.5">send</span>
        <div className="flex-1">
          <h3 className="font-headline font-bold text-sm text-[#dce2f7] mb-1">
            Connect Telegram
          </h3>
          <p className="text-xs text-[#958da1] leading-relaxed mb-3">
            Link your Telegram account to use the Hire Lens bot with the same login and quota as
            this website.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleConnect}
              disabled={loading}
              className="gradient-primary text-[#3f008e] font-headline font-bold px-4 py-2 rounded-lg text-xs hover:brightness-110 disabled:opacity-50"
            >
              {loading ? 'Opening Telegram…' : 'Connect Telegram'}
            </button>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="text-xs text-[#958da1] hover:text-[#d2bbff] px-3 py-2"
              >
                I&apos;ve connected — refresh
              </button>
            )}
          </div>
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}
