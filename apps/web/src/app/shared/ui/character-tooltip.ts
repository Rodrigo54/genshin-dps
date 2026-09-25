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

// Estrela de cinco pontas em viewBox 0 0 24 24, uma por raridade como no jogo
const RARITY_STAR = 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z';

interface TableRow {
  label: string;
  value: string;
}

// Card do personagem: elemento, raridade, região, arma, constelação do time, perfil e status no nível 90, no mesmo
// visual do card de arma
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
      [tagsBelowIcon]="true"
    >
      <img class="size-[1.5em]" [src]="elementIconUrl()" alt="" width="30" height="30" nameSuffix />
      <p class="flex gap-[0.1em] pt-[0.2em] text-[#ffcc32]" header>
        @for (star of stars(); track $index) {
          <svg class="size-[1em]" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" [attr.d]="rarityStar" />
          </svg>
        }
        <span class="sr-only">{{ character().rarity }}★</span>
      </p>
      <!-- Perfil e status em duas tabelas iguais, como na ficha do personagem no jogo -->
      @for (rows of [profileRows(), statRows()]; track $index) {
        <dl class="mt-[0.8em] text-[0.9em]">
          @for (row of rows; track row.label) {
            <div class="flex justify-between gap-[1em] rounded-[0.3em] px-[0.5em] py-[0.15em] odd:bg-black/20">
              <dt class="shrink-0 text-white/80">{{ row.label }}</dt>
              <dd class="text-right">{{ row.value }}</dd>
            </div>
          }
        </dl>
      }
      <hr class="my-[1em] border-white opacity-40" />
      <p class="font-sans italic opacity-80">{{ text.description }}</p>
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

  protected readonly rarityStar = RARITY_STAR;
  protected readonly stars = computed(() => Array.from({ length: this.character().rarity }));
  protected readonly characterIconUrl = computed(() => iconUrl(this.character().icon));
  protected readonly elementIconUrl = computed(() => iconUrl(ELEMENT_ICONS[this.element()]));
  protected readonly tags = computed<RichTooltipTag[]>(() => {
    const { level, text } = this.tooltip();
    const { region, weaponType } = text[this.locale()];
    return [
      { text: this.translate('tooltip.level', { level }) },
      ...(region ? [{ text: region }] : []),
      { text: weaponType },
      { text: `C${this.constellation()}`, colorClass: 'text-[wheat]' },
    ];
  });
  protected readonly profileRows = computed<TableRow[]>(() => {
    const { title, constellation, visionLabel, affiliation } = this.tooltip().text[this.locale()];
    const rows: (TableRow | false)[] = [
      !!title && { label: this.translate('tooltip.title'), value: title },
      { label: this.translate('tooltip.constellation'), value: constellation },
      // Sem rótulo próprio no jogo, vale o padrão da aba Perfil: "Visão"
      { label: visionLabel ?? this.translate('tooltip.vision'), value: this.translate(`elements.${this.element()}`) },
      !!affiliation && { label: this.translate('tooltip.affiliation'), value: affiliation },
    ];
    return rows.filter((row): row is TableRow => row !== false);
  });
  protected readonly statRows = computed<TableRow[]>(() => {
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
