import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

export type LoadStatusKind = 'loading' | 'error';

@Component({
  selector: 'app-load-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe],
  template: `
    @if (status() === 'error') {
      <p class="text-pyro" role="alert">{{ errorKey() | transloco }}</p>
    } @else {
      <p class="text-ink-muted" aria-live="polite">{{ 'state.loading' | transloco }}</p>
    }
  `,
})
export class LoadStatus {
  readonly status = input.required<LoadStatusKind>();
  readonly errorKey = input('state.loadError');
}
