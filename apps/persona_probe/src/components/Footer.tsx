import React from 'react';

export function Footer() {
  return (
    <footer className="bg-[#070e1d] w-full py-12 mt-24">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#4a4455]/30 to-transparent mb-12" />
      <div className="flex flex-col md:flex-row justify-between items-center px-12 w-full max-w-[1440px] mx-auto gap-4">
        <div className="flex flex-col items-start gap-1">
          <span className="font-headline font-bold text-[#ccc3d8] text-sm">PersonaProbe Intelligence</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.05em] text-[#ccc3d8]/60">© 2026 PersonaProbe Intelligence</span>
        </div>
        <div className="flex gap-8 font-mono text-[10px] uppercase tracking-[0.05em] text-[#ccc3d8]/60">
          <span>API Documentation</span>
          <span>GitHub Source</span>
          <span>Terms of Service</span>
        </div>
      </div>
    </footer>
  );
}
