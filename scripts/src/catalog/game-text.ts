import type { GameTextSegment } from '@genshin-dps/schema';

const COLOR_TAG = /<color=(#[0-9A-Fa-f]{8})>(.*?)<\/color>/s;
const COLOR_TAG_PARTS = 3;
const PLAIN_PART = 0;
const COLORED_PART = 2;
// Texto que depende do gênero do Viajante: "{F#ela}{M#ele}" vira "ele/ela", em qualquer ordem
const GENDER_PAIR = /\{(M|F)#([^}]*)\}\{(?:M|F)#([^}]*)\}/g;
// Textos com variáveis de gênero começam com "#", que marca o texto como template no jogo
const TEMPLATE_MARK = /^#/;

function resolveGenderVariants(text: string): string {
  return text
    .replace(TEMPLATE_MARK, '')
    .replace(GENDER_PAIR, (_, firstGender: string, first: string, second: string) =>
      firstGender === 'M' ? `${first}/${second}` : `${second}/${first}`,
    );
}

// Converte a marcação do jogo em trechos com cor, sem HTML: o app só renderiza texto
export function parseGameText(raw: string): GameTextSegment[] {
  // Com os dois grupos de captura, o split alterna: texto comum, cor, texto colorido, texto comum…
  const parts = resolveGenderVariants(raw).split(COLOR_TAG);
  const segments: GameTextSegment[] = [];
  parts.forEach((part, index) => {
    const role = index % COLOR_TAG_PARTS;
    if (role === PLAIN_PART && part) segments.push({ text: part });
    if (role === COLORED_PART) segments.push({ text: part, color: parts[index - 1]?.toUpperCase() });
  });
  return segments;
}
