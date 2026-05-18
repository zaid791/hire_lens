import { GitHubProfile, GitHubRepo, GitHubEvent } from '../types/index';

export class GitHubNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GitHubNotFoundError';
  }
}

export class GitHubRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GitHubRateLimitError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 404) {
    throw new GitHubNotFoundError('User not found');
  }
  if (response.status === 403) {
    throw new GitHubRateLimitError('GitHub API rate limit exceeded');
  }
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchGitHubProfile(username: string): Promise<GitHubProfile> {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`);
    return handleResponse<GitHubProfile>(response);
  } catch (error) {
    if (error instanceof GitHubNotFoundError || error instanceof GitHubRateLimitError) {
      throw error;
    }
    throw new Error('Failed to fetch GitHub profile');
  }
}

export async function fetchGitHubRepos(username: string): Promise<GitHubRepo[]> {
  try {
    const response = await fetch(`https://api.github.com/users/${username}/repos?per_page=30&sort=updated`);
    return handleResponse<GitHubRepo[]>(response);
  } catch (error) {
    if (error instanceof GitHubNotFoundError || error instanceof GitHubRateLimitError) {
      throw error;
    }
    throw new Error('Failed to fetch GitHub repositories');
  }
}

export async function fetchGitHubEvents(username: string): Promise<any[]> {
  try {
    console.log("Fetching events for:", username);
    
    // Try public events first
    const responsePublic = await fetch(`https://api.github.com/users/${username}/events/public?per_page=100`);
    let data = [];
    
    if (responsePublic.ok) {
      data = await responsePublic.json();
    }
    
    // If empty or failed, try all events
    if (!Array.isArray(data) || data.length === 0) {
      console.log("Public events empty, trying all events...");
      const responseAll = await fetch(`https://api.github.com/users/${username}/events?per_page=100`);
      if (responseAll.ok) {
        const allData = await responseAll.json();
        if (Array.isArray(allData)) {
          data = allData;
        }
      }
    }
    
    console.log("Events received:", data.length, data[0]?.type);
    
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Failed to fetch GitHub events:', error);
    return [];
  }
}
