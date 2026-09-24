import type { ArtifactSetEntry, CatalogOverrides, CharacterEntry, WeaponEntry } from '@genshin-dps/schema';
import { CatalogIndex, type NamedEntry } from './catalog-index';
import type { CatalogSource } from './genshin-db-source';
import { toSlug } from './slug';

export interface ResolvedCatalog {
  characters: CatalogIndex<CharacterEntry>;
  weapons: CatalogIndex<WeaponEntry>;
  artifactSets: CatalogIndex<ArtifactSetEntry>;
}

export interface CatalogBuild {
  catalog: ResolvedCatalog;
  warnings: string[];
}

interface IndexBuild<T extends NamedEntry> {
  index: CatalogIndex<T>;
  warnings: string[];
}

interface IndexInput<T extends NamedEntry> {
  kind: string;
  sourceEntries: readonly T[];
  overrideEntries: readonly T[];
  aliases: Readonly<Record<string, string>>;
}

// Override com o mesmo id substitui a entrada do genshin-db (serve para correção);
// quando o pacote já traz a entrada, ou o alias aponta para a entrada que o nome já teria, o override ficou
// redundante e gera aviso. Alias que redireciona um nome do pacote para outra entrada (Lumine → Traveler) é válido.
function buildIndex<T extends NamedEntry>({
  kind,
  sourceEntries,
  overrideEntries,
  aliases,
}: IndexInput<T>): IndexBuild<T> {
  const sourceIndex = new CatalogIndex(kind, sourceEntries);
  const entriesById = new Map(sourceEntries.map((entry) => [entry.id, entry]));
  overrideEntries.forEach((entry) => entriesById.set(entry.id, entry));
  const index = new CatalogIndex(kind, [...entriesById.values()], aliases);

  Object.values(aliases).forEach((target) => index.resolve(target));

  const redundantEntries = overrideEntries
    .filter((entry) => sourceIndex.hasExactName(entry.name.en))
    .map((entry) => `${kind} "${entry.name.en}" já existe no genshin-db; remova o override se não for uma correção`);
  const redundantAliases = Object.entries(aliases)
    .filter(
      ([alias, target]) => sourceIndex.hasExactName(alias) && sourceIndex.resolve(alias) === index.resolve(target),
    )
    .map(([alias]) => `Alias de ${kind.toLowerCase()} "${alias}" já é um nome do genshin-db; remova o alias`);

  return { index, warnings: [...redundantEntries, ...redundantAliases] };
}

function withSlugIds<T extends Omit<NamedEntry, 'id'>>(entries: readonly T[]): (T & { id: string })[] {
  return entries.map((entry) => ({ ...entry, id: toSlug(entry.name.en) }));
}

export function buildCatalog(source: CatalogSource, overrides: CatalogOverrides): CatalogBuild {
  const characters = buildIndex({
    kind: 'Personagem',
    sourceEntries: source.characters,
    overrideEntries: withSlugIds(overrides.characters),
    aliases: overrides.aliases.characters,
  });
  const weapons = buildIndex({
    kind: 'Arma',
    sourceEntries: source.weapons,
    overrideEntries: withSlugIds(overrides.weapons),
    aliases: overrides.aliases.weapons,
  });
  const artifactSets = buildIndex({
    kind: 'Set de artefatos',
    sourceEntries: source.artifactSets,
    overrideEntries: withSlugIds(overrides.artifactSets),
    aliases: overrides.aliases.artifactSets,
  });

  return {
    catalog: { characters: characters.index, weapons: weapons.index, artifactSets: artifactSets.index },
    warnings: [...characters.warnings, ...weapons.warnings, ...artifactSets.warnings],
  };
}
