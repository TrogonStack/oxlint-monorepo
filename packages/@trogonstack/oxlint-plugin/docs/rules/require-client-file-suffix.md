# trogonstack/require-client-file-suffix

Require files with a `use client` directive to be named `*.client.*`.

## Why

Server rendering is the default, so client-side files are the opt-in and are named for it. [ADR 5541831634](https://github.com/straw-hat-team/adr/blob/main/src/adrs/5541831634/README.md) requires `*.client.[extension]` for client-side files, which makes the boundary visible in file listings and imports.

## Detection

The rule applies to files whose first statement is the `'use client'` directive and reports the directive when the file base name does not contain `.client.` before the extension.

Next.js special files that must be client components are exempt under `src/app`: `error` and `global-error` with any extension.

## Examples

Invalid:

```tsx
// src/app/cart/_components/button.tsx
'use client';

export function Button() {
  return <button />;
}
```

Valid:

```tsx
// src/app/cart/_components/button.client.tsx
'use client';

export function Button() {
  return <button />;
}
```

```tsx
// src/app/error.tsx
'use client';

export default function Error() {
  return <p>Something went wrong</p>;
}
```

## Options

This rule has no options.

## When not to use it

Projects that mark client components by another convention should disable this rule.
