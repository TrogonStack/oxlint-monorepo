# trogonstack/no-decorative-grid-background

Discourage decorative grid backgrounds unless the UI is a real canvas/map/measurement surface.

## Why

Two-axis one-pixel gradient "blueprint" backgrounds are a common generated-UI decoration that adds noise without meaning.

## Detection

Flags `className` values, `style` object values, and standalone string or template literals that contain `linear-gradient` together with `1px` and either a `90deg` angle or more than one `linear-gradient`.

## Examples

Invalid:

```tsx
<div
  style={{
    backgroundImage:
      'linear-gradient(#eee 1px, transparent 1px), linear-gradient(90deg, #eee 1px, transparent 1px)',
  }}
/>
```

Valid:

```tsx
<div className="grid grid-cols-2 gap-4" />
```

## Options

This rule has no options.

## When not to use it

Real canvases, plotting surfaces, and design tools legitimately draw grid backgrounds; disable the rule for those components.
