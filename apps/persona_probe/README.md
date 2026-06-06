# PersonaProbe

![PersonaProbe banner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

PersonaProbe turns a GitHub username into a polished developer profile report. It combines GitHub API data, commit activity analysis, language breakdowns, and Gemini-generated insights to produce a shareable developer persona.

## What it does

- Searches any public GitHub username and pulls profile, repository, and activity data.
- Analyzes dominant languages and commit patterns from the user’s repositories and events.
- Generates a personality summary, archetype, strengths, blind spot, and recruiter pitch with Gemini.
- Includes a built-in `demo` profile so the app can be showcased without an API lookup.

## Tech Stack

- React 19
- Vite
- TypeScript
- Tailwind CSS
- Google Gemini API
- GitHub REST API

## Local Setup

### Prerequisites

- Node.js 18 or newer
- A Gemini API key
- A Firebase project with Auth and Firestore enabled

### Install and run

1. Install dependencies:
   `npm install`
2. Create a local env file from [.env.example](.env.example) and set the `VITE_FIREBASE_*` values from your Firebase project (and `VITE_GEMINI_API_KEY` if using Gemini).
3. In Firebase Console, enable **Email/Password** and **Google** sign-in under Authentication → Sign-in method.
4. Start the app:
   `npm run dev`

## Environment Variables

Copy [.env.example](.env.example) to `.env.local` and fill in:

- `VITE_FIREBASE_*` — Firebase Web SDK config (Firebase Console → Project settings)
- `VITE_GEMINI_API_KEY` — required when using the gemini model variant locally

Authentication is handled by **Firebase Auth** (email/password and Google). No custom backend OAuth is required.

## Showcase Tips

- Use the username `demo` to show the app instantly without calling GitHub or Gemini.
- Search a recognizable public developer profile to demonstrate the language and commit pattern breakdown.
- If you are presenting live, make sure your Gemini key is valid and GitHub rate limits are not exceeded.

## Project Structure

- `src/components`: UI sections for the search flow, results, cards, and navigation.
- `src/services`: GitHub and Gemini API integration.
- `src/utils`: Language and commit activity analysis helpers.
- `src/types`: Shared TypeScript types for profile data and analysis output.

## Build

To create a production build:

`npm run build`

## Notes

- Public GitHub data is subject to API rate limits.
- The Gemini analysis depends on a valid API key and network access.
