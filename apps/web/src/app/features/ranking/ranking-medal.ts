// Medalha do pódio num viewBox só: disco com o número, ramos de oliveira em volta, coroa no alto e estrela no pé.
// Só o ramo da esquerda é calculado; o da direita é o espelho dele.
const CENTER = { x: 28, y: 31 };
const DISC_RADIUS = 12;
const STEM_RADIUS = 14;
// Ângulos em graus no sentido do SVG (y para baixo): 90 é o pé do ramo, 180 é a esquerda
const STEM_START_ANGLE = 98;
const STEM_END_ANGLE = 245;
const LEAF_NODES = 8;
// Duas folhas por nó, as duas para fora: uma quase deitada no ramo e outra mais aberta
const LEAF_TILTS = [-15, -60];
const TIP_LEAF_SCALE = 0.6;
const STAR_OUTER_RADIUS = 3.2;
const STAR_INNER_RADIUS = 1;
const STAR_POINTS = 4;
// A coroa (viewBox 0 0 32 24) entra com metade do tamanho e a faixa encostando no alto do disco
const CROWN_SCALE = 0.5;
const CROWN_WIDTH = 32;
const CROWN_BAND_BOTTOM = 23;
const CROWN_BAND_OVERLAP = 1;

// Quadrado justo em volta do conteúdo medido (folhas, estrela e coroa), com o conjunto centralizado nele
export const MEDAL_VIEW_BOX = '6 8.5 44 44';
export const MEDAL_MIRROR_TRANSFORM = `matrix(-1 0 0 1 ${CENTER.x * 2} 0)`;
export const MEDAL_DISC = { cx: CENTER.x, cy: CENTER.y, r: DISC_RADIUS };
export const MEDAL_INNER_RING = { cx: CENTER.x, cy: CENTER.y, r: DISC_RADIUS - 2 };

// Folha pontuda deitada no eixo x, com a base na origem
export const MEDAL_LEAF = 'M0 0Q3.5-2.8 9 0Q3.5 2.8 0 0Z';

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function getPolarPoint(radius: number, angle: number): { x: number; y: number } {
  return {
    x: round(CENTER.x + radius * Math.cos(toRadians(angle))),
    y: round(CENTER.y + radius * Math.sin(toRadians(angle))),
  };
}

function buildLeafTransform(angle: number, tilt: number, scale: number): string {
  const { x, y } = getPolarPoint(STEM_RADIUS, angle);
  // A tangente do arco aponta para a ponta do ramo; a inclinação negativa abre a folha para fora
  const rotation = angle + 90 + tilt;
  return `translate(${x} ${y}) rotate(${round(rotation)}) scale(${round(scale)})`;
}

function buildStem(): string {
  const start = getPolarPoint(STEM_RADIUS, STEM_START_ANGLE);
  const end = getPolarPoint(STEM_RADIUS, STEM_END_ANGLE);
  return `M${start.x} ${start.y}A${STEM_RADIUS} ${STEM_RADIUS} 0 0 1 ${end.x} ${end.y}`;
}

function buildLeaves(): string[] {
  const step = (STEM_END_ANGLE - STEM_START_ANGLE) / LEAF_NODES;
  const nodes = Array.from({ length: LEAF_NODES }, (_, index) => {
    const angle = STEM_START_ANGLE + index * step;
    // As folhas diminuem do pé até a ponta do ramo
    const scale = 1 - ((1 - TIP_LEAF_SCALE) * index) / LEAF_NODES;
    return LEAF_TILTS.map((tilt) => buildLeafTransform(angle, tilt, scale));
  });
  return [...nodes.flat(), buildLeafTransform(STEM_END_ANGLE, 0, TIP_LEAF_SCALE)];
}

function buildStar(): string {
  const bottom = { x: CENTER.x, y: CENTER.y + STEM_RADIUS + STAR_INNER_RADIUS };
  const corners = Array.from({ length: STAR_POINTS * 2 }, (_, index) => {
    const radius = index % 2 === 0 ? STAR_OUTER_RADIUS : STAR_INNER_RADIUS;
    const angle = toRadians(-90 + (index * 180) / STAR_POINTS);
    return `${round(bottom.x + radius * Math.cos(angle))} ${round(bottom.y + radius * Math.sin(angle))}`;
  });
  return `M${corners.join('L')}Z`;
}

function buildCrownTransform(): string {
  const x = CENTER.x - (CROWN_WIDTH * CROWN_SCALE) / 2;
  const y = CENTER.y - DISC_RADIUS + CROWN_BAND_OVERLAP - CROWN_BAND_BOTTOM * CROWN_SCALE;
  return `translate(${round(x)} ${round(y)}) scale(${CROWN_SCALE})`;
}

export const MEDAL_STEM = buildStem();
export const MEDAL_LEAF_TRANSFORMS = buildLeaves();
export const MEDAL_STAR = buildStar();
export const MEDAL_CROWN_TRANSFORM = buildCrownTransform();
