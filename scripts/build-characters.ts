import { basename, join } from 'node:path';
import { unlink } from 'node:fs/promises';
import { stringify } from 'yaml';
import { extractCharacters } from './src/characters/extract-characters';
import { type GameTables, type TextMap } from './src/characters/game-tables';
import { PATHS } from './src/paths';
import { reportFailure } from './src/report';

// Tabelas do jogo extraídas pelo Dimbreath; os TextMaps de cada idioma vêm divididos em dois arquivos
const GAME_DATA_URL = 'https://gitlab.com/Dimbreath/animegamedata2/-/raw/main';
const TEXT_MAP_FILES = { pt: ['TextMapPT', 'TextMap_MediumPT'], en: ['TextMapEN', 'TextMap_MediumEN'] } as const;
const YAML_EXTENSION = '.yaml';

const FILE_HEADER = `# Gerado por \`bun run characters\` a partir das tabelas do jogo (Dimbreath/animegamedata2).
# Não edite à mão: rode o comando de novo a cada patch.
`;

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${GAME_DATA_URL}/${path}`);
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return (await response.json()) as T;
}

const fetchTable = <T>(name: string) => fetchJson<T>(`ExcelBinOutput/${name}ExcelConfigData.json`);

async function fetchTextMap(files: readonly string[]): Promise<TextMap> {
  const parts = await Promise.all(files.map((file) => fetchJson<TextMap>(`TextMap/${file}.json`)));
  return Object.assign({}, ...parts) as TextMap;
}

async function fetchGameTables(): Promise<GameTables> {
  const [avatars, fetters, curves, promotes, codex, cities, manualTexts, pt, en] = await Promise.all([
    fetchTable<GameTables['avatars']>('Avatar'),
    fetchTable<GameTables['fetters']>('FetterInfo'),
    fetchTable<GameTables['curves']>('AvatarCurve'),
    fetchTable<GameTables['promotes']>('AvatarPromote'),
    fetchTable<GameTables['codex']>('AvatarCodex'),
    fetchJson<GameTables['cities']>('ExcelBinOutput/CityConfigData.json'),
    fetchJson<GameTables['manualTexts']>('ExcelBinOutput/ManualTextMapConfigData.json'),
    fetchTextMap(TEXT_MAP_FILES.pt),
    fetchTextMap(TEXT_MAP_FILES.en),
  ]);
  return { avatars, fetters, curves, promotes, codex, cities, manualTexts, textMaps: { pt, en } };
}

// Apaga o arquivo de quem saiu das tabelas, para a pasta refletir só a última geração
async function removeStaleFiles(directory: string, currentIds: Set<string>): Promise<void> {
  const fileNames = await Array.fromAsync(new Bun.Glob(`*${YAML_EXTENSION}`).scan(directory));
  const stale = fileNames.filter((fileName) => !currentIds.has(basename(fileName, YAML_EXTENSION)));
  await Promise.all(stale.map((fileName) => unlink(join(directory, fileName))));
}

async function buildCharacters(): Promise<void> {
  const characters = extractCharacters(await fetchGameTables(), new Date());
  await Promise.all(
    Object.entries(characters).map(([id, character]) =>
      Bun.write(
        join(PATHS.characters, `${id}${YAML_EXTENSION}`),
        FILE_HEADER + stringify(character, { lineWidth: 0, singleQuote: true }),
      ),
    ),
  );
  await removeStaleFiles(PATHS.characters, new Set(Object.keys(characters)));
  console.log(`personagens gravados: ${Object.keys(characters).length}`);
}

await buildCharacters().catch(reportFailure);
