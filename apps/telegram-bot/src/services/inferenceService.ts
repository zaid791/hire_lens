import { GitHubProfile, GitHubRepo, LanguageStat, CommitPattern, GeminiAnalysis } from '../types/index.js';

export async function analyzeWithInference(
  profile: GitHubProfile,
  repos: GitHubRepo[],
  languageStats: LanguageStat[],
  commitPattern: CommitPattern
): Promise<GeminiAnalysis> {
  const inferenceUrl = process.env.INFERENCE_SERVICE_URL;
  if (!inferenceUrl) {
    throw new Error('Missing INFERENCE_SERVICE_URL environment variable.');
  }

  const response = await fetch(`${inferenceUrl.replace(/\/$/, '')}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile, repos, languageStats, commitPattern })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Inference service error (${response.status}): ${body}`);
  }

  return response.json() as Promise<GeminiAnalysis>;
}
