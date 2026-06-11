import React from 'react';
import { Footer } from './Footer';

interface HomePageProps {
  onSignIn: () => void;
}

export function HomePage({ onSignIn }: HomePageProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0c1322] text-[#ccc3d8] font-body">
      <nav className="bg-[#0c1322]/60 backdrop-blur-xl sticky top-0 z-50 border-b border-[#2e3545]/40">
        <div className="flex items-center justify-between w-full px-6 md:px-8 py-5 max-w-6xl mx-auto">
          <span className="text-2xl font-bold tracking-[-0.02em] text-[#d2bbff] glow-text font-headline">
            Hire Lens
          </span>
          <button
            onClick={onSignIn}
            className="text-sm font-headline font-bold text-[#d2bbff] hover:text-white transition-colors"
          >
            Sign In
          </button>
        </div>
      </nav>

      <main className="flex-grow relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary-container/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 py-16 md:py-24 relative z-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#958da1] mb-4">
            Telegram-first HR assistant
          </p>
          <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-[-0.02em] text-[#d2bbff] mb-6 glow-text leading-tight">
            Understand developers before the first interview
          </h1>
          <p className="text-lg md:text-xl text-[#ccc3d8] font-light leading-relaxed max-w-2xl mb-4">
            Hire Lens analyzes public GitHub profiles and turns them into clear, recruiter-ready
            developer reports — powered by AI and available through our web dashboard and Telegram bot.
          </p>
          <p className="text-sm text-[#958da1] leading-relaxed max-w-2xl mb-10">
            Search any GitHub username to explore languages, commit patterns, strengths, and a
            personality summary. Connect your Telegram account to share the same analysis workflow
            with your team.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <button
              onClick={onSignIn}
              className="gradient-primary text-[#3f008e] font-headline font-bold px-8 py-4 rounded-xl text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg inline-flex items-center justify-center gap-2"
            >
              Get Started
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: 'code',
                title: 'GitHub intelligence',
                text: 'Pull profile, repos, languages, and activity from public GitHub data.',
              },
              {
                icon: 'psychology',
                title: 'AI persona reports',
                text: 'Generate archetypes, strengths, blind spots, and recruiter pitches with Gemini.',
              },
              {
                icon: 'hub',
                title: 'Bot + web sync',
                text: 'Use the Telegram bot in the field and the dashboard for deeper review.',
              },
            ].map((item) => (
              <div key={item.title} className="p-6 rounded-xl bg-[#141b2b] border border-[#2e3545]/50">
                <span className="material-symbols-outlined text-[#d2bbff] mb-3">{item.icon}</span>
                <h3 className="font-headline font-bold text-sm text-[#dce2f7] mb-2">{item.title}</h3>
                <p className="text-xs text-[#958da1] leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
