# trogonstack/no-shape-in-symbol-names

Disallow the case-insensitive substring "shape" in JavaScript, TypeScript, private, and JSX symbol names.

## Why

"Shape" describes structure rather than ownership, so a name like `UserShape` or `parseShape` says what the data looks like but not what role it plays. Name symbols for their domain role.

## Detection

Flags any identifier, private identifier (`#shape`), or JSX identifier whose name contains `shape` in any letter case, such as `shape`, `Shape`, `userShape`, or `SHAPE_KEY`. The match is a plain substring test, so names like `shaped` also match. Property names and other identifier positions are included.

## Examples

Invalid:

```ts
const userShape = { id: 1 };
type ResponseShape = { id: string };
class Box {
  #shape = 1;
}
```

Valid:

```ts
const user = { id: 1 };
type UserResponse = { id: string };
```

## Options

This rule has no options.
