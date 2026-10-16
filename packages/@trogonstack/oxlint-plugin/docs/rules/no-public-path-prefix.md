# trogonstack/no-public-path-prefix

Disallow URLs that start with `/public`, since files in `public` are served from the site root.

## Why

Static files live in `<rootDir>/public`, and Next.js and Vite serve that directory from the site root. A URL such as `/public/logo.png` points at a file that is never served, so the asset breaks at runtime. See [React project files and directories names convention](https://github.com/straw-hat-team/adr/blob/main/src/adrs/5541831634/README.md).

## Detection

Flags string literals, including JSX attribute values, and template literals whose first segment is `/public` or starts with `/public/`. Paths such as `/publications` and relative paths such as `public/logo.png` are ignored.

## Examples

Invalid:

```tsx
export const View = () => <img src="/public/logo.png" />;
```

Valid:

```tsx
export const View = () => <img src="/logo.png" />;
```

## Options

This rule has no options.
