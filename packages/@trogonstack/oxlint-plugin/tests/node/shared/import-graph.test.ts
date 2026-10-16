import { deepStrictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { importersOf } from '../../../src/shared/import-graph.ts';

const root = `${import.meta.dirname}/../../fixtures/import-graph/src`;

describe('importersOf', () => {
  it('links dot and dot-dot specifiers to the directory index', () => {
    const importers = importersOf({ root, segments: ['lib', 'index.ts'] }, [])
      .map((segments) => segments.join('/'))
      .toSorted();
    deepStrictEqual(importers, ['lib/sibling.ts', 'lib/sub/user.ts']);
  });
});
