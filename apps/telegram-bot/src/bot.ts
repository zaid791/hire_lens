import { Telegraf } from 'telegraf';
import * as dotenv from 'dotenv';
import { fetchGitHubProfile, fetchGitHubRepos, fetchGitHubEvents, GitHubNotFoundError, GitHubRateLimitError } from './services/githubService.js';
import { analyzeLanguages } from './utils/analyzeLanguages.js';
import { analyzeCommitPattern } from './utils/analyzeCommitPattern.js';
import { analyzeWithGemini } from './services/geminiService.js';
import { analyzeWithInference } from './services/inferenceService.js';
import {
  checkAndIncrementRequestLimit,
  completeTelegramLink,
  getUserProfile,
  isTelegramLinked,
} from './services/firebaseService.js';
import { FullProfile } from './types/index.js';

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

Your Telegram is linked to your website account. You can analyze public GitHub profiles from here or the web dashboard.

🎯 <b>Commands:</b>
• <code>/analyze octocat</code> — analyze a GitHub user
• Send a GitHub username or profile link directly
• <code>/profile</code> — check your daily quota
• <code>/demo</code> — example report`;

function loginUrl(): string {
  return `${APP_URL.replace(/\/$/, '')}/login`;
}

function appUrl(): string {
  return `${APP_URL.replace(/\/$/, '')}/app`;
}

function linkRequiredMessage(): string {
  return `🔐 <b>Website account required</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━
To use Hire Lens on Telegram, create an account on the website and connect Telegram from your dashboard.

<b>Steps:</b>
1. Sign up or log in at the website
2. Open your dashboard and click <b>Connect Telegram</b>
3. Tap <b>Start</b> in the Telegram chat that opens

🌐 <a href="${loginUrl()}">Create account / Log in</a>
📊 <a href="${appUrl()}">Open dashboard</a>`;
}

function getStartPayload(text: string): string | undefined {
  const parts = text.trim().split(/\s+/);
  if (parts.length < 2) return undefined;
  return parts.slice(1).join(' ').trim() || undefined;
}

async function replyLinkRequired(ctx: { replyWithHTML: (text: string) => Promise<unknown> }) {
  await ctx.replyWithHTML(linkRequiredMessage());
}

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
    // Not a URL
  }

  if (cleanText.startsWith('@')) {
    return cleanText.substring(1);
  }

  const usernameRegex = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
  if (usernameRegex.test(cleanText)) {
    return cleanText;
  }

  return null;
}

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

async function handleAnalysis(ctx: any, username: string) {
  const chatId = String(ctx.from?.id);
  const userHandle = ctx.from?.username || '';

  let quota;
  try {
    quota = await checkAndIncrementRequestLimit(chatId, userHandle);
  } catch (err) {
    console.error('Failed checking request quota:', err);
    await ctx.replyWithHTML('❌ Could not verify your account. Please try again later.');
    return;
  }

  if (!quota.linked) {
    await replyLinkRequired(ctx);
    return;
  }

  if (!quota.allowed) {
    const limitMessage = `⚠️ <b>Daily Quota Reached!</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━
You have used all <b>${quota.limit}</b> of your daily analysis requests.

👉 Type <code>/profile</code> for account details.`;

    try {
      await ctx.replyWithHTML(limitMessage);
    } catch {
      console.warn('Could not send limit warning — user may have blocked the bot.');
    }
    return;
  }

  let loadingMsgId: number | null = null;

  try {
    const usageFooter = `(Quota: ${quota.limit - quota.remaining}/${quota.limit} used today)`;
    const loadingMsg = await ctx.replyWithHTML(`⏳ Analyzing <b>@${username}</b>... Please wait.\n<i>${usageFooter}</i>`);
    loadingMsgId = loadingMsg.message_id;
  } catch {
    console.warn('Could not send loading message — user may have blocked the bot.');
    return;
  }

  try {
    if (username === 'demo') {
      await ctx.replyWithHTML(formatProfileReport(MOCK_PROFILE), { disable_web_page_preview: true });
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
      console.warn('Could not send analysis report — user may have blocked the bot.');
    }
  } catch (error) {
    let errMsg = 'An unknown error occurred during analysis.';
    if (error instanceof GitHubNotFoundError) {
      errMsg = `❌ GitHub user <b>@${username}</b> not found. Please verify the spelling.`;
    } else if (error instanceof GitHubRateLimitError) {
      errMsg = '⚠️ GitHub API rate limit exceeded. Please try again later.';
    } else if (error instanceof Error) {
      errMsg = `❌ Error: ${error.message}`;
    }
    try {
      await ctx.replyWithHTML(errMsg);
    } catch {
      console.warn('Could not send error message — user may have blocked the bot.');
    }
  } finally {
    if (loadingMsgId !== null) {
      try {
        await ctx.deleteMessage(loadingMsgId);
      } catch {
        // ignored
      }
    }
  }
}

bot.start(async (ctx) => {
  const chatId = String(ctx.from?.id);
  const text = 'text' in (ctx.message ?? {}) ? ctx.message.text : '';
  const token = getStartPayload(text);

  if (token) {
    const result = await completeTelegramLink(token, chatId, ctx.from?.username);
    if (result.ok) {
      await ctx.replyWithHTML(`✅ <b>Telegram connected!</b>\n\nYour bot is now linked to your Hire Lens website account.`);
      await ctx.replyWithHTML(WELCOME_MESSAGE);
    } else {
      await ctx.replyWithHTML(`❌ ${result.error}\n\n${linkRequiredMessage()}`);
    }
    return;
  }

  if (!(await isTelegramLinked(chatId))) {
    await replyLinkRequired(ctx);
    return;
  }

  await ctx.replyWithHTML(WELCOME_MESSAGE);
});

bot.use(async (ctx, next) => {
  const chatId = String(ctx.from?.id);
  if (!(await isTelegramLinked(chatId))) {
    await replyLinkRequired(ctx);
    return;
  }
  return next();
});

bot.help((ctx) => ctx.replyWithHTML(WELCOME_MESSAGE));

bot.command('demo', async (ctx) => {
  await handleAnalysis(ctx, 'demo');
});

bot.command('profile', async (ctx) => {
  const chatId = String(ctx.from?.id);
  const profile = await getUserProfile(chatId);

  if (!profile?.linked) {
    await replyLinkRequired(ctx);
    return;
  }

  const profileMessage = `👤 <b>Your Hire Lens Account</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━
