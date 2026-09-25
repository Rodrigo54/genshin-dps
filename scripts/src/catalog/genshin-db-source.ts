import {
  type ArtifactSetEntry,
  FLAT_WEAPON_SUBSTAT,
  WEAPON_SUBSTAT_TYPES,
  type WeaponEntry,
  type WeaponSubstatType,
  type WeaponTooltipData,
  type WeaponTooltipText,
} from '@genshin-dps/schema';
import gdb, { type Artifact, Language, type QueryFunction, type Weapon } from 'genshin-db';
import { parseGameText } from './game-text';
import { roundStat } from './round-stat';
import { toSlug } from './slug';

// Armas e sets ainda vêm do genshin-db; os personagens vêm de data/characters
export interface GenshinDbCatalog {
  weapons: WeaponEntry[];
  artifactSets: ArtifactSetEntry[];
}

interface GameEntity {
  id: number;
  name: string;
}

function fetchAll<T extends GameEntity>(query: QueryFunction<T>, language: Language): T[] {
  return query('names', { matchCategories: true, verboseCategories: true, resultLanguage: language });
}

// Junta EN e PT pelo id numérico do jogo; o slug vem do nome em inglês.
// Entradas repetidas no genshin-db (ex.: variantes da "Prized Isshin Blade") ficam só com a primeira.
function joinLocales<T extends GameEntity, E extends { id: string }>(
  query: QueryFunction<T>,
  toEntry: (english: T, portuguese: T) => E,
): E[] {
  const portugueseById = new Map(fetchAll(query, Language.Portuguese).map((entity) => [entity.id, entity]));
  const entries = new Map<string, E>();
  fetchAll(query, Language.English).forEach((english) => {
    const entry = toEntry(english, portugueseById.get(english.id) ?? english);
    if (!entries.has(entry.id)) entries.set(entry.id, entry);
  });
  return [...entries.values()];
}

// Armas 1★ e 2★ param no nível 70; as outras, no 90
const LOW_RARITY_MAX = 2;
const LOW_RARITY_MAX_LEVEL = 70;
const MAX_LEVEL = 90;
const WEAPON_REFINEMENTS = ['r1', 'r2', 'r3', 'r4', 'r5'] as const;

function isWeaponSubstatType(type: string | undefined): type is WeaponSubstatType {
  return WEAPON_SUBSTAT_TYPES.some((substatType) => substatType === type);
}

function toWeaponTooltipText(weapon: Weapon): WeaponTooltipText {
  return {
    ...(weapon.effectName &&
      weapon.effectTemplateRaw && {
        passive: {
          name: weapon.effectName,
          template: parseGameText(weapon.effectTemplateRaw),
          refinementValues: WEAPON_REFINEMENTS.map((refinement) => weapon[refinement]?.values ?? []),
        },
      }),
    lore: weapon.description,
  };
}

function toWeaponTooltip(english: Weapon, portuguese: Weapon): WeaponTooltipData {
  const level = english.rarity <= LOW_RARITY_MAX ? LOW_RARITY_MAX_LEVEL : MAX_LEVEL;
  const { attack, specialized } = english.stats(level);
  if (attack === undefined) throw new Error(`genshin-db sem ATQ base para "${english.name}" no nível ${level}`);
  const substatType = english.mainStatType;
  return {
    level,
    baseAtk: Math.round(attack),
    ...(isWeaponSubstatType(substatType) &&
      specialized !== undefined && {
        substat: { type: substatType, value: roundStat(specialized, substatType !== FLAT_WEAPON_SUBSTAT) },
      }),
    text: { en: toWeaponTooltipText(english), pt: toWeaponTooltipText(portuguese) },
  };
}

function toWeaponEntry(weapon: Weapon, portuguese: Weapon): WeaponEntry {
  return {
    id: toSlug(weapon.name),
    name: { en: weapon.name, pt: portuguese.name },
    rarity: weapon.rarity,
    // Arte da arma ascendida, com fundo transparente como no inventário do jogo
    icon: weapon.images.filename_awakenIcon,
    tooltip: toWeaponTooltip(weapon, portuguese),
  };
}

function toArtifactSetEntry(artifact: Artifact, portuguese: Artifact): ArtifactSetEntry {
  return { id: toSlug(artifact.name), name: { en: artifact.name, pt: portuguese.name } };
}

export function loadGenshinDbCatalog(): GenshinDbCatalog {
  return {
    weapons: joinLocales(gdb.weapons, toWeaponEntry),
    artifactSets: joinLocales(gdb.artifacts, toArtifactSetEntry),
  };
}
