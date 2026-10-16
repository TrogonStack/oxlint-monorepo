# trogonstack/require-import-locality

Require relative imports for files in the importing directory or below it, instead of a source alias.

## Why

A relative import tells the reader that the file is part of the same feature and moves with it, while an absolute import tells the reader it comes from elsewhere. [ADR 5541831634](https://github.com/straw-hat-team/adr/blob/main/src/adrs/5541831634/README.md) asks for relative imports of sibling files and files nested under the same parent directory, and absolute imports from a different parent directory.

## Detection

Applies to files under `src`. Checked sources are `import` declarations, `export ... from`, `export * from`, and `import()` with a string literal.

The rule reports a source-aliased specifier that resolves to the importing file's directory or any directory below it, and offers a fix to the relative form (`./name`, or `.` for the directory itself). A specifier that resolves to the importing file's own directory is reported only when that directory exists on disk.

The other half of the ADR, avoiding `../` in favor of the alias, is not checked here because Oxlint's built-in `import/no-relative-parent-imports` reports every relative import that climbs to a parent directory. Enable that rule alongside this one.

Packages, relative specifiers, and files outside `src` are ignored.

## Examples

Invalid:

```tsx
// src/app/cart/page.tsx
import { Summary } from '@/app/cart/_components/summary';

export default function Page() {
  return <Summary />;
}
```

Valid:

```tsx
// src/app/cart/page.tsx
import { Summary } from './_components/summary';
import { Header } from '@/components/header';

export default function Page() {
  return (
    <Header>
      <Summary />
    </Header>
  );
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

Projects that do not use a source alias have nothing to check.
