import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { type CharacterEntry, type CharacterLevel } from '@genshin-dps/schema/site-data';
import { TranslocoService } from '@jsverse/transloco';
import { provideTranslocoForTests } from '../../testing/transloco-testing';
import { CharacterTooltip } from './character-tooltip';

const mavuika: CharacterEntry = {
  id: 'mavuika',
  name: { pt: 'Mavuika', en: 'Mavuika' },
  rarity: 5,
  element: 'pyro',
  icon: 'UI_AvatarIcon_Mavuika',
  tooltip: {
    stats: [
      { level: 90, hp: 12552, atk: 359, def: 792, ascensionStat: 88.4 },
      { level: 95, hp: 12998, atk: 399, def: 820, ascensionStat: 88.4 },
      { level: 100, hp: 13444, atk: 439, def: 848, ascensionStat: 88.4 },
    ],
    isAscensionStatPercent: true,
    text: {
      pt: {
        title: 'Chama da Noite Ardente',
        region: 'Natlan',
        affiliation: 'Huitztlan',
        constellation: 'Sol Invictus',
        visionLabel: 'Eixo Estelar',
        weaponType: 'Espadão',
        ascensionStatName: 'Dano Crítico',
        description: 'A líder de Natlan.',
      },
      en: {
        title: 'Night-Igniting Flame',
        region: 'Natlan',
        affiliation: 'Huitztlan',
        constellation: 'Sol Invictus',
        visionLabel: 'Stellar Linchpin',
        weaponType: 'Claymore',
        ascensionStatName: 'CRIT DMG',
        description: 'The leader of Natlan.',
      },
    },
  },
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CharacterTooltip],
  template: `
    <span
      tabindex="0"
      [appCharacterTooltip]="character()"
      [constellation]="constellation()"
      [level]="level()"
      element="pyro"
    >
      personagem
    </span>
  `,
})
class CharacterTooltipHost {
  readonly character = signal(mavuika);
  readonly constellation = signal(2);
  readonly level = signal<CharacterLevel>(90);
}

async function openTooltip(configure: (host: CharacterTooltipHost) => void = () => undefined) {
  TestBed.configureTestingModule({ imports: [provideTranslocoForTests()] });
  TestBed.inject(TranslocoService).setActiveLang('pt');
  const fixture = TestBed.createComponent(CharacterTooltipHost);
  configure(fixture.componentInstance);
  fixture.detectChanges();
  const trigger = (fixture.nativeElement as HTMLElement).querySelector('span')!;
  trigger.dispatchEvent(new FocusEvent('focusin'));
  await fixture.whenStable();
  return { trigger, card: document.querySelector<HTMLElement>('[role="tooltip"]') };
}

describe('CharacterTooltip', () => {
  afterEach(() => document.querySelectorAll('[role="tooltip"]').forEach((card) => card.remove()));

  it('mostra nome, elemento, estrelas, etiquetas, status no nível 90 e descrição', async () => {
    const { trigger, card } = await openTooltip();
    const text = card?.textContent ?? '';
    expect(text).toContain('Mavuika');
    const tags = [...card!.querySelectorAll('.whitespace-nowrap')].map((tag) => tag.textContent?.trim());
    expect(tags).toEqual(['Nível 90', 'Natlan', 'Espadão', 'C2']);
    expect(card?.querySelectorAll('[header] svg')).toHaveLength(5);
    const profile = [...card!.querySelectorAll('dl')[0]!.querySelectorAll('div')].map((row) => [
      row.querySelector('dt')?.textContent?.trim(),
      row.querySelector('dd')?.textContent?.trim(),
    ]);
    expect(profile).toEqual([
      ['Título', 'Chama da Noite Ardente'],
      ['Constelação', 'Sol Invictus'],
      ['Eixo Estelar', 'Pyro'],
      ['Afiliação', 'Huitztlan'],
    ]);
    expect(text).toContain('Vida base');
    expect(text).toContain('12.552');
    expect(text).toContain('Dano Crítico');
    expect(text).toContain('88,4%');
    expect(text).toContain('A líder de Natlan.');
    expect(card?.querySelector('img[src$="UI_Buff_Element_Fire.webp"]')).not.toBeNull();
    expect(trigger.getAttribute('aria-describedby')).toBe(card?.id);
  });

  it('mostra o nível e os status do nível do membro no time', async () => {
    const { card } = await openTooltip((host) => host.level.set(100));
    const tags = [...card!.querySelectorAll('.whitespace-nowrap')].map((tag) => tag.textContent?.trim());
    expect(tags[0]).toBe('Nível 100');
    expect(card?.textContent).toContain('13.444');
    expect(card?.textContent).not.toContain('12.552');
  });

  it('omite título e afiliação de quem não tem', async () => {
    const { card } = await openTooltip((host) =>
      host.character.update((character) => ({
        ...character,
        tooltip: {
          ...character.tooltip!,
          text: {
            ...character.tooltip!.text,
            pt: {
              ...character.tooltip!.text.pt,
              title: undefined,
              affiliation: undefined,
            },
          },
        },
      })),
    );
    const tags = [...card!.querySelectorAll('.whitespace-nowrap')].map((tag) => tag.textContent?.trim());
    expect(tags).toEqual(['Nível 90', 'Natlan', 'Espadão', 'C2']);
    const profileLabels = [...card!.querySelectorAll('dl')[0]!.querySelectorAll('dt')].map((dt) => dt.textContent);
    expect(profileLabels).toEqual(['Constelação', 'Eixo Estelar']);
  });

  it('não abre para personagem sem dados de tooltip', async () => {
    const { tooltip: _, ...withoutTooltip } = mavuika;
    const { card } = await openTooltip((host) => host.character.set(withoutTooltip));
    expect(card).toBeNull();
  });
});
