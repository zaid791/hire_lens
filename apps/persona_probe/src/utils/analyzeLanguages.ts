import { LanguageStat } from '../types/index';

export function analyzeLanguages(repos: any[]): LanguageStat[] {
  const languageCounts = new Map<string, number>();
  let totalReposWithLanguage = 0;

  for (const repo of repos) {
    const language = repo.language ?? repo["language"] ?? null;
    if (language && typeof language === 'string' && language.trim() !== '') {
      languageCounts.set(language, (languageCounts.get(language) || 0) + 1);
      totalReposWithLanguage++;
    }
  }

  if (totalReposWithLanguage === 0) {
    return [{ language: "Unknown", percentage: 100 }];
  }

  const stats: LanguageStat[] = Array.from(languageCounts.entries()).map(([language, count]) => ({
    language,
    percentage: parseFloat(((count / totalReposWithLanguage) * 100).toFixed(1)),
  }));

  return stats
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);
}
