# trogonstack/no-chained-type-assertions

Disallow chained TypeScript as and angle-bracket assertions, including parenthesized chains.

## Why

Each assertion tells the compiler to stop trusting the evidence it has. Stacking them (`value as unknown as User`) throws the original type away and then invents a new one with no check in between. Keep the precise type, or parse untrusted input at its boundary before narrowing it.

## Detection

Flags the outermost assertion of a chain of two or more `as` or `<T>` assertions, looking through parentheses. A chain made only of `as const` assertions is allowed. A chain with at least one non-const assertion is reported once, on its outermost node.

## Examples

Invalid:

```ts
const user = value as unknown as User;
const other = <User>(<unknown>value);
const wrapped = value as unknown as User;
```

Valid:

```ts
const user = value as User;
const tuple = [1, 2] as const;
```

## Options

This rule has no options.
