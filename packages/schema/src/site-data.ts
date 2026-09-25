// Contrato do JSON gerado por `bun run data` e consumido pelo app

export const LOCALES = ['pt', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export type LocalizedText = Record<Locale, string>;

// "none" cobre o Viajante e os Manequins, cujo elemento depende da escolha do jogador
export const ELEMENTS = ['pyro', 'hydro', 'anemo', 'electro', 'dendro', 'cryo', 'geo', 'none'] as const;
export type Element = (typeof ELEMENTS)[number];

// Elemento de um membro no time: quem não tem elemento fixo recebe o da build
export type TeamElement = Exclude<Element, 'none'>;

// Nome do ícone de cada elemento nos arquivos do jogo
export const ELEMENT_ICONS: Record<TeamElement, string> = {
  pyro: 'UI_Buff_Element_Fire',
  hydro: 'UI_Buff_Element_Water',
  anemo: 'UI_Buff_Element_Wind',
  electro: 'UI_Buff_Element_Electric',
  dendro: 'UI_Buff_Element_Grass',
  cryo: 'UI_Buff_Element_Ice',
  geo: 'UI_Buff_Element_Rock',
};

export type CharacterRarity = 4 | 5;

// Níveis com status gravados em data/characters: 90 é o máximo por ascensão e o padrão das builds; 95 e 100 vêm
// do investimento extra que tira o time do Baseline
export const CHARACTER_LEVELS = [90, 95, 100] as const;
export type CharacterLevel = (typeof CHARACTER_LEVELS)[number];
export const DEFAULT_CHARACTER_LEVEL: CharacterLevel = 90;
export type WeaponRarity = 1 | 2 | 3 | 4 | 5;

export interface CharacterTooltipText {
  // Viajante e Manequins não têm título; a afiliação é opcional porque o jogo pode deixar vazia
  title?: string;
  // Nação do personagem; quem não pertence a uma fica em "Teyvat"
  region: string;
  affiliation?: string;
  // Nome da constelação do personagem (ex.: "Dulciaria Structura")
  constellation: string;
  // Rótulo do campo de elemento na aba Perfil ("Visão", "Gnosis", "Eixo Estelar"…)
  visionLabel: string;
  weaponType: string;
  // Nome do atributo de ascensão como o jogo mostra (ex.: "Dano Crítico", "Bônus de Dano Pyro")
  ascensionStatName: string;
  description: string;
}

// Status base num nível, depois da última ascensão; porcentagens já multiplicadas por 100
export interface CharacterLevelStats {
  level: CharacterLevel;
  hp: number;
  atk: number;
  def: number;
  ascensionStat: number;
}

// O card mostra os status no nível do membro no time
export interface CharacterTooltipData {
  // Um por nível de CHARACTER_LEVELS
  stats: CharacterLevelStats[];
  // Só a Proficiência Elemental é plana; os outros atributos de ascensão são porcentagem
  isAscensionStatPercent: boolean;
  text: Record<Locale, CharacterTooltipText>;
}

export interface CharacterEntry {
  id: string;
  name: LocalizedText;
  rarity: CharacterRarity;
  element: Element;
  icon: string;
  // Ausente em personagem cadastrado à mão no overrides
  tooltip?: CharacterTooltipData;
}

// Atributo secundário da arma, com o nome interno do jogo
export const WEAPON_SUBSTAT_TYPES = [
  'FIGHT_PROP_ATTACK_PERCENT',
  'FIGHT_PROP_HP_PERCENT',
  'FIGHT_PROP_DEFENSE_PERCENT',
  'FIGHT_PROP_CHARGE_EFFICIENCY',
  'FIGHT_PROP_CRITICAL',
  'FIGHT_PROP_CRITICAL_HURT',
  'FIGHT_PROP_ELEMENT_MASTERY',
  'FIGHT_PROP_PHYSICAL_ADD_HURT',
] as const;
export type WeaponSubstatType = (typeof WEAPON_SUBSTAT_TYPES)[number];

// Proficiência Elemental é o único secundário em número absoluto; os outros são porcentagem
export const FLAT_WEAPON_SUBSTAT: WeaponSubstatType = 'FIGHT_PROP_ELEMENT_MASTERY';

// Trecho de texto do jogo com a cor que o jogo dá a ele (#RRGGBBAA); `{0}`, `{1}`… são lacunas
// preenchidas pelos valores de cada refinamento
export interface GameTextSegment {
  text: string;
  color?: string;
}

export interface WeaponPassive {
  name: string;
  template: GameTextSegment[];
  // Um item por refinamento (R1 a R5), com os valores das lacunas do template
  refinementValues: string[][];
}

export interface WeaponTooltipText {
  // Armas 1★ e 2★ não têm passiva
  passive?: WeaponPassive;
  lore: string;
}

// Status no nível máximo, como o tooltip do jogo mostra; porcentagens já multiplicadas por 100
export interface WeaponTooltipData {
  level: number;
  baseAtk: number;
  substat?: { type: WeaponSubstatType; value: number };
  text: Record<Locale, WeaponTooltipText>;
}

export interface WeaponEntry {
  id: string;
  name: LocalizedText;
  rarity: WeaponRarity;
  icon: string;
  // Ausente em arma cadastrada à mão no overrides
  tooltip?: WeaponTooltipData;
}

export interface ArtifactSetEntry {
  id: string;
  name: LocalizedText;
}

export interface Catalog {
  characters: Record<string, CharacterEntry>;
  weapons: Record<string, WeaponEntry>;
  artifactSets: Record<string, ArtifactSetEntry>;
}

const COMMON_MAIN_STATS = ['hpPercent', 'atkPercent', 'defPercent', 'elementalMastery'] as const;

// Atributos principais possíveis por peça; flor e pena são fixas (Vida e ATQ) e não entram
export const MAIN_STATS_BY_SLOT = {
  sands: [...COMMON_MAIN_STATS, 'energyRecharge'],
  goblet: [
    ...COMMON_MAIN_STATS,
    'pyroDmgBonus',
    'hydroDmgBonus',
    'anemoDmgBonus',
    'electroDmgBonus',
    'dendroDmgBonus',
    'cryoDmgBonus',
    'geoDmgBonus',
    'physicalDmgBonus',
  ],
  circlet: [...COMMON_MAIN_STATS, 'critRate', 'critDamage', 'healingBonus'],
} as const;

export type MainStatSlot = keyof typeof MAIN_STATS_BY_SLOT;
export const MAIN_STAT_SLOTS = Object.keys(MAIN_STATS_BY_SLOT) as MainStatSlot[];

export type MemberMainStats = { [Slot in MainStatSlot]: (typeof MAIN_STATS_BY_SLOT)[Slot][number] };

export interface MemberStats {
  hp?: number;
  atk?: number;
  def?: number;
  elementalMastery?: number;
  energyRecharge?: number;
  critRate?: number;
  critDamage?: number;
}

export interface MemberArtifactSet {
  artifactSetId: string;
  pieces: 2 | 4;
}

export interface MemberWeapon {
  weaponId: string;
  refinement: number;
}

export interface TeamMember {
  characterId: string;
  element: TeamElement;
  constellation: number;
  // Sempre preenchido: 90 quando o benchmark não informa
  level: CharacterLevel;
  // Ausente quando a fonte não informou a arma do suporte
  weapon?: MemberWeapon;
  sets?: MemberArtifactSet[];
  talents?: [number, number, number];
  mainStats?: MemberMainStats;
  stats?: MemberStats;
}

// Crédito e metodologia da fonte do benchmark
export interface BenchmarkRef {
  author: string;
  url: string;
  tool?: string;
  notes?: Partial<LocalizedText>;
}

export interface Team {
  id: string;
  mainCharacterId: string;
  teamDps: number;
  rotationTime?: number;
  patch: string;
  ref: BenchmarkRef;
  rotation?: string;
  notes?: Partial<LocalizedText>;
  isObsolete: boolean;
  isBaseline: boolean;
  members: TeamMember[];
}

// data/teams/<characterId>.json — times ordenados por DPS do time, do maior para o menor
export interface CharacterTeams {
  characterId: string;
  teams: Team[];
}

export const INVESTMENT_FILTERS = ['baseline', 'all'] as const;
export type InvestmentFilter = (typeof INVESTMENT_FILTERS)[number];

// data/ranking.json — melhor time de cada DPS principal, por filtro de investimento
export type Ranking = Record<InvestmentFilter, Team[]>;

const DATA_DIRECTORY = 'data';
const TEAMS_DIRECTORY = `${DATA_DIRECTORY}/teams`;
const ICON_DIRECTORY = 'images';

export const SITE_DATA_PATHS = {
  dataDirectory: DATA_DIRECTORY,
  catalog: `${DATA_DIRECTORY}/catalog.json`,
  ranking: `${DATA_DIRECTORY}/ranking.json`,
  teamsDirectory: TEAMS_DIRECTORY,
  characterTeams: (characterId: string) => `${TEAMS_DIRECTORY}/${characterId}.json`,
  // Ícones baixados do CDN da Enka e convertidos para WebP por `bun run images`
  iconDirectory: ICON_DIRECTORY,
  icon: (icon: string) => `${ICON_DIRECTORY}/${icon}.webp`,
} as const;
