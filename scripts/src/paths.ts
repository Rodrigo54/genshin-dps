import { join } from 'node:path';

const REPO_ROOT = join(import.meta.dir, '..', '..');
const WEB_ROOT = join(REPO_ROOT, 'apps', 'web');
const WEB_PUBLIC = join(WEB_ROOT, 'public');

export const PATHS = {
  benchmarks: join(REPO_ROOT, 'data', 'benchmarks'),
  catalogOverrides: join(REPO_ROOT, 'data', 'catalog-overrides.yaml'),
  visionLabels: join(REPO_ROOT, 'data', 'vision-labels.yaml'),
  characters: join(REPO_ROOT, 'data', 'characters'),
  webPublic: WEB_PUBLIC,
  translations: join(WEB_PUBLIC, 'i18n'),
  // Saída do `ng build` com outputMode static
  prerenderedSite: join(WEB_ROOT, 'dist', 'web', 'browser'),
} as const;
