import { describe, expect, it } from 'bun:test';
import { type BaselineMember, isBaselineMember, isBaselineTeam } from './baseline';

const fiveStarC0R1: BaselineMember = {
  characterId: 'mavuika',
  characterRarity: 5,
  constellation: 0,
  weapon: { weaponId: 'a-thousand-blazing-suns', rarity: 5, refinement: 1 },
};
const fourStarC6R5: BaselineMember = {
  characterId: 'bennett',
  characterRarity: 4,
  constellation: 6,
  weapon: { weaponId: 'favonius-sword', rarity: 4, refinement: 5 },
};

describe('isBaselineMember', () => {
  it('aceita 5★ em C0 com arma 5★ R1', () => {
    expect(isBaselineMember(fiveStarC0R1)).toBe(true);
  });

  it('recusa 5★ acima de C0', () => {
    expect(isBaselineMember({ ...fiveStarC0R1, constellation: 1 })).toBe(false);
  });

  it('recusa arma 5★ acima de R1', () => {
    expect(isBaselineMember({ ...fiveStarC0R1, weapon: { ...fiveStarC0R1.weapon!, refinement: 2 } })).toBe(false);
  });

  it('aceita 4★ em qualquer constelação, pois C6 é o teto', () => {
    expect(isBaselineMember(fourStarC6R5)).toBe(true);
    expect(isBaselineMember({ ...fourStarC6R5, constellation: 0 })).toBe(true);
  });

  it('aceita armas 4★ e 3★ em qualquer refinamento, pois R5 é o teto', () => {
    expect(
      isBaselineMember({ ...fiveStarC0R1, weapon: { weaponId: 'favonius-sword', rarity: 4, refinement: 5 } }),
    ).toBe(true);
    expect(
      isBaselineMember({ ...fiveStarC0R1, weapon: { weaponId: 'harbinger-of-dawn', rarity: 3, refinement: 5 } }),
    ).toBe(true);
  });

  it('recusa 4★ segurando arma 5★ acima de R1', () => {
    expect(isBaselineMember({ ...fourStarC6R5, weapon: { weaponId: 'skyward-blade', rarity: 5, refinement: 5 } })).toBe(
      false,
    );
  });
});

describe('isBaselineMember com investimento gratuito', () => {
  it('aceita C1 de 5★ do evento de treino, mas não C2', () => {
    const yaeMiko = { ...fiveStarC0R1, characterId: 'yae-miko' };
    expect(isBaselineMember({ ...yaeMiko, constellation: 1 })).toBe(true);
    expect(isBaselineMember({ ...yaeMiko, constellation: 2 })).toBe(false);
  });

  it('aceita a Viajante em qualquer constelação', () => {
    expect(isBaselineMember({ ...fiveStarC0R1, characterId: 'traveler', constellation: 6 })).toBe(true);
  });

  it('aceita arma 5★ gratuita em qualquer refinamento, com qualquer personagem', () => {
    const weapon = { weaponId: 'exaiphanes-blade', rarity: 5, refinement: 5 } as const;
    expect(isBaselineMember({ ...fiveStarC0R1, characterId: 'traveler', weapon })).toBe(true);
    expect(isBaselineMember({ ...fiveStarC0R1, characterId: 'odette', weapon })).toBe(true);
  });
});

describe('isBaselineMember com dado ausente', () => {
  it('não tira do baseline quando a fonte omite a arma', () => {
    expect(isBaselineMember({ characterId: 'mavuika', characterRarity: 5, constellation: 0 })).toBe(true);
  });

  it('continua exigindo C0 do 5★ mesmo sem arma informada', () => {
    expect(isBaselineMember({ characterId: 'mavuika', characterRarity: 5, constellation: 1 })).toBe(false);
  });
});

describe('isBaselineTeam', () => {
  it('aceita time em que todos os membros estão no baseline', () => {
    expect(isBaselineTeam([fiveStarC0R1, fourStarC6R5, fiveStarC0R1, fourStarC6R5])).toBe(true);
  });

  it('recusa time com um único membro acima do baseline', () => {
    const c2Member = { ...fiveStarC0R1, constellation: 2 };
    expect(isBaselineTeam([fiveStarC0R1, fourStarC6R5, c2Member, fourStarC6R5])).toBe(false);
  });
});
