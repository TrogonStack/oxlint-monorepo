import { RuleTester } from 'oxlint/plugins-dev';

import { noRootAssetsDirectoryRule } from '../../../src/rules/no-root-assets-directory.ts';

const tester = new RuleTester({ cwd: '/repo' });
const error = { messageId: 'rootAssets' };

tester.run('trogonstack/no-root-assets-directory', noRootAssetsDirectoryRule, {
  valid: [
    { code: "import logo from '../assets/logo.png';", filename: '/repo/src/app/page.tsx' },
    { code: "import logo from '../../assets/logo.png';", filename: '/repo/src/app/a/page.tsx' },
    { code: "import logo from './assets/logo.png';", filename: '/repo/src/page.tsx' },
    { code: "import logo from '../../static/logo.png';", filename: '/repo/src/app/page.tsx' },
    { code: "import logo from '../../assets-old/logo.png';", filename: '/repo/src/app/page.tsx' },
    { code: "import logo from '../../../assets/logo.png';", filename: '/repo/src/app/page.tsx' },
    { code: "import logo from '../../other/assets/logo.png';", filename: '/repo/src/app/page.tsx' },
    { code: "import logo from '../../assets';", filename: '/repo/src/app/page.tsx' },
    { code: "import logo from 'assets/logo.png';", filename: '/repo/src/app/page.tsx' },
    { code: "import logo from '../../assets/logo.png';", filename: '/repo/vite.config.ts' },
    {
      code: "import logo from '..\\\\..\\\\static\\\\logo.png';",
      filename: 'C:\\repo\\src\\app\\page.tsx',
    },
  ],
  invalid: [
    {
      code: "import logo from '../../assets/logo.png';",
      filename: '/repo/src/app/page.tsx',
      errors: [error],
    },
    {
      code: "export * from '../../assets/icons';",
      filename: '/repo/src/app/page.tsx',
      errors: [error],
    },
    {
      code: "const logo = import('../../assets/logo.png');",
      filename: '/repo/src/app/page.tsx',
      errors: [error],
    },
    {
      code: "import logo from '../../../assets/logo.png';",
      filename: '/repo/src/app/a/page.tsx',
      errors: [error],
    },
    {
      code: "import logo from '../assets/logo.png';",
      filename: '/repo/src/page.tsx',
      errors: [error],
    },
    {
      code: "import logo from '../../assets/logo.png';",
      filename: '/repo/apps/mobile/src/app/page.tsx',
      errors: [error],
    },
    {
      code: "import logo from '..\\\\..\\\\assets\\\\logo.png';",
      filename: 'C:\\repo\\src\\app\\page.tsx',
      errors: [error],
    },
  ],
});
