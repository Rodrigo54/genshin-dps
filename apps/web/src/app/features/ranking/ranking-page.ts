import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { type InvestmentFilter } from '@genshin-dps/schema/site-data';
import { TranslocoPipe } from '@jsverse/transloco';
import { SiteData } from '../../core/data/site-data';
import { injectActiveLocale } from '../../core/i18n/active-locale';
import { injectTranslate } from '../../core/i18n/translate';
import { syncPageMeta } from '../../core/seo/page-meta-effect';
import { LocalizePipe } from '../../shared/format/localize.pipe';
import { SecondsPipe, TeamDpsPipe } from '../../shared/format/number-format.pipes';
import { elementTextColor } from '../../shared/ui/game-colors';
import { InvestmentToggle } from '../../shared/ui/investment-toggle';
import { LoadStatus } from '../../shared/ui/load-status';
import { TeamMembers } from '../../shared/ui/team-members';
import { rankingFrameColor } from './ranking-frame';
import { RankingPosition } from './ranking-position';

// Home: o melhor time de cada DPS principal dentro do filtro de investimento
@Component({
  selector: 'app-ranking-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    TranslocoPipe,
    LocalizePipe,
    TeamDpsPipe,
    SecondsPipe,
    InvestmentToggle,
    LoadStatus,
    TeamMembers,
    RankingPosition,
  ],
  template: `
    <section class="rounded-2xl bg-night px-4 py-6 sm:px-8 sm:py-8">
      <header class="mb-8 flex flex-wrap items-start justify-between gap-6">
        <div>
          <p class="font-display text-sm tracking-[0.4em] text-ink-muted uppercase">{{ 'site.name' | transloco }}</p>
          <h1 class="mt-1 font-display text-4xl font-bold tracking-wide uppercase sm:text-5xl">
            {{ 'ranking.title' | transloco }}
          </h1>
          <p class="mt-2 max-w-md text-sm text-ink-muted">{{ 'ranking.description' | transloco }}</p>
        </div>
        <div class="flex max-w-sm flex-col gap-3 text-sm">
          <app-investment-toggle [locale]="locale()" [filter]="filter()" />
          <div>
            <h2 class="font-display font-semibold">{{ 'ranking.criteriaTitle' | transloco }}</h2>
            <ul class="mt-1 list-disc ps-5 text-ink-muted">
              <li>{{ 'ranking.criteriaSources' | transloco }}</li>
              <li>{{ 'ranking.criteriaMetric' | transloco }}</li>
              <li>{{ (filter() === 'baseline' ? 'investment.baselineHint' : 'ranking.criteriaAll') | transloco }}</li>
            </ul>
          </div>
        </div>
      </header>

      @if (siteData.catalog.hasValue() && siteData.ranking.hasValue()) {
        @let catalog = siteData.catalog.value();
        @let teams = siteData.ranking.value()[filter()];
        @if (teams.length === 0) {
          <p class="text-ink-muted">{{ 'ranking.empty' | transloco }}</p>
        } @else {
          <ol class="flex flex-col gap-4">
            @for (team of teams; track team.id; let index = $index) {
              @let main = catalog.characters[team.mainCharacterId];
              @let mainElement = team.members[0].element;
              @let position = index + 1;
              <li
                class="ranking-frame grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3 rounded-xl bg-surface/85 px-3
                  py-3 sm:grid-cols-[auto_auto_1fr] sm:px-5 {{ rankingFrameColor(position, mainElement) }}"
              >
                <app-ranking-position class="row-span-2 sm:row-span-1" [position]="position" />
                <app-team-members size="lg" [members]="team.members" [catalog]="catalog" />
                <div class="flex flex-col sm:items-end sm:text-right">
                  <a
                    class="font-display text-2xl font-bold tabular-nums hover:text-accent sm:text-3xl"
                    [routerLink]="['/', locale(), 'characters', main.id, 'teams', team.id]"
                    [attr.title]="'team.details' | transloco"
                  >
                    {{ 'ranking.teamDpsValue' | transloco: { value: (team.teamDps | teamDps: locale()) } }}
                  </a>
                  @if (team.rotationTime !== undefined) {
                    <span class="font-display text-lg text-ink-muted tabular-nums sm:text-xl">
                      ({{ team.rotationTime | seconds: locale() }})
                    </span>
                  }
                  <a
                    class="text-sm font-semibold hover:underline {{ elementTextColor(mainElement) }}"
                    [routerLink]="['/', locale(), 'characters', main.id]"
                  >
                    {{ main.name | localize: locale() }}
                  </a>
                </div>
              </li>
            }
          </ol>
        }
      } @else {
        <app-load-status [status]="hasError() ? 'error' : 'loading'" />
      }
    </section>
  `,
})
export class RankingPage {
  readonly filter = input.required<InvestmentFilter>();

  protected readonly siteData = inject(SiteData);
  protected readonly locale = injectActiveLocale();
  protected readonly elementTextColor = elementTextColor;
  protected readonly rankingFrameColor = rankingFrameColor;
  protected readonly hasError = computed(() => !!(this.siteData.catalog.error() || this.siteData.ranking.error()));

  constructor() {
    const translate = injectTranslate();
    syncPageMeta(() => ({ title: translate('ranking.title'), description: translate('ranking.description') }));
  }
}
