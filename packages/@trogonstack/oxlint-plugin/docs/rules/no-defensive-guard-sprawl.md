# trogonstack/no-defensive-guard-sprawl

Discourage repeated defensive null and record guards in ordinary functions.

## Why

Stacked `if (x == null) return null;` guards at the top of every function obscure the real data contract. Shape validation belongs in one named validator, not sprinkled through business logic.

## Detection

Flags functions whose bodies open with more than `maxGuards` consecutive `if` statements without an `else` whose branch only returns or throws, and whose condition tests for a nullish value (`== null`, `=== undefined`, `typeof x === "undefined"`) or calls `isRecord(...)`. Negation and `&&`/`||` combinations of those checks count as well.

Functions named like validators are exempt because they are expected to own repeated checks. The name must start with `is`, `has`, `can`, `should`, `assert`, `ensure`, or `validate` followed by an uppercase letter or underscore, such as `assertUserPayload`. The name comes from the function itself, its variable declarator, or its property key.

## Examples

Invalid:

```ts
function parseUser(input) {
  if (!isRecord(input)) return null;
  if (input.id == null) return null;
  if (input.email == null) return null;
  return { id: input.id, email: input.email };
}
```

Valid:

```ts
function assertUserPayload(input) {
  if (!isRecord(input)) throw new Error('Invalid user');
  if (input.id == null) throw new Error('Invalid user');
  if (input.email == null) throw new Error('Invalid user');
}
```

## Options

```json
{
  "rules": {
    "trogonstack/no-defensive-guard-sprawl": ["warn", { "maxGuards": 2 }]
  }
}
```

- `maxGuards` (integer, default `2`): the largest number of leading defensive guards allowed before the function is flagged.
