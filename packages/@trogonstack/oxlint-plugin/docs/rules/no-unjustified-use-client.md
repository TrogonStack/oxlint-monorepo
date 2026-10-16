# trogonstack/no-unjustified-use-client

Prevent unnecessary `use client` directives.

## Why

Every unjustified `"use client"` moves a component and everything it imports out of the server bundle, growing client JavaScript and losing server-only capabilities for no benefit. Generated code frequently adds the directive defensively.

## Detection

The rule applies to files whose first statement is the `"use client"` directive, and reports the directive when the file shows no client signal.

A client signal is any of the following:

- A React client hook (`useState`, `useEffect`, `useLayoutEffect`, `useReducer`, `useRef`, `useTransition`, `useDeferredValue`, `useImperativeHandle`, `useSyncExternalStore`, `useInsertionEffect`, `useOptimistic`, `useActionState`) imported from `react` and actually referenced in the file. Aliased imports are tracked by their local name; an unused import is not a signal.
- A referenced imported binding whose local name matches `use[A-Z]`, such as `useWorkspace` from an application hook module. Type-only imports and type-only references do not count.
- `React.useState(...)`-style member access through a react namespace or default import.
- Unshadowed browser globals: `window`, `document`, `localStorage`, `sessionStorage`, and `navigator`, including access through `globalThis` such as `globalThis["localStorage"]`. Object-property spellings such as `settings.window` do not count.
- JSX event handler props matching `/^on[A-Z]/` (`onClick`, `onChange`; a prop like `online` does not count).
- Imports from client-only modules (`settings.trogonstack.clientOnlyImports`, default: `next/navigation`, `@tanstack/react-query`, `recharts`, including their subpaths). A type-only import does not count.

## Examples

Invalid:

```tsx
'use client';

export function Header() {
  return <header>Account</header>;
}
```

Valid:

```tsx
'use client';

import { useWorkspace } from './use-workspace';

export function Header() {
  const workspace = useWorkspace();
  return <header>{workspace.name}</header>;
}
```

## Options

This rule has no options.

## Settings

Client-only modules come from the shared `settings.trogonstack` object. A list that is missing or not an array of strings keeps its default; a valid list replaces the default.

```json
{
  "settings": {
    "trogonstack": {
      "clientOnlyImports": ["next/navigation", "@tanstack/react-query", "recharts"]
    }
  }
}
```

## When not to use it

If your project intentionally marks entire directories as client components regardless of content, disable this rule for those paths.

## Fixer

This rule reports for manual review and deliberately has no autofix. A file-local heuristic cannot prove that removing the directive preserves the server/client boundary.
