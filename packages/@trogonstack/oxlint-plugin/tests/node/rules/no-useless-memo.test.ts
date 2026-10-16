import { RuleTester } from 'oxlint/plugins-dev';

import { noUselessMemoRule } from '../../../src/rules/no-useless-memo.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });

tester.run('trogonstack/no-useless-memo', noUselessMemoRule, {
  valid: [
    'const rows = useMemo(() => ({ total: items.length, items }), [items]);',
    'const filtered = useMemo(() => items.filter((item) => item.active), [items]);',
    'const saved = useCallback(() => { submit(); }, []);',
    'const unknown = memoFactory(() => 1, []);',
    "import { useMemo } from 'proxy-memoize';\nconst value = useMemo(() => 1, []);",
    'function useMemo(factory) { return factory(); }\nconst value = useMemo(() => 1, []);',
    "import { useMemo } from 'react';\nconst filtered = useMemo(() => items.filter((item) => item.active), [items]);",
  ],
  invalid: [
    {
      code: 'const value = useMemo(() => 1, []);',
      errors: [{ messageId: 'uselessMemo' }],
    },
    {
      code: 'const label = useMemo(function () { return `Ready`; }, []);',
      errors: [{ messageId: 'uselessMemo' }],
    },
    {
      code: 'const onClick = useCallback(() => submit(), []);',
      errors: [{ messageId: 'uselessCallback' }],
    },
    {
      code: 'const onClick = useCallback(function () { return submit; }, []);',
      errors: [{ messageId: 'uselessCallback' }],
    },
    {
      code: "import { useMemo } from 'react';\nconst value = useMemo(() => 1, []);",
      errors: [{ messageId: 'uselessMemo' }],
    },
    {
      code: "import { useMemo as memoize } from 'react';\nconst value = memoize(() => 1, []);",
      errors: [{ messageId: 'uselessMemo' }],
    },
    {
      code: "import * as React from 'react';\nconst value = React.useMemo(() => 1, []);",
      errors: [{ messageId: 'uselessMemo' }],
    },
    {
      code: "import React from 'react';\nconst onClick = React.useCallback(() => submit(), []);",
      errors: [{ messageId: 'uselessCallback' }],
    },
    {
      code: 'const value = React.useMemo(() => 1, []);',
      errors: [{ messageId: 'uselessMemo' }],
    },
  ],
});
