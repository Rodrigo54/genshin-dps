import { LOCALES, type Locale } from '@genshin-dps/schema/site-data';

export const DEFAULT_LOCALE: Locale = 'pt';

// Tag usada no <html lang>, no hreflang e na formatação de números
export const LOCALE_TAGS: Record<Locale, string> = { pt: 'pt-BR', en: 'en' };

export function isLocale(value: string | undefined): value is Locale {
  return LOCALES.some((locale) => locale === value);
}
