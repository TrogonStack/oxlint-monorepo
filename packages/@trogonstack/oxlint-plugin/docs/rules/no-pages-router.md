# trogonstack/no-pages-router

Disallow files under `src/pages`; use the App Router in `src/app`.

## Why

Routes live in the App Router under `src/app`, where route trees and colocation follow one convention. The Pages Router is a second routing model that splits the application tree. See [React project files and directories names convention](https://github.com/straw-hat-team/adr/blob/main/src/adrs/5541831634/README.md).

## Detection

Flags any file whose path relative to the nearest enclosing `src` directory starts with `pages/`. Reports once on the program.

## Examples

Invalid:

```tsx
// src/pages/index.tsx
export default function Home() {
  return null;
}
```

Valid:

```tsx
// src/app/page.tsx
export default function Home() {
  return null;
}
```

## Options

This rule has no options.
