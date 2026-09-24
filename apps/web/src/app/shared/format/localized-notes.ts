import { LOCALES, type Locale, type LocalizedText } from '@genshin-dps/schema/site-data';

export interface NotesView {
  text: string;
  // Presente quando o texto veio de outro idioma (selo "original em X")
  originalLocale?: Locale;
}

export function toNotesView(notes: Partial<LocalizedText>, locale: Locale): NotesView | undefined {
  const ownText = notes[locale];
  if (ownText) return { text: ownText };
  for (const originalLocale of LOCALES) {
    const text = notes[originalLocale];
    if (text) return { text, originalLocale };
  }
  return undefined;
}
