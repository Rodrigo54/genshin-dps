import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Catalog } from '@genshin-dps/schema';
import { findMissingIcons, findUnusedIconFiles } from './icon-cache';
import { collectIcons, toIconOutputPath, toIconSourceUrl } from './icons';

const catalog: Catalog = {
  characters: {
    mavuika: {
      id: 'mavuika',
      name: { en: 'Mavuika', pt: 'Mavuika' },
      rarity: 5,
      element: 'pyro',
      icon: 'UI_AvatarIcon_Mavuika',
    },
  },
  weapons: {
    'wolf-fang': {
      id: 'wolf-fang',
      name: { en: 'Wolf-Fang', pt: 'Farpa' },
      rarity: 4,
      icon: 'UI_EquipIcon_Sword_Boreas',
    },
  },
  artifactSets: {},
};

describe('icons', () => {
  it('coleta ícones de personagens e armas sem repetir, e sempre os 7 de elemento', () => {
    const icons = collectIcons(catalog);
    expect(icons).toContain('UI_AvatarIcon_Mavuika');
    expect(icons).toContain('UI_EquipIcon_Sword_Boreas');
    expect(icons.filter((icon) => icon.startsWith('UI_Buff_Element_'))).toHaveLength(7);
    expect(new Set(icons).size).toBe(icons.length);
  });

  it('busca os ícones de elemento no Project Amber', () => {
    expect(toIconSourceUrl('UI_Buff_Element_Ice')).toBe('https://gi.yatta.moe/assets/UI/UI_Buff_Element_Ice.png');
  });

  it('monta a URL do CDN da Enka e o caminho WebP servido pelo site', () => {
    expect(toIconSourceUrl('UI_AvatarIcon_Mavuika')).toBe('https://enka.network/ui/UI_AvatarIcon_Mavuika.png');
    expect(toIconOutputPath('public', 'UI_AvatarIcon_Mavuika')).toBe(
      join('public', 'images', 'UI_AvatarIcon_Mavuika.webp'),
    );
  });
});

describe('icon-cache', () => {
  let publicDirectory: string;

  beforeEach(async () => {
    publicDirectory = await mkdtemp(join(tmpdir(), 'genshin-dps-icons-'));
    await Bun.write(toIconOutputPath(publicDirectory, 'UI_AvatarIcon_Mavuika'), 'webp');
    await Bun.write(toIconOutputPath(publicDirectory, 'UI_AvatarIcon_Removed'), 'webp');
  });

  afterEach(async () => {
    await rm(publicDirectory, { recursive: true, force: true });
  });

  it('só considera faltando o que não está em disco', async () => {
    const icons = collectIcons(catalog);
    const missingIcons = await findMissingIcons(publicDirectory, icons);
    expect(missingIcons).not.toContain('UI_AvatarIcon_Mavuika');
    expect(missingIcons).toContain('UI_EquipIcon_Sword_Boreas');
  });

  it('encontra ícones em disco que saíram do catálogo', async () => {
    const unused = await findUnusedIconFiles(publicDirectory, collectIcons(catalog));
    expect(unused).toEqual([toIconOutputPath(publicDirectory, 'UI_AvatarIcon_Removed')]);
  });
});
