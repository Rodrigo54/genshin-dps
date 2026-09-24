import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { RenderMode, type ServerRoute } from '@angular/ssr';
import { type CharacterTeams, LOCALES, SITE_DATA_PATHS } from '@genshin-dps/schema/site-data';

// O `ng build` roda em apps/web: lê direto de public/ o JSON gerado por `bun run data`
const TEAMS_DIRECTORY = join(process.cwd(), 'public', SITE_DATA_PATHS.teamsDirectory);

async function readAllCharacterTeams(): Promise<CharacterTeams[]> {
  const fileNames = await readdir(TEAMS_DIRECTORY);
  return Promise.all(
    fileNames.map(
      async (fileName) => JSON.parse(await readFile(join(TEAMS_DIRECTORY, fileName), 'utf8')) as CharacterTeams,
    ),
  );
}

const localeParams = () => LOCALES.map((lang) => ({ lang }));

async function characterParams() {
  const characterIds = (await readAllCharacterTeams()).map(({ characterId }) => characterId);
  return LOCALES.flatMap((lang) => characterIds.map((characterId) => ({ lang, characterId })));
}

async function teamParams() {
  const teams = (await readAllCharacterTeams()).flatMap((characterTeams) => characterTeams.teams);
  return LOCALES.flatMap((lang) => teams.map((team) => ({ lang, characterId: team.mainCharacterId, teamId: team.id })));
}

// Tudo com idioma é prerenderizado nos dois idiomas; o resto só existe no `ng serve` (a Netlify redireciona)
export const serverRoutes: ServerRoute[] = [
  { path: ':lang', renderMode: RenderMode.Prerender, getPrerenderParams: async () => localeParams() },
  { path: ':lang/all', renderMode: RenderMode.Prerender, getPrerenderParams: async () => localeParams() },
  { path: ':lang/about', renderMode: RenderMode.Prerender, getPrerenderParams: async () => localeParams() },
  { path: ':lang/not-found', renderMode: RenderMode.Prerender, getPrerenderParams: async () => localeParams() },
  { path: ':lang/characters/:characterId', renderMode: RenderMode.Prerender, getPrerenderParams: characterParams },
  {
    path: ':lang/characters/:characterId/teams/:teamId',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: teamParams,
  },
  { path: '**', renderMode: RenderMode.Client },
];
