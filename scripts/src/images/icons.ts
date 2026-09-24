import { join } from 'node:path';
import { type Catalog, ELEMENT_ICONS, SITE_DATA_PATHS } from '@genshin-dps/schema';

const ENKA_UI_BASE_URL = 'https://enka.network/ui';
// A Enka não serve o ícone de Cryo; os de elemento vêm do Project Amber, que espelha os mesmos arquivos do jogo
const AMBER_UI_BASE_URL = 'https://gi.yatta.moe/assets/UI';
const ELEMENT_ICON_NAMES: ReadonlySet<string> = new Set(Object.values(ELEMENT_ICONS));

export function collectIcons(catalog: Catalog): string[] {
  const entries = [...Object.values(catalog.characters), ...Object.values(catalog.weapons)];
  // Os 7 ícones de elemento vão sempre: o da Viajante depende da build de cada time, não do catálogo
  return [...new Set([...entries.map((entry) => entry.icon), ...ELEMENT_ICON_NAMES])].sort();
}

export function toIconSourceUrl(icon: string): string {
  const baseUrl = ELEMENT_ICON_NAMES.has(icon) ? AMBER_UI_BASE_URL : ENKA_UI_BASE_URL;
  return `${baseUrl}/${icon}.png`;
}

export function toIconOutputPath(publicDirectory: string, icon: string): string {
  return join(publicDirectory, SITE_DATA_PATHS.icon(icon));
}
