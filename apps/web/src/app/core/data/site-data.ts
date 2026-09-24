import { httpResource } from '@angular/common/http';
import { Injectable, type Signal } from '@angular/core';
import { type Catalog, type CharacterTeams, type Ranking, SITE_DATA_PATHS } from '@genshin-dps/schema/site-data';

// Caminhos absolutos a partir da raiz: o JSON gerado por `bun run data` fica em public/
const fromRoot = (path: string) => `/${path}`;

export function iconUrl(icon: string): string {
  return fromRoot(SITE_DATA_PATHS.icon(icon));
}

// Catálogo e ranking são compartilhados entre páginas: carregam uma vez por sessão
@Injectable({ providedIn: 'root' })
export class SiteData {
  readonly catalog = httpResource<Catalog>(() => fromRoot(SITE_DATA_PATHS.catalog));
  readonly ranking = httpResource<Ranking>(() => fromRoot(SITE_DATA_PATHS.ranking));
}

// Chamar no contexto de injeção de um componente: recarrega quando o personagem muda
export function injectCharacterTeams(characterId: Signal<string>) {
  return httpResource<CharacterTeams>(() => fromRoot(SITE_DATA_PATHS.characterTeams(characterId())));
}
