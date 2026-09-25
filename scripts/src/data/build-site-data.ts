import { createHash } from 'node:crypto';
import {
  type BaselineMember,
  type BenchmarkInput,
  type Catalog,
  type CharacterEntry,
  DEFAULT_CHARACTER_LEVEL,
  type CharacterTeams,
  isBaselineTeam,
  type Ranking,
  type Team,
  type SupportMemberInput,
  type TeamElement,
  type TeamMember,
} from '@genshin-dps/schema';
import type { ResolvedCatalog } from '../catalog/build-catalog';

const TEAM_ID_LENGTH = 8;

export interface BenchmarkFile {
  // Id do DPS principal que o arquivo agrupa (nome do arquivo sem extensão)
  mainCharacterId: string;
  path: string;
  benchmarks: BenchmarkInput[];
}

export interface SiteData {
  catalog: Catalog;
  ranking: Ranking;
  characterTeams: CharacterTeams[];
}

export class DataValidationError extends Error {
  constructor(readonly issues: string[]) {
    super(`Dados inválidos:\n${issues.map((issue) => `  - ${issue}`).join('\n')}`);
    this.name = 'DataValidationError';
  }
}

// DPS principal e suportes têm o mesmo formato, a não ser pelo personagem (o do principal vem do arquivo)
type MemberInput = Omit<SupportMemberInput, 'character'>;

interface ResolvedMember {
  member: TeamMember;
  baseline: BaselineMember;
}

export class RepeatedCharacterError extends Error {
  constructor(characterId: string) {
    super(`"${characterId}" aparece mais de uma vez no time`);
    this.name = 'RepeatedCharacterError';
  }
}

export class ElementChoiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ElementChoiceError';
  }
}

// Quem não tem elemento fixo precisa do elemento da build; quem tem não pode trocá-lo
function resolveElement(character: CharacterEntry, chosenElement?: TeamElement): TeamElement {
  if (character.element === 'none') {
    if (chosenElement === undefined) {
      throw new ElementChoiceError(`"${character.id}" não tem elemento fixo: informe o element da build`);
    }
    return chosenElement;
  }
  if (chosenElement !== undefined) {
    throw new ElementChoiceError(`"${character.id}" tem elemento fixo: tire o element da build`);
  }
  return character.element;
}

function resolveMember(catalog: ResolvedCatalog, character: CharacterEntry, input: MemberInput): ResolvedMember {
  const weapon = input.weapon && {
    entry: catalog.weapons.resolve(input.weapon.name),
    refinement: input.weapon.refinement,
  };
  const member: TeamMember = {
    characterId: character.id,
    element: resolveElement(character, input.element),
    constellation: input.constellation,
    level: input.level ?? DEFAULT_CHARACTER_LEVEL,
    ...(weapon && { weapon: { weaponId: weapon.entry.id, refinement: weapon.refinement } }),
    ...(input.sets && {
      sets: input.sets.map((set) => ({ artifactSetId: catalog.artifactSets.resolve(set.name).id, pieces: set.pieces })),
    }),
    ...(input.talents && { talents: input.talents }),
    ...(input.mainStats && { mainStats: input.mainStats }),
    ...(input.stats && { stats: input.stats }),
  };
  const baseline: BaselineMember = {
    characterId: character.id,
    characterRarity: character.rarity,
    constellation: input.constellation,
    ...(weapon && {
      weapon: { weaponId: weapon.entry.id, rarity: weapon.entry.rarity, refinement: weapon.refinement },
    }),
  };
  return { member, baseline };
}

function resolveSupport(catalog: ResolvedCatalog, input: SupportMemberInput): ResolvedMember {
  return resolveMember(catalog, catalog.characters.resolve(input.character), input);
}

function assertUniqueCharacters(members: TeamMember[]): void {
  const repeated = members.find((member, position) =>
    members.slice(0, position).some((previous) => previous.characterId === member.characterId),
  );
  if (repeated) throw new RepeatedCharacterError(repeated.characterId);
}

const toMemberIdentity = (member: TeamMember) =>
  [
    member.characterId,
    member.element,
    member.constellation,
    member.weapon?.weaponId ?? '',
    member.weapon?.refinement ?? '',
    // Só o nível fora do padrão entra, para os times no nível 90 manterem a URL de antes do campo existir
    ...(member.level === DEFAULT_CHARACTER_LEVEL ? [] : [member.level]),
  ].join(':');

// O id identifica time + investimento: DPS principal e, sem importar a ordem, os três suportes com elemento, C/R,
// arma e nível.
// DPS, patch e ref ficam de fora para a URL sobreviver a uma nova medição do mesmo time.
function createTeamId(members: TeamMember[]): string {
  const mainIdentity = members.slice(0, 1).map(toMemberIdentity);
  const supportIdentities = members.slice(1).map(toMemberIdentity).sort();
  const fingerprint = JSON.stringify([mainIdentity, supportIdentities]);
  return createHash('sha1').update(fingerprint).digest('hex').slice(0, TEAM_ID_LENGTH);
}

