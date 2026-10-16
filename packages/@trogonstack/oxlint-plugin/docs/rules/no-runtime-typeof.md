# trogonstack/no-runtime-typeof

Disallow runtime typeof checks; external values must be decoded into meaningful types at their I/O boundary.

## Why

A `typeof` check narrows a representation without establishing its contract: knowing a value is a string says nothing about whether it is a valid identifier or email. Parse input once at its I/O boundary, then branch on the domain value.

## Detection

Flags every `typeof` unary expression. With `allowInTypeGuards` enabled, a `typeof` is allowed when its nearest enclosing function declares a type predicate return type (`value is T` or `asserts value is T`). A `typeof` inside a nested function within a type guard is still reported, because the nearest function is the nested one.

## Examples

Invalid:

```ts
if (typeof input === 'string') use(input);
```

Invalid with `allowInTypeGuards` enabled:

```ts options='{"allowInTypeGuards":true}'
function parse(value: unknown): string {
  if (typeof value !== 'string') throw new Error();
  return value;
}
```

Valid with `allowInTypeGuards` enabled:

```ts options='{"allowInTypeGuards":true}'
function isString(value: unknown): value is string {
  return typeof value === 'string';
}
```

## Options

```json
{
  "trogonstack/no-runtime-typeof": ["error", { "allowInTypeGuards": false }]
}
```

- `allowInTypeGuards` (boolean, default `false`): allow `typeof` inside functions whose return type is a type predicate.
