# trogonstack/no-server-file-suffix

Disallow the `.server` file name suffix; server is the default, so name client files `*.client.*` instead.

## Why

Server-side rendering is the default strategy, and client-side code is the opt-in. Marking the default with a `.server` suffix adds noise, while marking the exception with `.client` keeps the distinction visible. See [React project files and directories names convention](https://github.com/straw-hat-team/adr/blob/main/src/adrs/5541831634/README.md).

## Detection

Flags a file whose base name has a `server` segment between the first segment and the extension, such as `db.server.ts`, `page.server.tsx`, or `x.server.mjs`. A file named `server.ts` is not reported. Reports once on the program.

## Examples

Invalid:

```ts
// src/app/_services/db.server.ts
export const db = {};
```

Valid:

```ts
// src/app/_services/db.ts
export const db = {};
```

```ts
// src/app/_services/storage.client.ts
export const storage = {};
```

## Options

This rule has no options.
