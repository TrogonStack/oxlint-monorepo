# trogonstack/no-unknown-parameters

Disallow explicitly unknown function parameters except `cause`; decode unknown input at its I/O boundary instead.

## Why

A parameter typed `unknown` leaves input unparsed and pushes validation into the function body. Accept a named domain type, and run the expected schema or parser at the I/O boundary before calling the function. A parameter named `cause` is exempt so error-cause enrichment stays possible.

## Detection

Flags a parameter whose annotation is exactly `unknown`, including rest and default parameters and constructor parameter properties. Applies to function declarations and expressions, arrow functions, methods, and function, call, construct, and method signature types. Parameters named `cause` are allowed. Only the literal `unknown` keyword is matched; aliases and unions containing `unknown` are not followed.

## Examples

Invalid:

```ts
function parse(input: unknown) {}
const handle = (event: unknown) => {};
type Handler = (payload: unknown) => void;
```

Valid:

```ts
function parse(input: UserPayload) {}
function wrap(message: string, cause: unknown) {}
```

## Options

This rule has no options.
