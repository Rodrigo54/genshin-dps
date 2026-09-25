import { describe, expect, it } from 'bun:test';
import { extractVisionLabels, type GameData, VISION_LABEL_FIELDS } from './extract-vision-labels';

const { before, after } = VISION_LABEL_FIELDS;

function gameData(fetters: GameData['fetters']): GameData {
  return {
    fetters,
    avatars: [
      { id: 1, nameTextMapHash: 101 },
      { id: 2, nameTextMapHash: 102 },
      { id: 3, nameTextMapHash: 103 },
    ],
    textMaps: {
      pt: { 900: '???', 901: 'Visão', 902: 'Eixo Estelar' },
      en: { 101: 'Furina', 102: 'Vesna', 103: 'Hu Tao', 900: '???', 901: 'Vision', 902: 'Star Axis' },
    },
  };
}

describe('extractVisionLabels', () => {
  it('usa o rótulo revelado pela história quando existe', () => {
    const labels = extractVisionLabels(gameData([{ avatarId: 1, [before]: 900, [after]: 901 }]));
    expect(labels).toEqual({ furina: { pt: 'Visão', en: 'Vision' } });
  });

  it('usa o rótulo inicial quando o revelado não tem texto', () => {
    const labels = extractVisionLabels(gameData([{ avatarId: 2, [before]: 902, [after]: 998 }]));
    expect(labels).toEqual({ vesna: { pt: 'Eixo Estelar', en: 'Star Axis' } });
  });

  it('deixa de fora quem não tem rótulo próprio e ordena pelo id', () => {
    const labels = extractVisionLabels(
      gameData([
        { avatarId: 2, [before]: 902, [after]: 998 },
        { avatarId: 3, [before]: 997, [after]: 998 },
        { avatarId: 1, [before]: 900, [after]: 901 },
      ]),
    );
    expect(Object.keys(labels)).toEqual(['furina', 'vesna']);
  });

  it('falha quando nenhum personagem tem os campos, sinal de que foram renomeados', () => {
    expect(() => extractVisionLabels(gameData([{ avatarId: 1, OUTRO_CAMPO: 901 }]))).toThrow(/renomeado/);
  });

  it('falha quando nenhum rótulo tem texto, sinal de que os campos mudaram de significado', () => {
    expect(() => extractVisionLabels(gameData([{ avatarId: 3, [before]: 997, [after]: 998 }]))).toThrow(/significado/);
  });

  it('falha quando o rótulo existe num idioma e falta no outro', () => {
    const data = gameData([{ avatarId: 2, [before]: 903 }]);
    data.textMaps.en['903'] = 'Moonsign';
    expect(() => extractVisionLabels(data)).toThrow(/903/);
  });
});
