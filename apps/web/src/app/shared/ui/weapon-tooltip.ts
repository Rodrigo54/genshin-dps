import {
  createFlexibleConnectedPositionStrategy,
  type ConnectedPosition,
  type FlexibleConnectedPositionStrategy,
  type OverlayRef,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  ElementRef,
  inject,
  Injector,
  input,
  type OnDestroy,
  signal,
} from '@angular/core';
import {
  type WeaponEntry,
  type WeaponPassive,
  type WeaponRarity,
  type WeaponTooltipData,
} from '@genshin-dps/schema/site-data';
import { iconUrl } from '../../core/data/site-data';
import { injectActiveLocale } from '../../core/i18n/active-locale';
import { injectTranslate } from '../../core/i18n/translate';
import { formatFlatStat, formatWeaponSubstat } from '../format/number-format';
import { STAT_ICON_VIEW_BOX, STAT_ICONS, type StatIconType } from './stat-icons';
import { createTooltipId, createTooltipOverlay } from './tooltip';

// Degradê do topo do card pela raridade, nas cores do tooltip do Project Amber (Ambr)
const RARITY_FADES: Record<WeaponRarity, string> = {
  1: '[--fade-color:rgb(73_73_73/0.5)]',
  2: '[--fade-color:rgb(26_58_23/0.5)]',
  3: '[--fade-color:rgb(9_53_104/0.5)]',
  4: '[--fade-color:rgb(59_35_104/0.5)]',
  5: '[--fade-color:rgb(110_77_5/0.5)]',
};

const PASSIVE_VALUE_SLOT = /\{(\d+)\}/g;

// Como no Ambr: o card fica 20px à direita do cursor e sobe 70px; perto da borda direita, vai para a esquerda
const POINTER_OFFSET_X_PX = 20;
const POINTER_OFFSET_Y_PX = -70;
const POINTER_POSITIONS: ConnectedPosition[] = [
  {
    originX: 'start',
    originY: 'top',
    overlayX: 'start',
    overlayY: 'top',
    offsetX: POINTER_OFFSET_X_PX,
    offsetY: POINTER_OFFSET_Y_PX,
  },
  {
    originX: 'start',
    originY: 'top',
    overlayX: 'end',
    overlayY: 'top',
    offsetX: -POINTER_OFFSET_X_PX,
    offsetY: POINTER_OFFSET_Y_PX,
  },
];
// No foco do teclado não há cursor: o card abre ao lado do elemento
const ELEMENT_POSITIONS: ConnectedPosition[] = [
  { originX: 'end', originY: 'top', overlayX: 'start', overlayY: 'top', offsetX: POINTER_OFFSET_X_PX },
  { originX: 'start', originY: 'top', overlayX: 'end', overlayY: 'top', offsetX: -POINTER_OFFSET_X_PX },
];

interface StatTag {
  text: string;
  icon?: StatIconType;
}

// Preenche as lacunas {0}, {1}… do texto da passiva com os valores do refinamento
function fillPassiveValues(text: string, values: readonly string[]): string {
  return text.replace(PASSIVE_VALUE_SLOT, (slot, index: string) => values[Number(index)] ?? slot);
}

// Card no visual do tooltip do Ambr (usado por Akasha e Enka): ícone saltado, status e passiva no refinamento
@Component({
  selector: 'app-weapon-tooltip-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'tooltip',
    '[id]': 'id()',
    '[class]': 'rarityFade()',
    class: `pointer-events-none relative flex max-h-[min(85vh,40em)] w-[22em] flex-col rounded-[0.8em] bg-[#2b2b2b]
      bg-[linear-gradient(195deg,var(--fade-color)_0em,transparent_8em)] p-[1em] font-display text-[0.9em]
      leading-normal text-white shadow-[0.2em_0.2em_1em_rgb(0_0_0/0.7)]`,
  },
  template: `
    @let data = tooltip();
    <div class="flow-root">
      <div
        class="relative float-left -mt-[2.5em] mr-[1em] mb-[0.5em] -ml-[2.5em] size-[6em] rounded-[0.8em] bg-[#2b2b2b] shadow-[0.2em_0.2em_1em_rgb(0_0_0/0.7)]"
      >
        <img
          class="absolute top-1/2 left-1/2 h-full -translate-1/2"
          [src]="weaponIconUrl()"
          alt=""
          width="96"
          height="96"
        />
      </div>
      <p class="relative left-[0.15em] text-[1.25em]">{{ weapon().name[locale()] }}</p>
      <!-- Nível, ataque base e secundário numa linha só: na fonte do jogo, "Nível 90 · 674 · 66,2%" mede 16,9em no
        tamanho normal e cabem 15,5em ao lado do ícone, por isso as etiquetas ficam em 0,85em -->
      <div class="flex gap-[0.6em] pt-[0.3em] text-[0.85em]">
        @for (tag of tags(); track $index) {
          <span
            class="flex items-center gap-[0.5em] rounded-[0.3em] bg-black/20 px-[0.5em] py-[0.1em] whitespace-nowrap text-white/90"
          >
            @if (tag.icon; as icon) {
              <svg class="w-[1em]" [attr.viewBox]="statIconViewBox" aria-hidden="true">
                @for (path of statIcons[icon]; track $index) {
                  <path fill="currentColor" [attr.d]="path.d" [attr.opacity]="path.opacity ?? null" />
                }
              </svg>
            }
            {{ tag.text }}
          </span>
        }
      </div>
    </div>

    <div class="min-h-0 grow overflow-hidden">
      @if (passive(); as passive) {
        <p class="mt-[0.5em] flex gap-[0.3em] leading-[1.3] opacity-95">
          {{ passive.name }}
          <span class="text-[wheat]">R{{ refinement() }}</span>
        </p>
        <p class="mt-[0.5em] font-sans text-[0.9em] whitespace-pre-line text-white/80">
          @for (segment of passive.template; track $index) {
            <span [style.color]="segment.color ?? null">{{ fillPassiveValues(segment.text, passiveValues()) }}</span>
          }
        </p>
      }
      <hr class="my-[1em] border-white opacity-40" />
      <p class="font-sans text-[0.7em] opacity-70">{{ data.text[locale()].lore }}</p>
    </div>
  `,
})
export class WeaponTooltipCard {
  readonly id = input.required<string>();
  readonly weapon = input.required<WeaponEntry>();
  readonly tooltip = input.required<WeaponTooltipData>();
  readonly refinement = input.required<number>();

