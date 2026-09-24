import { inject } from '@angular/core';
import { type CanMatchFn, type ResolveFn } from '@angular/router';
import { type Translation, TranslocoService } from '@jsverse/transloco';
import { tap } from 'rxjs';
import { isLocale } from './locale';

export const LOCALE_PARAM = 'lang';

// Só casa a rota /:lang quando o segmento é um idioma suportado (/pt, /en)
export const matchSupportedLocale: CanMatchFn = (_route, segments) => isLocale(segments[0]?.path);

// Carrega as traduções do idioma da URL e só então o ativa: a rota não renderiza antes disso,
// então o HTML prerenderizado nunca sai com chaves no lugar do texto
export const activateRouteLocale: ResolveFn<Translation> = (route) => {
  const transloco = inject(TranslocoService);
  const locale = route.paramMap.get(LOCALE_PARAM) ?? '';
  return transloco.load(locale).pipe(tap(() => transloco.setActiveLang(locale)));
};
