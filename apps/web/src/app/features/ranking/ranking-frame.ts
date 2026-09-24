import { type Element } from '@genshin-dps/schema/site-data';

// Classes completas (não interpoladas) para o Tailwind encontrá-las no código-fonte
const MEDAL_FRAME_COLORS: Record<number, string> = {
  1: '[--frame-color:var(--color-medal-gold)]',
  2: '[--frame-color:var(--color-medal-silver)]',
  3: '[--frame-color:var(--color-medal-bronze)]',
};

const ELEMENT_FRAME_COLORS: Record<Element, string> = {
  pyro: '[--frame-color:var(--color-pyro)]',
  hydro: '[--frame-color:var(--color-hydro)]',
  anemo: '[--frame-color:var(--color-anemo)]',
  electro: '[--frame-color:var(--color-electro)]',
  dendro: '[--frame-color:var(--color-dendro)]',
  cryo: '[--frame-color:var(--color-cryo)]',
  geo: '[--frame-color:var(--color-geo)]',
  none: '[--frame-color:var(--color-none)]',
};

// Cor da moldura da linha: a medalha no pódio e o elemento do DPS principal no resto
export function rankingFrameColor(position: number, mainElement: Element): string {
  return MEDAL_FRAME_COLORS[position] ?? ELEMENT_FRAME_COLORS[mainElement];
}
