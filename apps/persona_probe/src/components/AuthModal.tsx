import React, { useState } from 'react';
import { AuthForm } from './AuthForm';

interface AuthModalProps {
  onClose: () => void;
}

export function AuthModal({ onClose }: AuthModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[99999] px-4">
      <div className="bg-[#0c1322] border border-[#2e3545] rounded-2xl p-8 max-w-md w-full relative shadow-[0_0_50px_rgba(124,58,237,0.15)]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#958da1] hover:text-white"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <h2 className="text-3xl font-bold font-headline text-[#d2bbff] text-center mb-2">
          Welcome Back
        </h2>
        <p className="text-xs text-[#958da1] text-center mb-6">
          Log in to continue using Hire Lens
        </p>

        <AuthForm onSuccess={onClose} />
      </div>
    </div>
  );
}
