import { computed, inject, type Signal } from '@angular/core';
import { type Locale } from '@genshin-dps/schema/site-data';
import { TranslocoService } from '@jsverse/transloco';

// activeLang só recebe idiomas validados por matchSupportedLocale
export function injectActiveLocale(): Signal<Locale> {
  const transloco = inject(TranslocoService);
  return computed(() => transloco.activeLang() as Locale);
}
