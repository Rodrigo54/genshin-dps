import { describe, expect, it } from 'bun:test';
import { characterFileSchema } from './character-file';

const text = (value: string) => ({ pt: value, en: value });
const statsAt = (level: number) => ({ level, hp: 12552, atk: 359, def: 792, ascensionStat: 88.4 });

const validCharacter = {
  name: text('Mavuika'),
  rarity: 5,
  element: 'pyro',
  icon: 'UI_AvatarIcon_Mavuika',
  weaponType: { pt: 'Espadão', en: 'Claymore' },
  region: text('Natlan'),
  profile: {
    title: { pt: 'Chama da Noite Ardente', en: 'Night-Igniting Flame' },
    constellation: text('Sol Invictus'),
    visionLabel: text('Gnosis'),
    affiliation: text('Huitztlan'),
    description: { pt: 'A líder de Natlan.', en: 'The leader of Natlan.' },
  },
  ascensionStat: { name: { pt: 'Dano Crítico', en: 'CRIT DMG' }, isPercent: true },
  stats: [statsAt(90), statsAt(95), statsAt(100)],
};

const isValid = (character: unknown) => characterFileSchema.safeParse(character).success;

describe('characterFileSchema', () => {
  it('aceita um personagem completo', () => {
    expect(isValid(validCharacter)).toBe(true);
  });

  it('aceita personagem sem título nem afiliação, como a Viajante', () => {
    const { title: _title, affiliation: _affiliation, ...profile } = validCharacter.profile;
    expect(isValid({ ...validCharacter, element: 'none', profile })).toBe(true);
  });

  it('exige os status nos níveis 90, 95 e 100, nessa ordem', () => {
    expect(isValid({ ...validCharacter, stats: [statsAt(90), statsAt(100)] })).toBe(false);
    expect(isValid({ ...validCharacter, stats: [statsAt(100), statsAt(95), statsAt(90)] })).toBe(false);
    expect(isValid({ ...validCharacter, stats: [statsAt(80), statsAt(95), statsAt(100)] })).toBe(false);
  });

  it('exige os textos nos dois idiomas e recusa campo desconhecido', () => {
    expect(isValid({ ...validCharacter, region: { pt: 'Natlan' } })).toBe(false);
    expect(isValid({ ...validCharacter, nickname: text('Mavu') })).toBe(false);
  });
});
