import { describe, expect, it } from 'bun:test';
import { loadCharacterFiles } from '../data/load-data';
import { PATHS } from '../paths';
import { emptyOverrides } from '../test-fixtures';
import { buildCatalog } from './build-catalog';
import { toCharacterEntries } from './character-entries';

// Integração com os arquivos reais de data/characters: garante que a geração e o build continuam no mesmo formato
const characters = toCharacterEntries(await loadCharacterFiles(PATHS.characters));
const { catalog } = buildCatalog({ characters, weapons: [], artifactSets: [] }, emptyOverrides);

describe('toCharacterEntries', () => {
  it('traz personagens com nome PT, raridade, elemento e ícone, com o id vindo do nome do arquivo', () => {
    expect(catalog.characters.resolve('Mavuika')).toMatchObject({
      id: 'mavuika',
      name: { en: 'Mavuika', pt: 'Mavuika' },
      rarity: 5,
      element: 'pyro',
      icon: 'UI_AvatarIcon_Mavuika',
    });
  });

  it('monta o tooltip no nível 90, com perfil, arma e atributo de ascensão nos dois idiomas', () => {
    const tooltip = catalog.characters.resolve('Mavuika').tooltip!;
    expect(tooltip).toMatchObject({ level: 90, baseHp: 12552, baseAtk: 359, baseDef: 792 });
    expect(tooltip.ascensionStat).toEqual({ value: 88.4, isPercent: true });
    expect(tooltip.text.pt).toMatchObject({
      title: 'Chama da Noite Ardente',
      region: 'Natlan',
      affiliation: 'Huitztlan',
      constellation: 'Sol Invictus',
      visionLabel: 'Gnosis',
      weaponType: 'Espadão',
      ascensionStatName: 'Dano Crítico',
    });
  });

  it('deixa a Proficiência Elemental plana e dá região aos personagens novos de Snezhnaya', () => {
    expect(catalog.characters.resolve('Nahida').tooltip!.ascensionStat).toEqual({ value: 115, isPercent: false });
    expect(catalog.characters.resolve('Vesna').tooltip!.text.en).toMatchObject({
      region: 'Snezhnaya',
      visionLabel: 'Stellar Linchpin',
    });
  });

  it('tem a Viajante como uma entrada só, a do Aether, em Teyvat', () => {
    const traveler = catalog.characters.resolve('Viajante');
    expect(traveler).toMatchObject({ id: 'traveler', element: 'none', icon: 'UI_AvatarIcon_PlayerBoy' });
    expect(traveler.tooltip!.text.pt.region).toBe('Teyvat');
  });
});
