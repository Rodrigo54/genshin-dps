const PERCENT = 100;
const PERCENT_DECIMALS = 10;

// Porcentagens com uma casa, como o jogo mostra (0.661536 → 66.2); valores planos inteiros
export function roundStat(value: number, isPercent: boolean): number {
  if (!isPercent) return Math.round(value);
  return Math.round(value * PERCENT * PERCENT_DECIMALS) / PERCENT_DECIMALS;
}
