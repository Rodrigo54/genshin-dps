import { buildCatalog } from './src/catalog/build-catalog';
import { toCharacterEntries } from './src/catalog/character-entries';
import { loadGenshinDbCatalog } from './src/catalog/genshin-db-source';
import { buildSiteData } from './src/data/build-site-data';
import { loadBenchmarkFiles, loadCatalogOverrides, loadCharacterFiles } from './src/data/load-data';
import { writeSiteData } from './src/data/write-site-data';
import { PATHS } from './src/paths';
import { reportFailure, reportWarning } from './src/report';

// data/*.yaml → validação (Zod + catálogo: personagens de data/characters, armas e sets do genshin-db)
// → apps/web/public/data/*.json
async function buildData(): Promise<void> {
  const overrides = await loadCatalogOverrides(PATHS.catalogOverrides);
  const characters = toCharacterEntries(await loadCharacterFiles(PATHS.characters));
  const { catalog, warnings } = buildCatalog({ characters, ...loadGenshinDbCatalog() }, overrides);
  warnings.forEach(reportWarning);

  const siteData = buildSiteData(catalog, await loadBenchmarkFiles(PATHS.benchmarks));
  await writeSiteData(PATHS.webPublic, siteData);
  const teamCount = siteData.characterTeams.reduce((total, { teams }) => total + teams.length, 0);
  console.log(`dados gerados: ${siteData.characterTeams.length} DPS principais, ${teamCount} times`);
}

await buildData().catch(reportFailure);
