# trogonstack/no-destructured-parameters

Disallow destructured function parameters; accept `props` in React components and hooks, and `args` elsewhere.

## Why

Destructuring in a signature hides the name of the object the caller passes and couples the signature to the field list. Accepting a single named object keeps signatures stable and reads the same at every call site. React components and hooks take `props`; every other function takes `args`.

## Detection

Flags an object destructuring parameter, including one wrapped in a default value, with or without a type annotation. Applies to function declarations and expressions, arrow functions, and class and object methods. Array patterns and type-only signatures are not reported.

A React component is a function bound to a PascalCase name (at least one lowercase letter, so CONSTANT_CASE is excluded) by a function declaration, a variable declarator, or `memo`, `forwardRef`, `React.memo`, or `React.forwardRef` wrapping the function in a variable declarator, in a `.jsx` or `.tsx` file. A React hook is a function bound to a name matching `use` followed by an uppercase letter, in any file. Components and hooks get the `props` message; all other functions get the `args` message.

The first parameter of a React component must also be named `props` when it is a plain identifier. Hooks and other functions are not checked for parameter naming.

## Examples

Invalid:

```tsx
// app/button.tsx
function Button({ label }: ButtonProps) {
  return <button>{label}</button>;
}
const Card = (p: CardProps) => <section>{p.title}</section>;
const ids = items.map(({ id }) => id);
```

Valid:

```tsx
// app/button.tsx
function Button(props: ButtonProps) {
  return <button>{props.label}</button>;
}
const ids = items.map((item) => item.id);
function first([head]: readonly string[]) {
  return head;
}
```

## Options

This rule has no options.
