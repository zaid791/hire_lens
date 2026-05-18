import React, { useState } from 'react';
import { FullProfile } from './types';
import { fetchGitHubProfile, fetchGitHubRepos, fetchGitHubEvents } from './services/githubService';
import { analyzeLanguages } from './utils/analyzeLanguages';
import { analyzeCommitPattern } from './utils/analyzeCommitPattern';
import { analyzeWithGemini } from './services/geminiService';
import { SearchPage } from './components/SearchPage';
import { ResultsPage } from './components/ResultsPage';

const MOCK_PROFILE: FullProfile = {
  profile: { login: 'demo', bio: 'AI enthusiast and builder.', public_repos: 15, avatar_url: 'https://github.com/identicons/demo.png', html_url: 'https://github.com/demo' },
  repos: [],
  languageStats: [{ language: 'TypeScript', percentage: 70 }, { language: 'React', percentage: 30 }],
  commitPattern: { most_active_day: 'Monday', most_active_hour: 10, pattern_label: 'Consistent Grinder' },
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
        console.log('languageStats:', languageStats);
        console.log('commitPattern:', commitPattern);
        const analysis = await analyzeWithGemini(profile, repos, languageStats, commitPattern);

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
      {result ? (
        <ResultsPage result={result} onReset={() => setResult(null)} />
      ) : (
        <SearchPage onSearch={handleSearch} isLoading={isLoading} />
      )}
      {error && (
        <div className="fixed bottom-4 right-4 bg-[#93000a] text-[#ffdad6] px-6 py-3 rounded-xl font-body text-sm shadow-xl z-50 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">error</span>
          {error}
        </div>
      )}
    </>
  );
}
