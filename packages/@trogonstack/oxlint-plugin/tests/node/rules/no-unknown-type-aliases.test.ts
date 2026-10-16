import { RuleTester } from 'oxlint/plugins-dev';

import { noUnknownTypeAliasesRule } from '../../../src/rules/no-unknown-type-aliases.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } });
const error = { messageId: 'unknownAlias' };

tester.run('trogonstack/no-unknown-type-aliases', noUnknownTypeAliasesRule, {
  valid: [
    'type User = { readonly id: string };',
    'type Alias = string; type UserId = Alias;',
    'type Box<T> = T; type Value = Box<unknown>;',
  ],
  invalid: [
    { code: 'type Alias = unknown;', errors: [error] },
    { code: 'type Current = unknown;', errors: [error] },
    { code: 'type UnknownValue = unknown; type Alias = UnknownValue;', errors: [error, error] },
    { code: 'type Box<T> = unknown;', errors: [error] },
    { code: 'type Box<T> = unknown; type Value = Box<string>;', errors: [error] },
  ],
});
