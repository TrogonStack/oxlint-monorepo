# trogonstack/no-hoisted-modules

Disallow modules that sit in a fractal directory higher than the one every consumer lives in.

## Why

Code that only one feature uses should live with that feature, so it is found, changed, and deleted together with it. A module kept higher in the tree looks shared when it is not, and every change to it carries the risk of a shared module. [ADR 5541831634](https://github.com/straw-hat-team/adr/blob/main/src/adrs/5541831634/README.md) asks to colocate files at the closest common parent of their consumers.

## Detection

The fractal directories are `src`, `src/app` and every route directory below it, `components/<name>` (or `_components/<name>` under `src/app`), and `src/libs/<name>`. The owner of a file is its nearest enclosing fractal directory.

The rule reads every JavaScript and TypeScript file under the `src` directory once per process and records which files import which. It follows `import ... from`, `import '...'`, `export ... from`, `import()`, and `require()` with a string literal, resolving relative specifiers and source aliases to files, directory indexes, and extensionless paths.

For a file, the rule takes the files that import it, ignoring unit tests (`*.test.*` and `*.spec.*`), and finds the deepest fractal directory that contains all of them. It reports the file when that directory is strictly deeper than the file's owner and sits inside it. Files that nothing imports are not reported.

Route files directly under `src/app` (those outside a private `_` directory), unit tests, and anything under `src/libs`, `src/@types`, or `src/polyfills` are never reported.

Files inside a component directory such as `src/components/Button` belong to that component's own fractal directory, so a component used by a single route is not reported as a whole.

The project is scanned once, so editors and language server integrations may need a restart to see files that were moved or created after the first lint.

## Examples

Invalid:

```tsx
// src/hooks/use-cart.ts
export const useCart = () => 1;

// src/app/cart/page.tsx
import { useCart } from '@/hooks/use-cart';

export default function Page() {
  useCart();
  return null;
}
```

Valid:

```tsx
// src/app/_hooks/use-cart.ts
export const useCart = () => 1;

// src/app/cart/page.tsx
import { useCart } from '@/app/_hooks/use-cart';

export default function Page() {
  useCart();
  return null;
}

// src/app/checkout/page.tsx
import { useCart } from '@/app/_hooks/use-cart';

export default function Page() {
  useCart();
  return null;
}
```

## Options

This rule has no options.

## Settings

Source aliases and fractal directory names come from the shared `settings.trogonstack` object (defaults: `["@/"]` for `sourceAliases`, the ADR directory names for `fractalDirectories`).

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

Projects that do not follow the fractal directory pattern under `src` have nothing to check.
