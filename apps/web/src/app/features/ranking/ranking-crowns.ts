export interface RankingCrown {
  body: string;
  jewels: { cx: number; cy: number; r: number }[];
}

// Coroas do pódio em viewBox 0 0 32 24: a faixa da base é igual nas três e o número de pontas cai com a posição
export const RANKING_CROWN_BAND =
  'M6 18.5h20a1.5 1.5 0 0 1 1.5 1.5v1.5a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5V20A1.5 1.5 0 0 1 6 18.5';

export const RANKING_CROWNS: Record<number, RankingCrown> = {
  1: {
    body: 'M5.5 19 2.5 7.5 8.5 12 9.5 4.5 13 10 16 2l3 8 3.5-5.5 1 7.5 6-4.5-3 11.5z',
    jewels: [
      { cx: 2.5, cy: 7.5, r: 1.6 },
      { cx: 9.5, cy: 4.5, r: 1.6 },
      { cx: 16, cy: 2, r: 1.8 },
      { cx: 22.5, cy: 4.5, r: 1.6 },
      { cx: 29.5, cy: 7.5, r: 1.6 },
    ],
  },
  2: {
    body: 'M6 19 4 8l7 5 5-8.5 5 8.5 7-5-2 11z',
    jewels: [
      { cx: 4, cy: 8, r: 1.6 },
      { cx: 16, cy: 4.5, r: 1.8 },
      { cx: 28, cy: 8, r: 1.6 },
    ],
  },
  3: {
    body: 'M7 19 6 11.5l5.5 3L16 8l4.5 6.5 5.5-3-1 7.5z',
    jewels: [
      { cx: 6, cy: 11.5, r: 1.4 },
      { cx: 16, cy: 8, r: 1.6 },
      { cx: 26, cy: 11.5, r: 1.4 },
    ],
  },
};
