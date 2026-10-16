# trogonstack/no-generic-stat-label

Discourage generic metrics/section labels.

## Why

"Analytics", "Insights", and "Overview" are labels that could sit above any chart in any product. Domain-specific labels such as "Failed payments" prove the dashboard means something.

## Detection

Heading elements (`h1` to `h6`) whose only child is text, and `label`, `title`, and `heading` JSX attributes with a static string or template value, are compared against `settings.trogonstack.genericStatLabels` (default: `performance`, `insights`, `overview`, `analytics`, `usage`, `activity`). The comparison ignores case and surrounding whitespace, and only exact generic labels are flagged; longer domain phrases that merely contain a label are allowed. Other attributes such as `description` are not checked.

## Examples

Invalid:

```tsx
export function Dashboard() {
  return <h2>Analytics</h2>;
}
```

```tsx
export function Dashboard() {
  return <Metric label="Usage" />;
}
```

Valid:

```tsx
export function Dashboard() {
  return <h2>Failed payments</h2>;
}
```

## Options

This rule has no options.

## Settings

Labels come from the shared `settings.trogonstack` object. A list that is missing or not an array of strings keeps its default; a valid list replaces the default.

```json
{
  "settings": {
    "trogonstack": {
      "genericStatLabels": ["performance", "insights", "overview", "analytics", "usage", "activity"]
    }
  }
}
```
