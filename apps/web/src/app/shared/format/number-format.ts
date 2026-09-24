import {
  FLAT_WEAPON_SUBSTAT,
  type Locale,
  type MemberStats,
  type WeaponSubstatType,
} from '@genshin-dps/schema/site-data';
import { LOCALE_TAGS } from '../../core/i18n/locale';

const THOUSAND = 1000;

// 252000 → "252,0K" (pt) / "252.0K" (en), como nas tabelas de benchmark da comunidade
export function formatTeamDps(teamDps: number, locale: Locale): string {
  const thousands = new Intl.NumberFormat(LOCALE_TAGS[locale], { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return `${thousands.format(teamDps / THOUSAND)}K`;
}

// 19.37 → "19,37s" (pt) / "19.37s" (en); sufixo fixo porque o estilo "unit" do Intl põe espaço no pt-BR
export function formatSeconds(seconds: number, locale: Locale): string {
  return `${new Intl.NumberFormat(LOCALE_TAGS[locale], { maximumFractionDigits: 2 }).format(seconds)}s`;
}

const PERCENT_STATS = new Set<keyof MemberStats>(['energyRecharge', 'critRate', 'critDamage']);

// Valor plano inteiro: 608 → "608", 1234 → "1.234" (pt)
export function formatFlatStat(value: number, locale: Locale): string {
  return new Intl.NumberFormat(LOCALE_TAGS[locale], { maximumFractionDigits: 0 }).format(value);
}

// Taxa em porcentagem com uma casa: 66.2 → "66,2%" (pt) / "66.2%" (en)
function formatPercentStat(value: number, locale: Locale): string {
  const percent = new Intl.NumberFormat(LOCALE_TAGS[locale], { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return `${percent.format(value)}%`;
}

// Atributos de ficha: taxas em porcentagem com uma casa, valores planos inteiros
export function formatStat(stat: keyof MemberStats, value: number, locale: Locale): string {
  return PERCENT_STATS.has(stat) ? formatPercentStat(value, locale) : formatFlatStat(value, locale);
}

// Secundário da arma: só a Proficiência Elemental é plana
export function formatWeaponSubstat(type: WeaponSubstatType, value: number, locale: Locale): string {
  return type === FLAT_WEAPON_SUBSTAT ? formatFlatStat(value, locale) : formatPercentStat(value, locale);
}
