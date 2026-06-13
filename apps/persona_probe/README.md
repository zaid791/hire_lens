# PersonaProbe (Web App)

![PersonaProbe banner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

PersonaProbe is the **Hire Lens web dashboard**. It turns a public GitHub username into a developer intelligence report and provides account management, Telegram linking, and an admin panel.

Deployed to **Google Cloud Run** in production; runs locally with Vite during development.

---

## Features

| Feature | Route / location |
|---------|------------------|
| Marketing landing page | `/` |
| Sign in / sign up | `/login` |
| GitHub profile search & analysis | `/app` |
| Telegram account linking | `/app` (Connect Telegram) |
| Admin user overview | `/admin` (Firestore `admins/{uid}` only) |

### Analysis output

- GitHub profile, repos, and recent events
- Dominant language breakdown
- Commit activity patterns (day, hour, style label)
- Gemini-generated persona: archetype, strengths, blind spot, recruiter pitch
- Built-in **`demo`** username for instant showcase without API calls

---

## Tech stack

- React 19 + TypeScript
- Vite
- Tailwind CSS
- Firebase Auth (email/password, Google)
- Firestore (user profiles, quotas, admin access)
- GitHub REST API
- Google Gemini API

---

## Local setup

### Prerequisites

- Node.js 18+
- Firebase project with Auth + Firestore enabled
- Gemini API key (for live analysis)

### Install and run

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev
```

Open the URL printed by Vite (typically `http://localhost:5173`).

### Environment variables

Copy [.env.example](.env.example) to `.env.local`:

| Variable | Description |
|----------|-------------|
| `VITE_FIREBASE_*` | Firebase Web SDK config (Console → Project settings) |
| `VITE_GEMINI_API_KEY` | Required for live GitHub analysis |
| `VITE_TELEGRAM_BOT_USERNAME` | Bot @username without `@` (Connect Telegram flow) |

After a Terraform deploy, values are also written to `.env.production.generated`.

---

## Routes

| Path | Auth | Description |
|------|------|-------------|
| `/` | Public | Landing page |
| `/login` | Public | Authentication |
| `/app` | Required | Main dashboard and search |
| `/admin` | Admin only | User list with tier, quota, Telegram status |

Admin access is controlled by a Firestore document at `admins/{firebase-uid}` — not by a frontend env variable.

---

## Project structure

```
src/
├── components/     # UI (SearchPage, AdminPage, AuthForm, …)
├── services/       # GitHub, Gemini, Telegram link, admin API
├── hooks/          # Client-side routing (usePathname)
├── utils/          # Language & commit analysis, quota helpers
└── types/          # Shared TypeScript types
```

---

## Production build

```bash
npm run build    # output in dist/
```

Cloud Build bakes `VITE_*` variables at image build time via `terraform_new/cloudbuild/frontend.yaml`.

---

## Demo tips (for submission / presentation)

1. Use username **`demo`** for a guaranteed instant result.
2. Sign in before demonstrating Telegram linking or admin features.
3. For admin demo: ensure your Firebase UID exists in `admins/{uid}` in Firestore.
4. Watch GitHub API rate limits when analyzing real profiles repeatedly.

---

## Related docs

- [Root README](../../README.md)
- [Local development guide](../../docs/LOCAL_DEVELOPMENT.md)
- [Deployment guide](../../terraform_new/DEPLOYMENT_GUIDE.md)
