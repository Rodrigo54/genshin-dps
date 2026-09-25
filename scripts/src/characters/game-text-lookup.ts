import { type LocalizedText } from '@genshin-dps/schema';
import { type GameTables, type ManualTextRow } from './game-tables';

// Texto com as duas formas de gênero ("#{F#Uma}{M#Um} Viajante"): fica a masculina, a do Aether
const GENDER_MARKUP_PREFIX = /^#/;
const MALE_VARIANT = /\{M#([^}]*)\}/g;
const FEMALE_VARIANT = /\{F#[^}]*\}/g;

function resolveGenderMarkup(text: string): string {
  if (!GENDER_MARKUP_PREFIX.test(text)) return text;
  return text.replace(GENDER_MARKUP_PREFIX, '').replace(MALE_VARIANT, '$1').replace(FEMALE_VARIANT, '');
}

export interface GameTextLookup {
  // Texto obrigatório nos dois idiomas
  read(hash: unknown, context: string): LocalizedText;
  // Texto que pode não existir: ausente nos dois idiomas dá undefined, ausente em só um quebra
  find(hash: unknown, context: string): LocalizedText | undefined;
  // Texto de interface pelo id legível (ex.: WEAPON_POLE)
  readManual(textMapId: string): LocalizedText;
}

export function createGameTextLookup({ textMaps, manualTexts }: Pick<GameTables, 'textMaps' | 'manualTexts'>) {
  const manualHashById = new Map(
    manualTexts.map((row: ManualTextRow) => [row.textMapId, row.textMapContentTextMapHash]),
  );

  const find = (hash: unknown, context: string): LocalizedText | undefined => {
    if (typeof hash !== 'number') return undefined;
    const pt = textMaps.pt[String(hash)];
    const en = textMaps.en[String(hash)];
    if (!pt && !en) return undefined;
    if (!pt || !en) throw new Error(`texto ${hash} existe em só um idioma (${context})`);
    return { pt: resolveGenderMarkup(pt), en: resolveGenderMarkup(en) };
  };

  const read = (hash: unknown, context: string): LocalizedText => {
    const text = find(hash, context);
    if (!text) throw new Error(`texto ${String(hash)} ausente no TextMap (${context})`);
    return text;
  };

  const readManual = (textMapId: string): LocalizedText =>
    read(manualHashById.get(textMapId), `texto de interface ${textMapId}`);

  return { read, find, readManual } satisfies GameTextLookup;
}
