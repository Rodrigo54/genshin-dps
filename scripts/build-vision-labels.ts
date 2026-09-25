import { stringify } from 'yaml';
import {
  type AvatarRow,
  extractVisionLabels,
  type FetterRow,
  type TextMap,
} from './src/vision-labels/extract-vision-labels';
import { PATHS } from './src/paths';
import { reportFailure } from './src/report';

// Tabelas do jogo extraídas pelo Dimbreath; os TextMaps de cada idioma vêm divididos em dois arquivos
const GAME_DATA_URL = 'https://gitlab.com/Dimbreath/animegamedata2/-/raw/main';
const TEXT_MAP_FILES = { pt: ['TextMapPT', 'TextMap_MediumPT'], en: ['TextMapEN', 'TextMap_MediumEN'] } as const;

const FILE_HEADER = `# Gerado por \`bun run vision-labels\` a partir das tabelas do jogo (Dimbreath/animegamedata2). Não edite à mão:
# rode o script de novo a cada patch. Rótulo do campo de elemento na aba Perfil, por id de personagem; quem não
# aparece aqui não tem rótulo próprio no jogo.
`;

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${GAME_DATA_URL}/${path}`);
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return (await response.json()) as T;
}

async function fetchTextMap(files: readonly string[]): Promise<TextMap> {
  const parts = await Promise.all(files.map((file) => fetchJson<TextMap>(`TextMap/${file}.json`)));
  return Object.assign({}, ...parts) as TextMap;
}

async function buildVisionLabels(): Promise<void> {
  const [fetters, avatars, pt, en] = await Promise.all([
    fetchJson<FetterRow[]>('ExcelBinOutput/FetterInfoExcelConfigData.json'),
    fetchJson<AvatarRow[]>('ExcelBinOutput/AvatarExcelConfigData.json'),
    fetchTextMap(TEXT_MAP_FILES.pt),
    fetchTextMap(TEXT_MAP_FILES.en),
  ]);
  const labels = extractVisionLabels({ fetters, avatars, textMaps: { pt, en } });
  await Bun.write(PATHS.visionLabels, FILE_HEADER + stringify(labels));
  console.log(`rótulos gravados: ${Object.keys(labels).length} personagens`);
}

await buildVisionLabels().catch(reportFailure);
