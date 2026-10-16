# trogonstack/no-hidden-reveal-default

Discourage reveal animations that hide content by default.

## Why

Content gated behind `opacity-0` and a transition breaks when JavaScript fails, hurts LCP, and hides information from crawlers and assistive tooling. Reveal motion should enhance already-visible content.

## Detection

Flags class strings combining a hidden default (`opacity-0`, `invisible`) with motion (`animate-*`, `transition`, `transition-*`, `duration-*`), style objects combining `opacity: 0` or `visibility: "hidden"` with `animation` or `transition`, and standalone CSS strings or templates doing the same. Static classes are also recovered from `clsx`/`cn`-style calls, arrays, and objects. The important modifier (`!opacity-0`, `opacity-0!`) still counts as a hidden default, while variant-prefixed hiding such as `hover:opacity-0` does not, because it is not the default state. Motion classes count with or without variants, such as `motion-safe:transition`. Declarations that disable motion (`transition-none`, `animate-none`, `transition: none`, `animation: none`) are not motion.

## Examples

Invalid:

```tsx
<section className="opacity-0 transition-opacity">Hidden until reveal</section>
```

Valid:

```tsx
<section className="opacity-100 transition-opacity">Visible content</section>
```

## Options

This rule has no options.
