import { describe, expect, it } from 'bun:test';
import { FETTER_OBFUSCATED_FIELDS } from './character-profile';
import { extractCharacters } from './extract-characters';
import { type AvatarRow, type FetterRow, type GameTables } from './game-tables';

const { visionLabelBefore, visionLabelAfter, affiliationAfter } = FETTER_OBFUSCATED_FIELDS;
const GENERATED_AT = new Date('2026-09-25T00:00:00Z');
const NO_TEXT = 999;

// Textos pelo hash, iguais nos dois idiomas salvo quando o teste precisa diferenciar
const TEXTS: Record<number, [string, string]> = {
  1: ['Mavuika', 'Mavuika'],
  2: ['Viajante', 'Traveler'],
  3: ['Viajante', 'Traveler'],
  4: ['Venti', 'Venti'],
  5: ['Personagem Futuro', 'Future Character'],
  6: ['Teste', 'Test'],
  10: ['Pyro', 'Pyro'],
  11: ['Anemo', 'Anemo'],
  20: ['Chama da Noite Ardente', 'Night-Igniting Flame'],
  21: ['A líder de Natlan.', 'The leader of Natlan.'],
  22: ['#{F#Uma}{M#Um} Viajante forçad{F#a}{M#o}.', '#A traveler.'],
  23: ['Sol Invictus', 'Sol Invictus'],
  24: ['???', '???'],
  25: ['Carmen Dei', 'Carmen Dei'],
  26: ['Huitztlan', 'Huitztlan'],
  27: ['Mondstadt', 'Mondstadt'],
  28: ['Cidade de Mondstadt', 'Mondstadt City'],
  29: ['Eixo Estelar', 'Stellar Linchpin'],
  30: ['Natlan', 'Natlan'],
  31: ['Mondstadt', 'Mondstadt'],
  40: ['Espadão', 'Claymore'],
  41: ['Espada', 'Sword'],
  42: ['Dano Crítico', 'CRIT DMG'],
  43: ['Recarga de Energia', 'Energy Recharge'],
  44: ['Visão', 'Vision'],
  45: ['Gnosis', 'Gnosis'],
};

function avatar(id: number, nameTextMapHash: number, overrides: Partial<AvatarRow> = {}): AvatarRow {
  return {
    id,
    nameTextMapHash,
    iconName: `UI_AvatarIcon_${id}`,
    qualityType: 'QUALITY_ORANGE',
    weaponType: 'WEAPON_CLAYMORE',
    avatarPromoteId: 1,
    hpBase: 1000,
    attackBase: 30,
    defenseBase: 60,
    critical: 0.05,
    criticalHurt: 0.5,
    propGrowCurves: [
      { type: 'FIGHT_PROP_BASE_HP', growCurve: 'CURVE_HP' },
      { type: 'FIGHT_PROP_BASE_ATTACK', growCurve: 'CURVE_ATTACK' },
      { type: 'FIGHT_PROP_BASE_DEFENSE', growCurve: 'CURVE_HP' },
    ],
    ...overrides,
  };
}

function fetter(avatarId: number, overrides: Partial<FetterRow> = {}): FetterRow {
  return {
    avatarId,
    avatarAssocType: 'ASSOC_TYPE_NATLAN',
    avatarTitleTextMapHash: 20,
    avatarDetailTextMapHash: 21,
    avatarNativeTextMapHash: 26,
    avatarVisionBeforTextMapHash: 10,
    avatarConstellationBeforTextMapHash: 23,
    finishConds: [{ condType: 'FETTER_COND_NOT_OPEN' }],
    [visionLabelBefore]: NO_TEXT,
    [visionLabelAfter]: NO_TEXT,
    [affiliationAfter]: NO_TEXT,
    ...overrides,
  };
}

const curvePoint = (level: number, multiplier: number) => ({
  level,
  curveInfos: [
    { type: 'CURVE_HP', value: multiplier },
    { type: 'CURVE_ATTACK', value: multiplier },
  ],
});

function tables(overrides: Partial<GameTables> = {}): GameTables {
  return {
    avatars: [
      avatar(10000106, 1),
      avatar(10000005, 2, { weaponType: 'WEAPON_SWORD_ONE_HAND' }),
      avatar(10000007, 3, { weaponType: 'WEAPON_SWORD_ONE_HAND' }),
      avatar(10000022, 4),
      avatar(10000999, 5),
      avatar(11000043, 6),
    ],
    fetters: [
      fetter(10000106),
      fetter(10000005, {
        avatarAssocType: 'ASSOC_TYPE_MAINACTOR',
        avatarTitleTextMapHash: NO_TEXT,
        avatarDetailTextMapHash: 22,
        avatarNativeTextMapHash: NO_TEXT,
        avatarVisionBeforTextMapHash: NO_TEXT,
      }),
      fetter(10000007, { avatarAssocType: 'ASSOC_TYPE_MAINACTOR' }),
      fetter(10000022, {
        avatarAssocType: 'ASSOC_TYPE_MONDSTADT',
        avatarNativeTextMapHash: 27,
        avatarVisionBeforTextMapHash: 11,
        avatarConstellationBeforTextMapHash: 24,
        avatarConstellationAfterTextMapHash: 25,
        finishConds: [{ condType: 'FETTER_COND_FINISH_QUEST' }],
        [affiliationAfter]: 28,
      }),
      fetter(10000999),
    ],
    curves: [curvePoint(90, 8), curvePoint(95, 9), curvePoint(100, 10)],
    promotes: [
      {
        avatarPromoteId: 1,
        unlockMaxLevel: 90,
        addProps: [
          { propType: 'FIGHT_PROP_BASE_HP', value: 4000 },
          { propType: 'FIGHT_PROP_BASE_ATTACK', value: 100 },
          { propType: 'FIGHT_PROP_BASE_DEFENSE', value: 250 },
          { propType: 'FIGHT_PROP_CRITICAL_HURT', value: 0.384 },
        ],
      },
    ],
    codex: [
      { avatarId: 10000106, beginTime: '2025-01-01 06:00:00' },
      { avatarId: 10000999, beginTime: '2027-01-01 06:00:00' },
    ],
    cities: [
      { cityId: 1, cityNameTextMapHash: 31 },
      { cityId: 6, cityNameTextMapHash: 30 },
    ],
    manualTexts: [
      { textMapId: 'WEAPON_CLAYMORE', textMapContentTextMapHash: 40 },
      { textMapId: 'WEAPON_SWORD_ONE_HAND', textMapContentTextMapHash: 41 },
      { textMapId: 'FIGHT_PROP_CRITICAL_HURT', textMapContentTextMapHash: 42 },
      { textMapId: 'FIGHT_PROP_CHARGE_EFFICIENCY', textMapContentTextMapHash: 43 },
      { textMapId: 'UI_STC_FETTER_VISION_BEFORE', textMapContentTextMapHash: 44 },
      { textMapId: 'UI_STC_FETTER_VISION_AFTER', textMapContentTextMapHash: 45 },
    ],
    textMaps: {
      pt: Object.fromEntries(Object.entries(TEXTS).map(([hash, [pt]]) => [hash, pt])),
      en: Object.fromEntries(Object.entries(TEXTS).map(([hash, [, en]]) => [hash, en])),
    },
    ...overrides,
  };
}

