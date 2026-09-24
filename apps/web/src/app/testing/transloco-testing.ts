import { TranslocoTestingModule } from '@jsverse/transloco';
import en from '../../../public/i18n/en.json';
import pt from '../../../public/i18n/pt.json';

// Traduções reais nos testes: um texto quebrado aparece como falha, não como chave
export function provideTranslocoForTests() {
  return TranslocoTestingModule.forRoot({
    langs: { pt, en },
    translocoConfig: { availableLangs: ['pt', 'en'], defaultLang: 'pt' },
    preloadLangs: true,
  });
}
