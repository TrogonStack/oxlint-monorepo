# trogonstack/no-module-mocking

Disallow Vitest and Jest module mocking; tests must replace dependencies through real interfaces.

## Why

Module mocks patch what an import resolves to, so a test no longer exercises the real wiring and can pass while production breaks. Inject the dependency through a real interface, a service layer, or a faithful test implementation instead.

## Detection

Flags calls to `mock`, `doMock`, and `unstable_mockModule` (dot or string-literal computed access) on `vi` or `jest`. The receiver counts as the framework object when it is the global `vi` or `jest`, an unresolved `vi` or `jest`, `vi` imported from `vitest` (including renamed imports), or `jest` imported from `@jest/globals`. A locally defined `vi` or `jest`, or a `vi` imported from another module, is ignored. `vi.spyOn` and other methods are not reported.

## Examples

Invalid:

```ts
vi.mock('./user-store');
jest.mock('./user-store');
vi['doMock']('./user-store');
jest.unstable_mockModule('./user-store');
import { vi as testApi } from 'vitest';
testApi.mock('./user-store');
import { jest } from '@jest/globals';
jest.mock('./user-store');
```

Valid:

```ts
const store = new InMemoryUserStore();
vi.spyOn(store, 'save');
const vi = { mock() {} };
vi.mock();
import { vi as localVi } from './helpers';
localVi.mock('./module');
```

## Options

This rule has no options.
