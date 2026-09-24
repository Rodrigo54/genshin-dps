import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Tooltip } from './tooltip';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Tooltip],
  template: `<button type="button" appTooltip="C0 com arma R1">Mavuika</button>`,
})
class TooltipHost {}

function setup() {
  const fixture = TestBed.createComponent(TooltipHost);
  fixture.detectChanges();
  const button = (fixture.nativeElement as HTMLElement).querySelector('button')!;
  return { fixture, button };
}

describe('Tooltip', () => {
  it('abre no foco, liga aria-describedby e fecha ao perder o foco', async () => {
    const { fixture, button } = setup();

    button.dispatchEvent(new FocusEvent('focusin'));
    await fixture.whenStable();
    const tooltip = document.querySelector('[role="tooltip"]');
    expect(tooltip?.textContent).toBe('C0 com arma R1');
    expect(button.getAttribute('aria-describedby')).toBe(tooltip?.id);

    button.dispatchEvent(new FocusEvent('focusout'));
    await fixture.whenStable();
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
    expect(button.hasAttribute('aria-describedby')).toBe(false);
  });

  it('fecha com Escape', async () => {
    const { fixture, button } = setup();
    button.dispatchEvent(new MouseEvent('mouseenter'));
    await fixture.whenStable();
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
  });
});
