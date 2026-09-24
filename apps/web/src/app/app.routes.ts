import { type Routes } from '@angular/router';
import { DEFAULT_LOCALE } from './core/i18n/locale';
import { activateRouteLocale, LOCALE_PARAM, matchSupportedLocale } from './core/i18n/locale-route';
import { SiteLayout } from './layout/site-layout';

export const routes: Routes = [
  // Em produção a Netlify redireciona URLs sem idioma (_redirects); aqui cobre o `ng serve`
  { path: '', pathMatch: 'full', redirectTo: DEFAULT_LOCALE },
  {
    path: `:${LOCALE_PARAM}`,
    canMatch: [matchSupportedLocale],
    resolve: { translations: activateRouteLocale },
    component: SiteLayout,
    children: [
      {
        path: '',
        loadComponent: () => import('./features/ranking/ranking-page').then((m) => m.RankingPage),
        data: { filter: 'baseline' },
      },
      {
        path: 'all',
        loadComponent: () => import('./features/ranking/ranking-page').then((m) => m.RankingPage),
        data: { filter: 'all' },
      },
      {
        path: 'characters/:characterId',
        loadComponent: () => import('./features/character/character-teams-page').then((m) => m.CharacterTeamsPage),
      },
      {
        path: 'characters/:characterId/teams/:teamId',
        loadComponent: () => import('./features/team/team-detail-page').then((m) => m.TeamDetailPage),
      },
      { path: 'about', loadComponent: () => import('./features/about/about-page').then((m) => m.AboutPage) },
      {
        path: 'not-found',
        loadComponent: () => import('./features/not-found/not-found-page').then((m) => m.NotFoundPage),
      },
      { path: '**', loadComponent: () => import('./features/not-found/not-found-page').then((m) => m.NotFoundPage) },
    ],
  },
  { path: '**', redirectTo: `${DEFAULT_LOCALE}/not-found` },
];
