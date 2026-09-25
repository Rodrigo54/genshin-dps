import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  type Catalog,
  type CharacterEntry,
  type CharacterLevel,
  ELEMENT_ICONS,
  type TeamElement,
  type TeamMember,
  type WeaponEntry,
} from '@genshin-dps/schema/site-data';
import { TranslocoPipe } from '@jsverse/transloco';
import { iconUrl } from '../../core/data/site-data';
import { injectActiveLocale } from '../../core/i18n/active-locale';
import { formatWeaponLabel } from '../format/weapon-label';
import { CharacterTooltip } from './character-tooltip';
import { elementTextColor, rarityBackground } from './game-colors';
import { WeaponTooltip } from './weapon-tooltip';

type TeamMembersSize = 'md' | 'lg';

// Classes completas (não interpoladas) para o Tailwind encontrá-las no código-fonte
const PORTRAIT_SIZES: Record<TeamMembersSize, string> = {
  md: 'size-14',
  lg: 'size-12 sm:size-24',
};

interface WeaponView {
  entry: WeaponEntry;
  label: string;
  iconUrl: string;
  rarityClass: string;
  refinement: number;
}

interface MemberView {
  character: CharacterEntry;
  element: TeamElement;
  characterName: string;
  characterIconUrl: string;
  characterRarityClass: string;
  elementIconUrl: string;
  elementTextClass: string;
  constellation: number;
  level: CharacterLevel;
  // Ausente quando a fonte não informou a arma do suporte
  weapon?: WeaponView;
}

// Os 4 membros do time: ícone com constelação e arma com refinamento, cada um com o próprio tooltip
@Component({
  selector: 'app-team-members',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CharacterTooltip, TranslocoPipe, WeaponTooltip],
  template: `
    <ul class="flex gap-4">
      @for (member of memberViews(); track $index) {
        @let weaponText = member.weapon?.label ?? ('member.unknownWeapon' | transloco);
        @let summary =
          'member.summary'
            | transloco: { character: member.characterName, constellation: member.constellation, weapon: weaponText };
        <!-- O card do personagem fica no retrato e o da arma no selo dela, para os dois não abrirem juntos; o resumo
          em texto continua para leitores de tela -->
        <li class="relative">
          <span
            class="block rounded-md outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent"
            tabindex="0"
            [appCharacterTooltip]="member.character"
            [constellation]="member.constellation"
            [level]="member.level"
            [element]="member.element"
          >
            <span class="sr-only">{{ summary }}</span>
            <img
              class="rounded-md {{ portraitSize() }} {{ member.characterRarityClass }}"
              [src]="member.characterIconUrl"
              alt=""
              width="48"
              height="48"
            />
            <span
              class="absolute -top-1.5 -left-2 flex items-center gap-0.5 rounded bg-surface pr-1 shadow-md shadow-black/60
                ring-2 ring-surface {{ member.elementTextClass }}"
            >
              <img class="size-5" [src]="member.elementIconUrl" alt="" width="20" height="20" />
              <span class="font-display text-xs leading-none font-semibold [text-box:trim-both_cap_alphabetic]"
                >C{{ member.constellation }}</span
              >
            </span>
          </span>
          @if (member.weapon; as weapon) {
            <span
              class="absolute -right-2 -bottom-1.5 flex items-center gap-0.5 rounded pr-1 shadow-md shadow-black/60 ring-2 ring-surface outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent {{
                weapon.rarityClass
              }}"
              tabindex="0"
              [appWeaponTooltip]="weapon.entry"
              [refinement]="weapon.refinement"
            >
              <img class="size-6" [src]="weapon.iconUrl" alt="" width="24" height="24" />
              <span class="font-display text-xs leading-none font-semibold [text-box:trim-both_cap_alphabetic]"
                >R{{ weapon.refinement }}</span
              >
            </span>
          }
        </li>
      }
    </ul>
  `,
})
export class TeamMembers {
  readonly members = input.required<TeamMember[]>();
  readonly catalog = input.required<Catalog>();
  readonly size = input<TeamMembersSize>('md');
  private readonly locale = injectActiveLocale();

  protected readonly portraitSize = computed(() => PORTRAIT_SIZES[this.size()]);
  protected readonly memberViews = computed(() => this.members().map((member) => this.toMemberView(member)));

  // O build de dados garante que todo id usado nos times está no catálogo
  private toMemberView(member: TeamMember): MemberView {
    const character = this.catalog().characters[member.characterId];
    return {
      character,
      element: member.element,
      characterName: character.name[this.locale()],
      characterIconUrl: iconUrl(character.icon),
      characterRarityClass: rarityBackground(character.rarity),
      elementIconUrl: iconUrl(ELEMENT_ICONS[member.element]),
      elementTextClass: elementTextColor(member.element),
      constellation: member.constellation,
      level: member.level,
      ...(member.weapon && { weapon: this.toWeaponView(member.weapon.weaponId, member.weapon.refinement) }),
    };
  }

  private toWeaponView(weaponId: string, refinement: number): WeaponView {
    const weapon = this.catalog().weapons[weaponId];
    return {
      entry: weapon,
      label: formatWeaponLabel(weapon.name[this.locale()], refinement),
      iconUrl: iconUrl(weapon.icon),
      rarityClass: rarityBackground(weapon.rarity),
      refinement,
    };
  }
}
