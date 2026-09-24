import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { type WeaponEntry } from '@genshin-dps/schema/site-data';
import { TranslocoService } from '@jsverse/transloco';
import { provideTranslocoForTests } from '../../testing/transloco-testing';
import { WeaponTooltip } from './weapon-tooltip';

const passiveText = {
  name: 'Dança Kagura',
  template: [{ text: 'Aumenta o dano em ' }, { text: '{0}', color: '#99FFFFFF' }, { text: '.' }],
  refinementValues: [['12%'], ['15%'], ['18%'], ['21%'], ['24%']],
};

const kagura: WeaponEntry = {
  id: 'kagura-s-verity',
  name: { pt: 'Prova de Kagura', en: "Kagura's Verity" },
  rarity: 5,
  icon: 'UI_EquipIcon_Catalyst_Narukami_Awaken',
  tooltip: {
    level: 90,
    baseAtk: 608,
    substat: { type: 'FIGHT_PROP_CRITICAL_HURT', value: 66.2 },
    text: {
      pt: { passive: passiveText, lore: 'Sino usado na Dança Kagura.' },
      en: { passive: passiveText, lore: 'A bell used in the Kagura Dance.' },
    },
  },
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [WeaponTooltip],
  template: `<span tabindex="0" [appWeaponTooltip]="weapon()" [refinement]="refinement()">arma</span>`,
})
class WeaponTooltipHost {
  readonly weapon = signal(kagura);
  readonly refinement = signal(5);
}

async function openTooltip(configure: (host: WeaponTooltipHost) => void = () => undefined) {
  TestBed.configureTestingModule({ imports: [provideTranslocoForTests()] });
  TestBed.inject(TranslocoService).setActiveLang('pt');
  const fixture = TestBed.createComponent(WeaponTooltipHost);
  configure(fixture.componentInstance);
  fixture.detectChanges();
  const trigger = (fixture.nativeElement as HTMLElement).querySelector('span')!;
  trigger.dispatchEvent(new FocusEvent('focusin'));
  await fixture.whenStable();
  return { fixture, trigger, card: document.querySelector<HTMLElement>('[role="tooltip"]') };
}

describe('WeaponTooltip', () => {
  afterEach(() => document.querySelectorAll('[role="tooltip"]').forEach((card) => card.remove()));

  it('mostra nome, nível, ATQ base, secundário e a passiva no refinamento do time', async () => {
    const { trigger, card } = await openTooltip();
    const text = card?.textContent ?? '';
    expect(text).toContain('Prova de Kagura');
    expect(text).toContain('Nível 90');
    expect(text).toContain('608');
    expect(text).toContain('66,2%');
    expect(text).toContain('R5');
    expect(text).toContain('Aumenta o dano em 24%.');
    expect(text).toContain('Sino usado na Dança Kagura.');
    expect(trigger.getAttribute('aria-describedby')).toBe(card?.id);
  });

  it('mostra a passiva no refinamento pedido', async () => {
    const { card } = await openTooltip((host) => host.refinement.set(1));
    expect(card?.textContent).toContain('R1');
    expect(card?.textContent).toContain('Aumenta o dano em 12%.');
  });

  it('não abre para arma sem dados de tooltip', async () => {
    const { tooltip: _, ...withoutTooltip } = kagura;
    const { card } = await openTooltip((host) => host.weapon.set(withoutTooltip));
    expect(card).toBeNull();
  });

  it('fecha ao perder o foco', async () => {
    const { fixture, trigger } = await openTooltip();
    trigger.dispatchEvent(new FocusEvent('focusout'));
    await fixture.whenStable();
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
  });
});
