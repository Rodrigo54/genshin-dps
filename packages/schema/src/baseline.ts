import type { CharacterRarity, WeaponRarity } from './site-data';

const FIVE_STAR = 5;
const MAX_CONSTELLATION = 6;
const BASELINE_FIVE_STAR_CONSTELLATION = 0;
const BASELINE_FIVE_STAR_REFINEMENT = 1;

// Evento fixo "Controlar-se e Viajar Para Longe" (EN: "To Temper Thyself and Journey Far", JP: 鍛錬の道):
// dá de graça a C1 de um destes 5★ limitados
const TRAINING_EVENT_CONSTELLATION = 1;
const TRAINING_EVENT_CHARACTER_IDS: ReadonlySet<string> = new Set([
  'albedo',
  'wanderer',
  'arataki-itto',
  'baizhu',
  'chiori',
  'clorinde',
  'cyno',
  'dehya',
  'diluc',
  'emilie',
  'eula',
  'ganyu',
  'hu-tao',
  'jean',
  'kamisato-ayaka',
  'kamisato-ayato',
  'keqing',
  'klee',
  'lyney',
  'mona',
  'navia',
  'nilou',
  'qiqi',
  'sangonomiya-kokomi',
  'shenhe',
  'sigewinne',
  'tighnari',
  'wriothesley',
  'xianyun',
  'xiao',
  'yae-miko',
  'yoimiya',
  'yumemizuki-mizuki',
]);

// As constelações da Viajante vêm da história, então todas são gratuitas
const TRAVELER_ID = 'traveler';

// Armas 5★ dadas de graça, que qualquer um tem em R5
const FREE_FIVE_STAR_WEAPON_IDS: ReadonlySet<string> = new Set(['exaiphanes-blade']);

export interface BaselineWeapon {
  weaponId: string;
  rarity: WeaponRarity;
  refinement: number;
}

export interface BaselineMember {
  characterId: string;
  characterRarity: CharacterRarity;
  constellation: number;
  // Ausente quando a fonte não informou a arma do suporte
  weapon?: BaselineWeapon;
}

// Maior constelação que qualquer jogador alcança sem gastar em gacha
function getFreeConstellationCap(member: BaselineMember): number {
  if (member.characterRarity < FIVE_STAR || member.characterId === TRAVELER_ID) return MAX_CONSTELLATION;
  if (TRAINING_EVENT_CHARACTER_IDS.has(member.characterId)) return TRAINING_EVENT_CONSTELLATION;
  return BASELINE_FIVE_STAR_CONSTELLATION;
}

function isWeaponWithinBaseline(weapon: BaselineWeapon): boolean {
  return (
    weapon.rarity < FIVE_STAR ||
    weapon.refinement <= BASELINE_FIVE_STAR_REFINEMENT ||
    FREE_FIVE_STAR_WEAPON_IDS.has(weapon.weaponId)
  );
}

// Baseline é um teto de investimento: 5★ até C0 com arma 5★ até R1, mais o que o jogo dá de graça
// (C1 do evento de treino, constelações da Viajante e armas 5★ gratuitas).
// 4★ em C6 e armas 4★/3★ em R5 são o máximo do jogo, então nunca estouram o teto.
// Arma ausente não estoura o teto: a fonte já limita cada time a uma R1 ou uma C1.
export function isBaselineMember(member: BaselineMember): boolean {
  const isWeaponOk = member.weapon === undefined || isWeaponWithinBaseline(member.weapon);
  return member.constellation <= getFreeConstellationCap(member) && isWeaponOk;
}

export function isBaselineTeam(members: readonly BaselineMember[]): boolean {
  return members.every(isBaselineMember);
}
