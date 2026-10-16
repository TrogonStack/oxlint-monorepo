# @trogonstack/oxlint-plugin

**An [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) JS plugin with opinionated rules for TypeScript and React code.** It runs inside Oxlint alongside the built-in rules, under the `trogonstack/` prefix.

**The plugin rejects patterns that compile but discard evidence or signal.** Its TypeScript rules target escape hatches such as `Reflect.get`, `unknown` contracts, runtime `typeof` checks and unexplained type assertions. Its UI rules flag placeholder copy, trivial memoization, unjustified `use client` directives, decorative styling and motion without a reduced-motion fallback.

**Standard linters catch broken code, but not code that works and still says little.** Those patterns multiply when code is written quickly or with AI assistance, and reviewers end up leaving the same comments. Each rule turns one of those comments into feedback in the editor and in CI.

**The plugin is for teams on Oxlint who want stricter review standards enforced automatically.** It suits TypeScript codebases that parse input into domain types at their boundaries, and React or Next.js projects that want product-quality UI checks.

## Installation

```bash
pnpm add --save-dev oxlint @trogonstack/oxlint-plugin
```

## Configuration

Register the plugin in `.oxlintrc.json` and enable the rules you want:

```json
{
  "jsPlugins": ["@trogonstack/oxlint-plugin"],
  "rules": {
    "trogonstack/no-reflect-get": "error",
    "trogonstack/no-placeholder-copy": "warn"
  }
}
```

The copy, data, client-boundary and project-structure rules read shared lists from `settings.trogonstack`. `sourceAliases` lists the import prefixes that resolve to `src`, so the structure rules can follow aliased imports. `fractalDirectories` lists the category directories the fractal pattern allows. `localeParameterAliases` lists the dynamic segment names that `require-locale-route-parameter` asks to rename to `[locale]`. Each list you set replaces its default:

```json
{
  "settings": {
    "trogonstack": {
      "placeholderPatterns": ["coming soon", "todo", "tbd", "lorem ipsum", "placeholder"],
      "marketingPatterns": ["powerful", "seamless", "unlock", "supercharge"],
      "genericStatLabels": [
        "performance",
        "insights",
        "overview",
        "analytics",
        "usage",
        "activity"
      ],
      "actionWords": ["retry", "open", "create", "run", "fix", "clear filter"],
      "demoDataModules": ["@/demo", "@/mocks", "@/fixtures"],
      "realDataIndicators": ["fetch", "db", "prisma", "trpc"],
      "clientOnlyImports": ["next/navigation", "@tanstack/react-query", "recharts"],
      "sourceAliases": ["@/"],
      "fractalDirectories": [
        "services",
        "storages",
        "schemas",
        "components",
        "hooks",
        "contexts",
        "constants",
        "types",
        "styles",
        "assets",
        "i18n",
        "helpers",
        "server"
      ],
      "localeParameterAliases": [
        "lang",
        "lng",
        "language",
        "languageCode",
        "langCode",
        "localeCode"
      ]
    }
  }
}
```

