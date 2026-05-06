# Web Dashboard

This folder will contain the optional admin or analytics frontend for Hire Lens.

## Purpose

- Show usage analytics
- Manage moderation or review tasks
- Provide an internal admin view if the team decides to ship one

## Boundaries

- This is optional and should stay separate from the Telegram bot
- Do not place backend or Terraform code here
- Share API contracts through `packages/shared`

## Suggested ownership

- Frontend UI and presentation layer

## Notes

- Keep this app lightweight and optional until the main bot flow is stable
