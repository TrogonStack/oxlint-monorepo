import { deepStrictEqual, ok } from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import plugin from '../../../src/index.ts';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const oxlintBin = join(packageRoot, 'node_modules', '.bin', 'oxlint');
const configsUrl = './node_modules/@trogonstack/oxlint-plugin/configs';

const BUILDING_BLOCKS = [
  'structure',
  'app-structure',
  'naming',
  'typescript',
  'react',
  'react-dom',
] as const;
const PRESETS = ['library', 'react-library', 'nextjs', 'vite', 'expo'] as const;
const ALL_CONFIGS = [...BUILDING_BLOCKS, ...PRESETS];
const PLUGIN_SPECIFIER = '@trogonstack/oxlint-plugin';

type Preset = (typeof PRESETS)[number];
type Framework = 'nextjs' | 'vite' | 'expo';
const FRAMEWORKS: readonly Framework[] = ['nextjs', 'vite', 'expo'];

const PRESET_EXTENDS: Record<Preset, string[]> = {
  library: ['structure', 'naming', 'typescript'],
  'react-library': ['library', 'react'],
  nextjs: ['react-library', 'app-structure', 'react-dom'],
  vite: ['react-library', 'app-structure', 'react-dom'],
  expo: ['react-library', 'app-structure'],
};

const FRAMEWORK_ONLY: Record<Preset, string[]> = {
  library: [],
  'react-library': [],
  nextjs: [
    'no-pages-router',
    'no-server-action-imports',
    'require-client-component-suffix',
    'require-locale-route-parameter',
    'require-server-directives',
    'no-unjustified-use-client',
    'no-server-file-suffix',
  ],
  vite: ['require-app-entry-file'],
  expo: ['no-root-assets-directory'],
};

const FRAMEWORK_DECOYS: Record<Framework, { file: string; source: string; rule: string }> = {
  nextjs: {
    file: 'src/pages/index.tsx',
    source: 'export const page = 1;\n',
    rule: 'no-pages-router',
  },
  vite: {
    file: 'src/main.tsx',
    source: 'export const main = 1;\n',
    rule: 'require-app-entry-file',
  },
  expo: {
    file: 'src/app/index.tsx',
    source: "import logo from '../../assets/logo.png';\nexport const screen = logo;\n",
    rule: 'no-root-assets-directory',
  },
};

const PROBES = [
  {
    layer: 'structure',
    file: 'src/types.d.ts',
    source: 'export type Id = string;\n',
    code: 'trogonstack(require-types-directory)',
    presets: PRESETS,
  },
  {
    layer: 'naming',
    file: 'src/Widgets/Button.tsx',
    source: 'export const x = 1;\n',
    code: 'trogonstack(require-kebab-case-directories)',
    presets: PRESETS,
  },
  {
    layer: 'naming',
    file: 'src/Widgets/Button.tsx',
    source: 'export const x = 1;\n',
    code: 'unicorn(filename-case)',
    presets: PRESETS,
  },
  {
    layer: 'typescript',
    file: 'src/lib/read.ts',
    source: "export const x = Reflect.get({}, 'a');\n",
    code: 'trogonstack(no-reflect-get)',
    presets: PRESETS,
  },
  {
    layer: 'react',
    file: 'src/lib/copy.tsx',
    source: 'export const x = <p>Lorem ipsum dolor</p>;\n',
    code: 'trogonstack(no-placeholder-copy)',
    presets: ['react-library', 'nextjs', 'vite', 'expo'],
  },
  {
    layer: 'app-structure',
    file: 'src/app/components/x.tsx',
    source: 'export const x = 1;\n',
    code: 'trogonstack(require-private-app-directories)',
    presets: ['nextjs', 'vite', 'expo'],
  },
  {
    layer: 'react-dom',
    file: 'src/lib/layer.tsx',
    source: 'export const x = <div className="z-[9999]" />;\n',
    code: 'trogonstack(no-arbitrary-z-index)',
    presets: ['nextjs', 'vite'],
  },
] as const;

interface Config {
  extends?: string[];
  plugins?: string[];
  jsPlugins?: string[];
  rules?: Record<string, unknown>;
}

function readConfig(name: string): Config {
  return JSON.parse(readFileSync(join(packageRoot, 'configs', `${name}.json`), 'utf8'));
}

function ownRules(name: string): string[] {
  return Object.keys(readConfig(name).rules ?? {})
    .filter((rule) => rule.startsWith('trogonstack/'))
    .map((rule) => rule.slice('trogonstack/'.length));
}

function severity(name: string, rule: string): unknown {
  const value = readConfig(name).rules?.[`trogonstack/${rule}`];
  return Array.isArray(value) ? value[0] : value;
}

