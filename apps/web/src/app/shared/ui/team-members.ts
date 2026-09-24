import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { type Catalog, ELEMENT_ICONS, type TeamMember, type WeaponEntry } from '@genshin-dps/schema/site-data';
import { TranslocoPipe } from '@jsverse/transloco';
import { iconUrl } from '../../core/data/site-data';
import { injectActiveLocale } from '../../core/i18n/active-locale';
import { formatWeaponLabel } from '../format/weapon-label';
import { rarityBackground } from './game-colors';
import { Tooltip } from './tooltip';
import { WeaponTooltip } from './weapon-tooltip';

type TeamMembersSize = 'md' | 'lg';

// Classes completas (não interpoladas) para o Tailwind encontrá-las no código-fonte
const PORTRAIT_SIZES: Record<TeamMembersSize, string> = {
  md: 'size-12',
  lg: 'size-12 sm:size-20',
};

interface WeaponView {
  entry: WeaponEntry;
  label: string;
  iconUrl: string;
  refinement: number;
}

interface MemberView {
  characterName: string;
  characterIconUrl: string;
  characterRarityClass: string;
  elementIconUrl: string;
  constellation: number;
  // Ausente quando a fonte não informou a arma do suporte
  weapon?: WeaponView;
}

// Os 4 membros do time: ícone com constelação e arma com refinamento; o resumo aparece no tooltip
@Component({
  selector: 'app-team-members',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Tooltip, TranslocoPipe, WeaponTooltip],
  template: `
    <ul class="flex gap-2">
      @for (member of memberViews(); track $index) {
        @let weaponText = member.weapon?.label ?? ('member.unknownWeapon' | transloco);
        @let summary =
          'member.summary'
            | transloco: { character: member.characterName, constellation: member.constellation, weapon: weaponText };
        <!-- O resumo fica no retrato e o tooltip da arma no selo dela, para os dois não abrirem juntos -->
        <li class="relative">
          <span
            class="block rounded-md outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent"
            tabindex="0"
            [appTooltip]="summary"
          >
            <span class="sr-only">{{ summary }}</span>
            <img
              class="rounded-md {{ portraitSize() }} {{ member.characterRarityClass }}"
              [src]="member.characterIconUrl"
              alt=""
              width="48"
              height="48"
            />
            <img
              class="absolute -top-1 -right-1 size-5 drop-shadow-md"
              [src]="member.elementIconUrl"
              alt=""
              width="20"
              height="20"
            />
            <span class="absolute -top-1 -left-1 rounded bg-surface px-1 text-[0.6875rem] leading-4 font-semibold">
              C{{ member.constellation }}
            </span>
          </span>
          @if (member.weapon; as weapon) {
            <span
              class="absolute -right-1.5 -bottom-1 flex items-center rounded bg-surface pr-1 outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent"
              tabindex="0"
              [appWeaponTooltip]="weapon.entry"
              [refinement]="weapon.refinement"
            >
              <img class="size-5" [src]="weapon.iconUrl" alt="" width="20" height="20" />
              <span class="text-[0.6875rem] leading-4 font-semibold">R{{ weapon.refinement }}</span>
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
      characterName: character.name[this.locale()],
      characterIconUrl: iconUrl(character.icon),
      characterRarityClass: rarityBackground(character.rarity),
      elementIconUrl: iconUrl(ELEMENT_ICONS[member.element]),
      constellation: member.constellation,
      ...(member.weapon && { weapon: this.toWeaponView(member.weapon.weaponId, member.weapon.refinement) }),
    };
  }

  private toWeaponView(weaponId: string, refinement: number): WeaponView {
    const weapon = this.catalog().weapons[weaponId];
    return {
      entry: weapon,
      label: formatWeaponLabel(weapon.name[this.locale()], refinement),
      iconUrl: iconUrl(weapon.icon),
      refinement,
    };
  }
}
