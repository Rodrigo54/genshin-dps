import { type OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ChangeDetectionStrategy, Component, computed, Directive, input } from '@angular/core';
import { type WeaponEntry, type WeaponPassive, type WeaponTooltipData } from '@genshin-dps/schema/site-data';
import { iconUrl } from '../../core/data/site-data';
import { injectActiveLocale } from '../../core/i18n/active-locale';
import { injectTranslate } from '../../core/i18n/translate';
import { formatFlatStat, formatWeaponSubstat } from '../format/number-format';
import { RichTooltipCard, type RichTooltipTag, RichTooltipTrigger } from './rich-tooltip';

const PASSIVE_VALUE_SLOT = /\{(\d+)\}/g;

// Preenche as lacunas {0}, {1}… do texto da passiva com os valores do refinamento
function fillPassiveValues(text: string, values: readonly string[]): string {
  return text.replace(PASSIVE_VALUE_SLOT, (slot, index: string) => values[Number(index)] ?? slot);
}

// Card da arma: status no nível máximo e passiva no refinamento do time
@Component({
  selector: 'app-weapon-tooltip-card',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RichTooltipCard],
  template: `
    <app-rich-tooltip-card
      [id]="id()"
      [rarity]="weapon().rarity"
      [iconUrl]="weaponIconUrl()"
      [name]="weapon().name[locale()]"
      [tags]="tags()"
    >
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
      <p class="font-sans text-[0.7em] opacity-70">{{ tooltip().text[locale()].lore }}</p>
    </app-rich-tooltip-card>
  `,
})
export class WeaponTooltipCard {
  readonly id = input.required<string>();
  readonly weapon = input.required<WeaponEntry>();
  readonly tooltip = input.required<WeaponTooltipData>();
  readonly refinement = input.required<number>();

  protected readonly locale = injectActiveLocale();
  private readonly translate = injectTranslate();
  protected readonly fillPassiveValues = fillPassiveValues;

  protected readonly weaponIconUrl = computed(() => iconUrl(this.weapon().icon));
  protected readonly passive = computed<WeaponPassive | undefined>(() => this.tooltip().text[this.locale()].passive);
  protected readonly passiveValues = computed(() => this.passive()?.refinementValues[this.refinement() - 1] ?? []);
  protected readonly tags = computed<RichTooltipTag[]>(() => {
    const { level, baseAtk, substat } = this.tooltip();
    const locale = this.locale();
    return [
      { text: this.translate('tooltip.level', { level }) },
      { text: formatFlatStat(baseAtk, locale), icon: 'FIGHT_PROP_BASE_ATTACK' },
      ...(substat ? [{ text: formatWeaponSubstat(substat.type, substat.value, locale), icon: substat.type }] : []),
    ];
  });
}

@Directive({ selector: '[appWeaponTooltip]' })
export class WeaponTooltip extends RichTooltipTrigger {
  readonly appWeaponTooltip = input.required<WeaponEntry>();
  readonly refinement = input.required<number>();

  protected hasCardData(): boolean {
    return this.appWeaponTooltip().tooltip !== undefined;
  }

  protected attachCard(overlayRef: OverlayRef, tooltipId: string): void {
    const weapon = this.appWeaponTooltip();
    const card = overlayRef.attach(new ComponentPortal(WeaponTooltipCard));
    card.setInput('id', tooltipId);
    card.setInput('weapon', weapon);
    card.setInput('tooltip', weapon.tooltip);
    card.setInput('refinement', this.refinement());
  }
}