  protected readonly locale = injectActiveLocale();
  private readonly translate = injectTranslate();
  protected readonly statIcons = STAT_ICONS;
  protected readonly statIconViewBox = STAT_ICON_VIEW_BOX;
  protected readonly fillPassiveValues = fillPassiveValues;

  protected readonly rarityFade = computed(() => RARITY_FADES[this.weapon().rarity]);
  protected readonly weaponIconUrl = computed(() => iconUrl(this.weapon().icon));
  protected readonly passive = computed<WeaponPassive | undefined>(() => this.tooltip().text[this.locale()].passive);
  protected readonly passiveValues = computed(() => this.passive()?.refinementValues[this.refinement() - 1] ?? []);
  protected readonly tags = computed<StatTag[]>(() => {
    const { level, baseAtk, substat } = this.tooltip();
    const locale = this.locale();
    return [
      { text: this.translate('weapon.level', { level }) },
      { text: formatFlatStat(baseAtk, locale), icon: 'FIGHT_PROP_BASE_ATTACK' },
      ...(substat ? [{ text: formatWeaponSubstat(substat.type, substat.value, locale), icon: substat.type }] : []),
    ];
  });
}

const toPoint = (event: MouseEvent) => ({ x: event.clientX, y: event.clientY });

// Tooltip rico de arma sobre o CDK Overlay: segue o cursor como no Ambr e também abre no foco do teclado
@Directive({
  selector: '[appWeaponTooltip]',
  host: {
    '(mouseenter)': 'showAtPointer($event)',
    '(mousemove)': 'followPointer($event)',
    '(mouseleave)': 'hide()',
    '(focusin)': 'showAtElement()',
    '(focusout)': 'hide()',
    '(keydown.escape)': 'hide()',
    '[attr.aria-describedby]': 'describedBy()',
  },
})
export class WeaponTooltip implements OnDestroy {
  readonly appWeaponTooltip = input.required<WeaponEntry>();
  readonly refinement = input.required<number>();

  private readonly injector = inject(Injector);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly tooltipId = createTooltipId();
  private overlayRef?: OverlayRef;
  private pointerStrategy?: FlexibleConnectedPositionStrategy;
  protected readonly describedBy = signal<string | null>(null);

  showAtPointer(event: MouseEvent): void {
    if (this.overlayRef) return;
    this.pointerStrategy = createFlexibleConnectedPositionStrategy(this.injector, toPoint(event))
      .withPositions(POINTER_POSITIONS)
      .withPush(true);
    this.open(this.pointerStrategy);
  }

  followPointer(event: MouseEvent): void {
    if (!this.overlayRef || !this.pointerStrategy) return;
    this.pointerStrategy.setOrigin(toPoint(event));
    this.overlayRef.updatePosition();
  }

  showAtElement(): void {
    if (this.overlayRef) return;
    this.open(
      createFlexibleConnectedPositionStrategy(this.injector, this.element)
        .withPositions(ELEMENT_POSITIONS)
        .withPush(true),
    );
  }

  hide(): void {
    this.overlayRef?.dispose();
    this.overlayRef = undefined;
    this.pointerStrategy = undefined;
    this.describedBy.set(null);
  }

  ngOnDestroy(): void {
    this.hide();
  }

  // Arma cadastrada à mão no overrides não tem dados de tooltip: nada abre
  private open(positionStrategy: FlexibleConnectedPositionStrategy): void {
    const weapon = this.appWeaponTooltip();
    if (!weapon.tooltip) return;
    this.overlayRef = createTooltipOverlay(this.injector, positionStrategy);
    const card = this.overlayRef.attach(new ComponentPortal(WeaponTooltipCard));
    card.setInput('id', this.tooltipId);
    card.setInput('weapon', weapon);
    card.setInput('tooltip', weapon.tooltip);
    card.setInput('refinement', this.refinement());
    this.describedBy.set(this.tooltipId);
  }
}
