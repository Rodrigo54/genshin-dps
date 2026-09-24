import { describe, expect, it } from 'bun:test';
import { benchmarkFileSchema, benchmarkSchema } from './benchmark';

const support = (character: string) => ({
  character,
  constellation: 0,
  weapon: { name: 'Favonius Sword', refinement: 5 },
});

const validBenchmark = {
  teamDps: 252000,
  rotationTime: 19.37,
  patch: '6.8',
  ref: { author: 'April', url: 'https://example.com/benchmark' },
  main: { constellation: 0, weapon: { name: 'A Thousand Blazing Suns', refinement: 1 } },
  supports: [support('Citlali'), support('Bennett'), support('Xilonen')],
};

const isValid = (benchmark: unknown) => benchmarkSchema.safeParse(benchmark).success;

describe('benchmarkSchema', () => {
  it('aceita um benchmark só com os campos obrigatórios', () => {
    const { rotationTime: _rotationTime, ...requiredOnly } = validBenchmark;
    expect(isValid(requiredOnly)).toBe(true);
  });

  it('exige exatamente 3 suportes', () => {
    expect(isValid({ ...validBenchmark, supports: validBenchmark.supports.slice(0, 2) })).toBe(false);
    expect(isValid({ ...validBenchmark, supports: [...validBenchmark.supports, support('Furina')] })).toBe(false);
  });

  it('aceita suporte sem arma, mas exige o refinamento da arma informada e a arma do DPS principal', () => {
    const [citlali, ...others] = validBenchmark.supports;
    const { weapon: _weapon, ...withoutWeapon } = citlali!;
    const withoutRefinement = { ...citlali, weapon: { name: 'Favonius Sword' } };
    expect(isValid({ ...validBenchmark, supports: [withoutWeapon, ...others] })).toBe(true);
    expect(isValid({ ...validBenchmark, supports: [withoutRefinement, ...others] })).toBe(false);
    const { weapon: _mainWeapon, ...mainWithoutWeapon } = validBenchmark.main;
    expect(isValid({ ...validBenchmark, main: mainWithoutWeapon })).toBe(false);
    expect(
      isValid({ ...validBenchmark, main: { ...validBenchmark.main, weapon: { name: 'A Thousand Blazing Suns' } } }),
    ).toBe(false);
  });

  it('não aceita personagem no DPS principal, que vem do nome do arquivo', () => {
    expect(isValid({ ...validBenchmark, main: { ...validBenchmark.main, character: 'Mavuika' } })).toBe(false);
  });

  it('recusa constelação fora de 0–6 e refinamento fora de 1–5', () => {
    expect(isValid({ ...validBenchmark, main: { ...validBenchmark.main, constellation: 7 } })).toBe(false);
    const r0 = { ...support('Citlali'), weapon: { name: 'Favonius Sword', refinement: 0 } };
    expect(isValid({ ...validBenchmark, supports: [r0, ...validBenchmark.supports.slice(1)] })).toBe(false);
  });

  it('aceita principais válidos para cada peça e recusa atributo que a peça não tem', () => {
    const mainStats = { sands: 'atkPercent', goblet: 'pyroDmgBonus', circlet: 'critDamage' };
    expect(isValid({ ...validBenchmark, main: { ...validBenchmark.main, mainStats } })).toBe(true);
    const critGoblet = { ...mainStats, goblet: 'critRate' };
    expect(isValid({ ...validBenchmark, main: { ...validBenchmark.main, mainStats: critGoblet } })).toBe(false);
    const { circlet: _circlet, ...incomplete } = mainStats;
    expect(isValid({ ...validBenchmark, main: { ...validBenchmark.main, mainStats: incomplete } })).toBe(false);
  });

  it('recusa patch fora do formato X.Y', () => {
    expect(isValid({ ...validBenchmark, patch: 'v6.8' })).toBe(false);
  });

  it('recusa ref com link que não seja https', () => {
    expect(isValid({ ...validBenchmark, ref: { author: 'April', url: 'http://example.com' } })).toBe(false);
    expect(isValid({ ...validBenchmark, ref: { author: 'April', url: 'não é url' } })).toBe(false);
  });

  it('exige o autor da fonte e aceita ferramenta e notas de metodologia', () => {
    expect(isValid({ ...validBenchmark, ref: { url: 'https://example.com/benchmark' } })).toBe(false);
    const fullRef = { ...validBenchmark.ref, tool: 'LUNABASE Simulator', notes: { pt: 'Simulação de 2 rotações' } };
    expect(isValid({ ...validBenchmark, ref: fullRef })).toBe(true);
  });

  it('recusa campo desconhecido para pegar erro de digitação, também nos suportes', () => {
    expect(isValid({ ...validBenchmark, teamDPS: 1 })).toBe(false);
    const typo = { ...support('Citlali'), constelation: 1 };
    expect(isValid({ ...validBenchmark, supports: [typo, ...validBenchmark.supports.slice(1)] })).toBe(false);
  });

  it('aceita notas em um só idioma e recusa notas vazias', () => {
    expect(isValid({ ...validBenchmark, notes: { pt: 'Com Escudo' } })).toBe(true);
    expect(isValid({ ...validBenchmark, notes: {} })).toBe(false);
  });

  it('só aceita obsolete como true', () => {
    expect(isValid({ ...validBenchmark, obsolete: true })).toBe(true);
    expect(isValid({ ...validBenchmark, obsolete: false })).toBe(false);
  });
});

describe('benchmarkFileSchema', () => {
  it('recusa arquivo sem benchmarks', () => {
    expect(benchmarkFileSchema.safeParse([]).success).toBe(false);
  });
});
