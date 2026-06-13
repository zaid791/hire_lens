# Shared Package

Reserved for code shared across Hire Lens applications and services.

---

## Purpose

- Common TypeScript/Python types for profile and analysis data
- Validation rules and DTOs used by both bot and web app
- Small utilities that must stay consistent across codebases

---

## Current status

Types and analysis helpers currently live inside each app (`apps/persona_probe/src/types`, `apps/telegram-bot/src/types`). Extract shared contracts here when duplication becomes a maintenance burden.

---

## Boundaries

| Do | Don't |
|----|-------|
| Keep contracts small and stable | Put business logic here |
| Version breaking schema changes carefully | Import from `apps/` into this package |
| Document exported types | Add deployment or Terraform code |

---

## Suggested contents (future)

- `ProfileAnalysis` / `QuotaResult` types
- Subscription tier enums and limit constants
- Shared GitHub response normalizers

---

## Related

- [Repository structure](../docs/repo-structure.md)
- [Apps overview](../apps/README.md)
