# trogonstack/no-conditional-empty-object-spread

Disallow object spreads that conditionally spread an empty object to omit fields.

## Why

`{ ...(condition ? { value } : {}) }` hides property omission inside an expression. Building the object in separate statements and adding the property only when present keeps the omission visible and keeps the resulting type easy to follow.

## Detection

Flags a spread element inside an object literal whose argument is a conditional expression (parentheses are ignored) where either branch is an empty object literal `{}`. Conditionals outside a spread, and spreads of non-conditional values, are not reported. The rule offers no autofix because rewriting would change semantics.

## Examples

Invalid:

```ts
const fromDefined = { ...(value !== undefined ? { value } : {}) };
const fromNegated = { ...(condition ? {} : { value }) };
```

Valid:

```ts
const literal = { value };
const spread = { ...values };
const conditional = condition ? { value } : {};
```

## Options

This rule has no options.
