import { type CharacterRarity, type Element, type WeaponRarity } from '@genshin-dps/schema/site-data';

// Classes completas (não interpoladas) para o Tailwind encontrá-las no código-fonte
const RARITY_BACKGROUNDS: Record<WeaponRarity, string> = {
  5: 'bg-rarity-5',
  4: 'bg-rarity-4',
  3: 'bg-rarity-3',
  2: 'bg-rarity-2',
  1: 'bg-rarity-1',
};

const ELEMENT_TEXT_COLORS: Record<Element, string> = {
  pyro: 'text-pyro',
  hydro: 'text-hydro',
  anemo: 'text-anemo',
  electro: 'text-electro',
  dendro: 'text-dendro',
  cryo: 'text-cryo',
  geo: 'text-geo',
  none: 'text-none',
};

export function rarityBackground(rarity: CharacterRarity | WeaponRarity): string {
  return RARITY_BACKGROUNDS[rarity];
}

export function elementTextColor(element: Element): string {
  return ELEMENT_TEXT_COLORS[element];
}
