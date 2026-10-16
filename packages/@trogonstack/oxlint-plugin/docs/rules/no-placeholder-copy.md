# trogonstack/no-placeholder-copy

Disallow placeholder copy in user-facing strings.

## Why

"Coming soon", "TODO", and "lorem ipsum" shipping to users signals unfinished product. The rule targets user-facing surfaces only, so internal constants stay legal.

## Detection

Checks JSX text, string literals in JSX child expressions (`<p>{'Coming soon'}</p>`), user-facing JSX attributes (`aria-label`, `alt`, `label`, `placeholder`, `title`) including values wrapped in an expression container (`placeholder={'Coming soon'}`), and object properties commonly bound to UI copy (`title`, `description`, `subtitle`, `label`, `placeholder`, `emptyMessage`, `heading`) against `settings.trogonstack.placeholderPatterns` (default: `coming soon`, `todo`, `tbd`, `lorem ipsum`, `placeholder`). Matching ignores case and succeeds when the string contains a pattern.

## Examples

Invalid:

```tsx
export function EmptyState() {
  return <p>Coming soon</p>;
}
```

Valid:

```tsx
const internalNote = 'todo';
```

## Options

This rule has no options.

## Settings

Patterns come from the shared `settings.trogonstack` object. A list that is missing or not an array of strings keeps its default; a valid list replaces the default.

```json
{
  "settings": {
    "trogonstack": {
      "placeholderPatterns": ["coming soon", "todo", "tbd", "lorem ipsum", "placeholder"]
    }
  }
}
```