describe('extractCharacters', () => {
  it('gera só os jogáveis já lançados, com a Viajante numa entrada só e o id no slug do nome em inglês', () => {
    expect(Object.keys(extractCharacters(tables(), GENERATED_AT))).toEqual(['mavuika', 'traveler', 'venti']);
  });

  it('calcula os status nos níveis 90, 95 e 100 com a curva e a última ascensão', () => {
    const { stats, ascensionStat } = extractCharacters(tables(), GENERATED_AT).mavuika!;
    expect(stats).toEqual([
      { level: 90, hp: 12000, atk: 340, def: 730, ascensionStat: 88.4 },
      { level: 95, hp: 13000, atk: 370, def: 790, ascensionStat: 88.4 },
      { level: 100, hp: 14000, atk: 400, def: 850, ascensionStat: 88.4 },
    ]);
    expect(ascensionStat).toEqual({ name: { pt: 'Dano Crítico', en: 'CRIT DMG' }, isPercent: true });
  });

  it('monta identidade, região e perfil com o rótulo padrão "Visão"', () => {
    const mavuika = extractCharacters(tables(), GENERATED_AT).mavuika!;
    expect(mavuika).toMatchObject({
      name: { pt: 'Mavuika', en: 'Mavuika' },
      rarity: 5,
      element: 'pyro',
      icon: 'UI_AvatarIcon_10000106',
      weaponType: { pt: 'Espadão', en: 'Claymore' },
      region: { pt: 'Natlan', en: 'Natlan' },
      profile: {
        title: { pt: 'Chama da Noite Ardente', en: 'Night-Igniting Flame' },
        constellation: { pt: 'Sol Invictus', en: 'Sol Invictus' },
        visionLabel: { pt: 'Visão', en: 'Vision' },
        affiliation: { pt: 'Huitztlan', en: 'Huitztlan' },
      },
    });
  });

  it('usa os textos revelados pela história e o rótulo padrão "Gnosis" depois da revelação', () => {
    const { profile } = extractCharacters(tables(), GENERATED_AT).venti!;
    expect(profile.constellation.pt).toBe('Carmen Dei');
    expect(profile.affiliation?.en).toBe('Mondstadt City');
    expect(profile.visionLabel.pt).toBe('Gnosis');
  });

  it('usa o rótulo próprio antes do padrão', () => {
    const custom = tables();
    custom.fetters[0]![visionLabelBefore] = 29;
    expect(extractCharacters(custom, GENERATED_AT).mavuika!.profile.visionLabel.en).toBe('Stellar Linchpin');
  });

  it('dá à Viajante o Aether: ícone, texto no masculino, Teyvat, "Melhor amigo de Paimon" e sem título nem elemento', () => {
    const traveler = extractCharacters(tables(), GENERATED_AT).traveler!;
    expect(traveler.icon).toBe('UI_AvatarIcon_10000005');
    expect(traveler.profile.description).toEqual({ pt: 'Um Viajante forçado.', en: 'A traveler.' });
    expect(traveler.region.en).toBe('Teyvat');
    expect(traveler.element).toBe('none');
    expect(traveler.profile.title).toBeUndefined();
    expect(traveler.profile.affiliation).toEqual({ pt: 'Melhor amigo de Paimon', en: "Paimon's Best Friend" });
  });

  it('falha com tipo de afiliação sem região ligada', () => {
    const unknown = tables();
    unknown.fetters[0]!.avatarAssocType = 'ASSOC_TYPE_NOVA_NACAO';
    expect(() => extractCharacters(unknown, GENERATED_AT)).toThrow(/ASSOC_TYPE_NOVA_NACAO/);
  });

  it('falha quando o jogo renomeia os campos ofuscados', () => {
    const renamed = tables({
      fetters: tables().fetters.map(({ [visionLabelBefore]: _before, ...row }) => row as FetterRow),
    });
    expect(() => extractCharacters(renamed, GENERATED_AT)).toThrow(new RegExp(visionLabelBefore));
  });

  it('falha quando um texto existe em só um idioma', () => {
    const partial = tables();
    delete partial.textMaps.en['20'];
    expect(() => extractCharacters(partial, GENERATED_AT)).toThrow(/só um idioma/);
  });
});
