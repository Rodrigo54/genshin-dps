import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { injectTranslate } from '../../core/i18n/translate';
import { syncPageMeta } from '../../core/seo/page-meta-effect';

const SECTIONS = ['methodology', 'baseline', 'credits'] as const;

@Component({
  selector: 'app-about-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe],
  template: `
    <h1 class="mb-6 text-2xl font-bold">{{ 'about.title' | transloco }}</h1>
    <div class="flex max-w-prose flex-col gap-6">
      @for (section of sections; track section) {
        <section>
          <h2 class="mb-2 text-lg font-semibold">{{ 'about.' + section + 'Title' | transloco }}</h2>
          <p class="text-sm leading-6 text-ink-muted">{{ 'about.' + section | transloco }}</p>
        </section>
      }
      <p class="text-xs text-ink-muted">{{ 'about.fanContent' | transloco }}</p>
    </div>
  `,
})
export class AboutPage {
  protected readonly sections = SECTIONS;

  constructor() {
    const translate = injectTranslate();
    syncPageMeta(() => ({ title: translate('about.title'), description: translate('about.description') }));
  }
}
