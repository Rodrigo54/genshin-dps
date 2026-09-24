import { describe, expect, it } from 'bun:test';
import { catalogSourceFixture, emptyOverrides, travelerOverride } from '../test-fixtures';
import { buildCatalog } from './build-catalog';
import { AmbiguousNameError, CatalogIndex, UnknownNameError } from './catalog-index';

describe('buildCatalog', () => {
  it('resolve nome em inglês, em português e ignorando caixa e espaços', () => {
    const { catalog } = buildCatalog(catalogSourceFixture, emptyOverrides);
    expect(catalog.weapons.resolve('Wolf-Fang').id).toBe('wolf-fang');
    expect(catalog.weapons.resolve('Farpa').id).toBe('wolf-fang');
    expect(catalog.characters.resolve('  mavuika ').id).toBe('mavuika');
  });

  it('não aceita nome aproximado, ao contrário do genshin-db', () => {
    const { catalog } = buildCatalog(catalogSourceFixture, emptyOverrides);
    expect(() => catalog.characters.resolve('Mavuka')).toThrow(UnknownNameError);
  });

  it('resolve alias para o nome canônico', () => {
    const overrides = { ...emptyOverrides, aliases: { ...emptyOverrides.aliases, characters: { Bennet: 'Bennett' } } };
    const { catalog, warnings } = buildCatalog(catalogSourceFixture, overrides);
    expect(catalog.characters.resolve('Bennet').id).toBe('bennett');
    expect(warnings).toEqual([]);
  });

  it('falha quando o alias aponta para nome inexistente', () => {
    const overrides = { ...emptyOverrides, aliases: { ...emptyOverrides.aliases, characters: { Benny: 'Benet' } } };
    expect(() => buildCatalog(catalogSourceFixture, overrides)).toThrow(UnknownNameError);
  });

  it('acrescenta personagem novo com id derivado do nome em inglês', () => {
    const newCharacter = {
      name: { en: 'Kaedehara Kazuha', pt: 'Kaedehara Kazuha' },
      rarity: 5 as const,
      element: 'anemo' as const,
      icon: 'UI_AvatarIcon_Kazuha',
    };
    const { catalog, warnings } = buildCatalog(catalogSourceFixture, { ...emptyOverrides, characters: [newCharacter] });
    expect(catalog.characters.resolve('Kaedehara Kazuha').id).toBe('kaedehara-kazuha');
    expect(warnings).toEqual([]);
  });

  it('aceita alias que redireciona um nome do genshin-db para outra entrada, sem aviso', () => {
    const lumine = { ...catalogSourceFixture.characters[0]!, id: 'lumine', name: { en: 'Lumine', pt: 'Lumine' } };
    const source = { ...catalogSourceFixture, characters: [...catalogSourceFixture.characters, lumine] };
    const overrides = {
      ...emptyOverrides,
      aliases: { ...emptyOverrides.aliases, characters: { Lumine: 'Traveler' } },
      characters: [travelerOverride],
    };
    const { catalog, warnings } = buildCatalog(source, overrides);
    expect(catalog.characters.resolve('Lumine').id).toBe('traveler');
    expect(warnings).toEqual([]);
  });

  it('avisa quando override de entrada ou alias ficou redundante', () => {
    const overrides = {
      ...emptyOverrides,
      aliases: { ...emptyOverrides.aliases, weapons: { Farpa: 'Wolf-Fang' } },
      characters: [
        {
          name: { en: 'Barbara', pt: 'Bárbara' },
          rarity: 5 as const,
          element: 'hydro' as const,
          icon: 'UI_AvatarIcon_Barbara',
        },
      ],
    };
    const { catalog, warnings } = buildCatalog(catalogSourceFixture, overrides);
    expect(warnings).toHaveLength(2);
    expect(catalog.characters.resolve('Barbara').rarity).toBe(5);
  });
});

describe('CatalogIndex', () => {
  it('recusa nome que corresponde a duas entradas', () => {
    const index = new CatalogIndex('Arma', [
      { id: 'a', name: { en: 'Alpha', pt: 'Beta' } },
      { id: 'b', name: { en: 'Beta', pt: 'Gama' } },
    ]);
    expect(() => index.resolve('Beta')).toThrow(AmbiguousNameError);
  });
});
