import { deepStrictEqual, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { resolveSourceImport, sourcePath } from '../../../src/shared/source-path.ts';

describe('sourcePath', () => {
  it('returns segments relative to the nearest enclosing src directory', () => {
    deepStrictEqual(sourcePath('/repo/apps/web/src/app/cart/page.tsx'), {
      root: '/repo/apps/web/src',
      segments: ['app', 'cart', 'page.tsx'],
    });
  });

  it('normalizes Windows separators', () => {
    deepStrictEqual(sourcePath('C:\\repo\\src\\app\\page.tsx')?.segments, ['app', 'page.tsx']);
  });

  it('ignores files outside a src directory', () => {
    strictEqual(sourcePath('/repo/next-env.d.ts'), null);
    strictEqual(sourcePath('/repo/src'), null);
  });
});

describe('resolveSourceImport', () => {
  const importer = sourcePath('/repo/src/app/cart/page.tsx');
  if (importer === null) throw new Error('fixture path must resolve');

  it('resolves relative specifiers against the importing directory', () => {
    deepStrictEqual(resolveSourceImport(importer, '../checkout/_components/total', [])?.segments, [
      'app',
      'checkout',
      '_components',
      'total',
    ]);
    deepStrictEqual(resolveSourceImport(importer, './_hooks/use-cart', [])?.segments, [
      'app',
      'cart',
      '_hooks',
      'use-cart',
    ]);
  });

  it('resolves aliased specifiers from the src root', () => {
    deepStrictEqual(resolveSourceImport(importer, '@/libs/money', ['@/'])?.segments, [
      'libs',
      'money',
    ]);
  });

  it('ignores packages and specifiers that escape src', () => {
    strictEqual(resolveSourceImport(importer, 'react', ['@/']), null);
    strictEqual(resolveSourceImport(importer, '../../../outside', ['@/']), null);
  });
});
