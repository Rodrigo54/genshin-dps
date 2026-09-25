// Formato das tabelas do jogo (Dimbreath/animegamedata2) usadas para gerar data/characters. Só os campos lidos.

export type TextMap = Record<string, string>;

export interface AvatarRow {
  id: number;
  nameTextMapHash: number;
  iconName: string;
  qualityType: string;
  weaponType: string;
  avatarPromoteId: number;
  hpBase: number;
  attackBase: number;
  defenseBase: number;
  critical: number;
  criticalHurt: number;
  propGrowCurves: { type: string; growCurve: string }[];
}

// Perfil (aba Perfil do jogo). Alguns campos vêm com nome ofuscado: ver FETTER_OBFUSCATED_FIELDS
export interface FetterRow {
  avatarId: number;
  avatarAssocType: string;
  avatarTitleTextMapHash: number;
  avatarDetailTextMapHash: number;
  avatarNativeTextMapHash: number;
  avatarVisionBeforTextMapHash: number;
  avatarConstellationBeforTextMapHash: number;
  avatarConstellationAfterTextMapHash?: number;
  finishConds?: { condType?: string }[];
  [obfuscatedField: string]: unknown;
}

export interface CurveRow {
  level: number;
  curveInfos: { type: string; value: number }[];
}

export interface PromoteRow {
  avatarPromoteId: number;
  unlockMaxLevel: number;
  addProps?: { propType: string; value?: number }[];
}

export interface CodexRow {
  avatarId: number;
  beginTime?: string;
}

export interface CityRow {
  cityId: number;
  cityNameTextMapHash: number;
}

// Textos de interface por id legível (ex.: WEAPON_POLE, FIGHT_PROP_CRITICAL_HURT)
export interface ManualTextRow {
  textMapId: string;
  textMapContentTextMapHash: number;
}

export interface GameTables {
  avatars: AvatarRow[];
  fetters: FetterRow[];
  curves: CurveRow[];
  promotes: PromoteRow[];
  codex: CodexRow[];
  cities: CityRow[];
  manualTexts: ManualTextRow[];
  textMaps: { pt: TextMap; en: TextMap };
}
