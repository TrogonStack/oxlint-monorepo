# trogonstack/no-reflect-apply

Disallow Reflect.apply; call typed functions directly or model dynamic dispatch behind an interface.

## Why

`Reflect.apply(fn, thisArg, args)` bypasses ordinary typed calls, so the compiler cannot check arguments or the result. Call the function directly, or model dynamic dispatch behind a named interface.

## Detection

Flags calls to the global `Reflect.apply`, including `Reflect['apply'](...)`. A `Reflect` that is locally declared or passed in as a parameter is not the global and is ignored. Other `Reflect` methods and `Function.prototype.apply` (`fn.apply(...)`) are not reported.

## Examples

Invalid:

```ts
const fromDot = Reflect.apply(operation, owner, args);
const fromBracket = Reflect['apply'](operation, owner, args);
```

Valid:

```ts
const direct = operation.apply(owner, args);
Reflect.get(owner, key);
const Reflect = {
  apply() {
    return 1;
  },
};
Reflect.apply();
```

## Options

This rule has no options.
