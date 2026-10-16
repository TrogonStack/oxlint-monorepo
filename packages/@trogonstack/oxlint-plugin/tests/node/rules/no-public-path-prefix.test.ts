import { RuleTester } from 'oxlint/plugins-dev';

import { noPublicPathPrefixRule } from '../../../src/rules/no-public-path-prefix.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });
const error = { messageId: 'publicPrefix' };

tester.run('trogonstack/no-public-path-prefix', noPublicPathPrefixRule, {
  valid: [
    'export const View = () => <img src="/logo.png" />;',
    "export const href = '/publications/2026';",
    "export const path = 'public/logo.png';",
    'export const url = `/images/${name}.png`;',
  ],
  invalid: [
    { code: 'export const View = () => <img src="/public/logo.png" />;', errors: [error] },
    { code: "export const href = '/public';", errors: [error] },
    { code: 'export const url = `/public/images/${name}.png`;', errors: [error] },
  ],
});
