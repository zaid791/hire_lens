# Hire Lens Execution Guide

This document gives a concise execution guide for Hire Lens, the cloud computing project.

## Project Idea

Hire Lens is a Telegram-first HR assistant that analyzes public GitHub profiles and compares them with job descriptions. The system should help recruiters quickly understand whether a candidate matches a role.

Instead of relying on paid external AI APIs, we plan to host an open-source model such as Qwen ourselves and use it for summarization and candidate matching. This keeps the data flow inside our system and avoids API-key dependence.

The easiest Azure setup for beginners is:

- Azure Functions for the Telegram webhook, OAuth callbacks, and API endpoints
- Azure Container Apps for the self-hosted model inference service
- Azure Static Web Apps for a tiny admin dashboard if we need one
- Azure Cosmos DB, Blob Storage, and Service Bus for data, files, and background jobs

This keeps the app serverless where possible and avoids AKS or full VM management for most of the system.

The first version should focus on:

- Telegram bot as the main user interface
- OAuth login with Google/Facebook only, so no passwords are stored
- Server-side sessions or short-lived tokens
- GitHub profile analysis based on public data
- Job description comparison
- Access limits for users
- Terraform-based cloud deployment
- Stripe payments only in later versions

## How To Execute The Plan

### 1. Align the team on the scope

Decide that the bot is the main product and that the first release should be simple and reliable. Do not try to build every feature at once.

### 2. Finalize the MVP

Implement only these core flows first:

- Google/Facebook sign-in
- Telegram bot registration and session creation
- GitHub profile analysis from username or profile URL
- Job description comparison
- Saving and retrieving analysis reports

### 3. Choose the Azure services

Use managed Azure services so the project stays beginner-friendly:

- Azure Functions for backend logic, Telegram webhook handling, and OAuth callbacks
- Azure Container Apps for the self-hosted model service
- Azure Static Web Apps for any small admin dashboard
- Azure Cosmos DB for application data
- Azure Blob Storage for exported reports and cached files
- Azure Service Bus for background jobs and notifications
- Application Insights and Azure Monitor for logging and alerts

### 4. Define the data model

Create tables or documents for:

- Users
- Sessions
- Candidate profiles
- Analysis reports
- Job descriptions
- Usage limits
- Payment or subscription status

### 5. Build the Telegram bot

Implement bot commands step by step:

- `/start` for onboarding
- `/login` for OAuth sign-in
- `/analyze` for GitHub profile analysis
- `/compare` for job description matching
- `/report` to retrieve a saved analysis
- `/usage` to show user limits

### 6. Add the analysis pipeline

Use a simple pipeline first:

- Collect public GitHub data
- Extract useful signals such as repositories, languages, activity, and contribution style
- Generate a structured summary
- Compare the summary with the job description
- Return the result to Telegram

If you later add AI, keep a deterministic fallback version so the system still works without the model. A good practical path is:

- start with rules-based scoring
- add the self-hosted model as a separate inference service
- keep the rules-based path as fallback whenever the model is slow or unavailable

If you want to use a model like Qwen, host it on a GPU-capable Azure resource behind an internal API so the Telegram bot never talks to it directly.

### 7. Add access control

Limit usage by:

- number of analyses per day
- number of job comparisons per week
- free vs premium tier

### 8. Prepare Terraform

Write Terraform modules for:

- resource group
- storage
- functions
- messaging
- monitoring
- model hosting or inference service on Azure Container Apps
- optional auth resources

Keep everything in `dev` first, then clone the setup into `prod` later.

### 9. Test the system locally

Before deployment, test:

- bot command handling
- login/session flow
- profile analysis logic
- report generation
- rate limiting
- error handling

### 10. Deploy in small steps

Do not deploy everything at once.

1. Provision the Azure resources with Terraform
2. Deploy the backend functions
3. Connect the Telegram bot webhook
4. Connect the storage layer
5. Enable monitoring and alerts
6. Run a demo with a few sample GitHub profiles

### 11. Keep the presentation in sync

The slide deck in `presentation/` should match the same architecture and milestone plan.

## Team Split

- Mohammed Zaid Shaikh: Telegram bot flow and user experience
- Piotr Bartosiewicz: analysis logic and backend APIs
- Krzysztof Krawiec: Terraform, deployment, and monitoring

## Beginner Notes

- Keep the first version simple.
- Prefer managed cloud services over self-hosted infrastructure.
- Use small reusable modules.
- Add features only after the bot works end to end.
- Document every command and deployment step.

## Practical Next Step

Start by writing the Telegram bot command handlers and the OAuth login flow, then connect them to a minimal Azure backend.

After that, add the internal model service on Azure Container Apps and test it on a small set of GitHub profiles before turning on the more advanced matching logic.
