import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { FullProfile } from './types';
import { fetchGitHubProfile, fetchGitHubRepos, fetchGitHubEvents } from './services/githubService';
import { analyzeLanguages } from './utils/analyzeLanguages';
import { analyzeCommitPattern } from './utils/analyzeCommitPattern';
import { analyzeWithGemini } from './services/geminiService';
import { SearchPage } from './components/SearchPage';
import { ResultsPage } from './components/ResultsPage';
import { HomePage } from './components/HomePage';
import { LoginPage } from './components/LoginPage';
import { AdminPage } from './components/AdminPage';
import { usePathname } from './hooks/usePathname';
import { checkIsAdmin } from './services/adminService';

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

const APP_PATH = '/app';
const LOGIN_PATH = '/login';
const ADMIN_PATH = '/admin';
const PROTECTED_PATHS = [APP_PATH, ADMIN_PATH];

export default function App() {
  const { pathname, navigate } = usePathname();
  const [authReady, setAuthReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminReady, setAdminReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FullProfile | null>(null);

  const refreshUserProfile = useCallback(async (user: User) => {
    const userDocRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userDocRef);
    const profileFields = {
      ...(user.email ? { email: user.email } : {}),
    };

    if (docSnap.exists()) {
      if (user.email && docSnap.data()?.email !== user.email) {
        await setDoc(userDocRef, profileFields, { merge: true });
      }
      setUserProfile({ ...docSnap.data(), ...profileFields });
    } else {
      await setDoc(userDocRef, { subscriptionTier: 'base', ...profileFields });
      setUserProfile({ subscriptionTier: 'base', ...profileFields });
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAdminReady(false);
      if (user) {
        try {
          await refreshUserProfile(user);
          setIsAdmin(await checkIsAdmin(user.uid));
        } catch {
          setUserProfile({ subscriptionTier: 'base' });
          setIsAdmin(false);
        }
      } else {
        setUserProfile(null);
        setIsAdmin(false);
      }
      setAdminReady(true);
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, [refreshUserProfile]);

  // Route guards: login required for /app and /admin
  useEffect(() => {
    if (!authReady || !adminReady) return;

    const search = window.location.search;

    if (currentUser) {
      if (pathname === ADMIN_PATH && !isAdmin) {
        navigate(`${APP_PATH}${search}`);
        return;
      }

      if (pathname === LOGIN_PATH || pathname === '/') {
        navigate(`${APP_PATH}${search}`);
      }
      return;
    }

    if (PROTECTED_PATHS.includes(pathname)) {
      navigate(`${LOGIN_PATH}${search}`);
    }
  }, [authReady, adminReady, currentUser, isAdmin, pathname, navigate]);

  const pendingRedirect =
    authReady &&
    adminReady &&
    ((currentUser && (pathname === LOGIN_PATH || pathname === '/')) ||
      (currentUser && pathname === ADMIN_PATH && !isAdmin) ||
      (!currentUser && PROTECTED_PATHS.includes(pathname)));

  useEffect(() => {
    if (!currentUser) return;

    const params = new URLSearchParams(window.location.search);
    const linkCode = params.get('linkCode');
    if (linkCode) {
      window.history.replaceState({}, document.title, APP_PATH);
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setResult(null);
      navigate('/');
    } catch {
      setError('Failed to sign out');
    }
  };

  const handleSearch = async (username: string) => {
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

  if (!authReady || pendingRedirect) {
    return (
      <div className="min-h-screen bg-[#0c1322] flex items-center justify-center">
        <div className="text-[#958da1] font-mono text-sm animate-pulse">Loading...</div>
      </div>
    );
  }

  const showApp = currentUser && pathname === APP_PATH;
  const showAdmin = currentUser && isAdmin && pathname === ADMIN_PATH;

  if (!showApp && !showAdmin) {
    if (pathname === LOGIN_PATH) {
      return (
        <LoginPage
          onBack={() => navigate('/')}
          onSuccess={() => navigate(`${APP_PATH}${window.location.search}`)}
        />
      );
    }

    return <HomePage onSignIn={() => navigate(LOGIN_PATH)} />;
  }

  if (showAdmin) {
    return (
      <>
        <div className="fixed top-4 right-4 z-[9999] flex items-center gap-3">
          <div className="flex items-center gap-3 bg-[#070e1d]/80 border border-[#2e3545] rounded-xl px-4 py-2 text-xs font-mono text-[#ccc3d8]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
              Admin · {currentUser.email}
            </span>
            <button
              onClick={handleLogout}
              className="text-white hover:text-red-400 font-bold ml-2 pl-2 border-l border-[#2e3545]"
            >
              Log Out
            </button>
          </div>
        </div>

        <AdminPage onBack={() => navigate(APP_PATH)} />
      </>
    );
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-[9999] flex items-center gap-3">
        <div className="flex items-center gap-3 bg-[#070e1d]/80 border border-[#2e3545] rounded-xl px-4 py-2 text-xs font-mono text-[#ccc3d8]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
            {currentUser.email}
          </span>
          <span className="bg-[#7c3aed]/20 text-[#d2bbff] border border-[#7c3aed]/50 px-2 py-0.5 rounded uppercase font-bold text-[10px]">
            {userProfile?.subscriptionTier || 'BASE'}
          </span>
          {isAdmin && (
            <button
              onClick={() => navigate(ADMIN_PATH)}
              className="text-[#d2bbff] hover:text-white font-bold"
            >
              Admin
            </button>
          )}
          <button
            onClick={handleLogout}
            className="text-white hover:text-red-400 font-bold ml-2 pl-2 border-l border-[#2e3545]"
          >
            Log Out
          </button>
        </div>
      </div>

      {result ? (
        <ResultsPage result={result} onReset={() => setResult(null)} />
      ) : (
        <SearchPage
          onSearch={handleSearch}
          isLoading={isLoading}
          telegramLinked={Boolean(userProfile?.telegramChatId)}
          onRefreshTelegram={() => currentUser && refreshUserProfile(currentUser)}
        />
      )}

      {error && (
        <div className="fixed bottom-4 right-4 bg-[#93000a] text-[#ffdad6] px-6 py-3 rounded-xl font-body text-sm shadow-xl z-[9999] flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">error</span>
          {error}
        </div>
      )}
    </>
  );
}
