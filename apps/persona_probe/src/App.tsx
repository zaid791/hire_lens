import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { FullProfile } from './types';
import { fetchGitHubProfile, fetchGitHubRepos, fetchGitHubEvents } from './services/githubService';
import { analyzeLanguages } from './utils/analyzeLanguages';
import { analyzeCommitPattern } from './utils/analyzeCommitPattern';
import { analyzeWithGemini } from './services/geminiService';
import { SearchPage } from './components/SearchPage';
import { ResultsPage } from './components/ResultsPage';
import { AuthModal } from './components/AuthModal';

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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FullProfile | null>(null);
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);

  // 🔐 LISTEN TO AUTH STATE
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch custom user profile info (tier, linked accounts) from Firestore
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          } else {
            setUserProfile({ subscriptionTier: 'base' });
          }
        } catch {
          setUserProfile({ subscriptionTier: 'base' });
        }
      } else {
        setUserProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // 🔗 TELEGRAM DEEP-LINKING CODE HANDLER
  useEffect(() => {
    if (!currentUser) return;

    const params = new URLSearchParams(window.location.search);
    const linkCode = params.get("linkCode");

    if (linkCode) {
      const handleLinking = async () => {
        setIsLoading(true);
        setError(null);
        try {
          // 1. Fetch Telegram chat ID mapped to this linking code
          const codeRef = doc(db, 'linkingCodes', linkCode);
          const codeSnap = await getDoc(codeRef);

          if (!codeSnap.exists()) {
            throw new Error("Invalid or expired linking code. Please request a new one via the bot using /link.");
          }

          const { telegramChatId } = codeSnap.data();

          // 2. Link Telegram ID inside the user's web account
          const userDocRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userDocRef, {
            telegramChatId: telegramChatId
          });

          // 3. Delete used code for security
          await deleteDoc(codeRef);

          setLinkSuccess("🎉 Telegram linked successfully! Your bot will now share this premium web account status.");

          // Re-fetch profile
          const updatedSnap = await getDoc(userDocRef);
          if (updatedSnap.exists()) {
            setUserProfile(updatedSnap.data());
          }

          // Clear query params from address bar
          window.history.replaceState({}, document.title, "/");
        } catch (err: any) {
          setError(err.message || "Failed to link Telegram account.");
        } finally {
          setIsLoading(false);
        }
      };

      handleLinking();
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setResult(null);
      setLinkSuccess(null);
    } catch (err: any) {
      setError("Failed to sign out");
    }
  };

  // 🔍 SEARCH
  const handleSearch = async (username: string) => {
    if (!currentUser) {
      setIsAuthOpen(true);
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
      {/* 🔘 NAVIGATION / HEADER LOGINS */}
      <div className="fixed top-4 right-4 z-[9999] flex items-center gap-3">
        {currentUser ? (
          <div className="flex items-center gap-3 bg-[#070e1d]/80 border border-[#2e3545] rounded-xl px-4 py-2 text-xs font-mono text-[#ccc3d8]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
              {currentUser.email}
            </span>
            <span className="bg-[#7c3aed]/20 text-[#d2bbff] border border-[#7c3aed]/50 px-2 py-0.5 rounded uppercase font-bold text-[10px]">
              {userProfile?.subscriptionTier || 'BASE'}
            </span>
            <button
              onClick={handleLogout}
              className="text-white hover:text-red-400 font-bold ml-2 pl-2 border-l border-[#2e3545]"
            >
              Log Out
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAuthOpen(true)}
            className="bg-gradient-to-r from-[#7c3aed] to-[#d2bbff] text-[#3f008e] font-headline font-bold px-6 py-2.5 rounded-xl text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg"
          >
            Sign Up / Log In
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
          disabled={!currentUser}
        />
      )}

      {/* 🗝️ AUTH MODAL */}
      {isAuthOpen && (
        <AuthModal onClose={() => setIsAuthOpen(false)} />
      )}

      {/* 🎉 LINK SUCCESS */}
      {linkSuccess && (
        <div className="fixed bottom-20 right-4 bg-green-950 border border-green-500 text-green-300 px-6 py-4 rounded-xl font-body text-sm shadow-2xl z-[9999] flex items-center gap-3 max-w-sm">
          <span className="material-symbols-outlined text-green-400">check_circle</span>
          <div>
            <h4 className="font-bold">Telegram Connected</h4>
            <p className="text-xs text-green-400/80 mt-0.5">{linkSuccess}</p>
          </div>
          <button onClick={() => setLinkSuccess(null)} className="text-green-300 hover:text-white ml-auto">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
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