function lint(root: string, file: string, source: string, config = '.oxlintrc.json') {
  mkdirSync(dirname(join(root, file)), { recursive: true });
  writeFileSync(join(root, file), source);
  const result = spawnSync(oxlintBin, ['-c', config, '--format', 'json', file], {
    cwd: root,
    encoding: 'utf8',
  });
  const report: { diagnostics: { code: string }[] } = JSON.parse(result.stdout);
  return report.diagnostics.map((diagnostic) => diagnostic.code);
}

describe('configs', () => {
  const registered = Object.keys(plugin.rules ?? {});
  let workspace = '';

  function createProject(name: string, config: Config): string {
    const root = join(workspace, name);
    mkdirSync(join(root, 'node_modules', '@trogonstack'), { recursive: true });
    symlinkSync(packageRoot, join(root, 'node_modules', '@trogonstack', 'oxlint-plugin'));
    writeFileSync(join(root, '.oxlintrc.json'), JSON.stringify(config));
    return root;
  }

  const extending = (...names: string[]): Config => ({
    extends: names.map((name) => `${configsUrl}/${name}.json`),
  });

  before(() => {
    execFileSync('pnpm', ['exec', 'tsc', '-p', 'tsconfig.build.json'], { cwd: packageRoot });
    workspace = mkdtempSync(join(tmpdir(), 'oxlint-presets-'));
  });

  after(() => {
    rmSync(workspace, { recursive: true, force: true });
  });

  for (const name of ALL_CONFIGS) {
    it(`${name} only enables registered rules`, () => {
      for (const rule of ownRules(name)) ok(registered.includes(rule), `${name}: ${rule}`);
    });
  }

  it('building blocks load the plugin and presets inherit it', () => {
    for (const name of BUILDING_BLOCKS) {
      deepStrictEqual(readConfig(name).jsPlugins, [PLUGIN_SPECIFIER], name);
    }
    for (const name of PRESETS) deepStrictEqual(readConfig(name).jsPlugins, undefined, name);
  });

  it('every plugin rule belongs to exactly one building block or one framework', () => {
    const owners = new Map<string, string[]>();
    for (const name of ALL_CONFIGS) {
      for (const rule of ownRules(name)) owners.set(rule, [...(owners.get(rule) ?? []), name]);
    }
    for (const rule of registered) {
      deepStrictEqual(owners.get(rule)?.length, 1, `${rule}: ${owners.get(rule)?.join(', ')}`);
    }
    deepStrictEqual([...owners.keys()].toSorted(), registered.toSorted());
  });

  it('presets extend the expected layers and add only their own rules', () => {
    for (const preset of PRESETS) {
      deepStrictEqual(
        readConfig(preset).extends,
        PRESET_EXTENDS[preset].map((name) => `./${name}.json`),
      );
      deepStrictEqual(ownRules(preset).toSorted(), FRAMEWORK_ONLY[preset].toSorted());
    }
  });

  it('building blocks do not extend other configs', () => {
    for (const name of BUILDING_BLOCKS) deepStrictEqual(readConfig(name).extends, undefined);
  });

  it('severity follows the rule description', () => {
    for (const name of ALL_CONFIGS) {
      for (const rule of ownRules(name)) {
        const description = plugin.rules?.[rule]?.meta?.docs?.description ?? '';
        const expected = description.startsWith('Discourage') ? 'warn' : 'error';
        if (name === 'structure' && rule === 'require-import-locality') continue;
        deepStrictEqual(severity(name, rule), expected, `${name}: ${rule}`);
      }
    }
  });

  for (const preset of PRESETS) {
    describe(`${preset} preset`, () => {
      let root = '';

      before(() => {
        root = createProject(preset, extending(preset));
      });

      for (const probe of PROBES) {
        const enabled = (probe.presets as readonly string[]).includes(preset);
        it(`${enabled ? 'reports' : 'does not report'} ${probe.code} from ${probe.layer}`, () => {
          const codes = lint(root, probe.file, probe.source);
          deepStrictEqual(codes.includes(probe.code), enabled, codes.join(', '));
        });
      }

      for (const framework of FRAMEWORKS) {
        const decoy = FRAMEWORK_DECOYS[framework];
        const enabled = framework === preset;
        it(`${enabled ? 'reports' : 'does not report'} ${decoy.rule}`, () => {
          const codes = lint(root, decoy.file, decoy.source);
          deepStrictEqual(codes.includes(`trogonstack(${decoy.rule})`), enabled, codes.join(', '));
        });
      }
    });
  }

  it('structure rules apply through a framework preset', () => {
    const codes = lint(
      join(workspace, 'nextjs'),
      'src/app/cart/page.tsx',
      "import { x } from '../checkout/page';\nexport const y = x;\n",
    );
    ok(codes.includes('trogonstack(no-cross-route-imports)'), codes.join(', '));
  });

  for (const block of BUILDING_BLOCKS) {
    const probe = PROBES.find((candidate) => candidate.layer === block);
    it(`${block} works when extended alone`, () => {
      ok(probe !== undefined, `${block} has no probe`);
      const root = createProject(`alone-${block}`, extending(block));
      const codes = lint(root, probe.file, probe.source);
      ok(codes.includes(probe.code), codes.join(', '));
    });
  }

  it('loads the plugin once when several configs and the root all declare it', () => {
    const root = createProject('duplicates', {
      ...extending('nextjs', 'typescript', 'naming'),
      jsPlugins: [PLUGIN_SPECIFIER],
    });
    const codes = lint(root, 'src/Widgets/read.ts', "export const x = Reflect.get({}, 'a');\n");
    deepStrictEqual(codes.filter((code) => code === 'trogonstack(no-reflect-get)').length, 1);
    deepStrictEqual(
      codes.filter((code) => code === 'trogonstack(require-kebab-case-directories)').length,
      1,
    );
  });

  it('lets the root config override a preset rule', () => {
    const root = createProject('overrides', {
      ...extending('nextjs'),
      rules: { 'trogonstack/no-reflect-get': 'off', 'unicorn/filename-case': 'off' },
    });
    const codes = lint(root, 'src/lib/Read.ts', "export const x = Reflect.get({}, 'a');\n");
    ok(!codes.includes('trogonstack(no-reflect-get)'), codes.join(', '));
    ok(!codes.includes('unicorn(filename-case)'), codes.join(', '));
  });

  it('accepts Next.js special files under the naming config', () => {
    const root = createProject('special-files', extending('naming'));
    for (const file of [
      'src/app/page.tsx',
      'src/app/layout.tsx',
      'src/app/template.tsx',
      'src/app/loading.tsx',
      'src/app/error.tsx',
      'src/app/not-found.tsx',
      'src/app/global-error.tsx',
      'src/app/global-not-found.tsx',
      'src/app/forbidden.tsx',
      'src/app/unauthorized.tsx',
      'src/app/@modal/default.tsx',
      'src/app/api/users/route.ts',
      'src/app/icon.tsx',
      'src/app/apple-icon.tsx',
      'src/app/opengraph-image.tsx',
      'src/app/twitter-image.tsx',
      'src/app/sitemap.ts',
      'src/app/robots.ts',
      'src/app/manifest.ts',
      'src/middleware.ts',
      'src/proxy.ts',
      'src/instrumentation.ts',
      'src/instrumentation-client.ts',
      'src/mdx-components.tsx',
      'src/pages/_app.tsx',
      'src/pages/_document.tsx',
      'src/pages/_error.tsx',
      'src/pages/404.tsx',
      'src/pages/500.tsx',
      'src/pages/api/auth/[...nextauth].ts',
      'src/app/[locale]/(shop)/[[...categories]]/page.tsx',
      'src/app/@modal/(..)photo/page.tsx',
      'src/app/@modal/(...)photo/page.tsx',
      'src/app/feed/@modal/(..)(..)photo/page.tsx',
      'src/app/@modal/(.)[username]/page.tsx',
      'src/app/@modal/(.)[...slug]/page.tsx',
      'src/app/blog/[slug]/page.tsx',
      'src/app/docs/[...path]/page.tsx',
      'src/app/docs/[[...path]]/page.tsx',
      'src/app/blog/[slug].tsx',
      'src/app/users/[userId].tsx',
      'src/app/docs/[...filePath].tsx',
      'src/app/docs/[[...filePath]].tsx',
      'src/components/button/button.client.tsx',
      'src/components/button/button.test.tsx',
      'src/app/(marketing)/_components/hero.tsx',
      'src/app/@modal/(.)photo/page.tsx',
      'src/lib/globals.d.ts',
    ]) {
      deepStrictEqual(lint(root, file, 'export const x = 1;\n'), [], file);
    }
  });

  it('leaves the `.server` suffix to frameworks that give it a meaning', () => {
    const root = createProject('server-suffix', extending('vite'));
    deepStrictEqual(lint(root, 'src/app/_services/db.server.ts', 'export const db = 1;\n'), []);
  });

  it('still reports non-kebab files that only resemble dynamic segments', () => {
    const root = createProject('dynamic-lookalikes', extending('naming'));
    for (const file of ['src/app/users/UserCard.tsx', 'src/app/users/[userId]Card.tsx']) {
      ok(lint(root, file, 'export const x = 1;\n').includes('unicorn(filename-case)'), file);
    }
  });
});
