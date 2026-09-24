import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { type LocalizedText } from '@genshin-dps/schema/site-data';
import { TranslocoPipe } from '@jsverse/transloco';
import { injectActiveLocale } from '../../core/i18n/active-locale';
import { toNotesView } from '../format/localized-notes';

// Nota no idioma ativo ou, se só existe no outro, o original com o selo "original em X"
@Component({
  selector: 'app-localized-notes-text',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe],
  template: `
    @if (view(); as view) {
      <p class="text-sm" [attr.lang]="view.originalLocale ?? null">{{ view.text }}</p>
      @if (view.originalLocale) {
        <p class="mt-1 text-xs text-ink-muted">
          {{ 'team.originalIn' | transloco: { language: ('language.' + view.originalLocale | transloco) } }}
        </p>
      }
    }
  `,
})
export class LocalizedNotesText {
  readonly notes = input.required<Partial<LocalizedText>>();
  private readonly locale = injectActiveLocale();

  protected readonly view = computed(() => toNotesView(this.notes(), this.locale()));
}
