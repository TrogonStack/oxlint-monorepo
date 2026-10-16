# trogonstack/no-widen-then-assert

Disallow local const flows that explicitly widen a known value before asserting the widened binding to a narrower type.

## Why

Widening a value the compiler already understands (`const widened: unknown = source`) and then asserting it back (`widened as { id: string }`) discards evidence and recreates it with an unchecked claim. Keep the precise type from initialization through use, and parse boundary input once.

## Detection

Flags an `as` or angle-bracket assertion applied directly to an identifier when that identifier is a `const` binding that was explicitly widened to a broad type (`unknown`, `any`, `object`, or a broad `Record`) from a value with known evidence, and the assertion targets a narrower type. The assertion must come after the declaration and in the same function. An assertion to another broad type is not reported. A widened binding with no known initializer, such as `declare const input: unknown`, is not reported.

## Examples

Invalid:

```ts
const source = { id: 'second' };
const widened: unknown = source;
const parsed = widened as { readonly id: string };
```

Valid:

```ts
const source = { id: 'first' };
const widened: unknown = source;

declare const input: unknown;
const parsed = input as { readonly id: string };
```

## Options

This rule has no options.
