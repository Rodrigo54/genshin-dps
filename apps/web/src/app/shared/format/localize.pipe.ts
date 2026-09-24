import { Pipe, type PipeTransform } from '@angular/core';
import { type Locale, type LocalizedText } from '@genshin-dps/schema/site-data';

// Nome do catálogo no idioma ativo: {{ character.name | localize: locale() }}
@Pipe({ name: 'localize' })
export class LocalizePipe implements PipeTransform {
  transform(text: LocalizedText, locale: Locale): string {
    return text[locale];
  }
}
