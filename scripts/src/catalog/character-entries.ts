import {
  type CharacterEntry,
  type CharacterFile,
  type CharacterTooltipData,
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

function toTooltip(file: CharacterFile): CharacterTooltipData {
  return {
    stats: file.stats,
    isAscensionStatPercent: file.ascensionStat.isPercent,
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
    tooltip: toTooltip(file),
  }));
}
