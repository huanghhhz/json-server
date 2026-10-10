# AGENTS.md

Guide for AI agents working in this repo.

## Project

json-server v1 (beta) — a zero-config REST API mock server. Give it a `db.json`/`db.json5` file or a directory of JSON files, it serves CRUD routes over it.

- TypeScript, ESM (`"type": "module"`), Node >= 22.12 (runs TS directly via `--experimental-strip-types`)
- Web framework: `@tinyhttp/app`; storage: `lowdb`; views: `eta`; body parsing: `milliparsec`
- `src/` is the source; `lib/` is the compiled output (gitignored)

## Commands

```shell
pnpm dev         # run against fixtures/db.json with file watching
pnpm build       # tsc -> lib/
pnpm typecheck   # tsc --noEmit
pnpm test        # node --test on src/*.test.ts
pnpm lint        # oxlint src
pnpm fmt         # oxfmt (write)
pnpm fmt:check   # oxfmt --check
```

## Architecture

- `src/bin.ts` — CLI entry (arg parsing, file loading, watch mode, bootstraps the app)
- `src/app.ts` — HTTP app: routes, query parsing (`_sort`, `_page`, `_per_page`, `_embed`, `_where`, `_keys`), static file serving
- `src/service.ts` — the CRUD/logic layer on top of the lowdb instance (list, create, read, update, delete, embed)
- `src/matches-where.ts` / `src/parse-where.ts` / `src/where-operators.ts` — `_where` filter parsing and matching
- `src/paginate.ts` — `_page`/`_per_page` pagination
- `src/random-id.ts` — id generation
- `src/adapters/` — lowdb adapters: `dir-adapter` (maps a directory tree to nested JSON), `normalized-adapter` (normalizes ids, strips `$schema`), and a file-change observer
- `views/index.html` — the HTML home page template

## Conventions

- Import local files **with the `.ts` extension** (e.g. `import { Service } from './service.ts'`). tsconfig uses `allowImportingTsExtensions` + `rewriteRelativeImportExtensions` so imports are rewritten to `.js` in `lib/`.
- Formatting is enforced by `oxfmt`: **no semicolons, single quotes**.
- `strict` TypeScript; `erasableSyntaxOnly` means no enums/namespaces — only type-strippable syntax.
- Every non-trivial module has a co-located `*.test.ts` using `node:test` + `node:assert`. Tests are excluded from `lib/` build but typechecked.
- No `any` leaks at trust boundaries; `parseListParams` takes `req: any` deliberately (tinyhttp types) — don't "fix" that without a reason.
- Data shape: `Data = Record<string, Item[] | Item>` — plural keys map to arrays, singular keys to single objects.
- Directory mode: `dir/a/b.json` → `{ a: { b: <contents> } }` (subdir → key, filename without ext → key). Only top-level keys get full CRUD; nested dirs surface as one object at the parent key.

## Testing

Tests are plain `node:test` files next to the source they cover, run via `pnpm test`. Add or update a `*.test.ts` alongside any behavior change. No test framework beyond what's in the devDeps.
