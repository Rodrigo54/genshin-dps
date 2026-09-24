import { inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

export type TranslationParams = Record<string, string | number>;

// Tradução síncrona que registra dependência do idioma ativo dentro de computed/effect
export function injectTranslate(): (key: string, params?: TranslationParams) => string {
  const transloco = inject(TranslocoService);
  return (key, params) => {
    transloco.activeLang();
    return transloco.translate(key, params);
  };
}
