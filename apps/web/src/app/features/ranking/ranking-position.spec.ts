import { TestBed } from '@angular/core/testing';
import { RANKING_CROWNS } from './ranking-crowns';
import { MEDAL_LEAF_TRANSFORMS } from './ranking-medal';
import { RankingPosition } from './ranking-position';

async function render(position: number) {
  TestBed.configureTestingModule({ imports: [RankingPosition] });
  const fixture = TestBed.createComponent(RankingPosition);
  fixture.componentRef.setInput('position', position);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('RankingPosition', () => {
  it.each([1, 2, 3])('mostra o %iº lugar numa medalha com ramos de oliveira e a coroa da posição', async (position) => {
    const element = await render(position);
    const medal = element.querySelector('svg')!;
    expect(medal.getAttribute('aria-hidden')).toBe('true');
    // Dois ramos espelhados, cada um com o caule e as folhas
    const branches = medal.querySelectorAll('g > g');
    expect(branches).toHaveLength(2);
    expect(branches[0]!.querySelectorAll('path')).toHaveLength(1 + MEDAL_LEAF_TRANSFORMS.length);
    expect(medal.querySelector('g[transform^="translate"]')!.querySelectorAll('circle')).toHaveLength(
      RANKING_CROWNS[position]!.jewels.length,
    );
    expect(medal.querySelector('text')?.textContent?.trim()).toBe(String(position));
    expect(element.querySelector('.sr-only')?.textContent).toBe(String(position));
  });

  it('mostra só o número fora do pódio', async () => {
    const element = await render(4);
    expect(element.querySelector('svg')).toBeNull();
    expect(element.textContent?.trim()).toBe('4');
  });
});
