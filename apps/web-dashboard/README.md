# Web Dashboard (placeholder)

This folder was reserved for a standalone admin frontend.

## Current status

**Admin functionality is implemented inside PersonaProbe** at the protected `/admin` route:

- Lists all website users from Firestore
- Shows subscription tier (base / premium)
- Shows daily quota used and remaining
- Shows Telegram link status

Access is granted via a Firestore document at `admins/{firebase-uid}`.

## Why it lives in PersonaProbe

Keeping admin inside the existing Cloud Run frontend avoids a separate deployment, extra Terraform resources, and additional hosting configuration for submission.

## If you extend this folder later

- Keep it separate from the Telegram bot
- Share API contracts through `packages/shared`
- Do not duplicate Firestore access patterns without updating security rules

See [persona_probe/README.md](../persona_probe/README.md) for the live admin implementation.
