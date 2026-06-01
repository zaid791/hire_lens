import { Telegraf } from 'telegraf';
import * as dotenv from 'dotenv';
import { fetchGitHubProfile, fetchGitHubRepos, fetchGitHubEvents, GitHubNotFoundError, GitHubRateLimitError } from './services/githubService';
import { analyzeLanguages } from './utils/analyzeLanguages';
import { analyzeCommitPattern } from './utils/analyzeCommitPattern';
import { analyzeWithGemini } from './services/geminiService';
import { FullProfile } from './types';

// Load environment variables
dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!BOT_TOKEN) {
  console.error('Error: TELEGRAM_BOT_TOKEN is not set in environment variables.');
  process.exit(1);
}

if (!GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY is not set in environment variables.');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

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

const WELCOME_MESSAGE = `👋 <b>Welcome to Hire Lens!</b>

I am your Telegram-first HR assistant that analyzes public GitHub profiles to help you quickly understand a candidate's technical background.

🎯 <b>How to use:</b>
• Send <code>/analyze [github-username]</code>
• Send a GitHub profile link directly (e.g., <code>https://github.com/octocat</code>)
• Send just a GitHub username (e.g., <code>octocat</code>)
• Try <code>/demo</code> to see an example report instantly!

Let's find the best match for your team! 🚀`;

// Helper: Extract username from message text or URL
function extractUsername(text: string): string | null {
  const cleanText = text.trim();
  if (!cleanText) return null;

  try {
    const url = new URL(cleanText);
    if (url.hostname.includes('github.com')) {
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length > 0) return parts[0];
    }
  } catch {
    // Not a valid URL, treat as potential username
  }

  // Handle @username notation
  if (cleanText.startsWith('@')) {
    return cleanText.substring(1);
  }

  // Standard username verification
  const usernameRegex = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
  if (usernameRegex.test(cleanText)) {
    return cleanText;
  }

  return null;
}

// Helper: Format full profile to a beautiful HTML message
function formatProfileReport(result: FullProfile): string {
  const { profile, languageStats, commitPattern, analysis } = result;

  const languagesText = languageStats
    .map(lang => `• <b>${lang.language}</b>: ${lang.percentage}%`)
    .join('\n');

  const strengthsText = analysis.top_strengths
    .map((s, idx) => `${idx + 1}. <b>${s}</b>`)
    .join('\n');

  return `🔍 <b>Hire Lens Candidate Analysis: @${profile.login}</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 <b>Username:</b> ${profile.login}
📂 <b>Public Repos:</b> ${profile.public_repos}
📝 <b>Bio:</b> <i>${profile.bio || 'No bio provided'}</i>
🔗 <a href="${profile.html_url}">GitHub Profile Link</a>

📊 <b>Dominant Languages:</b>
${languagesText || '• <i>No languages detected</i>'}

⚡ <b>Commit Activity Pattern:</b>
• Most Active Day: <b>${commitPattern.most_active_day}</b>
• Peak Activity Hour (UTC): <b>${commitPattern.most_active_hour}:00</b>
• Style: <code>${commitPattern.pattern_label}</code>

🧠 <b>AI Developer Persona:</b>
• <b>Archetype:</b> <b>${analysis.archetype}</b>
• <b>Summary:</b> <i>${analysis.personality_summary}</i>

• <b>Top Strengths:</b>
${strengthsText}

• <b>Blind Spot:</b> <i>${analysis.blind_spot}</i>

• <b>Recruiter Pitch:</b>
<b>"${analysis.recruiter_pitch}"</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

// Handler: Run analysis on a username
async function handleAnalysis(ctx: any, username: string) {
  let loadingMsgId: number | null = null;

  try {
    const loadingMsg = await ctx.replyWithHTML(`⏳ Analyzing <b>@${username}</b>... Please wait.`);
    loadingMsgId = loadingMsg.message_id;
  } catch {
    // If we can't even send a message (e.g. user blocked bot), abort silently
    console.warn(`Could not send loading message to user — they may have blocked the bot.`);
    return;
  }

  try {
    if (username === 'demo') {
      const reportHtml = formatProfileReport(MOCK_PROFILE);
      await ctx.replyWithHTML(reportHtml, { disable_web_page_preview: true });
      return;
    }

    const [profile, repos, events] = await Promise.all([
      fetchGitHubProfile(username),
      fetchGitHubRepos(username),
      fetchGitHubEvents(username)
    ]);

    const languageStats = analyzeLanguages(repos);
    const commitPattern = analyzeCommitPattern(events, repos);
    const analysis = await analyzeWithGemini(profile, repos, languageStats, commitPattern);

    const reportHtml = formatProfileReport({ profile, repos, languageStats, commitPattern, analysis });
    try {
      await ctx.replyWithHTML(reportHtml, { disable_web_page_preview: true });
    } catch {
      console.warn(`Could not send analysis report — user may have blocked the bot.`);
    }
  } catch (error) {
    let errMsg = 'An unknown error occurred during analysis.';
    if (error instanceof GitHubNotFoundError) {
      errMsg = `❌ GitHub user <b>@${username}</b> not found. Please verify the spelling.`;
    } else if (error instanceof GitHubRateLimitError) {
      errMsg = '⚠️ GitHub API rate limit exceeded. Please try again later or check your API configuration.';
    } else if (error instanceof Error) {
      errMsg = `❌ Error: ${error.message}`;
    }
    try {
      await ctx.replyWithHTML(errMsg);
    } catch {
      console.warn(`Could not send error message — user may have blocked the bot.`);
    }
  } finally {
    if (loadingMsgId !== null) {
      try {
        await ctx.deleteMessage(loadingMsgId);
      } catch {
        // Ignored if message was already deleted or doesn't exist
      }
    }
  }
}

// Commands
bot.start((ctx) => ctx.replyWithHTML(WELCOME_MESSAGE));
bot.help((ctx) => ctx.replyWithHTML(WELCOME_MESSAGE));

bot.command('demo', async (ctx) => {
  await handleAnalysis(ctx, 'demo');
});

bot.command('analyze', async (ctx) => {
  const parts = ctx.message.text.split(' ');
  if (parts.length < 2) {
    await ctx.replyWithHTML('⚠️ Please provide a GitHub username. Example: <code>/analyze octocat</code>');
    return;
  }
  const username = extractUsername(parts.slice(1).join(' '));
  if (!username) {
    await ctx.replyWithHTML('⚠️ Invalid username or URL format. Please try again.');
    return;
  }
  await handleAnalysis(ctx, username);
});

// Handle plain text messages (extract username and run analysis)
bot.on('text', async (ctx) => {
  const text = ctx.message.text.trim();
  if (text.startsWith('/')) return; // Let command handlers process commands

  const username = extractUsername(text);
  if (username) {
    await handleAnalysis(ctx, username);
  } else {
    await ctx.replyWithHTML('🤔 I couldn\'t extract a valid GitHub username from your message. Send a username (e.g. <code>octocat</code>) or profile link.');
  }
});

// Start the bot
bot.launch().catch((err) => {
  console.error('❌ Failed to start the Telegram Bot:', err);
});
console.log('🚀 Hire Lens Telegram Bot is running locally...');

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