• Subscription: <b>${profile.subscriptionTier.toUpperCase()}</b>
• Requests today: <b>${profile.requestsToday} / ${profile.limit}</b>
• Remaining: <b>${profile.remaining}</b>

🌐 Manage your account on the <a href="${appUrl()}">website dashboard</a>.`;

  await ctx.replyWithHTML(profileMessage);
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

bot.on('text', async (ctx) => {
  const text = ctx.message.text.trim();
  if (text.startsWith('/')) return;

  const username = extractUsername(text);
  if (username) {
    await handleAnalysis(ctx, username);
  } else {
    await ctx.replyWithHTML('🤔 Send a GitHub username (e.g. <code>octocat</code>) or profile link, or use <code>/analyze username</code>.');
  }
});

import http from 'http';
import { GoogleAuth } from 'google-auth-library';

const PORT = Number(process.env.PORT) || 8080;
const WEBHOOK_PATH = '/telegram/webhook';

bot.catch((err, ctx) => {
  console.error('Unhandled bot error:', err);
  ctx.reply('Something went wrong. Please try again in a moment.').catch(() => undefined);
});

async function resolvePublicUrl(): Promise<string | null> {
  if (process.env.BOT_PUBLIC_URL) {
    return process.env.BOT_PUBLIC_URL.replace(/\/$/, '');
  }

  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  const serviceName = process.env.K_SERVICE;
  const region = process.env.GOOGLE_CLOUD_REGION || 'europe-west1';
  if (!projectId || !serviceName) {
    return null;
  }

  try {
    const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
    const client = await auth.getClient();
    const response = await client.request<{ uri?: string }>({
      url: `https://run.googleapis.com/v2/projects/${projectId}/locations/${region}/services/${serviceName}`,
    });
    return response.data.uri?.replace(/\/$/, '') ?? null;
  } catch (error) {
    console.error('Failed to resolve Cloud Run service URL:', error);
    return null;
  }
}

async function startBot() {
  const cloudRunService = process.env.K_SERVICE;
  const publicUrl = cloudRunService ? await resolvePublicUrl() : null;

  if (cloudRunService && publicUrl) {
    const server = http.createServer((req, res) => {
      if (req.method === 'POST' && req.url === WEBHOOK_PATH) {
        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', () => {
          try {
            const update = JSON.parse(body);
            bot.handleUpdate(update)
              .then(() => {
                res.writeHead(200);
                res.end('OK');
              })
              .catch((error) => {
                console.error('Webhook update failed:', error);
                res.writeHead(500);
                res.end('Error');
              });
          } catch (error) {
            console.error('Invalid webhook payload:', error);
            res.writeHead(400);
            res.end('Bad Request');
          }
        });
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Bot is running (webhook mode)...');
    });

    server.listen(PORT, async () => {
      const webhookUrl = `${publicUrl}${WEBHOOK_PATH}`;
      await bot.telegram.setWebhook(webhookUrl, { drop_pending_updates: true });
      console.log(`Webhook registered at ${webhookUrl}`);
      console.log(`Health check listening on port ${PORT}`);
    });
    return;
  }

  http.createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running (polling mode)...');
  }).listen(PORT, () => {
    console.log(`Health check listening on port ${PORT}`);
  });

  await bot.launch({ dropPendingUpdates: true });
  console.log('Hire Lens Telegram Bot is running (long polling)...');
}

startBot().catch((err) => {
  console.error('Failed to start the Telegram Bot:', err);
  process.exit(1);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
