import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { type Catalog, MAIN_STAT_SLOTS, type MemberStats, type TeamMember } from '@genshin-dps/schema/site-data';
import { TranslocoPipe } from '@jsverse/transloco';
import { iconUrl } from '../../core/data/site-data';
import { injectActiveLocale } from '../../core/i18n/active-locale';
import { LocalizePipe } from '../../shared/format/localize.pipe';
import { formatStat } from '../../shared/format/number-format';
import { formatWeaponLabel } from '../../shared/format/weapon-label';
import { rarityBackground } from '../../shared/ui/game-colors';
import { WeaponTooltip } from '../../shared/ui/weapon-tooltip';

// Ordem de exibição dos atributos de ficha
const STAT_ORDER: (keyof MemberStats)[] = [
  'hp',
  'atk',
  'def',
  'elementalMastery',
  'energyRecharge',
  'critRate',
  'critDamage',
];

// Build de um membro no detalhe do time: arma, talentos, sets, principais e atributos que a fonte informou
@Component({
  selector: 'app-team-member-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, LocalizePipe, WeaponTooltip],
  host: { class: 'flex gap-3 rounded-lg bg-surface-raised p-3' },
  template: `
    @let character = catalog().characters[member().characterId];
    <img
      class="size-16 rounded-md {{ rarityBackground(character.rarity) }}"
      [src]="iconUrl(character.icon)"
      alt=""
      width="64"
      height="64"
    />
    <div class="flex min-w-0 flex-col gap-1 text-sm">
      <p class="font-semibold">{{ character.name | localize: locale() }} C{{ member().constellation }}</p>
      @if (member().weapon; as memberWeapon) {
        @let weapon = catalog().weapons[memberWeapon.weaponId];
        <p
          class="flex items-center gap-1.5 self-start rounded text-ink-muted outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent"
          tabindex="0"
          [appWeaponTooltip]="weapon"
          [refinement]="memberWeapon.refinement"
        >
          <img class="size-5" [src]="iconUrl(weapon.icon)" alt="" width="20" height="20" />
          {{ formatWeaponLabel(weapon.name[locale()], memberWeapon.refinement) }}
        </p>
      } @else {
        <p class="text-ink-muted italic">{{ 'member.unknownWeapon' | transloco }}</p>
      }
      @if (member().talents; as talents) {
        <p>
          <span class="text-ink-muted">{{ 'team.talents' | transloco }}:</span>
          {{ talents.join(' / ') }}
        </p>
      }
      @if (member().sets; as sets) {
        <p>
          <span class="text-ink-muted">{{ 'team.sets' | transloco }}:</span>
          @for (set of sets; track set.artifactSetId; let isLast = $last) {
            {{ set.pieces }}× {{ catalog().artifactSets[set.artifactSetId].name | localize: locale()
            }}{{ isLast ? '' : ',' }}
          }
        </p>
      }
      @if (member().mainStats; as mainStats) {
        <p>
          <span class="text-ink-muted">{{ 'team.mainStats' | transloco }}:</span>
          @for (slot of mainStatSlots; track slot; let isLast = $last) {
            {{ 'mainStat.' + mainStats[slot] | transloco }}{{ isLast ? '' : ' /' }}
          }
        </p>
      }
      @if (member().stats; as stats) {
        <dl class="mt-1 grid grid-cols-2 gap-x-4 text-xs">
          @for (stat of statOrder; track stat) {
            @if (stats[stat] !== undefined) {
              <dt class="text-ink-muted">{{ 'stats.' + stat | transloco }}</dt>
              <dd class="text-right tabular-nums">{{ formatStat(stat, stats[stat], locale()) }}</dd>
            }
          }
        </dl>
      }
    </div>
  `,
})
export class TeamMemberCard {
  readonly member = input.required<TeamMember>();
  readonly catalog = input.required<Catalog>();

  protected readonly locale = injectActiveLocale();
  protected readonly iconUrl = iconUrl;
  protected readonly rarityBackground = rarityBackground;
  protected readonly formatStat = formatStat;
  protected readonly formatWeaponLabel = formatWeaponLabel;
  protected readonly statOrder = STAT_ORDER;
  protected readonly mainStatSlots = MAIN_STAT_SLOTS;
}
