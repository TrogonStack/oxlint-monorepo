import { RuleTester } from 'oxlint/plugins-dev';

import { requireColocatedCssModulesRule } from '../../../src/rules/require-colocated-css-modules.ts';

const tester = new RuleTester({
  cwd: '/repo',
  languageOptions: { parserOptions: { lang: 'tsx' } },
});
const button = '/repo/src/components/Button/Button.tsx';

function foreign(expected: string) {
  return { messageId: 'foreignCssModule', data: { expected } };
}

tester.run('trogonstack/require-colocated-css-modules', requireColocatedCssModulesRule, {
  valid: [
    { code: "import styles from './Button.module.css';", filename: button },
    { code: "import styles from './Button.module.scss';", filename: button },
    { code: "import styles from './Button.module.sass';", filename: button },
    { code: "import styles from './Button.module.less';", filename: button },
    { code: "import styles from './Button.module.css?inline';", filename: button },
    { code: "import styles from '@/components/Button/Button.module.css';", filename: button },
    {
      code: "import styles from './Button.module.css';",
      filename: '/repo/src/components/Button/Button.client.tsx',
    },
    {
      code: "import styles from './Button.client.module.css';",
      filename: '/repo/src/components/Button/Button.client.tsx',
    },
    { code: "import './global.css';", filename: button },
    { code: "import './Other.css';", filename: button },
    { code: "import styles from '../styles/shared.css';", filename: button },
    { code: "import styles from 'library/theme.module.css';", filename: button },
    { code: "import styles from './Other.module.css';", filename: '/repo/lib/Button.tsx' },
    { code: "export { default } from './Button.module.css';", filename: button },
    { code: "const styles = await import('./Button.module.css');", filename: button },
    { code: 'const styles = await import(name);', filename: button },
  ],
  invalid: [
    {
      code: "import styles from './Card.module.css';",
      filename: button,
      errors: [foreign('Button.module.css')],
    },
    {
      code: "import styles from '../Card/Card.module.scss';",
      filename: button,
      errors: [foreign('Button.module.scss')],
    },
    {
      code: "import styles from '../Button.module.css';",
      filename: button,
      errors: [foreign('Button.module.css')],
    },
    {
      code: "import styles from './nested/Button.module.css';",
      filename: button,
      errors: [foreign('Button.module.css')],
    },
    {
      code: "import styles from '@/components/Card/Card.module.css';",
      filename: button,
      errors: [foreign('Button.module.css')],
    },
    {
      code: "import styles from '@/components/Button/Card.module.css';",
      filename: button,
      errors: [foreign('Button.module.css')],
    },
    {
      code: "import styles from '~/components/Card/Card.module.css';",
      filename: button,
      settings: { trogonstack: { sourceAliases: ['~/'] } },
      errors: [foreign('Button.module.css')],
    },
    {
      code: "export { default } from './Card.module.less';",
      filename: button,
      errors: [foreign('Button.module.less')],
    },
    {
      code: "const styles = await import('./Card.module.css');",
      filename: button,
      errors: [foreign('Button.module.css')],
    },
    {
      code: "import './Card.module.css';",
      filename: button,
      errors: [foreign('Button.module.css')],
    },
    {
      code: "import styles from './Card.module.css?inline';",
      filename: button,
      errors: [foreign('Button.module.css')],
    },
  ],
});
