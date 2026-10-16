# trogonstack/require-private-app-directories

Require fractal directories under `src/app` to be private folders prefixed with an underscore.

## Why

Inside the App Router, every folder is a potential route segment. Prefixing support directories such as components, hooks, and services with an underscore opts them out of routing and signals that they are not routes. See [React project files and directories names convention](https://github.com/straw-hat-team/adr/blob/main/src/adrs/5541831634/README.md).

## Detection

For files under `src/app`, walks the directory segments after `app` and stops at the first segment starting with `_`. Reports when a segment before that equals one of `services`, `storages`, `schemas`, `components`, `hooks`, `contexts`, `constants`, `types`, `styles`, `assets`, `i18n`, `helpers`, or `server`, naming the expected `_<name>`. Only the first offending segment is reported, once on the program. Route groups `(x)`, dynamic segments `[id]`, and slots `@slot` are ordinary segments.

## Examples

Invalid:

```tsx
// src/app/dashboard/components/button.tsx
export const Button = () => null;
```

Valid:

```tsx
// src/app/dashboard/_components/button.tsx
export const Button = () => null;
```

## Options

This rule has no options.
