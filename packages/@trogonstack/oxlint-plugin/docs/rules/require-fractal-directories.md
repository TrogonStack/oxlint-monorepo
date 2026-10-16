# trogonstack/require-fractal-directories

Require every directory under `src` to follow the fractal directory pattern of ADR 5541831634.

## Why

The fractal pattern gives every level of the project the same predictable set of directories, so code is found by category instead of by guesswork. A stray directory such as `utils` or `lib` breaks that predictability. See [React project files and directories names convention](https://github.com/straw-hat-team/adr/blob/main/src/adrs/5541831634/README.md).

## Detection

A fractal directory is `src` itself, `src/app` and every route directory below it, and every `<name>` directory in `src/libs/<name>`, `src/components/<name>`, or `<fractalDir>/components/<name>`. Route directories are the non-underscore directories under `src/app`, such as `(group)`, `[id]`, `[...slug]`, `[[...slug]]`, and `@slot`.

A fractal directory may directly contain files and these category directories: `services`, `storages`, `schemas`, `components`, `hooks`, `contexts`, `constants`, `types`, `styles`, `assets`, `i18n`, `helpers`, `server`, and `__tests__`. Under `src/app` and its route directories the categories take an underscore prefix (`_components`, `_hooks`), except `__tests__`, and route directories are allowed as well. Directly under `src` the directories `app`, `libs`, `@types`, and `polyfills` are also allowed.

Inside a category:

- `storages` may only contain `local`, `session`, `cookies`, `websql`, and `indexeddb`.
- `i18n` may only contain `messages`, `datetime`, `list`, `numbers`, `plural`, and `relative-time`.
- `server` may only contain `actions`.
- `components` contains component directories, which are fractal directories themselves.
- Every other category, `@types`, and `polyfills` are not constrained below their own directory.

The report names the first unknown directory relative to `src` and the directory it sits in, once on the program. Only directories are checked, so files may sit anywhere. A non-underscore directory under `src/app` is a route, so it is never reported here; [`require-private-app-directories`](require-private-app-directories.md) covers misplaced categories there.

## Examples

Invalid:

```ts
// src/app/_utils/format.ts
export const format = () => '';
```

Valid:

```ts
// src/app/_helpers/format.ts
export const format = () => '';
```

## Settings

The category names come from the shared `fractalDirectories` list in `settings.trogonstack`, which `require-private-app-directories` reads as well. Setting it replaces the default list, so include the ADR categories you keep:

```json
{
  "settings": {
    "trogonstack": {
      "fractalDirectories": ["services", "components", "hooks", "helpers", "features"]
    }
  }
}
```

Each name takes the underscore prefix under `src/app`, and nothing below its own directory is constrained, except for the `storages`, `i18n` and `server` subdirectories the ADR defines.

## Circular dependencies

Circular dependencies between sibling directories and libraries are covered by Oxlint's built-in `import/no-cycle` rule, which this rule does not duplicate.
