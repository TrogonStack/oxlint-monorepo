# trogonstack/require-app-entry-file

Require the application entry to be `src/app/index.tsx` instead of `src/main` or `src/index`.

## Why

A single known entry point keeps the application layout predictable across Vite projects and keeps `src` free of loose files. Enable it for Vite applications only, since published packages commonly expose `src/index.ts` as their entry. See [React project files and directories names convention](https://github.com/straw-hat-team/adr/blob/main/src/adrs/5541831634/README.md).

## Detection

Flags a file sitting directly in a `src` directory whose name is `main` or `index` with a `js`, `jsx`, `ts`, `tsx`, `mjs`, `cjs`, `mts`, or `cts` extension. Files in subdirectories, such as `src/app/index.tsx`, and files outside any `src` directory are ignored. Reports once on the program.

## Examples

Invalid:

```tsx
// src/main.tsx
export const entry = 'main';
```

Valid:

```tsx
// src/app/index.tsx
export const entry = 'app';
```

## Options

This rule has no options.
