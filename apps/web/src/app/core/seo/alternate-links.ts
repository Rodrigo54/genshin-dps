import { DOCUMENT, effect, inject, Injectable } from '@angular/core';
import { LOCALES } from '@genshin-dps/schema/site-data';
import { injectCurrentUrl } from '../i18n/current-url';
import { LOCALE_TAGS } from '../i18n/locale';
import { splitLocalePath, toLocalizedPath } from '../i18n/locale-path';
import { SITE_ORIGIN } from './site-origin';

const MANAGED_LINK_SELECTOR = 'link[data-alternate]';

// Mantém <html lang>, canonical e hreflang recíprocos (pt, en e x-default sem prefixo) a cada navegação
@Injectable({ providedIn: 'root' })
export class AlternateLinks {
  private readonly document = inject(DOCUMENT);
  private readonly currentUrl = injectCurrentUrl();

  constructor() {
    effect(() => this.render(this.currentUrl()));
  }

  private render(url: string): void {
    const { locale, path } = splitLocalePath(url);
    if (!locale) return;

    this.document.documentElement.lang = LOCALE_TAGS[locale];
    this.document.head.querySelectorAll(MANAGED_LINK_SELECTOR).forEach((link) => link.remove());
    this.appendLink({ rel: 'canonical', href: SITE_ORIGIN + toLocalizedPath(locale, path) });
    LOCALES.forEach((alternate) =>
      this.appendLink({
        rel: 'alternate',
        href: SITE_ORIGIN + toLocalizedPath(alternate, path),
        hreflang: LOCALE_TAGS[alternate],
      }),
    );
    this.appendLink({ rel: 'alternate', href: SITE_ORIGIN + path, hreflang: 'x-default' });
  }

  private appendLink(attributes: Record<string, string>): void {
    const link = this.document.createElement('link');
    Object.entries(attributes).forEach(([name, value]) => link.setAttribute(name, value));
    link.setAttribute('data-alternate', '');
    this.document.head.appendChild(link);
  }
}
