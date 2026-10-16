# trogonstack/require-kebab-case-directories

Require every directory under `src` to be kebab-case, allowing framework route and private segments.

## Why

Directory names that mix `PascalCase`, `camelCase` and `snake_case` break on case-insensitive file systems, produce import paths that differ only by case, and make the tree harder to scan. One convention for directories matches the kebab-case file names that `unicorn/filename-case` enforces. See [React project files and directories names convention](https://github.com/straw-hat-team/adr/blob/main/src/adrs/5541831634/README.md).

## Detection

For files under `src`, checks every directory segment between `src` and the file. A segment passes when it is kebab-case: lowercase letters and digits separated by single dashes. These framework and ADR segments also pass:

- a private folder, an underscore before a kebab-case name, such as `_components`
- `__tests__` and `@types`
- Next.js route groups, `(marketing)`, with a kebab-case name
- dynamic segments `[id]`, `[...path]` and `[[...path]]`, whose parameter name is an identifier and may be camelCase
- parallel routes, `@modal`, with a kebab-case name
- intercepting routes `(.)photo`, `(..)photo` and `(...)photo`, with a kebab-case name

The first offending directory is reported once on the program, with a kebab-case suggestion. File names are not checked; use `unicorn/filename-case` for them. Files outside `src` are ignored.

## Examples

Invalid:

```tsx
// src/components/UserCard/user-card.tsx
export const UserCard = () => null;
```

Invalid, a private folder with an uppercase name:

```tsx
// src/app/_Components/button.tsx
export const Button = () => null;
```

Valid:

```tsx
// src/components/user-card/user-card.tsx
export const UserCard = () => null;
```

Valid, framework segments:

```tsx
// src/app/(marketing)/blog/[postId]/@modal/(.)photo/page.tsx
export default function Page() {
  return null;
}

// src/app/_components/__tests__/setup.ts
export const setup = 1;
```

## Options

This rule has no options.

## Settings

This rule reads no settings.

## When not to use it

Projects whose directory names are fixed by a tool or an existing convention that is not kebab-case.
