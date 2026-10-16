# trogonstack/no-object-parameters

Disallow object function parameters; inputs must use an owner-provided type and be parsed at their boundary.

## Why

The broad `object` type says nothing about what a function needs, so callers can pass anything and the body has to guess. Accept a named owner type, and parse external input at its boundary before calling the function.

## Detection

Flags a parameter annotated with `object`, or with a type that resolves to `object`: a parenthesized `object`, a union containing it, or a same-file non-generic type alias that resolves to it. Applies to function declarations and expressions, arrow functions, methods, constructor parameter properties, rest and default parameters, and function, call, construct, and method signature types. Type parameters and `infer` names that shadow an alias are respected, and constraints such as `Value extends object` are not reported.

## Examples

Invalid:

```ts
function f(value: object) {}
type Alias = object;
function g(value: Alias) {}
```

Valid:

```ts
interface Owner {
  readonly id: string;
}
function f(value: Owner) {}
function g<Value extends object>(value: Value) {}
type Alias = object;
function consume<Alias>(value: Alias) {}
```

## Options

This rule has no options.
