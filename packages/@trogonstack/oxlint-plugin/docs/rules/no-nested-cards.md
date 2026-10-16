# trogonstack/no-nested-cards

Discourage nested Card components or nested card class containers.

## Why

Cards inside cards double up borders, shadows, and padding, a framing hierarchy that reads as generated filler. Inner content usually wants a plain section.

## Detection

An element counts as a card when its component name is `Card` or ends with `Card` (for `Foo.Card`, the last segment is used), or when its static class list contains a `card`, `card-*`, or `card_*` token. The rule reports the first card found nested anywhere inside another card's JSX children, and it points at the nested card's opening element.

## Examples

Invalid:

```tsx
<Card>
  <MetricCard />
</Card>
```

Valid:

```tsx
<Card>
  <section>Details</section>
</Card>
```

## Options

This rule has no options.
