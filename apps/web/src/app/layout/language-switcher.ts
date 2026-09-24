import { ChangeDetectionStrategy, Component, computed, DOCUMENT, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LOCALES, type Locale } from '@genshin-dps/schema/site-data';
import { TranslocoPipe } from '@jsverse/transloco';
import { injectActiveLocale } from '../core/i18n/active-locale';
import { injectCurrentUrl } from '../core/i18n/current-url';
import { LOCALE_TAGS } from '../core/i18n/locale';
import { splitLocalePath, toLocalizedPath } from '../core/i18n/locale-path';

// Cookie lido pela regra Language do _redirects da Netlify: a escolha vale para URLs sem prefixo
const NETLIFY_LANGUAGE_COOKIE = 'nf_lang';
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

@Component({
  selector: 'app-language-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslocoPipe],
  template: `
    <ul class="flex gap-1" [attr.aria-label]="'nav.language' | transloco">
      @for (option of options(); track option.locale) {
        <li>
          <a
            class="rounded px-2 py-1 text-xs font-semibold uppercase hover:text-accent"
            [class.text-accent]="option.isActive"
            [class.text-ink-muted]="!option.isActive"
            [routerLink]="option.path"
            [attr.hreflang]="option.tag"
            [attr.lang]="option.tag"
            [attr.aria-current]="option.isActive ? 'true' : null"
            [attr.title]="'language.' + option.locale | transloco"
            (click)="rememberLocale(option.locale)"
          >
            {{ option.locale }}
          </a>
        </li>
      }
    </ul>
  `,
})
export class LanguageSwitcher {
  private readonly document = inject(DOCUMENT);
  private readonly activeLocale = injectActiveLocale();
  private readonly currentUrl = injectCurrentUrl();

  protected readonly options = computed(() => {
    const { path } = splitLocalePath(this.currentUrl());
    return LOCALES.map((locale) => ({
      locale,
      tag: LOCALE_TAGS[locale],
      path: toLocalizedPath(locale, path),
      isActive: locale === this.activeLocale(),
    }));
  });

  protected rememberLocale(locale: Locale): void {
    this.document.cookie = `${NETLIFY_LANGUAGE_COOKIE}=${locale}; path=/; max-age=${ONE_YEAR_IN_SECONDS}; samesite=lax`;
  }
}
