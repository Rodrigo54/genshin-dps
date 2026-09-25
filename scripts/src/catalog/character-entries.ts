import {
  type CharacterEntry,
  type CharacterFile,
  type CharacterTooltipData,
  DEFAULT_CHARACTER_LEVEL,
  LOCALES,
  type Locale,
} from '@genshin-dps/schema';

function toTooltipText(file: CharacterFile, locale: Locale): CharacterTooltipData['text'][Locale] {
  const { title, constellation, visionLabel, affiliation, description } = file.profile;
  return {
    ...(title && { title: title[locale] }),
    region: file.region[locale],
    ...(affiliation && { affiliation: affiliation[locale] }),
    constellation: constellation[locale],
    visionLabel: visionLabel[locale],
    weaponType: file.weaponType[locale],
    ascensionStatName: file.ascensionStat.name[locale],
    description: description[locale],
  };
}

function toTooltip(id: string, file: CharacterFile): CharacterTooltipData {
  const stats = file.stats.find(({ level }) => level === DEFAULT_CHARACTER_LEVEL);
  if (!stats) throw new Error(`data/characters/${id}.yaml sem status no nível ${DEFAULT_CHARACTER_LEVEL}`);
  return {
    level: stats.level,
    baseHp: stats.hp,
    baseAtk: stats.atk,
    baseDef: stats.def,
    ascensionStat: { value: stats.ascensionStat, isPercent: file.ascensionStat.isPercent },
    text: Object.fromEntries(
      LOCALES.map((locale) => [locale, toTooltipText(file, locale)]),
    ) as CharacterTooltipData['text'],
  };
}

// Entradas do catálogo de personagens a partir de data/characters, com o id vindo do nome do arquivo
export function toCharacterEntries(files: Record<string, CharacterFile>): CharacterEntry[] {
  return Object.entries(files).map(([id, file]) => ({
    id,
    name: file.name,
    rarity: file.rarity,
    element: file.element,
    icon: file.icon,
    tooltip: toTooltip(id, file),
  }));
}
