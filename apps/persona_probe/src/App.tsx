import React, { useState, useEffect } from 'react';
import { FullProfile } from './types';
import { fetchGitHubProfile, fetchGitHubRepos, fetchGitHubEvents } from './services/githubService';
import { analyzeLanguages } from './utils/analyzeLanguages';
import { analyzeCommitPattern } from './utils/analyzeCommitPattern';
import { analyzeWithGemini } from './services/geminiService';
import { SearchPage } from './components/SearchPage';
import { ResultsPage } from './components/ResultsPage';


const MOCK_PROFILE: FullProfile = {
  profile: {
    login: 'demo',
    bio: 'AI enthusiast and builder.',
    public_repos: 15,
    avatar_url: 'https://github.com/identicons/demo.png',
    html_url: 'https://github.com/demo'
  },
  repos: [],
  languageStats: [
    { language: 'TypeScript', percentage: 70 },
    { language: 'React', percentage: 30 }
  ],
  commitPattern: {
    most_active_day: 'Monday',
    most_active_hour: 10,
    pattern_label: 'Consistent Grinder'
  },
  analysis: {
    personality_summary: 'A highly focused and pragmatic builder who thrives on structured problem solving.',
    archetype: 'The Pragmatic Builder',
    top_strengths: ['Structured Thinking', 'Consistent Output', 'TypeScript Mastery'],
    blind_spot: 'Can sometimes over-engineer simple solutions.',
    recruiter_pitch: 'A reliable and efficient developer who delivers clean, maintainable code.'
  }
};

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FullProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // 🔐 AUTH
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) setToken(savedToken);

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code && !savedToken) {
      fetch("http://localhost:8000/auth/github", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ code })
      })
        .then(res => res.json())
        .then(data => {
          localStorage.setItem("token", data.token);
          setToken(data.token);
          window.history.replaceState({}, document.title, "/");
        })
        .catch(() => setError("GitHub login failed"));
    }
  }, []);

  // ✅ POPRAWKA: VITE zamiast process.env
  const handleLogin = () => {
    const clientId = import.meta.env.VITE_GH_CLIENT_ID;
    const redirectUri = "http://localhost:3000/auth/github/callback";

    window.location.href =
      `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=read:user`;
  };

const handleLogout = () => {
  localStorage.removeItem("token");
  setToken(null);
  setResult(null);

  const confirmRevoke = confirm(
    "Are you sure you want to logout?"
  );

  if (confirmRevoke) {
    window.open("https://github.com/settings/applications", "_blank");
  }

  window.location.href = "/";
};

  // 🔍 SEARCH
  const handleSearch = async (username: string) => {
    if (!token) {
      setError("Please log in first");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      if (username === 'demo') {
        setResult(MOCK_PROFILE);
      } else {
        const [profile, repos, events] = await Promise.all([
          fetchGitHubProfile(username),
          fetchGitHubRepos(username),
          fetchGitHubEvents(username)
        ]);

        const languageStats = analyzeLanguages(repos);
        const commitPattern = analyzeCommitPattern(events, repos);

        const analysis = await analyzeWithGemini(
          profile,
          repos,
          languageStats,
          commitPattern
        );

        setResult({ profile, repos, languageStats, commitPattern, analysis });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 🔘 LOGIN BUTTON (always visible) */}
      <div className="fixed top-4 right-4 z-[9999]">
        {token ? (
          <button
            onClick={handleLogout}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        ) : (
          <button
            onClick={handleLogin}
            className="bg-black text-white px-4 py-2 rounded-lg"
          >
            Log in with GitHub
          </button>
        )}
      </div>

      {/* 📄 MAIN */}
      {result ? (
        <ResultsPage result={result} onReset={() => setResult(null)} />
      ) : (
        <SearchPage
          onSearch={handleSearch}
          isLoading={isLoading}
          disabled={!token}
        />
      )}

      {/* ❌ ERROR */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-[#93000a] text-[#ffdad6] px-6 py-3 rounded-xl font-body text-sm shadow-xl z-[9999] flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">error</span>
          {error}
        </div>
      )}
    </>
  );
}