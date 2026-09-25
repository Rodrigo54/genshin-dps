import { formatAscensionStat, formatSeconds, formatStat, formatTeamDps, formatWeaponSubstat } from './number-format';

describe('formatTeamDps', () => {
  it('mostra milhares com uma casa decimal no separador de cada idioma', () => {
    expect(formatTeamDps(252000, 'pt')).toBe('252,0K');
    expect(formatTeamDps(252000, 'en')).toBe('252.0K');
    expect(formatTeamDps(1234567, 'en')).toBe('1,234.6K');
  });
});

describe('formatSeconds', () => {
  it('mostra segundos com até duas casas', () => {
    expect(formatSeconds(19.37, 'pt')).toBe('19,37s');
    expect(formatSeconds(20, 'en')).toBe('20s');
  });
});

describe('formatStat', () => {
  it('mostra taxas em porcentagem e valores planos inteiros', () => {
    expect(formatStat('critRate', 65.4, 'pt')).toBe('65,4%');
    expect(formatStat('atk', 2801.6, 'en')).toBe('2,802');
  });
});

describe('formatWeaponSubstat', () => {
  it('mostra porcentagem com uma casa e só a Proficiência Elemental como valor plano', () => {
    expect(formatWeaponSubstat('FIGHT_PROP_CRITICAL_HURT', 66.2, 'pt')).toBe('66,2%');
    expect(formatWeaponSubstat('FIGHT_PROP_ATTACK_PERCENT', 49.6, 'en')).toBe('49.6%');
    expect(formatWeaponSubstat('FIGHT_PROP_ELEMENT_MASTERY', 221, 'pt')).toBe('221');
  });
});

describe('formatAscensionStat', () => {
  it('mostra porcentagem com uma casa e valor plano como inteiro', () => {
    expect(formatAscensionStat(88.4, true, 'pt')).toBe('88,4%');
    expect(formatAscensionStat(115, false, 'en')).toBe('115');
  });
});
