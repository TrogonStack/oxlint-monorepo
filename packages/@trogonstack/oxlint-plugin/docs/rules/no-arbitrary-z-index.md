# trogonstack/no-arbitrary-z-index

Discourage arbitrary z-index values outside a semantic stacking scale.

## Why

`z-[9999]` is a stacking arms race, not a design decision. Projects should express layering through a small semantic scale such as dropdown, sticky, modal, and toast.

## Detection

Flags Tailwind classes `z-[N]` and `z-NNN` (three or more digits) above the threshold, and style-object `zIndex` values above it. Static classes are also recovered from `clsx`/`cn`-style calls, conditionals, and template literals.

## Examples

Invalid:

```tsx
<>
  <div className="z-[9999]" />
  <div style={{ zIndex: 1000 }} />
</>
```

Valid:

```tsx
<div className="z-50" />
```

## Options

```json
{
  "rules": {
    "trogonstack/no-arbitrary-z-index": ["warn", { "maxZIndex": 998 }]
  }
}
```

- `maxZIndex` (integer, default `998`): the largest z-index that is not flagged.
