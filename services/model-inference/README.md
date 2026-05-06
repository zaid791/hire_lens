# Model Inference Service

This folder will contain the self-hosted open-source model endpoint for Hire Lens.

## Purpose

- Host the inference API for summarization or matching
- Keep model calls internal to the system
- Provide a stable contract for backend services

## Boundaries

- No Telegram code here
- No frontend code here
- No Terraform code here
- Use `packages/shared` for request and response schemas

## Suggested ownership

- Model serving, prompt handling, inference API, and performance tuning

## Notes

- Treat this as an internal service, not a user-facing app
