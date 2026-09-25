import { type CharacterFile } from '@genshin-dps/schema';
import { type FetterRow } from './game-tables';
import { type GameTextLookup } from './game-text-lookup';

// Campos da FetterInfo com nome ofuscado, que podem mudar a cada versão do jogo. Sem rótulo próprio, o hash do
// rótulo aponta para um texto que não existe no TextMap.
export const FETTER_OBFUSCATED_FIELDS = {
  visionLabelBefore: 'LCHFJFOMFGA',
  visionLabelAfter: 'AAEINBDNBHL',
  affiliationAfter: 'PNIAJCCODBA',
} as const;

// Rótulos padrão da aba Perfil, antes e depois da revelação da história (Visão → Gnosis nos Arcontes)
const DEFAULT_VISION_LABEL = { before: 'UI_STC_FETTER_VISION_BEFORE', after: 'UI_STC_FETTER_VISION_AFTER' } as const;
const PROFILE_ALWAYS_OPEN = 'FETTER_COND_NOT_OPEN';

// Quem tem uma condição de desbloqueio no perfil (missão, nível) muda de textos depois da revelação da história
export function hasRevealedProfile(fetter: FetterRow): boolean {
  const condType = fetter.finishConds?.[0]?.condType;
  return condType !== undefined && condType !== PROFILE_ALWAYS_OPEN;
}

export function assertObfuscatedFieldsExist(fetters: FetterRow[]): void {
  const missing = Object.values(FETTER_OBFUSCATED_FIELDS).filter((field) => !fetters.some((row) => field in row));
  if (missing.length > 0) {
    throw new Error(`nenhum perfil tem os campos ${missing.join(', ')}: o jogo deve ter renomeado os campos ofuscados`);
  }
}

// Vale sempre o estado depois da revelação: o texto revelado, ou o inicial quando o revelado não existe
function readRevealedText(texts: GameTextLookup, fetter: FetterRow, fields: { before: unknown; after: unknown }) {
  const context = `perfil de ${fetter.avatarId}`;
  const before = texts.find(fields.before, context);
  return hasRevealedProfile(fetter) ? (texts.find(fields.after, context) ?? before) : before;
}

function readVisionLabel(texts: GameTextLookup, fetter: FetterRow): CharacterFile['profile']['visionLabel'] {
  const context = `rótulo do perfil de ${fetter.avatarId}`;
  const { visionLabelBefore, visionLabelAfter } = FETTER_OBFUSCATED_FIELDS;
  if (hasRevealedProfile(fetter)) {
    return texts.find(fetter[visionLabelAfter], context) ?? texts.readManual(DEFAULT_VISION_LABEL.after);
  }
  return texts.find(fetter[visionLabelBefore], context) ?? texts.readManual(DEFAULT_VISION_LABEL.before);
}

export function readProfile(texts: GameTextLookup, fetter: FetterRow): CharacterFile['profile'] {
  const context = `perfil de ${fetter.avatarId}`;
  const constellation = readRevealedText(texts, fetter, {
    before: fetter.avatarConstellationBeforTextMapHash,
    after: fetter.avatarConstellationAfterTextMapHash,
  });
  if (!constellation) throw new Error(`constelação ausente no ${context}`);
  const title = texts.find(fetter.avatarTitleTextMapHash, context);
  const affiliation = readRevealedText(texts, fetter, {
    before: fetter.avatarNativeTextMapHash,
    after: fetter[FETTER_OBFUSCATED_FIELDS.affiliationAfter],
  });
  return {
    ...(title && { title }),
    constellation,
    visionLabel: readVisionLabel(texts, fetter),
    ...(affiliation && { affiliation }),
    description: texts.read(fetter.avatarDetailTextMapHash, context),
  };
}
