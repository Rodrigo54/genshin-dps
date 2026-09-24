import { splitLocalePath, toLocalizedPath } from './locale-path';

describe('splitLocalePath', () => {
  it('separa o idioma do restante do caminho', () => {
    expect(splitLocalePath('/pt/characters/mavuika')).toEqual({ locale: 'pt', path: '/characters/mavuika' });
  });

  it('trata a home do idioma como "/"', () => {
    expect(splitLocalePath('/en')).toEqual({ locale: 'en', path: '/' });
  });

  it('ignora query e fragment', () => {
    expect(splitLocalePath('/en/about?x=1#top')).toEqual({ locale: 'en', path: '/about' });
  });

  it('não inventa idioma para caminho sem prefixo suportado', () => {
    expect(splitLocalePath('/fr/about')).toEqual({ path: '/fr/about' });
  });
});

describe('toLocalizedPath', () => {
  it('prefixa o idioma sem barra sobrando na home', () => {
    expect(toLocalizedPath('pt', '/')).toBe('/pt');
    expect(toLocalizedPath('en', '/characters/mavuika')).toBe('/en/characters/mavuika');
  });
});
