import { toNotesView } from './localized-notes';

describe('toNotesView', () => {
  it('usa o texto do idioma ativo quando existe', () => {
    expect(toNotesView({ pt: 'Com escudo', en: 'With shield' }, 'en')).toEqual({ text: 'With shield' });
  });

  it('cai para o outro idioma e indica o original', () => {
    expect(toNotesView({ pt: 'Com escudo' }, 'en')).toEqual({ text: 'Com escudo', originalLocale: 'pt' });
  });

  it('não mostra nada sem texto', () => {
    expect(toNotesView({}, 'pt')).toBeUndefined();
  });
});
