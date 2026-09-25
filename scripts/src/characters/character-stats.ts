import { CHARACTER_LEVELS, type CharacterFile } from '@genshin-dps/schema';
import { roundStat } from '../catalog/round-stat';
import { type AvatarRow, type CurveRow, type PromoteRow } from './game-tables';

// Nível máximo por ascensão: o bônus dessa fase vale também para 95 e 100
const LAST_ASCENSION_MAX_LEVEL = 90;
const FLAT_ASCENSION_STAT = 'FIGHT_PROP_ELEMENT_MASTERY';
const BASE_STAT_PROPS = {
  hp: 'FIGHT_PROP_BASE_HP',
  atk: 'FIGHT_PROP_BASE_ATTACK',
  def: 'FIGHT_PROP_BASE_DEFENSE',
} as const;
const BASE_STAT_PROP_TYPES = new Set<string>(Object.values(BASE_STAT_PROPS));

export interface StatTables {
  curves: CurveRow[];
  promotes: PromoteRow[];
}

export interface AscensionStatType {
  propType: string;
  isPercent: boolean;
}

function findLastAscension(avatar: AvatarRow, promotes: PromoteRow[]): PromoteRow {
  const ascension = promotes.find(
    (row) => row.avatarPromoteId === avatar.avatarPromoteId && row.unlockMaxLevel === LAST_ASCENSION_MAX_LEVEL,
  );
  if (!ascension) throw new Error(`personagem ${avatar.id} sem a ascensão do nível ${LAST_ASCENSION_MAX_LEVEL}`);
  return ascension;
}

function readAddProp(ascension: PromoteRow, propType: string): number {
  return ascension.addProps?.find((prop) => prop.propType === propType)?.value ?? 0;
}

function readCurve(curves: CurveRow[], level: number, curveType: string): number {
  const value = curves.find((row) => row.level === level)?.curveInfos.find((info) => info.type === curveType)?.value;
  if (value === undefined) throw new Error(`curva ${curveType} sem o nível ${level}`);
  return value;
}

// O atributo de ascensão é o único bônus da ascensão que não é Vida, ATQ ou DEF base
export function findAscensionStatType(avatar: AvatarRow, promotes: PromoteRow[]): AscensionStatType {
  const prop = findLastAscension(avatar, promotes).addProps?.find(
    ({ propType }) => !BASE_STAT_PROP_TYPES.has(propType),
  );
  if (!prop) throw new Error(`personagem ${avatar.id} sem atributo de ascensão`);
  return { propType: prop.propType, isPercent: prop.propType !== FLAT_ASCENSION_STAT };
}

// Taxa e Dano Crítico somam o valor base do personagem, como a ficha do jogo e o genshin-db mostram (5% e 50%)
function readAscensionStatBase(avatar: AvatarRow, propType: string): number {
  if (propType === 'FIGHT_PROP_CRITICAL') return avatar.critical;
  if (propType === 'FIGHT_PROP_CRITICAL_HURT') return avatar.criticalHurt;
  return 0;
}

function computeBaseStat(avatar: AvatarRow, tables: StatTables, level: number, prop: string, base: number): number {
  const curveType = avatar.propGrowCurves.find(({ type }) => type === prop)?.growCurve;
  if (!curveType) throw new Error(`personagem ${avatar.id} sem curva para ${prop}`);
  const ascensionBonus = readAddProp(findLastAscension(avatar, tables.promotes), prop);
  return Math.round(base * readCurve(tables.curves, level, curveType) + ascensionBonus);
}

// Status base em cada nível de CHARACTER_LEVELS: base × curva do nível + bônus da última ascensão
export function computeCharacterStats(avatar: AvatarRow, tables: StatTables): CharacterFile['stats'] {
  const { propType, isPercent } = findAscensionStatType(avatar, tables.promotes);
  const ascension = findLastAscension(avatar, tables.promotes);
  const ascensionStat = roundStat(
    readAscensionStatBase(avatar, propType) + readAddProp(ascension, propType),
    isPercent,
  );
  return CHARACTER_LEVELS.map((level) => ({
    level,
    hp: computeBaseStat(avatar, tables, level, BASE_STAT_PROPS.hp, avatar.hpBase),
    atk: computeBaseStat(avatar, tables, level, BASE_STAT_PROPS.atk, avatar.attackBase),
    def: computeBaseStat(avatar, tables, level, BASE_STAT_PROPS.def, avatar.defenseBase),
    ascensionStat,
  }));
}
