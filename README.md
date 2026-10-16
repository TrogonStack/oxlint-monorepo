# oxlint-monorepo

**Trogon Stack's shared [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) packages, published under the `@trogonstack` npm scope.** Each package lives in `packages/@trogonstack/*` and is versioned and released on its own.

**Each package adds rules or configuration on top of Oxlint's built-in set, installable independently.** Current rules target TypeScript patterns that discard type evidence and UI code that ships placeholder or decorative output. See each package README for its rules and configuration.

**Standard linters catch broken code, but not code that compiles and still says little.** Those patterns tend to multiply when code is written quickly or with AI assistance, and reviewers end up repeating the same comments. Encoding them as lint rules moves that feedback to the editor and CI, at Oxlint's speed.

**These packages are for TypeScript and JavaScript teams that already use Oxlint, or are moving to it from ESLint.** They suit codebases that value explicit domain types over defensive runtime checks, and React or Next.js projects that want product-quality UI checks alongside correctness rules.

## Packages

| Package                                                             | Description                                                          |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [`@trogonstack/oxlint-plugin`](packages/@trogonstack/oxlint-plugin) | Oxlint JS plugin with TypeScript type-evidence and UI quality rules. |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
