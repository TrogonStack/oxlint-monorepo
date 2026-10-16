import { deepStrictEqual, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { resolveSourceImport, sourcePath } from '../../../src/shared/source-path.ts';

describe('sourcePath', () => {
  it('returns segments relative to the nearest enclosing src directory', () => {
    deepStrictEqual(
      sourcePath({ filename: '/repo/apps/web/src/app/cart/page.tsx', cwd: '/repo' }),
      {
        root: '/repo/apps/web/src',
        segments: ['app', 'cart', 'page.tsx'],
      },
    );
  });

  it('normalizes Windows separators', () => {
    deepStrictEqual(
      sourcePath({ filename: 'C:\\repo\\src\\app\\page.tsx', cwd: 'C:\\repo' })?.segments,
      ['app', 'page.tsx'],
    );
  });

  it('ignores src directories above the working directory', () => {
    strictEqual(
      sourcePath({ filename: '/home/dev/src/repo/next-env.d.ts', cwd: '/home/dev/src/repo' }),
      null,
    );
    deepStrictEqual(
      sourcePath({ filename: '/home/dev/src/repo/src/app/page.tsx', cwd: '/home/dev/src/repo/' })
        ?.segments,
      ['app', 'page.tsx'],
    );
  });

  it('falls back to the nearest src directory for files outside the working directory', () => {
    deepStrictEqual(
      sourcePath({ filename: '/repo/src/app/page.tsx', cwd: '/elsewhere' })?.segments,
      ['app', 'page.tsx'],
    );
  });

  it('ignores files outside a src directory', () => {
    strictEqual(sourcePath({ filename: '/repo/next-env.d.ts', cwd: '/repo' }), null);
    strictEqual(sourcePath({ filename: '/repo/src', cwd: '/repo' }), null);
  });
});

describe('resolveSourceImport', () => {
  const importer = sourcePath({ filename: '/repo/src/app/cart/page.tsx', cwd: '/repo' });
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
