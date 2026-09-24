import { readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { SITE_DATA_PATHS } from '@genshin-dps/schema';
import sharp from 'sharp';
import { toIconOutputPath, toIconSourceUrl } from './icons';

// Ícones aparecem em até ~64px na tela; 128px cobre telas 2x
const ICON_SIZE = 128;
const WEBP_QUALITY = 85;
const CONCURRENT_DOWNLOADS = 8;

export class IconDownloadError extends Error {
  constructor(url: string, status: number) {
    super(`Falha ao baixar ${url} (HTTP ${status})`);
    this.name = 'IconDownloadError';
  }
}

async function downloadIcon(publicDirectory: string, icon: string): Promise<void> {
  const url = toIconSourceUrl(icon);
  const response = await fetch(url);
  if (!response.ok) throw new IconDownloadError(url, response.status);
  const webp = await sharp(await response.arrayBuffer())
    .resize(ICON_SIZE, ICON_SIZE, { fit: 'inside' })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
  await Bun.write(toIconOutputPath(publicDirectory, icon), webp);
}

export async function findMissingIcons(publicDirectory: string, icons: string[]): Promise<string[]> {
  const exists = await Promise.all(icons.map((icon) => Bun.file(toIconOutputPath(publicDirectory, icon)).exists()));
  return icons.filter((_, position) => !exists[position]);
}

// Baixa em lotes para não disparar centenas de requisições simultâneas no CDN da Enka
export async function downloadIcons(publicDirectory: string, icons: string[]): Promise<void> {
  for (let start = 0; start < icons.length; start += CONCURRENT_DOWNLOADS) {
    const batch = icons.slice(start, start + CONCURRENT_DOWNLOADS);
    await Promise.all(batch.map((icon) => downloadIcon(publicDirectory, icon)));
  }
}

// Ícones que saíram do catálogo; sem remover, o cache do CI acumularia arquivos publicados à toa
export async function findUnusedIconFiles(publicDirectory: string, icons: string[]): Promise<string[]> {
  const iconDirectory = join(publicDirectory, SITE_DATA_PATHS.iconDirectory);
  const usedPaths = new Set(icons.map((icon) => toIconOutputPath(publicDirectory, icon)));
  const existingFiles = await readdir(iconDirectory).catch(() => []);
  return existingFiles.map((file) => join(iconDirectory, file)).filter((path) => !usedPaths.has(path));
}

export async function removeFiles(paths: string[]): Promise<void> {
  await Promise.all(paths.map((path) => rm(path)));
}
