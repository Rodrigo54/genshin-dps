import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { injectCharacterTeams, SiteData } from '../../core/data/site-data';
import { injectActiveLocale } from '../../core/i18n/active-locale';
import { injectTranslate } from '../../core/i18n/translate';
import { syncPageMeta } from '../../core/seo/page-meta-effect';
import { SecondsPipe, TeamDpsPipe } from '../../shared/format/number-format.pipes';
import { LoadStatus } from '../../shared/ui/load-status';
import { TeamBadges } from '../../shared/ui/team-badges';
import { TeamMembers } from '../../shared/ui/team-members';

// Tabela de progressão: todos os times em que o personagem é DPS principal, do maior DPS para o menor
@Component({
  selector: 'app-character-teams-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslocoPipe, TeamDpsPipe, SecondsPipe, LoadStatus, TeamBadges, TeamMembers],
  template: `
    @if (siteData.catalog.hasValue() && teams.hasValue()) {
      @let catalog = siteData.catalog.value();
      <header class="mb-6">
        <h1 class="text-2xl font-bold">{{ 'character.title' | transloco: { name: characterName() } }}</h1>
        <p class="mt-1 text-sm text-ink-muted">{{ 'character.description' | transloco: { name: characterName() } }}</p>
      </header>

      <ol class="flex flex-col gap-2">
        @for (team of teams.value().teams; track team.id; let position = $index) {
          <li class="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg bg-surface-raised px-4 py-3">
            <span class="w-6 font-semibold text-ink-muted">{{ position + 1 }}.</span>
            <app-team-members [members]="team.members" [catalog]="catalog" />
            <a
              class="text-lg font-bold tabular-nums hover:text-accent"
              [routerLink]="['/', locale(), 'characters', characterId(), 'teams', team.id]"
              [attr.title]="'team.details' | transloco"
            >
              {{ team.teamDps | teamDps: locale() }}
            </a>
            @if (team.rotationTime !== undefined) {
              <span class="text-sm text-ink-muted tabular-nums">({{ team.rotationTime | seconds: locale() }})</span>
            }
            <app-team-badges class="ml-auto" [team]="team" />
          </li>
        }
      </ol>
    } @else {
      <app-load-status [status]="hasError() ? 'error' : 'loading'" errorKey="character.notFound" />
    }
  `,
})
export class CharacterTeamsPage {
  readonly characterId = input.required<string>();

  protected readonly siteData = inject(SiteData);
  protected readonly teams = injectCharacterTeams(this.characterId);
  protected readonly locale = injectActiveLocale();
  protected readonly hasError = computed(() => !!(this.siteData.catalog.error() || this.teams.error()));
  protected readonly characterName = computed(() =>
    this.siteData.catalog.hasValue()
      ? this.siteData.catalog.value().characters[this.characterId()]?.name[this.locale()]
      : '',
  );

  constructor() {
    const translate = injectTranslate();
    syncPageMeta(() => {
      const name = this.characterName();
      if (!name) return undefined;
      return {
        title: translate('character.title', { name }),
        description: translate('character.description', { name }),
      };
    });
  }
}
