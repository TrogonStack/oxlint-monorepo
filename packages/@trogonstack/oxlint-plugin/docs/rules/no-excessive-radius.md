# trogonstack/no-excessive-radius

Discourage oversized radius values on cards, sections, and inputs.

## Why

Very large border radii on framed surfaces (32px and above by default) are a visual trope of generated UI and clash with most product design systems' radius scales.

## Detection

Flags arbitrary Tailwind radius classes such as `rounded-[40px]` and `rounded-t-[2rem]`, and style-object properties whose name contains `Radius`, when the value is above the threshold. `rem` values are converted at 16px per rem. Scale classes such as `rounded-xl` or `rounded-full` are never flagged.

## Examples

Invalid:

```tsx
<>
  <section className="rounded-[40px]" />
  <section style={{ borderRadius: '2rem' }} />
</>
```

Valid:

```tsx
<section className="rounded-xl" />
```

## Options

```json
{
  "rules": {
    "trogonstack/no-excessive-radius": ["warn", { "maxRadiusPx": 31 }]
  }
}
```

- `maxRadiusPx` (number, default `31`): the largest static radius, in pixels, that is not flagged.
