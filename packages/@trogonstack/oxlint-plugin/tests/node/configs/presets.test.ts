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
const PRESETS = ['project-structure', 'nextjs', 'vite'] as const;
const NEXTJS_ONLY = [
  'no-pages-router',
  'no-server-action-imports',
  'require-client-component-suffix',
  'require-locale-route-parameter',
  'require-server-directives',
  'no-unjustified-use-client',
];
const VITE_ONLY = ['require-app-entry-file'];

interface Preset {
  extends?: string[];
  plugins?: string[];
  jsPlugins?: string[];
  rules?: Record<string, string>;
}

function readPreset(name: string): Preset {
  return JSON.parse(readFileSync(join(packageRoot, 'configs', `${name}.json`), 'utf8'));
}

function ownRules(name: string): string[] {
  return Object.keys(readPreset(name).rules ?? {})
    .filter((rule) => rule.startsWith('trogonstack/'))
    .map((rule) => rule.slice('trogonstack/'.length));
}

function lint(root: string, file: string, source: string) {
  mkdirSync(dirname(join(root, file)), { recursive: true });
  writeFileSync(join(root, file), source);
  const result = spawnSync(oxlintBin, ['-c', '.oxlintrc.json', '--format', 'json', file], {
    cwd: root,
    encoding: 'utf8',
  });
  const report: { diagnostics: { code: string }[] } = JSON.parse(result.stdout);
  return report.diagnostics.map((diagnostic) => diagnostic.code);
}

describe('presets', () => {
  const registered = Object.keys(plugin.rules ?? {});
  let workspace = '';

  before(() => {
    execFileSync('pnpm', ['exec', 'tsc', '-p', 'tsconfig.build.json'], { cwd: packageRoot });
    workspace = mkdtempSync(join(tmpdir(), 'oxlint-presets-'));
  });

  after(() => {
    rmSync(workspace, { recursive: true, force: true });
  });

  for (const name of PRESETS) {
    it(`${name} only enables registered rules`, () => {
      for (const rule of ownRules(name)) ok(registered.includes(rule), `${name}: ${rule}`);
    });
  }

  it('framework presets extend the shared preset and add their own rules', () => {
    deepStrictEqual(readPreset('nextjs').extends, ['./project-structure.json']);
    deepStrictEqual(readPreset('vite').extends, ['./project-structure.json']);
    deepStrictEqual(ownRules('nextjs').toSorted(), [...NEXTJS_ONLY].toSorted());
    deepStrictEqual(ownRules('vite').toSorted(), [...VITE_ONLY].toSorted());
  });

  for (const [framework, violation, own, other] of [
    ['nextjs', 'src/pages/index.tsx', 'no-pages-router', 'require-app-entry-file'],
    ['vite', 'src/main.tsx', 'require-app-entry-file', 'no-pages-router'],
  ] as const) {
    it(`${framework} preset reports its own rules through extends`, () => {
      const root = join(workspace, framework);
      mkdirSync(join(root, 'node_modules', '@trogonstack'), { recursive: true });
      symlinkSync(packageRoot, join(root, 'node_modules', '@trogonstack', 'oxlint-plugin'));
      writeFileSync(
        join(root, '.oxlintrc.json'),
        JSON.stringify({
          extends: [`./node_modules/@trogonstack/oxlint-plugin/configs/${framework}.json`],
        }),
      );
      const codes = lint(root, violation, 'export const page = 1;\n');
      ok(codes.includes(`trogonstack(${own})`), codes.join(', '));
      ok(!codes.includes(`trogonstack(${other})`), codes.join(', '));
    });
  }

  it('project-structure rules apply through the shared preset', () => {
    const root = join(workspace, 'nextjs');
    const codes = lint(
      root,
      'src/app/cart/page.tsx',
      "import { x } from '../checkout/page';\nexport const y = x;\n",
    );
    ok(codes.includes('trogonstack(no-cross-route-imports)'), codes.join(', '));
  });
});
