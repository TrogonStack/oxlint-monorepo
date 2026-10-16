# trogonstack/no-root-assets-directory

Disallow importing from an `assets` directory at the project root instead of `src/assets`.

## Why

Keeping assets inside `src` lets the bundler and the fractal layout treat them like any other source. A root `assets` directory splits the project in two. See [React project files and directories names convention](https://github.com/straw-hat-team/adr/blob/main/src/adrs/5541831634/README.md).

## Detection

For files under `src`, resolves relative specifiers against the importing file. A specifier is reported when it climbs exactly one level above `src` and then enters a top-level `assets` directory, such as `../../assets/logo.png` from `src/app/page.tsx`. Checked sources are `import` declarations, `export ... from`, `export * from`, and `import()` with a string literal. Imports into `src/assets`, other root directories, packages, and files outside `src` are ignored.

## Examples

Invalid:

```tsx
// src/app/page.tsx
import logo from '../../assets/logo.png';

export default function Page() {
  return <img src={logo} alt="" />;
}
```

Valid:

```tsx
// src/app/page.tsx
import logo from '../assets/logo.png';

export default function Page() {
  return <img src={logo} alt="" />;
}
```

## Options

This rule has no options.
