# trogonstack/no-cross-route-imports

Disallow importing between sibling routes under `src/app`.

## Why

Routes that import each other couple features that should change independently, and the risk of a change grows with its height in the application tree. [ADR 5541831634](https://github.com/straw-hat-team/adr/blob/main/src/adrs/5541831634/README.md) requires shared code to live in a common parent of the routes, which signals that it is shared and riskier to change.

## Detection

The rule applies when both the importing file and the resolved import target are under `src/app`. Each side has a route: the directory segments after `app`, up to but excluding the first segment that starts with `_` (a private directory). Route groups such as `(shop)` and dynamic segments such as `[id]` are part of the route. The file name is not part of the route.

An import is allowed when the target route equals or is an ancestor of the importing route. Anything else is reported, naming both routes (`/` is the root route).

Checked sources are `import` declarations (including `import type`), `export ... from`, `export * from`, and `import()` with a string literal. Relative specifiers and specifiers starting with a source alias resolve into `src`. Packages, unresolvable specifiers, and files outside `src/app` are ignored.

## Examples

Invalid:

```tsx
// src/app/checkout/page.tsx
import { CartSummary } from '@/app/cart/_components/cart-summary';

export default function Page() {
  return <CartSummary />;
}
```

Valid:

```tsx
// src/app/checkout/page.tsx
import { Summary } from '@/app/_components/summary';

export default function Page() {
  return <Summary />;
}
```

## Options

This rule has no options.

## Settings

Source aliases come from the shared `settings.trogonstack` object (default: `["@/"]`).

```json
{
  "settings": {
    "trogonstack": {
      "sourceAliases": ["@/"]
    }
  }
}
```

## When not to use it

Projects that do not use route directories under `src/app` have nothing to check.