The structure rules enforce [ADR 5541831634](https://github.com/straw-hat-team/adr/blob/main/src/adrs/5541831634/README.md). Circular dependencies between sibling directories and libraries are covered by Oxlint's built-in `import/no-cycle` rule, so these rules do not duplicate it. Relative imports that climb to a parent directory are covered by the built-in `import/no-relative-parent-imports` rule, and `require-import-locality` covers the aliased half of the import style. Re-exports are covered in part by the built-in `oxc/no-barrel-file` rule, which reports barrel files that re-export with `export *`; named re-exports are not reported by it.

### Shareable configs

The package ships Oxlint configs you extend in one line instead of enabling rules one by one. Oxlint resolves `extends` as a file path, not as a package specifier, so point it at the file inside `node_modules`.

**Building blocks** are the layers the presets are made of. Each one registers the plugin through `jsPlugins` and works on its own:

| Config               | Contents                                                                                                                                                                                                                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `structure.json`     | Layout rules that hold in any codebase: `require-colocated-modules`, `require-colocated-css-modules`, `require-colocated-unit-tests`, `require-types-directory`, `no-private-library-directories`, `require-import-locality`, and the built-in `import/no-cycle`, `import/no-relative-parent-imports` and `oxc/no-barrel-file`. |
| `app-structure.json` | ADR layout rules for an application: `require-fractal-directories`, `require-private-app-directories`, `no-cross-route-imports`, `require-client-file-suffix`, `no-server-file-suffix`, `no-public-path-prefix` and `no-demo-data-primary-path`.                                                                                |
| `naming.json`        | The built-in `unicorn/filename-case` rule set to `kebabCase`, and `require-kebab-case-directories` for directories.                                                                                                                                                                                                             |
| `typescript.json`    | Type-safety and code-shape rules, such as `no-reflect-get`, `no-unknown-parameters` and `require-safety-comment-for-type-assertion`.                                                                                                                                                                                            |
| `react.json`         | Platform-neutral React rules for copy, empty states and memoization: `no-placeholder-copy`, `no-marketing-copy`, `no-generic-stat-label`, `require-empty-state-action` and `no-useless-memo`.                                                                                                                                   |
| `react-dom.json`     | Web-only styling and motion rules: `no-arbitrary-z-index`, `no-decorative-grid-background`, `no-excessive-radius`, `no-gradient-text`, `no-hidden-reveal-default`, `no-nested-cards`, `no-side-stripe-accent` and `require-reduced-motion`.                                                                                     |

**Presets** compose the building blocks. Extend the one that matches your project:

| Preset               | Composition                                                                                                                                                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `library.json`       | `structure`, `naming` and `typescript`.                                                                                                                                                                                                                      |
| `react-library.json` | `library` and `react`. Use it for a React DOM or React Native component library.                                                                                                                                                                             |
| `nextjs.json`        | `react-library`, `app-structure` and `react-dom`, plus the App Router rules `no-pages-router`, `no-server-action-imports`, `require-client-component-suffix`, `require-locale-route-parameter`, `require-server-directives` and `no-unjustified-use-client`. |
| `vite.json`          | `react-library`, `app-structure` and `react-dom`, plus `require-app-entry-file`.                                                                                                                                                                             |
| `expo.json`          | `react-library` and `app-structure`, plus `no-root-assets-directory`, which the ADR scopes to React Native only. It leaves out `react-dom`.                                                                                                                  |

```json
{
  "extends": ["./node_modules/@trogonstack/oxlint-plugin/configs/nextjs.json"]
}
```

A React Native library, which has no app layout, extends `react-library` and not `expo`:

```json
{
  "extends": ["./node_modules/@trogonstack/oxlint-plugin/configs/react-library.json"]
}
```

Rules whose description starts with "Discourage" are warnings, and the rest are errors, except `require-import-locality` and the two softer built-ins, which are warnings. Every plugin rule belongs to exactly one building block or to one framework preset, and a test fails when a new rule is left out.

To compose your own set, extend the building blocks you want instead of a preset. Extending the same block through several configs is safe, because Oxlint loads the plugin once:

```json
{
  "extends": [
    "./node_modules/@trogonstack/oxlint-plugin/configs/typescript.json",
    "./node_modules/@trogonstack/oxlint-plugin/configs/naming.json"
  ]
}
```

#### Caveats

Oxlint does not merge `settings` from an extended config, so set `settings.trogonstack` in your own `.oxlintrc.json` when you need `sourceAliases` or the other lists above. The configs list the `import`, `oxc` and `unicorn` plugins where they need them, and Oxlint adds them to its default plugins unless your config sets `plugins` itself.

`unicorn/filename-case` accepts the Next.js special files (`page.tsx`, `layout.tsx`, `not-found.tsx`, `route.ts`), dynamic segment folders such as `[slug]`, and suffixes such as `button.client.tsx` and `button.test.tsx`. It reports a dynamic segment file whose parameter is not kebab-case, such as `[userId].tsx`. Ignore those files in your own config; `ignore` takes a list of regular expressions:

```json
{
  "extends": ["./node_modules/@trogonstack/oxlint-plugin/configs/nextjs.json"],
  "rules": {
    "unicorn/filename-case": [
      "error",
      { "case": "kebabCase", "ignore": ["^\\[{1,2}(\\.\\.\\.)?[A-Za-z0-9_-]+\\]{1,2}\\."] }
    ]
  }
}
```

Rules you set in your own config win over the extended configs, so you can change a severity or turn a rule off:

```json
{
  "extends": ["./node_modules/@trogonstack/oxlint-plugin/configs/nextjs.json"],
  "rules": {
    "trogonstack/require-import-locality": "off",
    "oxc/no-barrel-file": "error"
  }
}
```

## Rules

<!-- rules:start -->

| Rule                                                                                                               | Description                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`trogonstack/no-arbitrary-z-index`](docs/rules/no-arbitrary-z-index.md)                                           | Discourage arbitrary z-index values outside a semantic stacking scale.                                                                             |
| [`trogonstack/no-chained-type-assertions`](docs/rules/no-chained-type-assertions.md)                               | Disallow chained TypeScript as and angle-bracket assertions, including parenthesized chains.                                                       |
| [`trogonstack/no-conditional-empty-object-spread`](docs/rules/no-conditional-empty-object-spread.md)               | Disallow object spreads that conditionally spread an empty object to omit fields.                                                                  |
| [`trogonstack/no-cross-route-imports`](docs/rules/no-cross-route-imports.md)                                       | Disallow importing between sibling routes under `src/app`.                                                                                         |
| [`trogonstack/no-decorative-grid-background`](docs/rules/no-decorative-grid-background.md)                         | Discourage decorative grid backgrounds unless the UI is a real canvas/map/measurement surface.                                                     |
| [`trogonstack/no-defensive-guard-sprawl`](docs/rules/no-defensive-guard-sprawl.md)                                 | Discourage repeated defensive null and record guards in ordinary functions.                                                                        |
| [`trogonstack/no-demo-data-primary-path`](docs/rules/no-demo-data-primary-path.md)                                 | Prevent top-level routes from relying on demo data as primary data source.                                                                         |
| [`trogonstack/no-destructured-parameters`](docs/rules/no-destructured-parameters.md)                               | Disallow destructured function parameters; accept `props` in React components and hooks, and `args` elsewhere.                                     |
| [`trogonstack/no-excessive-radius`](docs/rules/no-excessive-radius.md)                                             | Discourage oversized radius values on cards, sections, and inputs.                                                                                 |
| [`trogonstack/no-generic-stat-label`](docs/rules/no-generic-stat-label.md)                                         | Discourage generic metrics/section labels.                                                                                                         |
| [`trogonstack/no-gradient-text`](docs/rules/no-gradient-text.md)                                                   | Discourage gradient-clipped text in product UI.                                                                                                    |
| [`trogonstack/no-hidden-reveal-default`](docs/rules/no-hidden-reveal-default.md)                                   | Discourage reveal animations that hide content by default.                                                                                         |
| [`trogonstack/no-known-value-widening`](docs/rules/no-known-value-widening.md)                                     | Disallow syntactically established values from flowing into explicitly broad or anonymous target types that discard useful evidence.               |
| [`trogonstack/no-marketing-copy`](docs/rules/no-marketing-copy.md)                                                 | Discourage generic marketing copy in product UI strings.                                                                                           |
| [`trogonstack/no-module-mocking`](docs/rules/no-module-mocking.md)                                                 | Disallow Vitest and Jest module mocking; tests must replace dependencies through real interfaces.                                                  |
| [`trogonstack/no-nested-cards`](docs/rules/no-nested-cards.md)                                                     | Discourage nested Card components or nested card class containers.                                                                                 |
| [`trogonstack/no-object-parameters`](docs/rules/no-object-parameters.md)                                           | Disallow object function parameters; inputs must use an owner-provided type and be parsed at their boundary.                                       |
| [`trogonstack/no-pages-router`](docs/rules/no-pages-router.md)                                                     | Disallow files under `src/pages`; use the App Router in `src/app`.                                                                                 |
| [`trogonstack/no-placeholder-copy`](docs/rules/no-placeholder-copy.md)                                             | Disallow placeholder copy in user-facing strings.                                                                                                  |
| [`trogonstack/no-private-library-directories`](docs/rules/no-private-library-directories.md)                       | Disallow underscore-prefixed private directories inside libraries under `src/libs`, except `__tests__`.                                            |
| [`trogonstack/no-public-path-prefix`](docs/rules/no-public-path-prefix.md)                                         | Disallow URLs that start with `/public`, since files in `public` are served from the site root.                                                    |
| [`trogonstack/no-reflect-apply`](docs/rules/no-reflect-apply.md)                                                   | Disallow Reflect.apply; call typed functions directly or model dynamic dispatch behind an interface.                                               |
| [`trogonstack/no-reflect-get`](docs/rules/no-reflect-get.md)                                                       | Disallow Reflect.get; use typed property access or parse dynamic input into a domain type.                                                         |
| [`trogonstack/no-root-assets-directory`](docs/rules/no-root-assets-directory.md)                                   | Disallow importing from an `assets` directory at the project root instead of `src/assets`.                                                         |
| [`trogonstack/no-runtime-typeof`](docs/rules/no-runtime-typeof.md)                                                 | Disallow runtime typeof checks; external values must be decoded into meaningful types at their I/O boundary.                                       |
| [`trogonstack/no-server-action-imports`](docs/rules/no-server-action-imports.md)                                   | Disallow Server Actions from importing or calling other Server Actions.                                                                            |
| [`trogonstack/no-server-file-suffix`](docs/rules/no-server-file-suffix.md)                                         | Disallow the `.server` file name suffix; server is the default, so name client files `*.client.*` instead.                                         |
| [`trogonstack/no-shape-in-symbol-names`](docs/rules/no-shape-in-symbol-names.md)                                   | Disallow the case-insensitive substring "shape" in JavaScript, TypeScript, private, and JSX symbol names.                                          |
| [`trogonstack/no-side-stripe-accent`](docs/rules/no-side-stripe-accent.md)                                         | Discourage thick left/right border stripe accents on cards and callouts.                                                                           |
| [`trogonstack/no-unjustified-use-client`](docs/rules/no-unjustified-use-client.md)                                 | Prevent unnecessary `use client` directives.                                                                                                       |
| [`trogonstack/no-unknown-parameters`](docs/rules/no-unknown-parameters.md)                                         | Disallow explicitly unknown function parameters except `cause`; decode unknown input at its I/O boundary instead.                                  |
| [`trogonstack/no-unknown-returns`](docs/rules/no-unknown-returns.md)                                               | Disallow functions whose explicit return contract is unknown or Promise<unknown>.                                                                  |
| [`trogonstack/no-unknown-type-aliases`](docs/rules/no-unknown-type-aliases.md)                                     | Disallow type aliases whose resolved type is unknown; unknown must remain visible at an allowed boundary.                                          |
| [`trogonstack/no-unsafe-dictionary-type`](docs/rules/no-unsafe-dictionary-type.md)                                 | Disallow object-dictionary contracts whose direct value type is unknown, any, object, {}, or a union/alias containing one of those escape hatches. |
| [`trogonstack/no-useless-memo`](docs/rules/no-useless-memo.md)                                                     | Discourage trivial useMemo/useCallback usage.                                                                                                      |
| [`trogonstack/no-widen-then-assert`](docs/rules/no-widen-then-assert.md)                                           | Disallow local const flows that explicitly widen a known value before asserting the widened binding to a narrower type.                            |
| [`trogonstack/require-app-entry-file`](docs/rules/require-app-entry-file.md)                                       | Require the application entry to be `src/app/index.tsx` instead of `src/main` or `src/index`.                                                      |
| [`trogonstack/require-client-component-suffix`](docs/rules/require-client-component-suffix.md)                     | Require client components to be named with a `Client` suffix instead of being aliased on import.                                                   |
| [`trogonstack/require-client-file-suffix`](docs/rules/require-client-file-suffix.md)                               | Require files with a `use client` directive to be named `*.client.*`.                                                                              |
| [`trogonstack/require-colocated-css-modules`](docs/rules/require-colocated-css-modules.md)                         | Require a CSS Module to be imported only by the component that owns it, from its sibling `[component name].module.[extension]` file.               |
| [`trogonstack/require-colocated-modules`](docs/rules/require-colocated-modules.md)                                 | Require modules to sit in the closest fractal directory that contains every consumer, neither higher nor lower.                                    |
| [`trogonstack/require-colocated-unit-tests`](docs/rules/require-colocated-unit-tests.md)                           | Require unit tests to sit next to the file they test instead of inside `__tests__`.                                                                |
| [`trogonstack/require-empty-state-action`](docs/rules/require-empty-state-action.md)                               | Require explicit actions in local empty-state UI blocks.                                                                                           |
| [`trogonstack/require-fractal-directories`](docs/rules/require-fractal-directories.md)                             | Require every directory under `src` to follow the fractal directory pattern of ADR 5541831634.                                                     |
| [`trogonstack/require-import-locality`](docs/rules/require-import-locality.md)                                     | Require relative imports for files in the importing directory or below it, instead of a source alias.                                              |
| [`trogonstack/require-kebab-case-directories`](docs/rules/require-kebab-case-directories.md)                       | Require every directory under `src` to be kebab-case, allowing framework route and private segments.                                               |
| [`trogonstack/require-locale-route-parameter`](docs/rules/require-locale-route-parameter.md)                       | Require the `[locale]` dynamic segment for internationalized routes under `src/app`.                                                               |
| [`trogonstack/require-private-app-directories`](docs/rules/require-private-app-directories.md)                     | Require fractal directories under `src/app` to be private folders prefixed with an underscore.                                                     |
| [`trogonstack/require-reduced-motion`](docs/rules/require-reduced-motion.md)                                       | Require a type-matched reduced-motion fallback when static UI code declares motion.                                                                |
| [`trogonstack/require-safety-comment-for-type-assertion`](docs/rules/require-safety-comment-for-type-assertion.md) | Require a nearby SAFETY comment for every TypeScript type assertion except const assertions.                                                       |
| [`trogonstack/require-server-directives`](docs/rules/require-server-directives.md)                                 | Require `'use server'` and `import 'server-only'` in fractal `server` directories.                                                                 |
| [`trogonstack/require-types-directory`](docs/rules/require-types-directory.md)                                     | Require TypeScript declaration files under `src` to live in `src/@types`.                                                                          |

<!-- rules:end -->
