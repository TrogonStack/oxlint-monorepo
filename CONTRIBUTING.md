# Contributing

## Setup

This is a [pnpm](https://pnpm.io/workspaces) monorepo, and tool versions come from [mise](https://mise.jdx.dev). From the repo root:

```bash
mise install
pnpm install
```

Shared configuration lives at the root: `.oxlintrc.json`, `.oxfmtrc.json`, and `tsconfig.base.json`. Packages extend those rather than redefining them.

## Tasks

Task scripts follow [ADR#6647967335](https://github.com/straw-hat-team/adr/blob/main/src/adrs/6647967335/README.md). They are mise file tasks under `.config/mise/tasks/`, and a package keeps its own tasks under its own `.config/mise/tasks/`. Every script a GitHub Actions workflow runs lives under `.config/mise/tasks/github/workflows/<workflow>/` and is invoked as `mise run github:workflows:<workflow>:<step>`. Steps shared by several workflows are composite actions under `.github/actions/<name>/`, with their scripts under `.config/mise/tasks/github/actions/<name>/`.

## Checks

```bash
pnpm run fmt:check
pnpm run lint
pnpm run typecheck
pnpm run build
pnpm run test
pnpm run docs:check
```

`typecheck`, `build`, `test`, and `docs:check` fan out to every workspace package.

Package READMEs that list rules generate that list from each rule's `meta.docs.description`. After adding or changing a rule, run `mise run docs:sync` in the package directory and commit the README.

Every code block under `## Examples` in `docs/rules/<rule>.md` is linted with the real plugin build by `pnpm run docs:check` (run `pnpm run build` first). A block inherits the nearest preceding `Invalid...:` or `Valid...:` label. Invalid blocks must report the rule, valid blocks must not, and neither may contain syntax errors. Blocks use `ts`, `tsx`, `js`, or `jsx` fences. A leading `// path/to/file.tsx` comment sets the file name the block is linted as, which matters for rules that depend on the path. Rule options and shared settings go in the fence info string as JSON, for example ` ```ts options='{"allowInTypeGuards":true}' ` or `settings='{...}'`.

## Adding a package

1. Create `packages/@trogonstack/<name>/` with a `package.json` named `@trogonstack/<name>`, `"publishConfig": { "access": "public", "provenance": true }`, and a `build` script emitting to `dist`.
2. Extend the shared TypeScript options: `{ "extends": "../../../tsconfig.base.json" }`.
3. Copy the root `LICENSE` into the package directory, since npm only publishes files inside it.
4. Add a `README.md` following the root README's introduction style, and list the package in the root README's Packages table.
5. Add the package to `.github/release-please-config.json` under `packages`, keyed by its path:

```json
"packages/@trogonstack/<name>": {
  "component": "@trogonstack/<name>",
  "initial-version": "0.0.1"
}
```

6. Seed its version in `.github/release-please-manifest.json`:

```json
"packages/@trogonstack/<name>": "0.0.1"
```

Until at least one entry exists in the manifest, the release workflow skips release-please instead of failing.

Git tags are per package: `@trogonstack/<name>@v1.2.3` (`include-v-in-tag`, `include-component-in-tag`, `tag-separator: "@"`). There is no repo-wide `v1.2.3` tag.

## Commits and pull requests

PR titles follow [Conventional Commits](https://www.conventionalcommits.org) and CI enforces them, since the squashed title becomes the commit on `main`. Releases and changelogs are handled by release-please, so do not bump versions by hand.
