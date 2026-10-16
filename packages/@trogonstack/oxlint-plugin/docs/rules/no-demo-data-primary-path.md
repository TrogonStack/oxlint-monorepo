# trogonstack/no-demo-data-primary-path

Prevent top-level routes from relying on demo data as primary data source.

## Why

Demo or fixture data on a real route makes an app look done while doing nothing. It belongs in previews, stories, and tests, not the main path.

## Detection

Applies to primary route files: `page`, `layout`, and `route` modules under `app/` (including `src/app/`), and any module under `pages/` (including `src/pages/`).

A runtime binding imported from a configured demo module (`settings.trogonstack.demoDataModules`, default: `@/demo`, `@/mocks`, `@/fixtures`, including their subpaths) is allowed only as the right-hand side of `??` when its left-hand side is a real-data call or that call's immutable `const` result in the same lexical scope. A real-data call is a call whose callee chain starts with a name from `settings.trogonstack.realDataIndicators` (default: `fetch`, `db`, `prisma`, `trpc`), such as `fetch(...)`, `db.report.findMany()`, or `trpc.rows.list.useQuery()`. Type-only imports and type-only references are not runtime fixture use.

An unrelated real-data call, a data-layer import, another fixture binding, direct fixture use, and `||` do not make fixture data safe. Unused fixture bindings are not a primary-path use, while side-effect fixture imports are reported.

Transparent TypeScript value wrappers such as `as Rows`, `rows!`, and `rows satisfies Rows` do not change whether a runtime fixture reference is a permitted fallback or a primary-path use.

## Examples

Invalid:

```tsx
// app/page.tsx
import { rows } from '@/fixtures/rows';
import { db } from '@/lib/db';

export async function Page() {
  const records = await db.report.findMany();
  return records || rows;
}
```

Valid:

```tsx
// app/page.tsx
import { rows } from '@/fixtures/rows';
import { db } from '@/lib/db';

export async function Page() {
  const records = await db.report.findMany();
  return records ?? rows;
}
```

## Options

This rule has no options.

## Settings

Module lists come from the shared `settings.trogonstack` object. A list that is missing or not an array of strings keeps its default; a valid list replaces the default.

```json
{
  "settings": {
    "trogonstack": {
      "demoDataModules": ["@/demo", "@/mocks", "@/fixtures"],
      "realDataIndicators": ["fetch", "db", "prisma", "trpc"]
    }
  }
}
```
