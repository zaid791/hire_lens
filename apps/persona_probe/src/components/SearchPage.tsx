import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface SearchPageProps {
  onSearch: (username: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function SearchPage({ onSearch, isLoading, disabled }: SearchPageProps) {
  const [username, setUsername] = useState("");

  const handleSubmit = () => {
    if (username.trim()) {
      onSearch(username.trim());
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0c1322] text-[#ccc3d8] font-body">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center px-6 relative overflow-hidden">
        
        {/* Ambient glow background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-container/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-3xl w-full text-center z-10">

          {/* Hero title */}
          <div className="mb-12">
            <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-[-0.02em] text-[#d2bbff] mb-4 glow-text">
              PersonaProbe 🕵️
            </h1>
            <p className="font-body text-lg md:text-xl text-[#ccc3d8] font-light tracking-wide">
              AI-powered GitHub Developer Intelligence
            </p>
          </div>

          {/* Search input cluster */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#7c3aed] to-[#d2bbff] rounded-xl blur opacity-20 group-focus-within:opacity-40 transition duration-500" />
            <div className="relative flex items-center bg-[#070e1d] rounded-xl p-2 shadow-2xl transition-colors duration-300 group-focus-within:bg-[#2e3545]">
              <div className="pl-4 pr-2 text-[#958da1]">
                <span className="material-symbols-outlined">search</span>
              </div>
              <input
                className="w-full bg-transparent border-none text-[#dce2f7] placeholder:text-[#958da1] focus:ring-0 font-body text-lg py-4"
                placeholder="Enter GitHub username..."
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSubmit()}
                disabled={isLoading || disabled}
              />
              <button
                className="gradient-primary text-[#3f008e] font-headline font-bold px-8 py-4 rounded-xl flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg disabled:opacity-50"
                onClick={handleSubmit}
                disabled={isLoading || disabled}
              >
                {isLoading ? "Analyzing..." : "Analyze"}
                {!isLoading && <span className="material-symbols-outlined text-sm">arrow_forward</span>}
              </button>
            </div>
          </div>

          {/* Suggestion buttons */}
          <div className="mt-6 flex justify-center items-center gap-3">
            <span className="font-mono text-xs tracking-[0.05em] uppercase text-[#958da1]">Try:</span>
            <div className="flex gap-4">
              {["ontaptom", "zaid791", "Sadiqueejaz316", "torvalds"].map((name) => (
                <button
                  key={name}
                  className="font-mono text-xs tracking-[0.05em] uppercase text-[#ccc3d8] hover:text-[#d2bbff] border-b border-transparent hover:border-[#d2bbff] transition-all duration-200 pb-0.5"
                  onClick={() => { setUsername(name); onSearch(name); }}
                  disabled={isLoading || disabled}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Feature preview cards */}
          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 text-left opacity-60">
            <div className="p-6 rounded-xl bg-[#141b2b]">
              <span className="material-symbols-outlined text-[#d2bbff] mb-3">psychology</span>
              <h3 className="font-headline font-bold text-sm text-[#dce2f7] tracking-[-0.02em] mb-1">Psychographic Profiling</h3>
              <p className="text-xs text-[#ccc3d8] leading-relaxed">Understanding coding patterns and architectural preferences.</p>
            </div>
            <div className="p-6 rounded-xl bg-[#141b2b] md:mt-4">
              <span className="material-symbols-outlined text-[#d2bbff] mb-3">timeline</span>
              <h3 className="font-headline font-bold text-sm text-[#dce2f7] tracking-[-0.02em] mb-1">Velocity Tracking</h3>
              <p className="text-xs text-[#ccc3d8] leading-relaxed">Deep analysis of contribution cycles and maintainer impact.</p>
            </div>
            <div className="p-6 rounded-xl bg-[#141b2b] md:mt-8">
              <span className="material-symbols-outlined text-[#d2bbff] mb-3">hub</span>
              <h3 className="font-headline font-bold text-sm text-[#dce2f7] tracking-[-0.02em] mb-1">Ecosystem Graph</h3>
              <p className="text-xs text-[#ccc3d8] leading-relaxed">Mapping developer influence across open-source clusters.</p>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
