# Hire Lens Repository Structure

This repository is organized as a monorepo with clear boundaries between products, services, shared code, and infrastructure.

## Top-level layout

- `apps/`: user-facing applications
- `services/`: backend and internal services
- `packages/`: shared code used by more than one codebase
- `terraform/`: infrastructure as code
- `docs/`: developer-facing documentation
- `diagrams/`: architecture and flow diagrams
- `plan/` and `presentation/`: course deliverables

## Codebase responsibilities

### `apps/telegram-bot`
The main product interface. This should contain the Telegram webhook handler, chat commands, onboarding flow, and user-facing bot logic.

### `apps/web-dashboard`
Optional admin or analytics frontend. Keep this separate from the Telegram bot so it can be built or skipped independently.

### `services/backend`
The core API and workflow layer. Use this for auth callbacks, access control, report orchestration, and queue-driven business logic.

### `services/model-inference`
The internal AI model endpoint. This should stay isolated from user-facing code and only be called by trusted backend services.

### `packages/shared`
Common contracts and helpers used by the other codebases. Keep this stable and small so the services do not diverge.

## Rules for the team

- Put deployable code in the right folder from the start.
- Do not copy the same DTOs or validation logic between apps.
- Keep infrastructure code in `terraform/` only.
- Keep documentation updated when ownership or boundaries change.
- If a folder is optional, say so clearly in its README.

## Suggested ownership split

- Telegram bot and UX: one teammate
- Backend logic and analysis flow: one teammate
- Terraform, deployment, and monitoring: one teammate
- Shared contracts: only when needed, with review from the whole team

## Practical guidance

If a change affects more than one codebase, update the shared contract first, then adjust the consuming services. This reduces drift and makes reviews easier.
