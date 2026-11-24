# Ingengo API Agent Rules

These instructions apply to `nexcoderw/ingengo-api`. Read [the Git and pull request
rules](.agents/git.md) before editing.

## Required Workflow

1. Inspect the working tree and report the repository, current branch, proposed task branch,
   PR base, and focused scope. Preserve unrelated changes.
2. Agents inspect and edit files and use read-only Git commands. Humans run dependency
   installation, formatting, linting, type-checking, tests, builds, servers, database operations,
   deployments, and all Git writes. Provide exact commands and report which checks ran.
3. Keep HTTP contracts in controller DTOs and Swagger metadata. Follow the owning NestJS
   module's existing boundaries. This repository owns `prisma/schema.prisma` and
   `prisma/migrations/` alongside the API. Keep pooled runtime connections and direct migration
   connections configured through the existing environment settings.
4. Keep real credentials out of source, logs, and handoffs. Use safe placeholders in environment
   examples and fake dependencies for unit tests. Humans verify database or deployment changes
   against an expressly selected environment.
5. Provide a complete PR handoff with an exact staging and commit command pair for each changed
   file. Give review and verification status using evidence from the task.

The user's current instructions take precedence.
