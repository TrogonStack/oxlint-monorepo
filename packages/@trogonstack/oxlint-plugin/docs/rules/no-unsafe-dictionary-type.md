# trogonstack/no-unsafe-dictionary-type

Disallow object-dictionary contracts whose direct value type is unknown, any, object, {}, or a union/alias containing one of those escape hatches.

## Why

A dictionary whose values are `unknown`, `any`, `object`, or `{}` gives callers no concrete value contract, so every read needs a cast or a check. Use an owner or schema-derived value type, and parse external payloads before inserting them.

## Detection

Checks dictionary-shaped types and reports those whose direct value type is an escape hatch: `unknown`, `any`, `object`, `{}`, an effectively empty or brand-only interface or object type, or a union, intersection, or same-file alias that contains one. Covered forms are `Record<K, V>`, index signatures (including in interfaces), and mapped types over broad keys, plus the utility wrappers around them (`Readonly`, `Partial`, `Required`, `NonNullable`, `Pick`, `Omit`) and generic aliases instantiated with an unsafe argument.

Only the direct value type counts: `Record<string, { payload: unknown }>` is allowed. `Map`, `ReadonlyMap`, and `WeakMap` are not checked, and locally shadowed `Record` or utility names are not treated as built-ins. A plain use of an already-reported alias is not reported again.

## Examples

Invalid:

```ts
type FromRecord = Record<string, unknown>;
type FromIndex = { [key: string]: any };
type FromMapped = { [K in PropertyKey]: object };
type FromEmpty = Record<string, {}>;
type FromUnion = Record<string, string | unknown>;
interface FromInterface {
  [key: string]: unknown;
}
```

Valid:

```ts
type Commands = Record<string, Command>;
type Indexed = { [key: string]: Command };
type Exhaustive = { [K in Permission]: number };
type Allowed = Record<string, { payload: unknown }>;
type A = Map<string, unknown>;
```

## Options

This rule has no options.
