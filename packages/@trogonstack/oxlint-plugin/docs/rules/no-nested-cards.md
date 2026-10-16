# trogonstack/no-nested-cards

Discourage nested Card components or nested card class containers.

## Why

Cards inside cards double up borders, shadows, and padding, a framing hierarchy that reads as generated filler. Inner content usually wants a plain section.

## Detection

An element counts as a card when its component name is `Card` or ends with `Card` (for `Foo.Card`, the last segment is used), or when its static class list contains a `card`, `card-*`, or `card_*` token. The rule reports the first card found nested anywhere inside another card's JSX children, and it points at the nested card's opening element.

Variant prefixes (`md:`, `hover:`, stacked, or arbitrary like `[&>*]:`) and the important modifier (`!` prefix or suffix) are ignored when matching classes.

The search follows child elements, fragments, and expression containers, including both sides of `&&`, `||`, and `??` and both branches of a ternary, through parentheses and TypeScript wrappers such as `as`, `satisfies`, and `!`. It does not enter function bodies, so cards rendered by callbacks like `items.map(() => <Card />)` are not reported.

## Examples

Invalid:

```tsx
<Card>
  <MetricCard />
</Card>
```

```tsx
<Card>{isOpen && <MetricCard />}</Card>
```

Valid:

```tsx
<Card>
  <section>Details</section>
</Card>
```

## Options

This rule has no options.
