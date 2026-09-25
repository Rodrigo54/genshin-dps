import { type CharacterFile, type Element, type LocalizedText } from '@genshin-dps/schema';
import { toSlug } from '../catalog/slug';
import { computeCharacterStats, findAscensionStatType } from './character-stats';
import { assertObfuscatedFieldsExist, readProfile } from './character-profile';
import { type AvatarRow, type CodexRow, type FetterRow, type GameTables } from './game-tables';
import { createGameTextLookup, type GameTextLookup } from './game-text-lookup';

// A Viajante é uma entrada só, a do Aether; a Lumine (mesmos status e textos) fica de fora
const AETHER_ID = 10000005;
const LUMINE_ID = 10000007;
// O jogo deixa a afiliação da Viajante vazia ("——"); o site mostra esta, que não existe nos textos do jogo
const TRAVELER_AFFILIATION: LocalizedText = { pt: 'Melhor amigo de Paimon', en: "Paimon's Best Friend" };

const TEYVAT: LocalizedText = { pt: 'Teyvat', en: 'Teyvat' };

// O jogo não liga o tipo de afiliação a uma região: a ligação é nossa (cityId da CityConfigData). Quem não
// pertence a uma nação fica em Teyvat. Tipo novo quebra a geração até ser ligado aqui.
const REGION_BY_ASSOC_TYPE: Record<string, number | 'teyvat'> = {
  ASSOC_TYPE_MONDSTADT: 1,
  ASSOC_TYPE_LIYUE: 2,
  ASSOC_TYPE_NODKRAI_ZIBAI: 2,
  ASSOC_TYPE_INAZUMA: 3,
  ASSOC_TYPE_SUMERU: 4,
  ASSOC_TYPE_FONTAINE: 5,
  ASSOC_TYPE_NATLAN: 6,
  ASSOC_TYPE_NODKRAI: 7,
  ASSOC_TYPE_HVISION: 7,
  ASSOC_TYPE_FATUI: 8,
  ASSOC_TYPE_SNEZHNAYA: 8,
  ASSOC_TYPE_SNEZHNAYA_STAR: 8,
  ASSOC_TYPE_MAINACTOR: 'teyvat',
  ASSOC_TYPE_RANGER: 'teyvat',
  ASSOC_TYPE_OMNI_SCOURGE: 'teyvat',
};

const RARITY_BY_QUALITY: Record<string, CharacterFile['rarity']> = {
  QUALITY_ORANGE: 5,
  QUALITY_ORANGE_SP: 5,
  QUALITY_PURPLE: 4,
};

// Elemento pelo nome da Visão em inglês; Viajante e Manequins não têm um fixo
const ELEMENT_BY_VISION: Record<string, Element> = {
  Pyro: 'pyro',
  Hydro: 'hydro',
  Anemo: 'anemo',
  Electro: 'electro',
  Dendro: 'dendro',
  Cryo: 'cryo',
  Geo: 'geo',
};

// "2020-09-28 06:00:00" no fuso do servidor; para decidir se já foi lançado, o dia basta
function parseCodexDate(beginTime: string): Date {
  return new Date(`${beginTime.replace(' ', 'T')}Z`);
}

function isReleased(fetter: FetterRow, codexById: Map<number, CodexRow>, generatedAt: Date): boolean {
  const beginTime = codexById.get(fetter.avatarId)?.beginTime;
  return beginTime === undefined || parseCodexDate(beginTime) <= generatedAt;
}

function readRegion(tables: GameTables, texts: GameTextLookup, fetter: FetterRow): LocalizedText {
  const region = REGION_BY_ASSOC_TYPE[fetter.avatarAssocType];
  if (region === undefined) {
    throw new Error(`tipo de afiliação ${fetter.avatarAssocType} (personagem ${fetter.avatarId}) sem região ligada`);
  }
  if (region === 'teyvat') return TEYVAT;
  const city = tables.cities.find(({ cityId }) => cityId === region);
  return texts.read(city?.cityNameTextMapHash, `região ${region}`);
}

function readRarity(avatar: AvatarRow): CharacterFile['rarity'] {
  const rarity = RARITY_BY_QUALITY[avatar.qualityType];
  if (!rarity) throw new Error(`personagem ${avatar.id} com raridade desconhecida: ${avatar.qualityType}`);
  return rarity;
}

function readElement(texts: GameTextLookup, fetter: FetterRow): Element {
  const vision = texts.find(fetter.avatarVisionBeforTextMapHash, `visão de ${fetter.avatarId}`);
  return (vision && ELEMENT_BY_VISION[vision.en]) ?? 'none';
}

function toCharacterFile(tables: GameTables, texts: GameTextLookup, avatar: AvatarRow, fetter: FetterRow) {
  const ascensionStat = findAscensionStatType(avatar, tables.promotes);
  const file: CharacterFile = {
    name: texts.read(avatar.nameTextMapHash, `nome de ${avatar.id}`),
    rarity: readRarity(avatar),
    element: readElement(texts, fetter),
    icon: avatar.iconName,
    weaponType: texts.readManual(avatar.weaponType),
    region: readRegion(tables, texts, fetter),
    profile: {
      ...readProfile(texts, fetter),
      ...(avatar.id === AETHER_ID && { affiliation: TRAVELER_AFFILIATION }),
    },
    ascensionStat: { name: texts.readManual(ascensionStat.propType), isPercent: ascensionStat.isPercent },
    stats: computeCharacterStats(avatar, tables),
  };
  return file;
}

// Um arquivo por personagem jogável já lançado (tem perfil e, se tem codex, a data de entrada já passou),
// com o id no slug do nome em inglês, como no catálogo
export function extractCharacters(tables: GameTables, generatedAt: Date): Record<string, CharacterFile> {
  assertObfuscatedFieldsExist(tables.fetters);
  const texts = createGameTextLookup(tables);
  const avatarById = new Map(tables.avatars.map((avatar) => [avatar.id, avatar]));
  const codexById = new Map(tables.codex.map((row) => [row.avatarId, row]));
  const characters = tables.fetters
    .filter((fetter) => fetter.avatarId !== LUMINE_ID && isReleased(fetter, codexById, generatedAt))
    .map((fetter) => {
      const avatar = avatarById.get(fetter.avatarId);
      if (!avatar) throw new Error(`perfil ${fetter.avatarId} sem personagem na AvatarExcelConfigData`);
      const file = toCharacterFile(tables, texts, avatar, fetter);
      return [toSlug(file.name.en), file] as const;
    });
  return Object.fromEntries(characters.sort(([a], [b]) => a.localeCompare(b)));
}
