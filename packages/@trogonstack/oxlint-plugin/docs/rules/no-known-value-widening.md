# trogonstack/no-known-value-widening

Disallow syntactically established values from flowing into explicitly broad or anonymous target types that discard useful evidence.

## Why

When a value is a literal, object, array, function, or class instance, the compiler already knows its precise type. Annotating the destination with `unknown`, `object`, an open dictionary, or an inline anonymous object type throws that knowledge away. Keep inference, check with `satisfies`, or use a named owner contract.

## Detection

Reports an expression whose type is syntactically known (object, array, function, class, `new`, literal, template literal, unary expression, or a stable `const` binding initialized from one of these) when it flows into a broad target:

- `unknown` or `object`
- an open dictionary: `Record<...>`, an index-signature type, a broad mapped type, or a local alias that resolves to one
- a generic container alias that resolves to a dictionary
- an inline anonymous object type with members

Flows checked: variable initializers and reassignments of annotated bindings, class property and accessor initializers, `return` values and arrow expression bodies with an annotated return type, and `as` or angle-bracket assertions. Wrapper types such as `Readonly`, `Partial`, and `Required` are looked through. An empty `{}` flowing into a dictionary or generic container is allowed, since that is an accumulator. Named interfaces and object-type aliases are not treated as broad.

## Examples

Invalid:

```ts
const asUnknown: unknown = {};
const asObject: object = {};
type Command = () => void;
const startCommand = () => {};
const fromRecord: Record<string, Command> = { start: startCommand };
const fromShape: { start: Command } = { start: startCommand };
const fromAssertion = { start: startCommand } as Record<string, Command>;
```

Valid:

```ts
type Command = () => void;
const startCommand = () => {};
const empty: Record<string, Command> = {};
const inferred = { start: startCommand };
const readonlyCommands = { start: startCommand } as const;
const checked = { start: startCommand } satisfies Record<string, Command>;
interface Commands {
  readonly start: Command;
}
const named: Commands = { start: startCommand };
```

## Options

This rule has no options.
