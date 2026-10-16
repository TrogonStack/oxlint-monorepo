import { sourceDirectories } from './source-path.ts';

import type { SourcePath } from './source-path.ts';

const APP_DIRECTORY = 'app';
const PRIVATE_DIRECTORY_PREFIX = '_';

/** Returns the route directory segments of a file under `src/app`, or `null` when it lives elsewhere. */
export function routeSegments(path: SourcePath): readonly string[] | null {
  if (path.segments[0] !== APP_DIRECTORY) return null;
  const directories = sourceDirectories(path).slice(1);
  const privateIndex = directories.findIndex((segment) =>
    segment.startsWith(PRIVATE_DIRECTORY_PREFIX),
  );
  return privateIndex === -1 ? directories : directories.slice(0, privateIndex);
}

export function formatRoute(route: readonly string[]): string {
  return route.length === 0 ? '/' : route.join('/');
}

/** Tells whether the path sits under a `server/actions` or `_server/actions` directory pair. */
export function isServerActionsPath(path: SourcePath): boolean {
  const directories = sourceDirectories(path);
  return directories.some(
    (segment, index) =>
      (segment === 'server' || segment === '_server') && directories[index + 1] === 'actions',
  );
}
