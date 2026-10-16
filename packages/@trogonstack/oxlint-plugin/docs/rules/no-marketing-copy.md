# trogonstack/no-marketing-copy

Discourage generic marketing copy in product UI strings.

## Why

"Unlock powerful insights" tells users nothing about the workflow in front of them. Product UI copy should describe concrete actions and objects.

## Detection

User-facing strings are matched against `settings.trogonstack.marketingPatterns` (default: `powerful`, `seamless`, `unlock`, `supercharge`). Matching ignores case and succeeds when the string contains a pattern.

A string is user-facing when it is JSX text, the value of an `aria-label`, `alt`, `label`, `placeholder`, or `title` attribute, or the value of an object property named `title`, `description`, `subtitle`, `label`, `placeholder`, `emptyMessage`, or `heading`. Strings elsewhere, such as plain variables, are ignored.

## Examples

Invalid:

```tsx
export function Banner() {
  return <p>Unlock powerful insights</p>;
}
```

Valid:

```tsx
export function Banner() {
  return <p>Run payroll for contractors</p>;
}
```

## Options

This rule has no options.

## Settings

Patterns come from the shared `settings.trogonstack` object. A list that is missing or not an array of strings keeps its default; a valid list replaces the default.

```json
{
  "settings": {
    "trogonstack": {
      "marketingPatterns": ["powerful", "seamless", "unlock", "supercharge"]
    }
  }
}
```

## When not to use it

Marketing and landing page routes are legitimate homes for this vocabulary; scope the rule to product surfaces with `overrides` and `files` globs in your Oxlint configuration.
