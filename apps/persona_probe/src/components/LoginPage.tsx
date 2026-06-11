import React from 'react';
import { AuthForm } from './AuthForm';

interface LoginPageProps {
  onSuccess: () => void;
  onBack: () => void;
}

export function LoginPage({ onSuccess, onBack }: LoginPageProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0c1322] text-[#ccc3d8] font-body">
      <nav className="bg-[#0c1322]/60 backdrop-blur-xl border-b border-[#2e3545]/40">
        <div className="flex items-center justify-between w-full px-6 md:px-8 py-5 max-w-6xl mx-auto">
          <button
            onClick={onBack}
            className="text-sm text-[#958da1] hover:text-[#d2bbff] transition-colors inline-flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back
          </button>
          <span className="text-lg font-bold font-headline text-[#d2bbff]">Hire Lens</span>
          <div className="w-14" />
        </div>
      </nav>

      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#7c3aed]/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="bg-[#0c1322] border border-[#2e3545] rounded-2xl p-8 max-w-md w-full relative shadow-[0_0_50px_rgba(124,58,237,0.15)] z-10">
          <h2 className="text-3xl font-bold font-headline text-[#d2bbff] text-center mb-2">
            Welcome to Hire Lens
          </h2>
          <p className="text-xs text-[#958da1] text-center mb-6">
            Log in to analyze GitHub profiles and connect Telegram
          </p>
          <AuthForm onSuccess={onSuccess} />
        </div>
      </main>
    </div>
  );
}
