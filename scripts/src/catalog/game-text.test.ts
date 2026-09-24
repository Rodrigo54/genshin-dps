import { describe, expect, it } from 'bun:test';
import { parseGameText } from './game-text';

describe('parseGameText', () => {
  it('separa os trechos coloridos do texto comum, mantendo as lacunas dos valores', () => {
    expect(parseGameText('Aumenta o ATQ em <color=#99FFFFFF>{0}</color> por 8s.')).toEqual([
      { text: 'Aumenta o ATQ em ' },
      { text: '{0}', color: '#99FFFFFF' },
      { text: ' por 8s.' },
    ]);
  });

  it('mantém quebras de linha e texto sem marcação', () => {
    expect(parseGameText('Linha 1\nLinha 2')).toEqual([{ text: 'Linha 1\nLinha 2' }]);
  });

  it('junta as variantes de gênero do Viajante, masculino primeiro', () => {
    expect(parseGameText('#com o qual {F#ela}{M#ele} ressoou')).toEqual([{ text: 'com o qual ele/ela ressoou' }]);
    expect(parseGameText('#{M#o}{F#a} Viajante')).toEqual([{ text: 'o/a Viajante' }]);
  });
});
