# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Kanban board ("kanban" in package.json): React 19 + TypeScript + Vite, styled with Tailwind CSS v4. `zustand` (state) and `@dnd-kit/*` (drag and drop) are installed but not used yet — `src/App.tsx` is still a heading-only scaffold, so there is no architecture beyond the setup below. Work is tracked in tickets named `K00N`; GitLab is the remote (`.gitlab/merge_request_templates/Default.md`).

## Commands

```bash
npm run dev            # Vite dev server
npm run build          # tsc -b && vite build (type-check is part of the build)
npm run lint           # oxlint (not ESLint)
npm run format         # prettier --write .
npm run format:check   # prettier --check .
npm test               # vitest in WATCH mode
npm test -- --run      # single pass (what CI/pre-push uses)
npx vitest run src/App.test.tsx            # one file
npx vitest run -t "renders the Kanban"     # one test by name
```

## Tooling notes

- **Tests**: Vitest config lives in `vite.config.ts` (jsdom environment). `src/test/setup.ts` loads `@testing-library/jest-dom/vitest`, so `toBeInTheDocument()` etc. work without imports. Tests sit next to the source as `*.test.tsx`.
- **Lint**: `.oxlintrc.json` enables the `react`, `typescript`, `oxc` plugins; `react/rules-of-hooks` is an error, `react/only-export-components` a warning. Blank lines between statements are enforced by `@stylistic/padding-line-between-statements`, loaded as an oxlint `jsPlugins` entry (alpha); `npx oxlint --fix` inserts them.
- **Format**: Prettier with no semicolons and single quotes. `.claude/skills` and `skills-lock.json` are in `.prettierignore` because they are vendored third-party files.
- **Skills**: `.claude/skills/` holds skills installed with `npx skills add <owner/repo@skill> -y --copy -a claude-code` and pinned in `skills-lock.json`. Update with `npx skills update`; don't hand-edit them. Exception: `unit-test/` is ours (not in the lock file): the house rules for tests and faker mock factories in `src/mocks/`; edit it directly.
- **TypeScript**: `tsconfig.app.json` is strict about `noUnusedLocals`/`noUnusedParameters`, `verbatimModuleSyntax` (use `import type` for type-only imports) and `erasableSyntaxOnly` (no enums, namespaces or constructor parameter properties).

## Git workflow

Hooks are installed by `npm install` (`prepare` → `lefthook install`), configured in `lefthook.yml`:

- `commit-msg`: commitlint. Format is `type(TICKET): lower-case subject` — the scope is **required and upper-case** (e.g. `chore(K005): add commitlint and lefthook git hooks`). This overrides the `config-conventional` defaults in `commitlint.config.js`.
- `pre-commit`: oxlint on staged JS/TS files, and `prettier --write` on all staged files (fixes are re-staged).
- `pre-push`: lint, format check, `npm test -- --run` and build, in parallel. Run these yourself before pushing; don't bypass with `--no-verify`.

Branches are named `<type>/<ticket-id>-<slug>` (e.g. `chore/K005-commitlint-lefthook`).

MR titles are **not** in commit format. They use a capitalised prefix, a slash, then the title: `Prefix/Title` (e.g. `Feature/Add drag and drop between columns`). Prefixes: `Feature/`, `Bugfix/`, `Refactor/`, `Chore/`, `Docs/`, `Test/`. The same rule is the checklist item in `.gitlab/merge_request_templates/Default.md`; change both together.

MR descriptions: the MR tool's `body` is free-form and does **not** apply the template, so build it from `.gitlab/merge_request_templates/Default.md` yourself. Read that file first, then keep its headings and order (`## What`, `## How to test`, `## Screenshots`, `## Checklist`) and fill each in:

- **What**: what changed and why, in a few lines. `Closes #` takes the GitLab issue number (e.g. `Closes #7`), not the `K00N` ticket id.
- **How to test**: real, numbered steps (commands, or what to click and expect). Don't leave the `1.`/`2.` placeholders.
- **Screenshots**: delete the section when there is no UI change (the template says so).
- **Checklist**: keep every item. Tick `[x]` only what you actually ran or confirmed this session; leave the rest `[ ]`.
- Remove the `<!-- ... -->` hints. Never open an MR with the empty template or a free-form body.
