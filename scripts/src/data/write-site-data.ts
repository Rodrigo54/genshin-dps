import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { SITE_DATA_PATHS } from '@genshin-dps/schema';
import type { SiteData } from './build-site-data';

// Recria a pasta gerada do zero para não sobrar JSON de personagem removido do YAML.
// A pasta de times existe mesmo vazia: o prerender do app lista o conteúdo dela.
export async function writeSiteData(publicDirectory: string, siteData: SiteData): Promise<void> {
  await rm(join(publicDirectory, SITE_DATA_PATHS.dataDirectory), { recursive: true, force: true });
  await mkdir(join(publicDirectory, SITE_DATA_PATHS.teamsDirectory), { recursive: true });
  const files: [string, unknown][] = [
    [SITE_DATA_PATHS.catalog, siteData.catalog],
    [SITE_DATA_PATHS.ranking, siteData.ranking],
    ...siteData.characterTeams.map((teams): [string, unknown] => [
      SITE_DATA_PATHS.characterTeams(teams.characterId),
      teams,
    ]),
  ];
  await Promise.all(files.map(([path, content]) => Bun.write(join(publicDirectory, path), JSON.stringify(content))));
}
