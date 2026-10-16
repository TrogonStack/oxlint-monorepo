# trogonstack/no-side-stripe-accent

Discourage thick left/right border stripe accents on cards and callouts.

## Why

The 4px colored side stripe is repetitive UI scaffolding, a default way to signal "this box is special" that stops meaning anything when every box has one. Full borders, icons, or background contrast communicate state with less noise.

## Detection

Flags Tailwind classes `border-l-N` and `border-r-N` with a width of 2 or more (including arbitrary values over 1px), and style objects setting `borderLeft`, `borderRight`, `borderLeftWidth`, or `borderRightWidth` wider than 1px.

Variant prefixes (`md:`, `hover:`, stacked, or arbitrary like `[&>*]:`) and the important modifier (`!` prefix or suffix) are ignored when matching classes.

## Examples

Invalid:

```tsx
<aside className="border-l-4 border-red-500" />
```

Valid:

```tsx
<aside className="border border-red-200 bg-red-50" />
```

## Options

This rule has no options.
