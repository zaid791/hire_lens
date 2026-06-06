# Telegram Bot

This folder will contain the Telegram-first user interface for Hire Lens.

## Purpose

- Receive Telegram webhook updates
- Handle onboarding and commands
- Trigger profile analysis and job matching requests
- Present results back to HR users

## Boundaries

- No infrastructure code here
- No model hosting code here
- Shared request and response types should live in `packages/shared`
- Set `APP_URL` in `.env` so the `/link` command points at your local dashboard during development and at the deployed frontend in production

## Suggested ownership

- Bot flows, UX, and Telegram integration

## Notes

- Keep this service focused on chat interaction only
- Put reusable contracts in the shared package instead of copying DTOs
