import { describe, expect, it } from 'bun:test';
import { emptyOverrides } from '../test-fixtures';
import { buildCatalog } from './build-catalog';
import { loadGenshinDbCatalog } from './genshin-db-source';

// Integração com o pacote real: garante que a versão instalada continua no formato esperado
describe('loadGenshinDbCatalog', () => {
  const { catalog } = buildCatalog(
    loadGenshinDbCatalog({ neuvillette: { pt: 'Autoridade do Antigo Dragão', en: "Ancient Dragon's Authority" } }),
    emptyOverrides,
  );

  it('traz personagens com nome PT, raridade, elemento e ícone da Enka', () => {
    expect(catalog.characters.resolve('Mavuika')).toMatchObject({
      id: 'mavuika',
      name: { en: 'Mavuika', pt: 'Mavuika' },
      rarity: 5,
      element: 'pyro',
      icon: 'UI_AvatarIcon_Mavuika',
    });
  });

  it('traz o tooltip do personagem no nível 90, com perfil, arma e atributo de ascensão nos dois idiomas', () => {
    const tooltip = catalog.characters.resolve('Mavuika').tooltip!;
    expect(tooltip).toMatchObject({ level: 90, baseHp: 12552, baseAtk: 359, baseDef: 792 });
    expect(tooltip.ascensionStat).toEqual({ value: 88.4, isPercent: true });
    expect(tooltip.text.pt).toMatchObject({
      title: 'Chama da Noite Ardente',
      region: 'Natlan',
      affiliation: 'Huitztlan',
      constellation: 'Sol Invictus',
      weaponType: 'Espadão',
      ascensionStatName: 'Dano Crítico',
    });
    expect(tooltip.text.en.description).not.toBe('');
  });

  it('coloca o rótulo da aba Perfil em quem tem e deixa de fora em quem não tem', () => {
    expect(catalog.characters.resolve('Neuvillette').tooltip!.text.pt.visionLabel).toBe('Autoridade do Antigo Dragão');
    expect(catalog.characters.resolve('Mavuika').tooltip!.text.en.visionLabel).toBeUndefined();
  });

  it('deixa a Proficiência Elemental plana e omite título, região e afiliação de quem não tem', () => {
    expect(catalog.characters.resolve('Nahida').tooltip!.ascensionStat).toEqual({ value: 115, isPercent: false });
    const { title, region, affiliation } = catalog.characters.resolve('Lumine').tooltip!.text.pt;
    expect([title, region, affiliation]).toEqual([undefined, undefined, undefined]);
  });

  it('resolve armas e sets pelo nome em português', () => {
    expect(catalog.weapons.resolve('Farpa').id).toBe('wolf-fang');
    expect(catalog.artifactSets.resolve('Códice de Obsidiana').id).toBe('obsidian-codex');
  });

  it('traz o tooltip da arma no nível máximo, com a passiva de cada refinamento nos dois idiomas', () => {
    const tooltip = catalog.weapons.resolve("Kagura's Verity").tooltip!;
    expect(tooltip.level).toBe(90);
    expect(tooltip.baseAtk).toBe(608);
    expect(tooltip.substat).toEqual({ type: 'FIGHT_PROP_CRITICAL_HURT', value: 66.2 });
    expect(tooltip.text.pt.passive?.name).toBe('Dança Kagura da Sakura Sagrada');
    expect(tooltip.text.en.passive?.refinementValues).toHaveLength(5);
    expect(tooltip.text.pt.passive?.template).toContainEqual({ text: '{0}', color: '#99FFFFFF' });
  });

  it('para armas 1★ no nível 70, sem secundário nem passiva', () => {
    const tooltip = catalog.weapons.resolve('Dull Blade').tooltip!;
    expect(tooltip.level).toBe(70);
    expect(tooltip.substat).toBeUndefined();
    expect(tooltip.text.pt.passive).toBeUndefined();
  });

  it('não herda a busca aproximada do genshin-db', () => {
    expect(() => catalog.characters.resolve('Mavuka')).toThrow();
  });
});
