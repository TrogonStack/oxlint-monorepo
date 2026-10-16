import { defineRule } from '@oxlint/plugins';

import { formatRoute, routeSegments } from '../shared/app-routes.ts';
import { ruleDocsUrl } from '../shared/docs.ts';
import { importSourceVisitors } from '../shared/module-directives.ts';
import { getTrogonstackSettings } from '../shared/plugin-settings.ts';
import { resolveSourceImport, sourcePath } from '../shared/source-path.ts';

export const noCrossRouteImportsRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      url: ruleDocsUrl('no-cross-route-imports'),
      description: 'Disallow importing between sibling routes under `src/app`.',
    },
    schema: [],
    messages: {
      crossRoute:
        'Route `{{importer}}` must not import from route `{{target}}`. Move the shared code to a common parent route.',
    },
  },
  createOnce(context) {
    return importSourceVisitors((node, source) => {
      const importer = sourcePath(context);
      if (importer === null) return;
      const importerRoute = routeSegments(importer);
      if (importerRoute === null) return;

      const target = resolveSourceImport(
        importer,
        source,
        getTrogonstackSettings(context).sourceAliases,
      );
      if (target === null) return;
      const targetRoute = routeSegments(target);
      if (targetRoute === null) return;

      const isSharedAncestor = targetRoute.every(
        (segment, index) => importerRoute[index] === segment,
      );
      if (isSharedAncestor) return;

      context.report({
        node,
        messageId: 'crossRoute',
        data: { importer: formatRoute(importerRoute), target: formatRoute(targetRoute) },
      });
    });
  },
});
