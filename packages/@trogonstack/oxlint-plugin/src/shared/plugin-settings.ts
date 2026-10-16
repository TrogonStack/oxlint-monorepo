import type { Context } from '@oxlint/plugins';

export const SETTINGS_KEY = 'trogonstack';

export interface TrogonstackSettings {
  readonly placeholderPatterns: readonly string[];
  readonly marketingPatterns: readonly string[];
  readonly genericStatLabels: readonly string[];
  readonly actionWords: readonly string[];
  readonly demoDataModules: readonly string[];
  readonly realDataIndicators: readonly string[];
  readonly clientOnlyImports: readonly string[];
  readonly sourceAliases: readonly string[];
}

export const DEFAULT_SETTINGS: TrogonstackSettings = {
  placeholderPatterns: ['coming soon', 'todo', 'tbd', 'lorem ipsum', 'placeholder'],
  marketingPatterns: ['powerful', 'seamless', 'unlock', 'supercharge'],
  genericStatLabels: ['performance', 'insights', 'overview', 'analytics', 'usage', 'activity'],
  actionWords: ['retry', 'open', 'create', 'run', 'fix', 'clear filter'],
  demoDataModules: ['@/demo', '@/mocks', '@/fixtures'],
  realDataIndicators: ['fetch', 'db', 'prisma', 'trpc'],
  clientOnlyImports: ['next/navigation', '@tanstack/react-query', 'recharts'],
  sourceAliases: ['@/'],
};

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/** Reads `settings.trogonstack`, keeping the default for any missing or malformed list. */
export function getTrogonstackSettings(context: Pick<Context, 'settings'>): TrogonstackSettings {
  const configured: unknown = context.settings[SETTINGS_KEY];
  if (typeof configured !== 'object' || configured === null || Array.isArray(configured)) {
    return DEFAULT_SETTINGS;
  }
  const overrides = configured as Record<string, unknown>;
  const pick = (key: keyof TrogonstackSettings): readonly string[] => {
    const value = overrides[key];
    return isStringList(value) ? value : DEFAULT_SETTINGS[key];
  };
  return {
    placeholderPatterns: pick('placeholderPatterns'),
    marketingPatterns: pick('marketingPatterns'),
    genericStatLabels: pick('genericStatLabels'),
    actionWords: pick('actionWords'),
    demoDataModules: pick('demoDataModules'),
    realDataIndicators: pick('realDataIndicators'),
    clientOnlyImports: pick('clientOnlyImports'),
    sourceAliases: pick('sourceAliases'),
  };
}
