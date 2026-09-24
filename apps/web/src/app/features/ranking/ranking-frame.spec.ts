import { rankingFrameColor } from './ranking-frame';

describe('rankingFrameColor', () => {
  it('usa a cor da medalha no pódio, qualquer que seja o elemento', () => {
    expect(rankingFrameColor(1, 'pyro')).toBe('[--frame-color:var(--color-medal-gold)]');
    expect(rankingFrameColor(2, 'hydro')).toBe('[--frame-color:var(--color-medal-silver)]');
    expect(rankingFrameColor(3, 'cryo')).toBe('[--frame-color:var(--color-medal-bronze)]');
  });

  it('usa a cor do elemento do DPS principal fora do pódio', () => {
    expect(rankingFrameColor(4, 'electro')).toBe('[--frame-color:var(--color-electro)]');
    expect(rankingFrameColor(10, 'dendro')).toBe('[--frame-color:var(--color-dendro)]');
  });
});
