import { RuleTester } from 'oxlint/plugins-dev';

import { noChainedTypeAssertionsRule } from '../../../src/rules/no-chained-type-assertions.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } });
const error = { messageId: 'chained' };

tester.run('trogonstack/no-chained-type-assertions', noChainedTypeAssertionsRule, {
  valid: [
    'const user = value as User;',
    'const user = <User>value;',
    'const tuple = [1, 2] as const;',
    'const tuple = <const>[1, 2];',
    'const tuple = [1, 2] as const as const;',
    'const tuple = (([1, 2] as const) as const);',
    'const tuple = <const>(<const>[1, 2]);',
    'const user = (value as User);',
    'const user = (value as unknown).user as User;',
    'const user = load(value as unknown) as User;',
    'const user = { id: value as unknown } as User;',
    'const user = (value as unknown, other) as User;',
    'const user = value!;',
    'const user = (value as unknown)!;',
    'const user = value satisfies User;',
  ],
  invalid: [
    { code: 'const user = value as unknown as User;', errors: [error] },
    { code: 'const user = <User>(<unknown>value);', errors: [error] },
    { code: 'const user = <User><unknown>value;', errors: [error] },
    { code: 'const user = (value as unknown) as User;', errors: [error] },
    { code: 'const user = ((value as unknown)) as User;', errors: [error] },
    { code: 'const user = (value as unknown as User);', errors: [error] },
    { code: 'const user = <User>(value as unknown);', errors: [error] },
    { code: 'const user = (<unknown>value) as User;', errors: [error] },
    { code: 'const user = value as unknown as Intermediate as User;', errors: [error] },
    { code: 'const user = (((value as A) as B) as C);', errors: [error] },
    { code: 'const user = value as const as User;', errors: [error] },
    { code: 'const user = value as unknown as const;', errors: [error] },
    { code: 'const user = <const>(value as unknown);', errors: [error] },
    {
      code: 'const first = a as unknown as A; const second = b as unknown as B;',
      errors: [error, error],
    },
    { code: 'load(value as unknown as User);', errors: [error] },
    { code: 'const user = (value as unknown as User).name;', errors: [error] },
    { code: 'const user = { nested: value as unknown as User };', errors: [error] },
    { code: 'const user = (value as unknown as User) as Other;', errors: [error] },
    {
      code: 'const user = (value as unknown as User).profile as unknown as Profile;',
      errors: [error, error],
    },
  ],
});
