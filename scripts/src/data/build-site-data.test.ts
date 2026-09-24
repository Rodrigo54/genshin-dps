import { describe, expect, it } from 'bun:test';
import { buildCatalog } from '../catalog/build-catalog';
import {
  benchmarkFixture,
  catalogSourceFixture,
  emptyOverrides,
  supportFixture,
  travelerOverride,
} from '../test-fixtures';
import { type BenchmarkFile, buildSiteData, DataValidationError } from './build-site-data';

const { catalog } = buildCatalog(catalogSourceFixture, { ...emptyOverrides, characters: [travelerOverride] });

const baselineTeam = benchmarkFixture({ teamDps: 200000 });
const c1Team = benchmarkFixture({
  teamDps: 260000,
  ref: { author: 'April', url: 'https://example.com/mavuika-c1' },
  main: { constellation: 1, weapon: { name: 'A Thousand Blazing Suns', refinement: 1 } },
});
const barbaraTeam = benchmarkFixture({
  teamDps: 90000,
  ref: { author: 'April', url: 'https://example.com/barbara' },
  main: { constellation: 6, weapon: { name: 'Thrilling Tales of Dragon Slayers', refinement: 5 } },
});

const mavuikaFile: BenchmarkFile = {
  mainCharacterId: 'mavuika',
  path: 'data/benchmarks/mavuika.yaml',
  benchmarks: [baselineTeam, c1Team],
};
const barbaraFile: BenchmarkFile = {
  mainCharacterId: 'barbara',
  path: 'data/benchmarks/barbara.yaml',
  benchmarks: [barbaraTeam],
};

const teamIdOf = (benchmark: typeof baselineTeam) =>
  buildSiteData(catalog, [{ ...mavuikaFile, benchmarks: [benchmark] }]).characterTeams[0]!.teams[0]!.id;

