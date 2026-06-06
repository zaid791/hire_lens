import { Telegraf } from 'telegraf';
import * as dotenv from 'dotenv';
import { fetchGitHubProfile, fetchGitHubRepos, fetchGitHubEvents, GitHubNotFoundError, GitHubRateLimitError } from './services/githubService.js';
import { analyzeLanguages } from './utils/analyzeLanguages.js';
import { analyzeCommitPattern } from './utils/analyzeCommitPattern.js';
import { analyzeWithGemini } from './services/geminiService.js';
import { analyzeWithInference } from './services/inferenceService.js';
import { checkAndIncrementRequestLimit, getUserProfile, generateLinkingCode, LIMITS } from './services/firebaseService.js';
import { FullProfile } from './types/index.js';

// Load environment variables
dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_PROVIDER = process.env.MODEL_PROVIDER || 'gemini';
const INFERENCE_SERVICE_URL = process.env.INFERENCE_SERVICE_URL || '';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

if (!BOT_TOKEN) {
  console.error('Error: TELEGRAM_BOT_TOKEN is not set in environment variables.');
  process.exit(1);
}

if (MODEL_PROVIDER === 'gemini' && !GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY is required when MODEL_PROVIDER=gemini.');
  process.exit(1);
}

if (MODEL_PROVIDER === 'opensource' && !INFERENCE_SERVICE_URL) {
  console.error('Error: INFERENCE_SERVICE_URL is required when MODEL_PROVIDER=opensource.');
  process.exit(1);
}

async function runAnalysis(
  profile: Parameters<typeof analyzeWithGemini>[0],
  repos: Parameters<typeof analyzeWithGemini>[1],
  languageStats: Parameters<typeof analyzeWithGemini>[2],
  commitPattern: Parameters<typeof analyzeWithGemini>[3]
) {
  if (MODEL_PROVIDER === 'opensource') {
    return analyzeWithInference(profile, repos, languageStats, commitPattern);
  }
  return analyzeWithGemini(profile, repos, languageStats, commitPattern);
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
• Send <code>/profile</code> to check your subscription quota
• Send <code>/link</code> to connect your bot with the Web Dashboard
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
* ${strengthsText}

• <b>Blind Spot:</b> <i>${analysis.blind_spot}</i>

• <b>Recruiter Pitch:</b>
<b>"${analysis.recruiter_pitch}"</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

// Handler: Run analysis on a username
async function handleAnalysis(ctx: any, username: string) {
  const chatId = String(ctx.from?.id);
  const userHandle = ctx.from?.username || '';

  // 1. Check & increment rate limit in Firestore
  let quota;
  try {
    quota = await checkAndIncrementRequestLimit(chatId, userHandle);
  } catch (err) {
    console.error('Failed checking request quota:', err);
    // Allow request as fallback if database completely errors out
    quota = { allowed: true, remaining: 1, limit: LIMITS.base, subscriptionTier: 'base', isMock: true };
  }

  if (!quota.allowed) {
    const limitMessage = `⚠️ <b>Daily Quota Reached!</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━
You have used all <b>${quota.limit}</b> of your daily analysis requests for today.

✨ <b>Get Unlimited Reports:</b>
Upgrade to our Premium Subscription to unlock unlimited candidate lookups, direct candidate PDF export, and advanced personality breakdowns!

👉 Type <code>/profile</code> to see your current subscription details.`;

    try {
      await ctx.replyWithHTML(limitMessage);
    } catch {
      console.warn(`Could not send limit warning — user may have blocked the bot.`);
    }
    return;
  }

  let loadingMsgId: number | null = null;

  try {
    const usageFooter = quota.isMock
      ? `(Quota: ${quota.limit - quota.remaining}/${quota.limit} used today • Mock Mode)`
      : `(Quota: ${quota.limit - quota.remaining}/${quota.limit} used today)`;

    const loadingMsg = await ctx.replyWithHTML(`⏳ Analyzing <b>@${username}</b>... Please wait.\n<i>${usageFooter}</i>`);
    loadingMsgId = loadingMsg.message_id;
  } catch {
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
    const analysis = await runAnalysis(profile, repos, languageStats, commitPattern);

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

bot.command('profile', async (ctx) => {
  const chatId = String(ctx.from?.id);
  const profile = await getUserProfile(chatId);

  const tier = profile ? profile.subscriptionTier : 'base';
  const requests = profile ? profile.requestsToday : 0;
  const limit = profile ? profile.limit : LIMITS.base;
  const remaining = profile ? profile.remaining : LIMITS.base;

  const profileMessage = `👤 <b>Your Hire Lens Account Profile</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━
• Account ID: <code>${chatId}</code>
• Subscription Tier: <b>${tier.toUpperCase()}</b>

📊 <b>Daily Usage Status:</b>
• Requests Used Today: <b>${requests} / ${limit}</b>
• Requests Remaining: <b>${remaining}</b>

${tier === 'base' ? '✨ Want unlimited searches? Contact support to upgrade your tier to Premium!' : '💎 Thank you for being a Premium member! You have unlimited access.'}`;

  await ctx.replyWithHTML(profileMessage);
});

bot.command('link', async (ctx) => {
  const chatId = String(ctx.from?.id);

  try {
    const code = await generateLinkingCode(chatId);
    const linkUrl = `${APP_URL.replace(/\/$/, '')}?linkCode=${code}`;

    const linkMsg = `🔗 <b>Connect with Web Dashboard</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━
Connect your Telegram account to your Hire Lens Web profile to sync your Premium subscription level!

🗝️ One-Time linking code: <code>${code}</code>
⏳ Valid for 15 minutes.

👉 <b>Click here to link immediately:</b>
${linkUrl}`;

    await ctx.replyWithHTML(linkMsg);
  } catch (error) {
    console.error('Failed to generate link code:', error);
    await ctx.replyWithHTML('❌ Failed to generate a linking code. Please try again later.');
  }
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


import http from 'http';

// Trik dla Google Cloud Run - udajemy, że nasłuchujemy na porcie 8080
const PORT = process.env.PORT || 8080;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is running...');
}).listen(PORT, () => {
  console.log(`Google Cloud Health Check listening on port ${PORT}`);
});



// Start the bot
bot.launch().catch((err) => {
  console.error('❌ Failed to start the Telegram Bot:', err);
});
console.log('🚀 Hire Lens Telegram Bot is running locally...');

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
