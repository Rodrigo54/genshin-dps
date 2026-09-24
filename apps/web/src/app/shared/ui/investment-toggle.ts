import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { INVESTMENT_FILTERS, type InvestmentFilter, type Locale } from '@genshin-dps/schema/site-data';
import { TranslocoPipe } from '@jsverse/transloco';
import { Tooltip } from './tooltip';

// Cada filtro é uma rota própria (/pt e /pt/all) para os dois estados saírem prerenderizados
const FILTER_SEGMENTS: Record<InvestmentFilter, string[]> = { baseline: [], all: ['all'] };

@Component({
  selector: 'app-investment-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslocoPipe, Tooltip],
  template: `
    <div
      class="inline-flex rounded-lg border border-border p-1 text-sm"
      role="group"
      [attr.aria-label]="'investment.label' | transloco"
    >
      @for (option of options; track option) {
        <a
          class="rounded-md px-3 py-1.5 font-medium"
          [class.bg-accent]="option === filter()"
          [class.text-surface]="option === filter()"
          [class.text-ink-muted]="option !== filter()"
          [routerLink]="['/', locale(), ...segments[option]]"
          [attr.aria-current]="option === filter() ? 'page' : null"
          [appTooltip]="
            option === 'baseline' ? ('investment.baselineHint' | transloco) : ('investment.all' | transloco)
          "
        >
          {{ 'investment.' + option | transloco }}
        </a>
      }
    </div>
  `,
})
export class InvestmentToggle {
  readonly locale = input.required<Locale>();
  readonly filter = input.required<InvestmentFilter>();

  protected readonly options = INVESTMENT_FILTERS;
  protected readonly segments = FILTER_SEGMENTS;
}