describe('buildSiteData', () => {
  it('usa o personagem do nome do arquivo como DPS principal e primeiro membro', () => {
    const { characterTeams } = buildSiteData(catalog, [barbaraFile]);
    const [team] = characterTeams[0]!.teams;
    expect(team!.mainCharacterId).toBe('barbara');
    expect(team!.members.map((member) => member.characterId)).toEqual(['barbara', 'citlali', 'bennett', 'xilonen']);
  });

  it('repassa os principais das peças para o JSON do membro', () => {
    const mainStats = { sands: 'atkPercent', goblet: 'pyroDmgBonus', circlet: 'critRate' } as const;
    const withMainStats = benchmarkFixture({ main: { ...baselineTeam.main, mainStats } });
    const { characterTeams } = buildSiteData(catalog, [{ ...mavuikaFile, benchmarks: [withMainStats] }]);
    expect(characterTeams[0]!.teams[0]!.members[0]!.mainStats).toEqual(mainStats);
  });

  it('aceita suporte sem arma: fica fora do catálogo de armas e não tira o time do baseline', () => {
    const [, bennett, xilonen] = baselineTeam.supports;
    const citlaliWithoutWeapon = { character: 'Citlali', constellation: 0 };
    const benchmark = benchmarkFixture({ supports: [citlaliWithoutWeapon, bennett, xilonen] });
    const { characterTeams } = buildSiteData(catalog, [{ ...mavuikaFile, benchmarks: [benchmark] }]);
    const [team] = characterTeams[0]!.teams;
    expect(team!.members[1]).toEqual({ characterId: 'citlali', element: 'cryo', constellation: 0 });
    expect(team!.isBaseline).toBe(true);
  });

  it('diferencia no id o suporte sem arma do suporte com arma', () => {
    const [citlali, bennett, xilonen] = baselineTeam.supports;
    const { weapon: _weapon, ...citlaliWithoutWeapon } = citlali;
    expect(teamIdOf({ ...baselineTeam, supports: [citlaliWithoutWeapon, bennett, xilonen] })).not.toBe(
      teamIdOf(baselineTeam),
    );
  });

  it('ordena os times do personagem pelo DPS do time, do maior para o menor', () => {
    const { characterTeams } = buildSiteData(catalog, [mavuikaFile]);
    expect(characterTeams[0]!.teams.map((team) => team.teamDps)).toEqual([260000, 200000]);
  });

  it('marca baseline por membro: Mavuika C1 tira o time do baseline', () => {
    const { characterTeams } = buildSiteData(catalog, [mavuikaFile]);
    const [c1, baseline] = characterTeams[0]!.teams;
    expect(c1!.isBaseline).toBe(false);
    expect(baseline!.isBaseline).toBe(true);
  });

  it('monta o ranking com o melhor time de cada DPS principal por filtro', () => {
    const { ranking } = buildSiteData(catalog, [mavuikaFile, barbaraFile]);
    expect(ranking.all.map((team) => [team.mainCharacterId, team.teamDps])).toEqual([
      ['mavuika', 260000],
      ['barbara', 90000],
    ]);
    expect(ranking.baseline.map((team) => [team.mainCharacterId, team.teamDps])).toEqual([
      ['mavuika', 200000],
      ['barbara', 90000],
    ]);
  });

  it('tira benchmark obsoleto do ranking, mas mantém na tabela do personagem', () => {
    const obsoleteFile = { ...mavuikaFile, benchmarks: [baselineTeam, { ...c1Team, obsolete: true as const }] };
    const { ranking, characterTeams } = buildSiteData(catalog, [obsoleteFile]);
    expect(ranking.all[0]!.teamDps).toBe(200000);
    expect(characterTeams[0]!.teams).toHaveLength(2);
    expect(characterTeams[0]!.teams[0]!.isObsolete).toBe(true);
  });

  it('inclui no catálogo só o que os times usam, com nomes nos dois idiomas', () => {
    const { catalog: siteCatalog } = buildSiteData(catalog, [mavuikaFile]);
    expect(Object.keys(siteCatalog.characters).sort()).toEqual(['bennett', 'citlali', 'mavuika', 'xilonen']);
    expect(siteCatalog.weapons['wolf-fang']!.name).toEqual({ en: 'Wolf-Fang', pt: 'Farpa' });
  });

  it('mantém o id com outra grafia, outra ordem dos suportes ou nova medição (DPS, patch, ref)', () => {
    const [citlali, bennett, xilonen] = baselineTeam.supports;
    const baselineId = teamIdOf(baselineTeam);
    expect(teamIdOf({ ...baselineTeam, supports: [{ ...citlali, character: 'citlali' }, bennett, xilonen] })).toBe(
      baselineId,
    );
    expect(teamIdOf({ ...baselineTeam, supports: [xilonen, citlali, bennett] })).toBe(baselineId);
    expect(
      teamIdOf({
        ...baselineTeam,
        teamDps: 999999,
        patch: '7.1',
        ref: { author: 'Lunnoa', url: 'https://example.com/outra' },
      }),
    ).toBe(baselineId);
  });

  it('muda o id quando muda o investimento do DPS principal ou de um suporte', () => {
    const [citlali, bennett, xilonen] = baselineTeam.supports;
    const baselineId = teamIdOf(baselineTeam);
    expect(teamIdOf(c1Team)).not.toBe(baselineId);
    expect(teamIdOf({ ...baselineTeam, supports: [{ ...citlali, constellation: 1 }, bennett, xilonen] })).not.toBe(
      baselineId,
    );
  });

  it('recusa personagem repetido no time, inclusive o DPS principal como suporte', () => {
    const [, bennett, xilonen] = baselineTeam.supports;
    const withMainAsSupport = benchmarkFixture({ supports: [supportFixture('Mavuika'), bennett, xilonen] });
    expect(() => buildSiteData(catalog, [{ ...mavuikaFile, benchmarks: [withMainAsSupport] }])).toThrow(
      'aparece mais de uma vez no time',
    );
  });

  it('usa o elemento do catálogo e, para quem não tem elemento fixo, o da build', () => {
    const [, bennett, xilonen] = baselineTeam.supports;
    const cryoTraveler = { ...supportFixture('Traveler'), element: 'cryo' } as const;
    const benchmark = benchmarkFixture({ supports: [cryoTraveler, bennett, xilonen] });
    const [team] = buildSiteData(catalog, [{ ...mavuikaFile, benchmarks: [benchmark] }]).characterTeams[0]!.teams;
    expect(team!.members.map((member) => member.element)).toEqual(['pyro', 'cryo', 'pyro', 'geo']);
  });

  it('diferencia no id a Viajante de cada elemento', () => {
    const [, bennett, xilonen] = baselineTeam.supports;
    const travelerOf = (element: 'cryo' | 'anemo') => ({ ...supportFixture('Traveler'), element });
    expect(teamIdOf(benchmarkFixture({ supports: [travelerOf('cryo'), bennett, xilonen] }))).not.toBe(
      teamIdOf(benchmarkFixture({ supports: [travelerOf('anemo'), bennett, xilonen] })),
    );
  });

  it('recusa a Viajante sem elemento e personagem de elemento fixo com elemento na build', () => {
    const [, bennett, xilonen] = baselineTeam.supports;
    const withoutElement = benchmarkFixture({ supports: [supportFixture('Traveler'), bennett, xilonen] });
    expect(() => buildSiteData(catalog, [{ ...mavuikaFile, benchmarks: [withoutElement] }])).toThrow(
      '"traveler" não tem elemento fixo',
    );
    const hydroMavuika = benchmarkFixture({ main: { ...baselineTeam.main, element: 'hydro' } });
    expect(() => buildSiteData(catalog, [{ ...mavuikaFile, benchmarks: [hydroMavuika] }])).toThrow(
      '"mavuika" tem elemento fixo',
    );
  });

  it('recusa arquivo cujo nome não é id de personagem', () => {
    const unknownFile = { ...mavuikaFile, mainCharacterId: 'mavuka', path: 'data/benchmarks/mavuka.yaml' };
    expect(() => buildSiteData(catalog, [unknownFile])).toThrow('"mavuka" não é id de personagem');
  });

  it('junta todos os problemas num único erro', () => {
    const unknownFile = { ...barbaraFile, mainCharacterId: 'barbra', path: 'data/benchmarks/barbra.yaml' };
    const [, bennett, xilonen] = baselineTeam.supports;
    const typoFile = {
      ...mavuikaFile,
      benchmarks: [benchmarkFixture({ supports: [supportFixture('Citlaly'), bennett, xilonen] })],
    };
    try {
      buildSiteData(catalog, [unknownFile, typoFile]);
      throw new Error('deveria ter falhado');
    } catch (error) {
      expect(error).toBeInstanceOf(DataValidationError);
      expect((error as DataValidationError).issues).toHaveLength(2);
    }
  });

  it('recusa o mesmo time com o mesmo investimento medido duas vezes', () => {
    const remeasured = {
      ...baselineTeam,
      teamDps: 210000,
      ref: { author: 'Lunnoa', url: 'https://example.com/nova-medicao' },
    };
    expect(() => buildSiteData(catalog, [{ ...mavuikaFile, benchmarks: [baselineTeam, remeasured] }])).toThrow(
      'Time repetido',
    );
  });
});
