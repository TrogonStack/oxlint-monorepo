import { RuleTester } from 'oxlint/plugins-dev';

import { requireColocatedCssModulesRule } from '../../../src/rules/require-colocated-css-modules.ts';

const tester = new RuleTester({
  cwd: '/repo',
  languageOptions: { parserOptions: { lang: 'tsx' } },
});
const button = '/repo/src/components/button/button.tsx';

function foreign(expected: string) {
  return { messageId: 'foreignCssModule', data: { expected } };
}

tester.run('trogonstack/require-colocated-css-modules', requireColocatedCssModulesRule, {
  valid: [
    { code: "import styles from './button.module.css';", filename: button },
    { code: "import styles from './button.module.scss';", filename: button },
    { code: "import styles from './button.module.sass';", filename: button },
    { code: "import styles from './button.module.less';", filename: button },
    { code: "import styles from './button.module.css?inline';", filename: button },
    { code: "import styles from '@/components/button/button.module.css';", filename: button },
    {
      code: "import styles from './button.module.css';",
      filename: '/repo/src/components/button/button.client.tsx',
    },
    {
      code: "import styles from './button.client.module.css';",
      filename: '/repo/src/components/button/button.client.tsx',
    },
    { code: "import './global.css';", filename: button },
    { code: "import './other.css';", filename: button },
    { code: "import styles from '../styles/shared.css';", filename: button },
    { code: "import styles from 'library/theme.module.css';", filename: button },
    { code: "import styles from './other.module.css';", filename: '/repo/lib/button.tsx' },
    { code: "export { default } from './button.module.css';", filename: button },
    { code: "const styles = await import('./button.module.css');", filename: button },
    { code: 'const styles = await import(name);', filename: button },
  ],
  invalid: [
    {
      code: "import styles from './card.module.css';",
      filename: button,
      errors: [foreign('button.module.css')],
    },
    {
      code: "import styles from '../card/card.module.scss';",
      filename: button,
      errors: [foreign('button.module.scss')],
    },
    {
      code: "import styles from '../button.module.css';",
      filename: button,
      errors: [foreign('button.module.css')],
    },
    {
      code: "import styles from './nested/button.module.css';",
      filename: button,
      errors: [foreign('button.module.css')],
    },
    {
      code: "import styles from '@/components/card/card.module.css';",
      filename: button,
      errors: [foreign('button.module.css')],
    },
    {
      code: "import styles from '@/components/button/card.module.css';",
      filename: button,
      errors: [foreign('button.module.css')],
    },
    {
      code: "import styles from '~/components/card/card.module.css';",
      filename: button,
      settings: { trogonstack: { sourceAliases: ['~/'] } },
      errors: [foreign('button.module.css')],
    },
    {
      code: "export { default } from './card.module.less';",
      filename: button,
      errors: [foreign('button.module.less')],
    },
    {
      code: "const styles = await import('./card.module.css');",
      filename: button,
      errors: [foreign('button.module.css')],
    },
    {
      code: "import './card.module.css';",
      filename: button,
      errors: [foreign('button.module.css')],
    },
    {
      code: "import styles from './card.module.css?inline';",
      filename: button,
      errors: [foreign('button.module.css')],
    },
  ],
});
