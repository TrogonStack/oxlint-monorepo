# trogonstack/no-unknown-type-aliases

Disallow type aliases whose resolved type is unknown; unknown must remain visible at an allowed boundary.

## Why

`type Alias = unknown` hides the top type behind a name, so `unknown` slips past rules and reviewers that look for it. Keep `unknown` explicit at the parsing boundary or on an allowed `cause` field; otherwise use the parsed owner type.

## Detection

Reports the name of a top-level (or exported) type alias whose type resolves to `unknown`, directly, through parentheses, or through another same-file non-generic alias. A generic alias declared as `unknown` is reported too, but references to generic aliases are not followed, because their type arguments are not substituted. Aliases to anything else are not reported. In a chain, every alias that resolves to `unknown` is reported.

## Examples

Invalid:

```ts
type Alias = unknown;
type UnknownValue = unknown;
type Indirect = UnknownValue;
```

Valid:

```ts
type User = { readonly id: string };
type Name = string;
type UserId = Name;
```

## Options

This rule has no options.
