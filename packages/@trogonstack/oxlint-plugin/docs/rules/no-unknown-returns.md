# trogonstack/no-unknown-returns

Disallow functions whose explicit return contract is unknown or Promise<unknown>.

## Why

Returning `unknown` hands the caller an unparsed value and the job of validating it. Parse the value at its boundary and return a named domain type.

## Detection

Flags an explicit return type annotation that resolves to `unknown`: `unknown` itself, a parenthesized `unknown`, a union containing it, `Promise<unknown>` or `PromiseLike<unknown>`, or a same-file non-generic type alias that resolves to one of these. Applies to function declarations and expressions, arrow functions, methods, and function, call, construct, and method signature types. Functions with no annotation, type parameters that shadow an alias name, and `unknown` nested inside an object type (such as `{ cause: unknown }`) are not reported.

## Examples

Invalid:

```ts
function load(): unknown {
  return input;
}
const loadArrow = (): unknown => input;
type LoaderFn = () => unknown;
interface Loader {
  load(): unknown;
}
function loadAsync(): Promise<unknown> {
  return promise;
}
type UnknownValue = unknown;
function loadAlias(): UnknownValue {
  return input;
}
```

Valid:

```ts
function parse(): User {
  return user;
}
function infer() {
  return input;
}
function cause(): { cause: unknown } {
  return { cause: input };
}
function load(): Promise<User> {
  return promise;
}
```

## Options

This rule has no options.
