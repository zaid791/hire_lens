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
2. Create a local env file from [.env.example](.env.example) and set `GEMINI_API_KEY` plus the `VITE_FIREBASE_*` values from your Firebase project.
3. In Firebase Console, enable the sign-in methods you plan to use. The app supports Email/Password, Google, and GitHub login.
4. Start the app:
   `npm run dev`

## Environment Variables

The app expects the following variable at runtime:

- `GEMINI_API_KEY`: Required for Gemini analysis.

The Firebase client also reads these Vite variables from `.env.local`:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

For local development, store them in [.env.local](.env.local). The repository also includes [.env.example](.env.example) as a template.

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
