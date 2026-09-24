import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

// Classes completas (não interpoladas) para o Tailwind encontrá-las no código-fonte
const MEDAL_GRADIENTS: Record<number, string> = {
  1: 'from-medal-gold to-medal-gold-deep',
  2: 'from-medal-silver to-medal-silver-deep',
  3: 'from-medal-bronze to-medal-bronze-deep',
};

// Posição no ranking: medalha de ouro, prata e bronze no pódio, número grande no resto
@Component({
  selector: 'app-ranking-position',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex w-12 justify-center sm:w-16' },
  template: `
    @if (medalGradient(); as gradient) {
      <span
        class="grid size-12 place-items-center rounded-full bg-linear-to-b font-display text-2xl font-bold text-surface
          shadow-[inset_0_-3px_6px_rgb(0_0_0/0.35)] ring-2 ring-white/30 sm:size-16 sm:text-3xl {{ gradient }}"
      >
        {{ position() }}
      </span>
    } @else {
      <span class="font-display text-4xl font-bold [text-shadow:0_2px_8px_rgb(0_0_0/0.6)] sm:text-5xl">
        {{ position() }}
      </span>
    }
  `,
})
export class RankingPosition {
  readonly position = input.required<number>();

  protected readonly medalGradient = computed(() => MEDAL_GRADIENTS[this.position()]);
}
