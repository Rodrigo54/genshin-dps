import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { type Translation, type TranslocoLoader } from '@jsverse/transloco';

// URL absoluta a partir da raiz: funciona em qualquer rota e no prerender, que lê os assets do build
@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);

  getTranslation(locale: string) {
    return this.http.get<Translation>(`/i18n/${locale}.json`);
  }
}
