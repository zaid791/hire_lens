import React from 'react';

export const Navbar = () => {
  return (
    <nav className="bg-[#0c1322]/60 backdrop-blur-xl sticky top-0 z-50 shadow-[0_40px_40px_0_rgba(124,58,237,0.08)]">
      <div className="flex items-center w-full px-8 py-5 max-w-[1440px] mx-auto">
        <span className="text-2xl font-bold tracking-[-0.02em] text-[#d2bbff] drop-shadow-[0_0_15px_rgba(210,187,255,0.3)] font-headline">
          PersonaProbe
        </span>
      </div>
    </nav>
  );
};
