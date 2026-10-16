# trogonstack/require-types-directory

Require TypeScript declaration files under `src` to live in `src/@types`.

## Why

Keeping every declaration file in one directory makes ambient types easy to find and keeps the rest of the source tree free of them. See [React project files and directories names convention](https://github.com/straw-hat-team/adr/blob/main/src/adrs/5541831634/README.md).

## Detection

Flags a `.d.ts`, `.d.mts`, or `.d.cts` file inside a `src` directory whose path relative to that `src` does not start with `@types`. Files outside any `src` directory, such as a root `next-env.d.ts`, are ignored. Reports once on the program.

## Examples

Invalid:

```ts
// src/app/globals.d.ts
export {};
```

Valid:

```ts
// src/@types/globals.d.ts
export {};
```

## Options

This rule has no options.
