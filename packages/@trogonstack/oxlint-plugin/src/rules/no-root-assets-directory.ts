import { defineRule } from '@oxlint/plugins';

import { ruleDocsUrl } from '../shared/docs.ts';
import { importSourceVisitors } from '../shared/module-directives.ts';
import { sourceDirectories, sourcePath } from '../shared/source-path.ts';

const ASSETS_DIRECTORY = 'assets';

function reachesRootAssets(directories: readonly string[], specifier: string): boolean {
  const normalized = specifier.replaceAll('\\', '/');
  if (!normalized.startsWith('./') && !normalized.startsWith('../')) return false;
  const stack = [...directories];
  let escaped = 0;
  const parts = normalized.split('/');
  for (const [index, part] of parts.entries()) {
    if (part === '' || part === '.') continue;
    if (part === '..') {
      if (stack.length > 0) stack.pop();
      else escaped += 1;
      continue;
    }
    return (
      escaped === 1 && stack.length === 0 && part === ASSETS_DIRECTORY && index < parts.length - 1
    );
  }
  return false;
}

export const noRootAssetsDirectoryRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      url: ruleDocsUrl('no-root-assets-directory'),
      description:
        'Disallow importing from an `assets` directory at the project root instead of `src/assets`.',
    },
    schema: [],
    messages: {
      rootAssets:
        'Assets must live in `src/assets`, not in the root `assets` directory. Move them to `src/assets`.',
    },
  },
  createOnce(context) {
    return importSourceVisitors((node, source) => {
      const importer = sourcePath(context);
      if (importer === null) return;
      if (!reachesRootAssets(sourceDirectories(importer), source)) return;
      context.report({ node, messageId: 'rootAssets' });
    });
  },
});
