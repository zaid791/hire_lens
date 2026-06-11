# Telegram Bot

Telegram interface for Hire Lens. Requires a linked website account before any commands work.

## Purpose

- Receive Telegram webhook updates (Cloud Run) or long-polling (local dev)
- Analyze GitHub profiles for linked website users
- Share quota and subscription tier with the web dashboard

## Account linking

Users must:

1. Create an account on the website (`/login`)
2. Click **Connect Telegram** on the dashboard (`/app`)
3. Tap **Start** in the Telegram chat opened by the link

The bot does not accept `/link` codes or standalone Telegram-only accounts.

## Local development

```bash
cp .env.example .env
# Set TELEGRAM_BOT_TOKEN, GEMINI_API_KEY, APP_URL=http://localhost:3000
gcloud auth application-default login
npm install && npm run dev
```

Set `APP_URL` to your local frontend URL so link instructions point to the correct dashboard.

On the website, set `VITE_TELEGRAM_BOT_USERNAME` in `.env.local` (your bot @username without `@`).

## Notes

- Shared types should live in `packages/shared` when extracted
- Firestore access uses Firebase Admin SDK + Application Default Credentials
