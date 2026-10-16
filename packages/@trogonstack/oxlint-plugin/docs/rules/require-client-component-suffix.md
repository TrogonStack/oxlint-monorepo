# trogonstack/require-client-component-suffix

Require client components to be named with a `Client` suffix instead of being aliased on import.

## Why

When a client component shares a name with its server counterpart, the name should say which side it runs on at its definition, not at each import. See [React project files and directories names convention](https://github.com/straw-hat-team/adr/blob/main/src/adrs/5541831634/README.md).

## Detection

Checks `import` declarations whose source resolves to a `*.client` or `*.client.<extension>` module. Relative specifiers and specifiers starting with a source alias resolve into `src`, and only the file name is inspected, never the disk. Reports every named import where the imported name starts with an uppercase letter, does not end in `Client`, and is bound to a different local name. Default imports, namespace imports, hooks and other lowercase exports, and imports that keep their name are ignored.

The rule does not inspect the `*.client.*` module itself, so it cannot detect a client component that merely shares a name with a server component. It only catches the aliasing workaround.

## Examples

Invalid:

```tsx
// src/app/page.tsx
import { Chart as ChartClient } from './chart.client';

export default function Page() {
  return <ChartClient />;
}
```

Valid:

```tsx
// src/app/page.tsx
import { ChartClient } from './chart.client';

export default function Page() {
  return <ChartClient />;
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

Projects that do not name client modules `*.client.*` have nothing to check.
