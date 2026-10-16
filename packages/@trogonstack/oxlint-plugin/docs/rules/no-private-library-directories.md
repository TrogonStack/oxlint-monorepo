# trogonstack/no-private-library-directories

Disallow underscore-prefixed private directories inside libraries under `src/libs`, except `__tests__`.

## Why

Private folders are an App Router convention for opting directories out of routing. A library under `src/libs` is not routed, so its directories should be named plainly. See [React project files and directories names convention](https://github.com/straw-hat-team/adr/blob/main/src/adrs/5541831634/README.md).

## Detection

For files under `src/libs/<lib>/`, reports the first directory after the library name that starts with `_`, other than `__tests__`. Reports once on the program.

## Examples

Invalid:

```ts
// src/libs/billing/_internal/charge.ts
export const charge = 1;
```

Valid:

```ts
// src/libs/billing/internal/charge.ts
export const charge = 1;
```

```ts
// src/libs/billing/__tests__/charge.ts
export const charge = 1;
```

## Options

This rule has no options.
