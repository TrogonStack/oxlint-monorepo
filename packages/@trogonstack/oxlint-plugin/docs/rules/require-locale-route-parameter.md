# trogonstack/require-locale-route-parameter

Require the `[locale]` dynamic segment for internationalized routes under `src/app`.

## Why

Using one parameter name for the locale keeps routes, layouts, and i18n helpers consistent across a Next.js codebase. See [React project files and directories names convention](https://github.com/straw-hat-team/adr/blob/main/src/adrs/5541831634/README.md).

## Detection

For files under `src/app`, inspects the directory segments after `app`. A dynamic segment in the forms `[name]`, `[...name]`, or `[[...name]]` is reported when `name` is in the `localeParameterAliases` setting (default: `lang`, `lng`, `language`, `languageCode`, `langCode`, `localeCode`). Matching is case-sensitive and only the bracketed name is compared, so `(lang)` and `lang` are ordinary segments. Only the first offending segment is reported, once on the program.

## Examples

Invalid:

```tsx
// src/app/[lang]/page.tsx
export default function Page() {
  return null;
}
```

Valid:

```tsx
// src/app/[locale]/page.tsx
export default function Page() {
  return null;
}
```

## Options

This rule has no options. It reads the shared `localeParameterAliases` list from `settings.trogonstack`. Setting it replaces the default list:

```json
{
  "settings": {
    "trogonstack": {
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

## When not to use it

Projects that do not use route directories under `src/app` or do not internationalize routes have nothing to check.
