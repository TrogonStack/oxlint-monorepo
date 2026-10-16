# trogonstack/require-colocated-modules

Require modules to sit in the closest fractal directory that contains every consumer, neither higher nor lower.

## Why

Code that only one feature uses should live with that feature, so it is found, changed, and deleted together with it. A module kept higher in the tree looks shared when it is not, and every change to it carries the risk of a shared module. A module kept lower than its consumers hides in a directory that suggests it is private, so importers reach into another feature's internals. [ADR 5541831634](https://github.com/straw-hat-team/adr/blob/main/src/adrs/5541831634/README.md) asks to colocate files at the closest common parent of their consumers.

## Detection

The fractal directories are `src`, `src/app` and every route directory below it, `components/<name>` (or `_components/<name>` under `src/app`), and `src/libs/<name>`. The owner of a file is its nearest enclosing fractal directory.

The rule reads every JavaScript and TypeScript file under the `src` directory once per process and records which files import which. It follows `import ... from`, `import '...'`, `export ... from`, `import()`, and `require()` with a string literal, resolving relative specifiers and source aliases to files, directory indexes, and extensionless paths.

For a file, the rule takes the files that import it, ignoring unit tests (`*.test.*` and `*.spec.*`), and finds the deepest fractal directory that contains all of them. It reports the file when that directory is strictly deeper than the file's owner and sits inside it. Files that nothing imports are not reported.

The rule also reports a file whose importers reach outside the place where it is visible. The visible scope of a file is its owner, except that an owner ending in a category directory and a name (`_components/Price` under `src/app`, `components/Icon` under another component) is visible from the directory that holds that category, and a top level component such as `src/components/Button` is visible from `src`. The rule reports the file when any importer, ignoring unit tests, lives outside that scope, and suggests the nearest fractal directory that contains the scope and every importer.

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

Invalid, a module private to a route that another route imports:

```tsx
// src/app/cart/_hooks/use-cart.ts
export const useCart = () => 1;

// src/app/cart/page.tsx
import { useCart } from './_hooks/use-cart';

export default function Page() {
  useCart();
  return null;
}

// src/app/checkout/page.tsx
import { useCart } from '../cart/_hooks/use-cart';

export default function Page() {
  useCart();
  return null;
}
```

Invalid, a component internal that a route imports directly:

```tsx
// src/components/Button/components/Icon/Icon.tsx
export const Icon = () => null;

// src/app/cart/page.tsx
import { Icon } from '@/components/Button/components/Icon/Icon';

export default function Page() {
  return <Icon />;
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

Valid, a component imported from any route and a module private to its route:

```tsx
// src/components/Button/Button.tsx
export const Button = () => null;

// src/app/cart/_hooks/use-local.ts
export const useLocal = () => 1;

// src/app/cart/page.tsx
import { Button } from '@/components/Button/Button';
import { useLocal } from './_hooks/use-local';

export default function Page() {
  useLocal();
  return <Button />;
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
