export interface GitHubRepo {
  id: number;
  name: string;
  language: string | null;
  stargazers_count: number;
  description: string | null;
  updated_at: string;
}

export interface GitHubEvent {
  id: string;
  type: string;
  created_at: string;
  payload: Record<string, any>;
}

export interface GitHubProfile {
  login: string;
  bio: string | null;
  public_repos: number;
  avatar_url: string;
  html_url: string;
}

export interface LanguageStat {
  language: string;
  percentage: number;
}

export type PatternLabel =
  | "Morning Committer"
  | "Night Owl"
  | "Consistent Grinder"
  | "Weekend Warrior"
  | "Bursty Sprinter";

export interface CommitPattern {
  most_active_day: string;
  most_active_hour: number;
  pattern_label: PatternLabel;
}

export interface GeminiAnalysis {
  personality_summary: string;
  archetype: string;
  top_strengths: string[];
  blind_spot: string;
  recruiter_pitch: string;
}

export interface FullProfile {
  profile: GitHubProfile;
  repos: GitHubRepo[];
  languageStats: LanguageStat[];
  commitPattern: CommitPattern;
  analysis: GeminiAnalysis;
}
