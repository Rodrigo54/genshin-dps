import type { BenchmarkInput, CatalogOverrides, SupportMemberInput } from '@genshin-dps/schema';
import type { CatalogSource } from './catalog/build-catalog';

// Catálogo reduzido e fixo para testar o build sem depender da versão do genshin-db
export const catalogSourceFixture: CatalogSource = {
  characters: [
    {
      id: 'mavuika',
      name: { en: 'Mavuika', pt: 'Mavuika' },
      rarity: 5,
      element: 'pyro',
      icon: 'UI_AvatarIcon_Mavuika',
    },
    {
      id: 'citlali',
      name: { en: 'Citlali', pt: 'Citlali' },
      rarity: 5,
      element: 'cryo',
      icon: 'UI_AvatarIcon_Citlali',
    },
    {
      id: 'bennett',
      name: { en: 'Bennett', pt: 'Bennett' },
      rarity: 4,
      element: 'pyro',
      icon: 'UI_AvatarIcon_Bennett',
    },
    { id: 'xilonen', name: { en: 'Xilonen', pt: 'Xilonen' }, rarity: 5, element: 'geo', icon: 'UI_AvatarIcon_Xilonen' },
    {
      id: 'barbara',
      name: { en: 'Barbara', pt: 'Barbara' },
      rarity: 4,
      element: 'hydro',
      icon: 'UI_AvatarIcon_Barbara',
    },
  ],
  weapons: [
    {
      id: 'a-thousand-blazing-suns',
      name: { en: 'A Thousand Blazing Suns', pt: 'Mil Sóis Ardentes' },
      rarity: 5,
      icon: 'UI_EquipIcon_Claymore_RadianceSword',
    },
    { id: 'wolf-fang', name: { en: 'Wolf-Fang', pt: 'Farpa' }, rarity: 4, icon: 'UI_EquipIcon_Sword_Boreas' },
    {
      id: 'thrilling-tales-of-dragon-slayers',
      name: { en: 'Thrilling Tales of Dragon Slayers', pt: 'Contos de Matadores de Dragões' },
      rarity: 3,
      icon: 'UI_EquipIcon_Catalyst_Pulpfic',
    },
  ],
  artifactSets: [{ id: 'obsidian-codex', name: { en: 'Obsidian Codex', pt: 'Códice de Obsidiana' } }],
};

// A Viajante não vem do genshin-db: entra pelo overrides, sem elemento fixo
export const travelerOverride: CatalogOverrides['characters'][number] = {
  name: { en: 'Traveler', pt: 'Viajante' },
  rarity: 5,
  element: 'none',
  icon: 'UI_AvatarIcon_PlayerGirl',
};

export const emptyOverrides: CatalogOverrides = {
  aliases: { characters: {}, weapons: {}, artifactSets: {} },
  characters: [],
  weapons: [],
  artifactSets: [],
};

export function supportFixture(character: string, overrides: Partial<SupportMemberInput> = {}): SupportMemberInput {
  return { character, constellation: 0, weapon: { name: 'Wolf-Fang', refinement: 5 }, ...overrides };
}

// Time de Mavuika (arquivo mavuika.yaml) dentro do baseline
export function benchmarkFixture(overrides: Partial<BenchmarkInput> = {}): BenchmarkInput {
  return {
    teamDps: 200000,
    patch: '6.8',
    ref: { author: 'April', url: 'https://example.com/mavuika' },
    main: { constellation: 0, weapon: { name: 'Wolf-Fang', refinement: 5 } },
    supports: [supportFixture('Citlali'), supportFixture('Bennett', { constellation: 6 }), supportFixture('Xilonen')],
    ...overrides,
  };
}
