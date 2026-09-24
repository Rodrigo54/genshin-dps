import type { LocalizedText } from '@genshin-dps/schema';

export interface NamedEntry {
  id: string;
  name: LocalizedText;
}

export class UnknownNameError extends Error {
  constructor(kind: string, name: string) {
    super(`${kind} desconhecido: "${name}" (adicione um alias ou uma entrada em data/catalog-overrides.yaml)`);
    this.name = 'UnknownNameError';
  }
}

export class AmbiguousNameError extends Error {
  constructor(kind: string, name: string, ids: string[]) {
    super(`${kind} ambíguo: "${name}" corresponde a ${ids.join(', ')}; use o nome em inglês`);
    this.name = 'AmbiguousNameError';
  }
}

export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('en');
}

// Busca exata por nome PT, nome EN ou alias, ignorando só caixa e espaços extras.
// O genshin-db faz busca aproximada e aceitaria "Mavuka" como Mavuika; aqui erro de digitação quebra o build.
export class CatalogIndex<T extends NamedEntry> {
  private readonly entriesById = new Map<string, T>();
  private readonly entriesByName = new Map<string, T[]>();
  private readonly aliases = new Map<string, string>();

  constructor(
    private readonly kind: string,
    entries: readonly T[],
    aliases: Readonly<Record<string, string>> = {},
  ) {
    entries.forEach((entry) => this.indexEntry(entry));
    Object.entries(aliases).forEach(([alias, target]) => this.aliases.set(normalizeName(alias), target));
  }

  resolve(name: string): T {
    const target = this.aliases.get(normalizeName(name)) ?? name;
    const [match, ...otherMatches] = this.entriesByName.get(normalizeName(target)) ?? [];
    if (!match) throw new UnknownNameError(this.kind, name);
    if (otherMatches.length > 0)
      throw new AmbiguousNameError(
        this.kind,
        name,
        [match, ...otherMatches].map(({ id }) => id),
      );
    return match;
  }

  getById(id: string): T {
    const entry = this.entriesById.get(id);
    if (!entry) throw new UnknownNameError(this.kind, id);
    return entry;
  }

  hasId(id: string): boolean {
    return this.entriesById.has(id);
  }

  hasExactName(name: string): boolean {
    return this.entriesByName.has(normalizeName(name));
  }

  private indexEntry(entry: T): void {
    this.entriesById.set(entry.id, entry);
    const keys = new Set([normalizeName(entry.name.en), normalizeName(entry.name.pt)]);
    keys.forEach((key) => {
      const current = this.entriesByName.get(key) ?? [];
      if (!current.some((existing) => existing.id === entry.id)) this.entriesByName.set(key, [...current, entry]);
    });
  }
}
