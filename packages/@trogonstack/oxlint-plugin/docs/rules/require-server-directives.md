# trogonstack/require-server-directives

Require `'use server'` and `import 'server-only'` in fractal `server` directories.

## Why

Code under a `server` directory must never reach the client bundle. [ADR 5541831634](https://github.com/straw-hat-team/adr/blob/main/src/adrs/5541831634/README.md) requires the `'use server'` directive and `import 'server-only'` at the top of every file there, so the boundary is enforced by the framework and not by convention.

## Detection

The rule applies to files with any directory segment named `server` or `_server` below the nearest enclosing `src` directory. Each missing piece is reported on the program with its own message:

- The first statement must be the `'use server'` directive.
- The file must contain a side-effect `import 'server-only'` (no specifiers).

## Examples

Invalid:

```ts
// src/app/cart/_server/load-cart.ts
export async function loadCart() {
  return [];
}
```

Valid:

```ts
// src/app/cart/_server/load-cart.ts
'use server';
import 'server-only';

export async function loadCart() {
  return [];
}
```

## Options

This rule has no options.

## When not to use it

Projects without Next.js server directories have nothing to check.
