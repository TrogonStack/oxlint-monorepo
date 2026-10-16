# trogonstack/require-colocated-unit-tests

Require unit tests to sit next to the file they test instead of inside `__tests__`.

## Why

A unit test that lives beside its subject is found, moved, and deleted together with it. The `__tests__` directory is reserved for testing support files such as setup and helpers. See [React project files and directories names convention](https://github.com/straw-hat-team/adr/blob/main/src/adrs/5541831634/README.md).

## Detection

Applies to files under `src` named `<name>.test.<extension>` or `<name>.spec.<extension>`, where the extension is one of `js`, `jsx`, `ts`, `tsx`, `mjs`, `cjs`, `mts`, or `cts`.

Reports a unit test that sits inside a `__tests__` directory at any depth. Otherwise reports a unit test when no file named `<name>.<extension>` with one of those extensions exists next to it on disk. A unit test inside `__tests__` is reported once, for its location.

## Examples

Invalid:

```ts
// src/components/__tests__/button.test.ts
export {};
```

Valid:

```ts
// src/components/__tests__/render.ts
export {};
```

## Options

This rule has no options.
