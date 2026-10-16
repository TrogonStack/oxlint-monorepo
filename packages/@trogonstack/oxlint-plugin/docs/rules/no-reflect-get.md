# trogonstack/no-reflect-get

Disallow Reflect.get; use typed property access or parse dynamic input into a domain type.

## Why

`Reflect.get(owner, key)` bypasses ordinary property access and the type evidence that comes with it, usually returning an untyped value. Use typed property access, or parse dynamic input into a named domain type before reading it.

## Detection

Flags calls to the global `Reflect.get`, including `Reflect['get'](...)`. A `Reflect` that is locally declared or passed in as a parameter is not the global and is ignored. Other `Reflect` methods are not reported.

## Examples

Invalid:

```ts
const fromDot = Reflect.get(owner, key);
const fromBracket = Reflect['get'](owner, key);
```

Valid:

```ts
const byProperty = owner.property;
const byKey = owner[key];
Reflect.set(owner, key, value);
const Reflect = {
  get() {
    return 1;
  },
};
Reflect.get();
```

## Options

This rule has no options.
