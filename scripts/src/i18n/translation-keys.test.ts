import { describe, expect, it } from 'bun:test';
import { findMissingKeys, findRenderedKeys, flattenKeys } from './translation-keys';

describe('translation-keys', () => {
  it('achata o JSON de traduções em chaves com ponto', () => {
    expect(flattenKeys({ nav: { about: 'Sobre', main: 'Menu' }, title: 'X' })).toEqual([
      'nav.about',
      'nav.main',
      'title',
    ]);
  });

  it('aponta chaves que faltam em um idioma', () => {
    expect(findMissingKeys(['nav.about', 'nav.main'], ['nav.about'])).toEqual(['nav.main']);
  });

  it('encontra chave renderizada no texto e em atributos', () => {
    const html = '<h1>ranking.title</h1><nav aria-label="nav.main">Sobre</nav>';
    expect(findRenderedKeys(html, ['ranking', 'nav'])).toEqual(['ranking.title', 'nav.main']);
  });

  it('ignora script, style e texto comum com ponto', () => {
    const html = '<script>{"ranking.title":"x"}</script><style>.nav.x{}</style><p>genshin-dps.netlify.app 6.8</p>';
    expect(findRenderedKeys(html, ['ranking', 'nav'])).toEqual([]);
  });
});
