import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { type Team } from '@genshin-dps/schema/site-data';
import { TranslocoPipe } from '@jsverse/transloco';
import { Tooltip } from './tooltip';

// Selos do benchmark: patch em que foi medido, baseline e obsoleto
@Component({
  selector: 'app-team-badges',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, Tooltip],
  host: { class: 'flex flex-wrap gap-1.5 text-xs font-medium' },
  template: `
    <span class="rounded bg-border px-1.5 py-0.5">{{ 'team.patch' | transloco: { patch: team().patch } }}</span>
    @if (team().isBaseline) {
      <span
        class="rounded bg-accent/15 px-1.5 py-0.5 text-accent"
        tabindex="0"
        [appTooltip]="'investment.baselineHint' | transloco"
      >
        {{ 'team.baseline' | transloco }}
      </span>
    }
    @if (team().isObsolete) {
      <span class="rounded bg-pyro/15 px-1.5 py-0.5 text-pyro">{{ 'team.obsolete' | transloco }}</span>
    }
  `,
})
export class TeamBadges {
  readonly team = input.required<Team>();
}
