# trogonstack/no-server-action-imports

Disallow Server Actions from importing or calling other Server Actions.

## Why

Server Actions are public entry points. Chaining them hides control flow and re-runs request-level concerns. [ADR 5541831634](https://github.com/straw-hat-team/adr/blob/main/src/adrs/5541831634/README.md) forbids importing a Server Action file from another and calling a Server Action function from another; shared logic belongs in plain functions.

## Detection

The rule applies to files under a `server/actions` or `_server/actions` directory pair below the nearest enclosing `src` directory.

- Imports (`import`, `export ... from`, `export * from`, string `import()`) whose resolved target is also under such a directory are reported. Relative specifiers and source aliases resolve into `src`; packages are ignored.
- Calls inside an exported top-level function to another top-level function of the same file that is also exported are reported. Exports can be direct (`export async function`, `export const x = async () => {}`), default (`export default async function x() {}`, `export default x`, or an anonymous default function as the caller), or through `export { x }`. Shadowed names and recursion are ignored.

## Examples

Invalid:

```ts
// src/app/cart/_server/actions/add-item.ts
import { removeItem } from './remove-item';

export async function addItem() {
  await removeItem();
}
```

```ts
// src/app/cart/_server/actions/cart.ts
export async function clearCart() {}

export async function resetCart() {
  await clearCart();
}
```

Valid:

```ts
// src/app/cart/_server/actions/cart.ts
async function clear() {}

export async function clearCart() {
  await clear();
}

export async function resetCart() {
  await clear();
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

Projects that do not use Next.js Server Actions have nothing to check.
