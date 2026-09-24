import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { injectActiveLocale } from '../../core/i18n/active-locale';
import { injectTranslate } from '../../core/i18n/translate';
import { syncPageMeta } from '../../core/seo/page-meta-effect';

@Component({
  selector: 'app-not-found-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslocoPipe],
  template: `
    <h1 class="mb-4 text-2xl font-bold">{{ 'notFound.title' | transloco }}</h1>
    <a class="text-accent hover:underline" [routerLink]="['/', locale()]">{{ 'notFound.backHome' | transloco }}</a>
  `,
})
export class NotFoundPage {
  protected readonly locale = injectActiveLocale();

  constructor() {
    const translate = injectTranslate();
    syncPageMeta(() => ({ title: translate('notFound.title'), description: translate('site.description') }));
  }
}
