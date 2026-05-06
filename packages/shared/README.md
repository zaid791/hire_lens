# Shared Package

This folder will contain code that is shared across the Hire Lens codebases.

## Purpose

- Store common request and response schemas
- Share validation rules and types
- Reuse utility functions that must stay consistent across services

## Boundaries

- Keep business logic out of this package when possible
- Do not put deployment-specific code here
- Avoid coupling the services through direct imports from app folders

## Suggested ownership

- Data contracts, DTOs, enums, and reusable helpers

## Notes

- This package should stay small and stable
- If something is specific to only one service, keep it inside that service instead