function toTeam(catalog: ResolvedCatalog, mainCharacter: CharacterEntry, benchmark: BenchmarkInput): Team {
  const resolved = [
    resolveMember(catalog, mainCharacter, benchmark.main),
    ...benchmark.supports.map((support) => resolveSupport(catalog, support)),
  ];
  const members = resolved.map(({ member }) => member);
  assertUniqueCharacters(members);
  return {
    id: createTeamId(members),
    mainCharacterId: mainCharacter.id,
    teamDps: benchmark.teamDps,
    ...(benchmark.rotationTime !== undefined && { rotationTime: benchmark.rotationTime }),
    patch: benchmark.patch,
    ref: benchmark.ref,
    ...(benchmark.rotation && { rotation: benchmark.rotation }),
    ...(benchmark.notes && { notes: benchmark.notes }),
    isObsolete: benchmark.obsolete === true,
    isBaseline: isBaselineTeam(resolved.map(({ baseline }) => baseline)),
    members,
  };
}

interface FileTeams {
  file: BenchmarkFile;
  teams: Team[];
  issues: string[];
}

type BenchmarkOutcome = { team: Team } | { issue: string };

interface BenchmarkLocation {
  file: BenchmarkFile;
  mainCharacter: CharacterEntry;
  benchmark: BenchmarkInput;
  position: number;
}

function toBenchmarkOutcome(
  catalog: ResolvedCatalog,
  { file, mainCharacter, benchmark, position }: BenchmarkLocation,
): BenchmarkOutcome {
  try {
    return { team: toTeam(catalog, mainCharacter, benchmark) };
  } catch (error) {
    return { issue: `${file.path} #${position + 1}: ${(error as Error).message}` };
  }
}

// O nome do arquivo define o DPS principal de todos os benchmarks dele
function toFileTeams(catalog: ResolvedCatalog, file: BenchmarkFile): FileTeams {
  if (!catalog.characters.hasId(file.mainCharacterId)) {
    const issue = `${file.path}: "${file.mainCharacterId}" não é id de personagem (use o nome em inglês em minúsculas com hífens, ex.: kaedehara-kazuha.yaml)`;
    return { file, teams: [], issues: [issue] };
  }
  const mainCharacter = catalog.characters.getById(file.mainCharacterId);
  const outcomes = file.benchmarks.map((benchmark, position) =>
    toBenchmarkOutcome(catalog, { file, mainCharacter, benchmark, position }),
  );
  return {
    file,
    teams: outcomes.flatMap((outcome) => ('team' in outcome ? [outcome.team] : [])),
    issues: outcomes.flatMap((outcome) => ('issue' in outcome ? [outcome.issue] : [])),
  };
}

function findDuplicateIds(teams: Team[]): string[] {
  const teamsById = Map.groupBy(teams, ({ id }) => id);
  return [...teamsById.entries()]
    .filter(([, sameIdTeams]) => sameIdTeams.length > 1)
    .map(([id, sameIdTeams]) => {
      const refs = sameIdTeams.map(({ ref }) => ref.url).join(', ');
      return `Time repetido (id ${id}): mesmo DPS principal, membros, C/R e armas em ${refs}; mantenha só uma medição`;
    });
}

const byTeamDpsDescending = (a: Team, b: Team) => b.teamDps - a.teamDps;

function rankBestTeamPerMain(teams: Team[]): Team[] {
  const bestByMain = new Map<string, Team>();
  teams.forEach((team) => {
    const current = bestByMain.get(team.mainCharacterId);
    if (!current || team.teamDps > current.teamDps) bestByMain.set(team.mainCharacterId, team);
  });
  return [...bestByMain.values()].sort(byTeamDpsDescending);
}

function collectCatalog(catalog: ResolvedCatalog, teams: Team[]): Catalog {
  const result: Catalog = { characters: {}, weapons: {}, artifactSets: {} };
  teams
    .flatMap(({ members }) => members)
    .forEach((member) => {
      result.characters[member.characterId] = catalog.characters.getById(member.characterId);
      if (member.weapon) result.weapons[member.weapon.weaponId] = catalog.weapons.getById(member.weapon.weaponId);
      member.sets?.forEach(({ artifactSetId }) => {
        result.artifactSets[artifactSetId] = catalog.artifactSets.getById(artifactSetId);
      });
    });
  return result;
}

// Transforma os benchmarks validados no JSON do site; junta todos os problemas antes de falhar
export function buildSiteData(catalog: ResolvedCatalog, files: BenchmarkFile[]): SiteData {
  const teamsByFile = files.map((file) => toFileTeams(catalog, file));
  const allTeams = teamsByFile.flatMap(({ teams }) => teams);
  const issues = [...teamsByFile.flatMap((fileTeams) => fileTeams.issues), ...findDuplicateIds(allTeams)];
  if (issues.length > 0) throw new DataValidationError(issues);

  const rankedTeams = allTeams.filter((team) => !team.isObsolete);
  return {
    catalog: collectCatalog(catalog, allTeams),
    ranking: {
      baseline: rankBestTeamPerMain(rankedTeams.filter((team) => team.isBaseline)),
      all: rankBestTeamPerMain(rankedTeams),
    },
    characterTeams: teamsByFile.map(({ file, teams }) => ({
      characterId: file.mainCharacterId,
      teams: [...teams].sort(byTeamDpsDescending),
    })),
  };
}
