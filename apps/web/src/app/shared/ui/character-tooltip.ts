import { type OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ChangeDetectionStrategy, Component, computed, Directive, input } from '@angular/core';
import {
  type CharacterEntry,
  type CharacterTooltipData,
  ELEMENT_ICONS,
  type TeamElement,
} from '@genshin-dps/schema/site-data';
import { iconUrl } from '../../core/data/site-data';
import { injectActiveLocale } from '../../core/i18n/active-locale';
import { injectTranslate } from '../../core/i18n/translate';
import { formatAscensionStat, formatFlatStat } from '../format/number-format';
import { RichTooltipCard, type RichTooltipTag, RichTooltipTrigger } from './rich-tooltip';

interface StatRow {
  label: string;
  value: string;
}

// Card do personagem: título, status no nível 90 e a constelação do time, no mesmo visual do card de arma
@Component({
  selector: 'app-character-tooltip-card',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RichTooltipCard],
  template: `
    @let text = tooltip().text[locale()];
    <app-rich-tooltip-card
      [id]="id()"
      [rarity]="character().rarity"
      [iconUrl]="characterIconUrl()"
      [name]="character().name[locale()]"
      [tags]="tags()"
    >
      <p class="relative left-[0.15em] flex items-center gap-[0.4em] text-[0.85em] text-white/70" header>
        <img class="size-[1.3em]" [src]="elementIconUrl()" alt="" width="20" height="20" />
        {{ text.title }}
      </p>
      <dl class="mt-[0.8em] text-[0.9em]">
        @for (row of statRows(); track row.label) {
          <div class="flex justify-between rounded-[0.3em] px-[0.5em] py-[0.15em] odd:bg-black/20">
            <dt class="text-white/80">{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        }
      </dl>
      <hr class="my-[1em] border-white opacity-40" />
      <p class="font-sans text-[0.7em] opacity-70">{{ text.description }}</p>
    </app-rich-tooltip-card>
  `,
})
export class CharacterTooltipCard {
  readonly id = input.required<string>();
  readonly character = input.required<CharacterEntry>();
  readonly tooltip = input.required<CharacterTooltipData>();
  readonly constellation = input.required<number>();
  // Elemento do membro no time: cobre quem não tem elemento fixo
  readonly element = input.required<TeamElement>();

  protected readonly locale = injectActiveLocale();
  private readonly translate = injectTranslate();

  protected readonly characterIconUrl = computed(() => iconUrl(this.character().icon));
  protected readonly elementIconUrl = computed(() => iconUrl(ELEMENT_ICONS[this.element()]));
  protected readonly tags = computed<RichTooltipTag[]>(() => [
    { text: this.translate('tooltip.level', { level: this.tooltip().level }) },
    { text: `C${this.constellation()}`, colorClass: 'text-[wheat]' },
  ]);
  protected readonly statRows = computed<StatRow[]>(() => {
    const { baseHp, baseAtk, baseDef, ascensionStat, text } = this.tooltip();
    const locale = this.locale();
    return [
      { label: this.translate('tooltip.baseHp'), value: formatFlatStat(baseHp, locale) },
      { label: this.translate('tooltip.baseAtk'), value: formatFlatStat(baseAtk, locale) },
      { label: this.translate('tooltip.baseDef'), value: formatFlatStat(baseDef, locale) },
      { label: text[locale].ascensionStatName, value: formatAscensionStat(ascensionStat, locale) },
    ];
  });
}

@Directive({ selector: '[appCharacterTooltip]' })
export class CharacterTooltip extends RichTooltipTrigger {
  readonly appCharacterTooltip = input.required<CharacterEntry>();
  readonly constellation = input.required<number>();
  readonly element = input.required<TeamElement>();

  protected hasCardData(): boolean {
    return this.appCharacterTooltip().tooltip !== undefined;
  }

  protected attachCard(overlayRef: OverlayRef, tooltipId: string): void {
    const character = this.appCharacterTooltip();
    const card = overlayRef.attach(new ComponentPortal(CharacterTooltipCard));
    card.setInput('id', tooltipId);
    card.setInput('character', character);
    card.setInput('tooltip', character.tooltip);
    card.setInput('constellation', this.constellation());
    card.setInput('element', this.element());
  }
}
