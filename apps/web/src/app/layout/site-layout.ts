import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { injectActiveLocale } from '../core/i18n/active-locale';
import { LanguageSwitcher } from './language-switcher';

@Component({
  selector: 'app-site-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslocoPipe, LanguageSwitcher],
  host: { class: 'flex min-h-dvh flex-col' },
  template: `
    <header class="border-b border-border">
      <div class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <a class="text-lg font-bold text-accent" [routerLink]="['/', locale()]">{{ 'site.name' | transloco }}</a>
        <nav class="flex items-center gap-4 text-sm" [attr.aria-label]="'nav.main' | transloco">
          <a
            class="hover:text-accent"
            [routerLink]="['/', locale()]"
            routerLinkActive="text-accent"
            [routerLinkActiveOptions]="{ exact: true }"
          >
            {{ 'nav.ranking' | transloco }}
          </a>
          <a class="hover:text-accent" [routerLink]="['/', locale(), 'about']" routerLinkActive="text-accent">
            {{ 'nav.about' | transloco }}
          </a>
          <app-language-switcher />
        </nav>
      </div>
    </header>

    <main class="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <router-outlet />
    </main>

    <footer class="border-t border-border">
      <p class="mx-auto max-w-5xl px-4 py-6 text-xs text-ink-muted">{{ 'about.fanContent' | transloco }}</p>
    </footer>
  `,
})
export class SiteLayout {
  protected readonly locale = injectActiveLocale();
}
