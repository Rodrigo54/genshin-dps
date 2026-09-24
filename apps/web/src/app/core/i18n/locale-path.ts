import { type Locale } from '@genshin-dps/schema/site-data';
import { isLocale } from './locale';

export interface LocalePath {
  locale?: Locale;
  // Caminho sem o prefixo de idioma, sem query/fragment; "/" para a home
  path: string;
}

export function splitLocalePath(url: string): LocalePath {
  const [pathname = ''] = url.split(/[?#]/);
  const [first, ...rest] = pathname.split('/').filter(Boolean);
  if (!isLocale(first)) return { path: pathname || '/' };
  return { locale: first, path: `/${rest.join('/')}` };
}

export function toLocalizedPath(locale: Locale, path: string): string {
  return path === '/' ? `/${locale}` : `/${locale}${path}`;
}
