import { type VisionLabels } from '@genshin-dps/schema';
import { toSlug } from '../catalog/slug';

// Campos da FetterInfoExcelConfigData com o rótulo da aba Perfil. Os nomes vêm ofuscados e podem mudar a cada
// versão do jogo: o "antes" é o rótulo inicial e o "depois", o que a história revela (ex.: Furina: ??? → Visão).
// Todo personagem tem os dois campos; sem rótulo, o hash aponta para um texto que não existe no TextMap.
export const VISION_LABEL_FIELDS = { before: 'LCHFJFOMFGA', after: 'AAEINBDNBHL' } as const;

export interface FetterRow {
  avatarId: number;
  [field: string]: unknown;
}

export interface AvatarRow {
  id: number;
  nameTextMapHash: number;
}

export type TextMap = Record<string, string>;

export interface GameData {
  fetters: FetterRow[];
  avatars: AvatarRow[];
  textMaps: { pt: TextMap; en: TextMap };
}

function readHash(row: FetterRow, field: string): number | undefined {
  const value = row[field];
  return typeof value === 'number' ? value : undefined;
}

function translate(textMap: TextMap, hash: number, context: string): string {
  const text = textMap[String(hash)];
  if (!text) throw new Error(`texto ${hash} ausente no TextMap (${context})`);
  return text;
}

function hasText({ pt, en }: GameData['textMaps'], hash: number | undefined): hash is number {
  return hash !== undefined && Boolean(pt[String(hash)] || en[String(hash)]);
}

// Vale sempre o último rótulo com texto: o revelado pela história, ou o inicial quando não há revelação
function findLabelHash(row: FetterRow, textMaps: GameData['textMaps']): number | undefined {
  return [VISION_LABEL_FIELDS.after, VISION_LABEL_FIELDS.before]
    .map((field) => readHash(row, field))
    .find((hash) => hasText(textMaps, hash));
}

function assertLabelFieldsExist(fetters: FetterRow[]): void {
  const fields = Object.values(VISION_LABEL_FIELDS);
  if (!fetters.some((row) => fields.some((field) => field in row))) {
    throw new Error(
      `nenhum personagem tem os campos ${fields.join(' / ')}: o jogo deve ter renomeado os campos ofuscados`,
    );
  }
}

// Só entra quem tem rótulo próprio; o id é o slug do nome em inglês, como no catálogo
export function extractVisionLabels({ fetters, avatars, textMaps }: GameData): VisionLabels {
  assertLabelFieldsExist(fetters);
  const nameHashById = new Map(avatars.map((avatar) => [avatar.id, avatar.nameTextMapHash]));
  const labels: VisionLabels = {};
  fetters.forEach((row) => {
    const labelHash = findLabelHash(row, textMaps);
    const nameHash = nameHashById.get(row.avatarId);
    if (labelHash === undefined || nameHash === undefined) return;
    const id = toSlug(translate(textMaps.en, nameHash, `nome do personagem ${row.avatarId}`));
    if (id in labels) return;
    const context = `rótulo de ${id}`;
    labels[id] = { pt: translate(textMaps.pt, labelHash, context), en: translate(textMaps.en, labelHash, context) };
  });
  if (Object.keys(labels).length === 0) {
    throw new Error('nenhum rótulo com texto: os campos ofuscados devem ter trocado de significado');
  }
  return Object.fromEntries(Object.entries(labels).sort(([a], [b]) => a.localeCompare(b)));
}
