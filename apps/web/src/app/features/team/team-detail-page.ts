import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { injectCharacterTeams, SiteData } from '../../core/data/site-data';
import { injectActiveLocale } from '../../core/i18n/active-locale';
import { injectTranslate } from '../../core/i18n/translate';
import { syncPageMeta } from '../../core/seo/page-meta-effect';
import { SecondsPipe, TeamDpsPipe } from '../../shared/format/number-format.pipes';
import { LoadStatus } from '../../shared/ui/load-status';
import { LocalizedNotesText } from '../../shared/ui/localized-notes-text';
import { TeamBadges } from '../../shared/ui/team-badges';
import { TeamMemberCard } from './team-member-card';

@Component({
  selector: 'app-team-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    TranslocoPipe,
    TeamDpsPipe,
    SecondsPipe,
    LoadStatus,
    LocalizedNotesText,
    TeamBadges,
    TeamMemberCard,
  ],
  template: `
    @if (siteData.catalog.hasValue() && team(); as team) {
      @let catalog = siteData.catalog.value();
      <a class="text-sm text-ink-muted hover:text-accent" [routerLink]="['/', locale(), 'characters', characterId()]">
        ← {{ 'team.backToCharacter' | transloco: { name: characterName() } }}
      </a>

      <header class="mt-3 mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold">{{ 'team.title' | transloco: { name: characterName() } }}</h1>
          <app-team-badges class="mt-2" [team]="team" />
        </div>
        <dl class="flex gap-6 text-right">
          <div>
            <dt class="text-xs text-ink-muted uppercase">{{ 'team.teamDps' | transloco }}</dt>
            <dd class="text-2xl font-bold tabular-nums">{{ team.teamDps | teamDps: locale() }}</dd>
          </div>
          @if (team.rotationTime !== undefined) {
            <div>
              <dt class="text-xs text-ink-muted uppercase">{{ 'team.rotationTime' | transloco }}</dt>
              <dd class="text-2xl font-bold tabular-nums">{{ team.rotationTime | seconds: locale() }}</dd>
            </div>
          }
        </dl>
      </header>

      <section class="mb-6">
        <h2 class="mb-3 text-lg font-semibold">{{ 'team.members' | transloco }}</h2>
        <ul class="grid gap-3 sm:grid-cols-2">
          @for (member of team.members; track $index) {
            <li><app-team-member-card class="h-full" [member]="member" [catalog]="catalog" /></li>
          }
        </ul>
      </section>

      @if (team.rotation) {
        <section class="mb-6">
          <h2 class="mb-2 text-lg font-semibold">{{ 'team.rotation' | transloco }}</h2>
          <p class="rounded-lg bg-surface-raised p-3 font-mono text-sm">{{ team.rotation }}</p>
        </section>
      }

      @if (team.notes; as notes) {
        <section class="mb-6">
          <h2 class="mb-2 text-lg font-semibold">{{ 'team.notes' | transloco }}</h2>
          <app-localized-notes-text [notes]="notes" />
        </section>
      }

      <section class="rounded-lg bg-surface-raised p-4">
        <h2 class="mb-1 text-lg font-semibold">{{ 'team.source' | transloco }}</h2>
        <p class="mb-2 text-sm text-ink-muted">
          {{ 'team.sourceAuthor' | transloco: { author: team.ref.author } }}
          @if (team.ref.tool; as tool) {
            · {{ 'team.sourceTool' | transloco: { tool } }}
          }
        </p>
        @if (team.ref.notes; as notes) {
          <app-localized-notes-text class="mb-3 block" [notes]="notes" />
        }
        <a
          class="text-sm font-medium text-accent hover:underline"
          [href]="team.ref.url"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ 'team.viewSource' | transloco }} ↗
        </a>
      </section>
    } @else {
      <app-load-status [status]="hasError() ? 'error' : 'loading'" errorKey="team.notFound" />
    }
  `,
})
export class TeamDetailPage {
  readonly characterId = input.required<string>();
  readonly teamId = input.required<string>();

  protected readonly siteData = inject(SiteData);
  protected readonly locale = injectActiveLocale();

  private readonly teams = injectCharacterTeams(this.characterId);
  protected readonly team = computed(() =>
    this.teams.hasValue() ? this.teams.value().teams.find((team) => team.id === this.teamId()) : undefined,
  );
  protected readonly hasError = computed(
    () => !!(this.siteData.catalog.error() || this.teams.error()) || (this.teams.hasValue() && !this.team()),
  );
  protected readonly characterName = computed(() =>
    this.siteData.catalog.hasValue()
      ? this.siteData.catalog.value().characters[this.characterId()]?.name[this.locale()]
      : '',
  );

  constructor() {
    const translate = injectTranslate();
    syncPageMeta(() => {
      const name = this.characterName();
      if (!name || !this.team()) return undefined;
      return { title: translate('team.title', { name }), description: translate('team.description', { name }) };
    });
  }
}
