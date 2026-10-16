# trogonstack/require-safety-comment-for-type-assertion

Require a nearby SAFETY comment for every TypeScript type assertion except const assertions.

## Why

A type assertion overrides the compiler, so the reason it is sound should be written down where reviewers can check it. A `SAFETY:` comment names the invariant TypeScript cannot express.

## Detection

Flags `as T` and `<T>value` assertions that have no comment containing `SAFETY:` before them. The comment may sit immediately before the assertion, or before its containing statement (expression statement, variable declaration, return, throw, or class property), including when that statement is exported with `export` or `export default`. A trailing comment after the assertion does not count. `as const` and `<const>` assertions are exempt.

## Examples

Invalid:

```ts
const bare = value as UserId;
const angle = <UserId>value;
// This cast seems fine.
const vague = value as UserId;
const late = value as UserId; // SAFETY: Too late.
```

Valid:

```ts
const values = [1, 2] as const;
// SAFETY: The parser established the UserId invariant.
const parsed = value as UserId;
function parse(): UserId {
  // SAFETY: Validation above established the UserId invariant.
  return value as UserId;
}
const inline = /* SAFETY: Validation established the invariant. */ value as UserId;
```

## Options

This rule has no options.
