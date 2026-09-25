import { describe, expect, it } from 'bun:test';
import { emptyOverrides } from '../test-fixtures';
import { buildCatalog } from './build-catalog';
import { loadGenshinDbCatalog } from './genshin-db-source';

// Integração com o pacote real: garante que a versão instalada continua no formato esperado
describe('loadGenshinDbCatalog', () => {
  const { catalog } = buildCatalog({ characters: [], ...loadGenshinDbCatalog() }, emptyOverrides);

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
    expect(() => catalog.weapons.resolve('Wolf Fang')).toThrow();
  });
});
