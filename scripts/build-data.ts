import { buildCatalog } from './src/catalog/build-catalog';
import { loadGenshinDbCatalog } from './src/catalog/genshin-db-source';
import { buildSiteData } from './src/data/build-site-data';
import { loadBenchmarkFiles, loadCatalogOverrides, loadVisionLabels } from './src/data/load-data';
import { writeSiteData } from './src/data/write-site-data';
import { PATHS } from './src/paths';
import { reportFailure, reportWarning } from './src/report';

// data/*.yaml → validação (Zod + catálogo) → apps/web/public/data/*.json
async function buildData(): Promise<void> {
  const overrides = await loadCatalogOverrides(PATHS.catalogOverrides);
  const visionLabels = await loadVisionLabels(PATHS.visionLabels);
  const { catalog, warnings } = buildCatalog(loadGenshinDbCatalog(visionLabels), overrides);
  warnings.forEach(reportWarning);

  const siteData = buildSiteData(catalog, await loadBenchmarkFiles(PATHS.benchmarks));
  await writeSiteData(PATHS.webPublic, siteData);
  const teamCount = siteData.characterTeams.reduce((total, { teams }) => total + teams.length, 0);
  console.log(`dados gerados: ${siteData.characterTeams.length} DPS principais, ${teamCount} times`);
}

await buildData().catch(reportFailure);
