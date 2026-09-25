import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RANKING_CROWN_BAND, RANKING_CROWNS } from './ranking-crowns';
import {
  MEDAL_CROWN_TRANSFORM,
  MEDAL_DISC,
  MEDAL_INNER_RING,
  MEDAL_LEAF,
  MEDAL_LEAF_TRANSFORMS,
  MEDAL_MIRROR_TRANSFORM,
  MEDAL_STAR,
  MEDAL_STEM,
  MEDAL_VIEW_BOX,
} from './ranking-medal';

// Classes completas (não interpoladas) para o Tailwind encontrá-las no código-fonte
const MEDAL_COLORS: Record<number, string> = {
  1: '[--medal:var(--color-medal-gold)] [--medal-deep:var(--color-medal-gold-deep)]',
  2: '[--medal:var(--color-medal-silver)] [--medal-deep:var(--color-medal-silver-deep)]',
  3: '[--medal:var(--color-medal-bronze)] [--medal-deep:var(--color-medal-bronze-deep)]',
};

// Posição no ranking: no pódio, medalha de ouro, prata ou bronze com ramos de oliveira e coroa; no resto, só o
// número grande
@Component({
  selector: 'app-ranking-position',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex w-16 justify-center sm:w-20' },
  template: `
    @let crown = podiumCrown();
    @if (medalColors(); as colors) {
      <svg
        class="size-16 drop-shadow-[0_2px_3px_rgb(0_0_0/0.6)] sm:size-20 {{ colors }}"
        aria-hidden="true"
        stroke-linejoin="round"
        [attr.viewBox]="viewBox"
      >
        <g class="fill-(--medal) stroke-(--medal-deep)">
          @for (transform of [undefined, mirrorTransform]; track $index) {
            <g [attr.transform]="transform">
              <path fill="none" stroke-linecap="round" stroke-width="1.2" [attr.d]="stem" />
              @for (leafTransform of leafTransforms; track $index) {
                <path stroke-width="0.4" [attr.d]="leaf" [attr.transform]="leafTransform" />
              }
            </g>
          }
          <path stroke-width="0.4" [attr.d]="star" />
        </g>
        <circle
          class="fill-(--medal-deep) stroke-(--medal)"
          stroke-width="1.5"
          [attr.cx]="disc.cx"
          [attr.cy]="disc.cy"
          [attr.r]="disc.r"
        />
        <circle
          class="stroke-(--medal)"
          fill="none"
          opacity="0.5"
          stroke-width="0.5"
          [attr.cx]="innerRing.cx"
          [attr.cy]="innerRing.cy"
          [attr.r]="innerRing.r"
        />
        <text
          class="fill-(--medal) stroke-(--medal-deep) font-display font-bold"
          dominant-baseline="central"
          font-size="16"
          paint-order="stroke"
          stroke-width="1.5"
          text-anchor="middle"
          [attr.x]="disc.cx"
          [attr.y]="disc.cy"
        >
          {{ position() }}
        </text>
        @if (crown) {
          <g class="fill-(--medal) stroke-(--medal-deep)" stroke-width="1.2" [attr.transform]="crownTransform">
            <path [attr.d]="crown.body" />
            <path [attr.d]="crownBand" />
            @for (jewel of crown.jewels; track $index) {
              <circle [attr.cx]="jewel.cx" [attr.cy]="jewel.cy" [attr.r]="jewel.r" />
            }
          </g>
        }
      </svg>
      <span class="sr-only">{{ position() }}</span>
    } @else {
      <span class="font-display text-4xl font-bold [text-shadow:0_2px_8px_rgb(0_0_0/0.6)] sm:text-5xl">
        {{ position() }}
      </span>
    }
  `,
})
export class RankingPosition {
  readonly position = input.required<number>();

  protected readonly viewBox = MEDAL_VIEW_BOX;
  protected readonly mirrorTransform = MEDAL_MIRROR_TRANSFORM;
  protected readonly stem = MEDAL_STEM;
  protected readonly leaf = MEDAL_LEAF;
  protected readonly leafTransforms = MEDAL_LEAF_TRANSFORMS;
  protected readonly star = MEDAL_STAR;
  protected readonly disc = MEDAL_DISC;
  protected readonly innerRing = MEDAL_INNER_RING;
  protected readonly crownTransform = MEDAL_CROWN_TRANSFORM;
  protected readonly crownBand = RANKING_CROWN_BAND;
  protected readonly medalColors = computed(() => MEDAL_COLORS[this.position()]);
  protected readonly podiumCrown = computed(() => RANKING_CROWNS[this.position()]);
}
