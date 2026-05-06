# Backend Service

This folder will contain the core backend logic for Hire Lens.

## Purpose

- Expose API endpoints used by the bot and dashboard
- Handle auth callbacks, sessions, access control, and business rules
- Orchestrate profile analysis, report storage, and queue-based jobs

## Boundaries

- Keep infrastructure definitions in `terraform/`
- Keep UI code in `apps/`
- Keep shared DTOs, schemas, and helpers in `packages/shared`

## Suggested ownership

- Backend APIs, workflows, and service orchestration

## Notes

- If the backend becomes large, split by domain but keep one service boundary
