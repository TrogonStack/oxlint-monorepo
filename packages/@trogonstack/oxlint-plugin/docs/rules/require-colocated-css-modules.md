# trogonstack/require-colocated-css-modules

Require a CSS Module to be imported only by the component that owns it, from its sibling `[component name].module.[extension]` file.

## Why

A CSS Module that sits next to its component is found, changed, and deleted together with it. Importing another component's CSS Module couples the two components through class names that were never meant to be shared. [ADR 5541831634](https://github.com/straw-hat-team/adr/blob/main/src/adrs/5541831634/README.md) requires CSS Module styles to be colocated as `[component name].module.[extension]`, and shared styles to live in `<fractalDir>/styles`.

## Detection

Applies to files under `src`. Checked sources are `import` declarations, `export ... from`, `export * from`, and `import()` with a string literal whose specifier, ignoring any `?query` or `#hash`, ends in `.module.css`, `.module.scss`, `.module.sass`, or `.module.less`.

The component name is the importing file name without its last extension. For a file such as `button.client.tsx`, both `button.client` and `button` are accepted. An import is allowed when it resolves to `<component name>.module.<extension>` in the importing file's own directory. Anything else is reported, including a differently named sibling, a file in another directory, and a nested file.

Relative specifiers and specifiers starting with a source alias are resolved. An aliased specifier that resolves to the correct sibling is allowed by this rule; use `trogonstack/require-import-locality` to require the relative form. Plain stylesheets that are not CSS Modules, packages, and files outside `src` are ignored.

## Examples

Invalid:

```tsx
// src/components/button/button.tsx
import styles from '../card/card.module.css';

export const Button = () => <button className={styles.root} />;
```

Invalid, a sibling that belongs to another component:

```tsx
// src/components/button/button.tsx
import styles from './card.module.css';

export const Button = () => <button className={styles.root} />;
```

Valid:

```tsx
// src/components/button/button.tsx
import styles from './button.module.css';

export const Button = () => <button className={styles.root} />;
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

Projects that do not use CSS Modules, or that do not colocate component styles, have nothing to check.
