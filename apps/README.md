# Apps

User-facing applications in the Hire Lens monorepo.

---

## Applications

| App | Folder | Status | Description |
|-----|--------|--------|-------------|
| **PersonaProbe** | `persona_probe/` | **Active** | Main web dashboard — search, auth, Telegram linking, admin panel |
| **Telegram Bot** | `telegram-bot/` | **Active** | Primary chat interface for linked users |
| Web Dashboard | `web-dashboard/` | Placeholder | Admin UI is implemented inside PersonaProbe at `/admin` |

---

## Boundaries

- User-facing UI and client logic live here
- Backend APIs live in `services/`
- Infrastructure lives in `terraform_new/`
- Shared types will eventually live in `packages/shared/`

---

## Quick start

```bash
# Web app
cd persona_probe && npm install && npm run dev

# Telegram bot
cd telegram-bot && npm install && npm run dev
```

Full local setup: [docs/LOCAL_DEVELOPMENT.md](../docs/LOCAL_DEVELOPMENT.md)

---

## Per-app documentation

- [persona_probe/README.md](persona_probe/README.md)
- [telegram-bot/README.md](telegram-bot/README.md)
