import { defineRule } from '@oxlint/plugins';

import { ruleDocsUrl } from '../shared/docs.ts';
import { getTrogonstackSettings } from '../shared/plugin-settings.ts';
import { resolveSourceImport, sourceFileName, sourcePath } from '../shared/source-path.ts';

const CLIENT_MODULE = /\.client(?:\.[^.]+)?$/u;
const COMPONENT_NAME = /^[A-Z]/u;
const CLIENT_SUFFIX = 'Client';

export const requireClientComponentSuffixRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      url: ruleDocsUrl('require-client-component-suffix'),
      description:
        'Require client components to be named with a `Client` suffix instead of being aliased on import.',
    },
    schema: [],
    messages: {
      aliasedComponent:
        'Name the export `{{imported}}Client` in the `*.client.*` module instead of aliasing `{{imported}}` to `{{local}}`.',
    },
  },
  createOnce(context) {
    return {
      ImportDeclaration(node) {
        const importer = sourcePath(context);
        if (importer === null) return;
        const target = resolveSourceImport(
          importer,
          node.source.value,
          getTrogonstackSettings(context).sourceAliases,
        );
        if (target === null || !CLIENT_MODULE.test(sourceFileName(target))) return;

        for (const specifier of node.specifiers) {
          if (specifier.type !== 'ImportSpecifier') continue;
          const imported =
            specifier.imported.type === 'Identifier'
              ? specifier.imported.name
              : specifier.imported.value;
          if (imported === specifier.local.name) continue;
          if (!COMPONENT_NAME.test(imported) || imported.endsWith(CLIENT_SUFFIX)) continue;
          context.report({
            node: specifier,
            messageId: 'aliasedComponent',
            data: { imported, local: specifier.local.name },
          });
        }
      },
    };
  },
});
