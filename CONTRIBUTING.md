# Contributing to N4S4 F0R FUN

## The golden rule: `main` is protected

Nobody pushes to `main` directly, including admins. Every change goes through a pull request, and it can only merge when the automated checks pass.

## Workflow

```bash
git checkout main && git pull
git checkout -b feature/short-description      # or fix/…, content/…, docs/…
# …make your changes…
cd frontend && npm run check                   # lint + tests + type-check + build
npm run test:e2e                               # every page in a real browser
cd ../backend && ruff check . && ruff format . && pytest
git add -A && git commit -m "Add Mars landing-site map"
git push -u origin feature/short-description
```

Then open a pull request on GitHub. The **CI** workflow runs two checks:

| Check | What it runs |
|---|---|
| `frontend` | `npm ci`, `oxlint` (warnings fail the build), Vitest data tests, TypeScript type-check, production build, Playwright smoke tests in a real browser |
| `backend` | `ruff check`, `ruff format --check`, `pytest` |

When both are green and all review comments are resolved, use **Squash and merge**. The branch is deleted automatically.

## Branch names

Two team branches run in parallel (see `docs/specs/README.md`):

- `game` · the Moon campaign. Work on `game/<feature>` branches and open pull requests into `game`.
- `ai` · Cosmic AI. Work on `ai/<feature>` branches and open pull requests into `ai`.

Other work branches from `main`:

- `feature/…` new pages or features
- `fix/…` bug fixes
- `content/…` artifact data, stories, glossary
- `docs/…` documentation only

## Code style

- **Frontend:** TypeScript strict mode. Components in `src/components`, pages in `src/pages`, shared constants and data in `src/data`, hooks in `src/hooks`. Files that export React components should export only components (shared constants go in `src/data`).
- **Backend:** formatted with `ruff format`, linted with `ruff check`. Routes stay thin; logic lives in `app/services`.
- No secrets in code or Git. Use `backend/.env` locally (it is git-ignored) and the hosting provider's environment settings in production.

## Changing facts

Read `docs/data_sources.md` first. Edit `frontend/src/data/artifacts.json`, run `npm run sync-data` in `frontend/`, and include a source link for every new fact. The tests fail if the backend copy is out of sync or a record has no source.
