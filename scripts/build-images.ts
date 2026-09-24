import { join } from 'node:path';
import { type Catalog, SITE_DATA_PATHS } from '@genshin-dps/schema';
import { collectIcons } from './src/images/icons';
import { downloadIcons, findMissingIcons, findUnusedIconFiles, removeFiles } from './src/images/icon-cache';
import { PATHS } from './src/paths';
import { reportFailure } from './src/report';

// Lê o catálogo gerado por `bun run data` e baixa só os ícones que ainda não estão em disco (cache do CI)
async function buildImages(): Promise<void> {
  const catalog: Catalog = await Bun.file(join(PATHS.webPublic, SITE_DATA_PATHS.catalog)).json();
  const icons = collectIcons(catalog);
  const missingIcons = await findMissingIcons(PATHS.webPublic, icons);
  await downloadIcons(PATHS.webPublic, missingIcons);
  const unusedFiles = await findUnusedIconFiles(PATHS.webPublic, icons);
  await removeFiles(unusedFiles);
  console.log(`ícones: ${icons.length} usados, ${missingIcons.length} baixados, ${unusedFiles.length} removidos`);
}

await buildImages().catch(reportFailure);
